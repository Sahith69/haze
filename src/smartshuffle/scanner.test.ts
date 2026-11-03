import { describe, it, expect } from 'vitest';
import { scanLibrary, markNotDuplicate, RawFile, Tags, FileSource, TagReader } from './scanner';
import { makeDb } from './testDb';

function makeWorld() {
  const files: RawFile[] = [];
  const tags = new Map<string, Tags>();
  const reads: string[] = [];
  const source: FileSource = { listAudioFiles: async () => files.map(f => ({ ...f })) };
  const reader: TagReader = { read: async (uri) => { reads.push(uri); return tags.get(uri) ?? null; } };

  const add = (uri: string, t: Tags, mtime = 1000, durationMs = 200_000) => {
    files.push({ uri, filename: uri.split('/').pop()!, durationMs, modifiedMs: mtime });
    tags.set(uri, { durationMs, ...t });
  };
  const remove = (uri: string) => { files.splice(files.findIndex(f => f.uri === uri), 1); };
  return { files, tags, reads, source, reader, add, remove };
}

const rows = (raw: any) =>
  raw.prepare('SELECT * FROM tracks ORDER BY id').all() as any[];

describe('scanLibrary', () => {
  it('adds new tracks with computed keys', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Blinding Lights (Remastered 2021)', artist: 'The Weeknd', album: 'After Hours' });
    w.add('/m/b.mp3', { title: 'Hey Jude', artist: 'The Beatles' });

    const s = await scanLibrary(db, w.source, w.reader);

    expect(s.added).toBe(2);
    expect(rows(raw).map(r => r.work_key)).toEqual(['blindinglights_weeknd', 'heyjude_beatles']);
  });

  it('falls back to the filename when tags are missing', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.files.push({ uri: '/m/Queen - Radio Ga Ga.mp3', filename: 'Queen - Radio Ga Ga.mp3',
                   durationMs: 200_000, modifiedMs: 1 });
    await scanLibrary(db, w.source, w.reader);
    expect(rows(raw)[0].work_key).toBe('radiogaga_queen');
  });

  it('skips files shorter than minDurationMs', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/voice.m4a', { title: 'Memo', artist: 'Me' }, 1, 5_000);
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' });
    await scanLibrary(db, w.source, w.reader);
    expect(rows(raw)).toHaveLength(1);
  });

  it('does not re-read unchanged files on a second scan', async () => {
    const { db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' });
    await scanLibrary(db, w.source, w.reader);
    w.reads.length = 0;

    const s = await scanLibrary(db, w.source, w.reader);

    expect(w.reads).toHaveLength(0);
    expect(s).toMatchObject({ added: 0, updated: 0, moved: 0, missing: 0 });
  });

  it('updates a changed file but keeps its play history', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' }, 1000);
    await scanLibrary(db, w.source, w.reader);
    raw.prepare('UPDATE tracks SET plays = 7, completions = 5').run();

    w.files[0].modifiedMs = 2000;
    w.tags.set('/m/a.mp3', { title: 'Song (Remastered)', artist: 'Artist', durationMs: 200_000 });
    const s = await scanLibrary(db, w.source, w.reader);

    expect(s.updated).toBe(1);
    const r = rows(raw);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ plays: 7, completions: 5, title: 'Song (Remastered)', work_key: 'song_artist' });
  });

  it('clears the embedding when the duration changes by more than 2s', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' }, 1000, 200_000);
    await scanLibrary(db, w.source, w.reader);
    raw.prepare('UPDATE tracks SET embedding = ?, embedding_dim = 1').run(Buffer.from([1, 2, 3, 4]));

    w.files[0].modifiedMs = 2000; w.files[0].durationMs = 230_000;
    w.tags.set('/m/a.mp3', { title: 'Song', artist: 'Artist', durationMs: 230_000 });
    await scanLibrary(db, w.source, w.reader);

    expect(rows(raw)[0].embedding).toBeNull();
  });

  it('keeps the embedding when the duration is unchanged', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' }, 1000);
    await scanLibrary(db, w.source, w.reader);
    raw.prepare('UPDATE tracks SET embedding = ?').run(Buffer.from([1, 2, 3, 4]));

    w.files[0].modifiedMs = 2000;
    await scanLibrary(db, w.source, w.reader);

    expect(rows(raw)[0].embedding).not.toBeNull();
  });

  it('detects a moved file and keeps the row and its history', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/old/a.mp3', { title: 'Song', artist: 'Artist' });
    w.add('/m/other.mp3', { title: 'Other', artist: 'Someone' });
    await scanLibrary(db, w.source, w.reader);
    const before = rows(raw).find(r => r.uri === '/old/a.mp3');
    raw.prepare('UPDATE tracks SET plays = 9 WHERE id = ?').run(before.id);

    w.remove('/old/a.mp3');
    w.add('/new/a.mp3', { title: 'Song', artist: 'Artist' });
    const s = await scanLibrary(db, w.source, w.reader);

    expect(s.moved).toBe(1);
    expect(s.added).toBe(0);
    const after = rows(raw);
    expect(after).toHaveLength(2);
    const moved = after.find(r => r.id === before.id);
    expect(moved).toMatchObject({ uri: '/new/a.mp3', plays: 9, missing: 0 });
  });

  it('does not treat a same-title file with a very different duration as a move', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/old/a.mp3', { title: 'Song', artist: 'Artist' }, 1, 200_000);
    w.add('/m/other.mp3', { title: 'Other', artist: 'Someone' });
    await scanLibrary(db, w.source, w.reader);

    w.remove('/old/a.mp3');
    w.add('/new/a-live.mp3', { title: 'Song', artist: 'Artist' }, 1, 300_000);
    const s = await scanLibrary(db, w.source, w.reader);

    expect(s.moved).toBe(0);
    expect(s.added).toBe(1);
    expect(s.missing).toBe(1);
    expect(rows(raw)).toHaveLength(3);
  });

  it('flags vanished files as missing, then revives them when they return', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' });
    w.add('/m/b.mp3', { title: 'Other', artist: 'Someone' });
    await scanLibrary(db, w.source, w.reader);

    const saved = w.files.find(f => f.uri === '/m/a.mp3')!;
    w.remove('/m/a.mp3');
    const s1 = await scanLibrary(db, w.source, w.reader);
    expect(s1.missing).toBe(1);
    expect(rows(raw).find(r => r.uri === '/m/a.mp3').missing).toBe(1);

    w.files.push(saved);                       // same mtime -> "came back untouched"
    const s2 = await scanLibrary(db, w.source, w.reader);
    expect(s2.revived).toBe(1);
    expect(rows(raw).find(r => r.uri === '/m/a.mp3').missing).toBe(0);
  });

  it('refuses to mark everything missing when the source returns nothing', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Song', artist: 'Artist' });
    await scanLibrary(db, w.source, w.reader);

    w.remove('/m/a.mp3');
    await expect(scanLibrary(db, w.source, w.reader)).rejects.toThrow();
    expect(rows(raw)[0].missing).toBe(0);
  });

  it('merges a typo variant into the existing work key', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Bohemian Rhapsody', artist: 'Queen' });
    w.add('/m/b.mp3', { title: 'Bohemian Rapsody', artist: 'Queen' });
    await scanLibrary(db, w.source, w.reader);

    const keys = new Set(rows(raw).map(r => r.work_key));
    expect(keys.size).toBe(1);
    expect(rows(raw)).toHaveLength(2);          // two files, one work
  });

  it('respects not_duplicates', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    await markNotDuplicate(db, 'bohemianrhapsody_queen', 'bohemianrapsody_queen');
    w.add('/m/a.mp3', { title: 'Bohemian Rhapsody', artist: 'Queen' });
    w.add('/m/b.mp3', { title: 'Bohemian Rapsody', artist: 'Queen' });
    await scanLibrary(db, w.source, w.reader);

    expect(new Set(rows(raw).map(r => r.work_key)).size).toBe(2);
  });

  it('does not fuzzy-merge titles whose digits differ', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: 'Piano Concerto No. 1 in B-flat minor', artist: 'Tchaikovsky' });
    w.add('/m/b.mp3', { title: 'Piano Concerto No. 2 in B-flat minor', artist: 'Tchaikovsky' });
    await scanLibrary(db, w.source, w.reader);
    expect(new Set(rows(raw).map(r => r.work_key)).size).toBe(2);
  });

  it('keeps every key splittable into exactly two parts on "_"', async () => {
    const { raw, db } = makeDb(); const w = makeWorld();
    w.add('/m/a.mp3', { title: '___', artist: '!!!' });
    w.add('/m/b.mp3', { title: 'Normal', artist: 'Band' });
    await scanLibrary(db, w.source, w.reader);
    for (const r of rows(raw)) expect(r.work_key.split('_')).toHaveLength(2);
  });
});

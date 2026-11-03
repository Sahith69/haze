import { describe, it, expect } from 'vitest';
import {
  titleKey, artistKey, makeKey, titleSimilarity, fuzzySameTitle,
} from './workKey';

describe('titleKey: version noise is stripped', () => {
  it.each([
    ['Blinding Lights (Remastered 2021)', 'blindinglights'],
    ['Hey Jude - Remastered 2015',        'heyjude'],
    ['Song - 2011 Remaster',              'song'],
    ['Song - Live at Wembley',            'song'],
    ['Song – Remastered',                 'song'],           // en dash
    ['Song (Radio Edit)',                 'song'],
    ['Song (Deluxe Edition)',             'song'],
    ['Song [Explicit]',                   'song'],
    ['Song (2011)',                       'song'],           // bare year in brackets
    ['Song (Remastered 2011) [Live]',     'song'],           // multiple groups
    ['Levitating (feat. DaBaby)',         'levitating'],
    ['Levitating feat. DaBaby',           'levitating'],     // unbracketed feat tail
    ['Café (feat. X)',                    'cafe'],
  ])('%s -> %s', (input, expected) => {
    expect(titleKey(input)).toBe(expected);
  });
});

describe('titleKey: meaningful text is preserved', () => {
  it.each([
    ['Levitating (The Blessed Madonna Remix)', 'levitatingtheblessedmadonnaremix'], // remix kept (policy)
    ["Love Story (Taylor's Version)",         'lovestorytaylorsversion'],           // different recording
    ['Song (Part 1)',                         'songpart1'],
    ['Song - Intro',                          'songintro'],                         // dash, no noise word
    ['Spider-Man: Into the Spider-Verse - Intro', 'spidermanintothespiderverseintro'],
    ['Live Forever',                          'liveforever'],                       // noise word as real title
    ['Alive',                                 'alive'],                             // \b protects substrings
    ['Stereo Love',                           'stereolove'],
  ])('%s -> %s', (input, expected) => {
    expect(titleKey(input)).toBe(expected);
  });

  it('keeps years that ARE the title', () => {
    expect(titleKey('1999')).toBe('1999');
    expect(titleKey('2001')).toBe('2001');
    expect(titleKey('1999 (Remastered)')).toBe('1999');
    expect(titleKey('(1999)')).toBe('1999');          // empty after strip -> falls back to raw
  });

  it('resolves nested brackets without leaving junk', () => {
    expect(titleKey('Song Title (Live (Acoustic Remaster))')).toBe('songtitle');
  });

  it('keeps remixes with a noise word distinct', () => {
    expect(titleKey('Song (Clean Bandit Remix)')).not.toBe(titleKey('Song'));
  });
});

describe('titleKey: normalization', () => {
  it('ignores case, spacing, punctuation', () => {
    expect(titleKey('  Blinding   Lights ')).toBe('blindinglights');
    expect(titleKey('Mr. Brightside')).toBe(titleKey('Mr Brightside'));
  });

  it('treats curly and straight apostrophes the same', () => {
    expect(titleKey('Don\u2019t Stop Believin\u2019')).toBe(titleKey("Don't Stop Believin'"));
  });

  it('treats & and "and" the same', () => {
    expect(titleKey('Rock & Roll')).toBe(titleKey('Rock and Roll'));
  });

  it('composed and decomposed accents give the same key', () => {
    expect(titleKey('Caf\u00e9')).toBe(titleKey('Cafe\u0301'));
  });

  it('never returns an empty key for non-blank input', () => {
    for (const s of ['!!!', '?', '...', '\u2014', '(Live)', '(2011)'])
      expect(titleKey(s).length).toBeGreaterThan(0);
    expect(titleKey('(Live)')).toBe('live');
  });
});

describe('titleKey: non-Latin scripts', () => {
  it('keeps Japanese', () => {
    expect(titleKey('紅蓮華 (Gurenge)')).toBe('紅蓮華gurenge');
  });

  it('keeps Korean (compared after NFKD, which is what fold() produces)', () => {
    const k = titleKey('사랑을 했다 (LOVE SCENARIO)');
    expect(k).toBe('사랑을했다lovescenario'.normalize('NFKD'));
    expect(k.length).toBeGreaterThan('lovescenario'.length);
  });

  it('keeps Cyrillic', () => {
    expect(makeKey('Группа крови', 'Кино').key).toBe('группакрови_кино');
  });
});

describe('artistKey', () => {
  it.each([
    ['The Beatles',          'beatles'],
    ['Beatles',              'beatles'],
    ['The Weeknd',           'weeknd'],
    ['Theatre of Tragedy',   'theatreoftragedy'],   // "The" only stripped as a whole word
    ['Simon & Garfunkel',    'simonandgarfunkel'],  // not split
    ['AC/DC',                'acdc'],
    ['Panic! At The Disco',  'panicatthedisco'],
    ['Tyler, The Creator',   'tylerthecreator'],    // not split on comma
    ['Dr. Dre',              'drdre'],
    ['Beyoncé',              'beyonce'],
    ['Artist feat. Someone', 'artist'],
    ['Artist ft. Someone',   'artist'],
    ['Artist A; Artist B',   'artista'],
    ['Artist / Other',       'artist'],
    ['',                     'unknown'],
  ])('%s -> %s', (input, expected) => {
    expect(artistKey(input)).toBe(expected);
  });

  it('merges & and "and"', () => {
    expect(artistKey('Simon & Garfunkel')).toBe(artistKey('Simon and Garfunkel'));
  });
});

describe('makeKey', () => {
  it('matches the examples from the design', () => {
    expect(makeKey('Blinding Lights (Remastered 2021)', 'The Weeknd').key).toBe('blindinglights_weeknd');
    expect(makeKey('Hey Jude - Remastered 2015', 'The Beatles').key).toBe('heyjude_beatles');
    expect(makeKey('Café (feat. X)', 'Beyoncé').key).toBe('cafe_beyonce');
    expect(makeKey('1999', 'Prince').key).toBe('1999_prince');
    expect(makeKey('2001', 'Dr. Dre').key).toBe('2001_drdre');
  });

  it('merges studio, remaster, live and radio edit of one song', () => {
    const keys = new Set([
      makeKey('Song', 'Artist').key,
      makeKey('Song (Remastered 2011)', 'Artist').key,
      makeKey('Song - Live at X', 'Artist').key,
      makeKey('Song (Radio Edit)', 'Artist').key,
    ]);
    expect(keys.size).toBe(1);
  });

  it('keeps remixes separate from the original', () => {
    expect(makeKey('Levitating (feat. DaBaby)', 'Dua Lipa').key)
      .not.toBe(makeKey('Levitating (The Blessed Madonna Remix)', 'Dua Lipa').key);
  });

  it('keys split cleanly on "_" (scanner.ts relies on this)', () => {
    const parts = makeKey('Blinding Lights', 'The Weeknd').key.split('_');
    expect(parts).toHaveLength(2);
  });
});

describe('titleSimilarity / fuzzySameTitle', () => {
  it('basic similarity', () => {
    expect(titleSimilarity('abc', 'abc')).toBe(1);
    expect(titleSimilarity('', 'x')).toBe(0);
    expect(titleSimilarity('kitten', 'sitting')).toBeCloseTo(1 - 3 / 7, 5);
  });

  it('catches a single typo in a long title', () => {
    expect(fuzzySameTitle('bohemianrhapsody', 'bohemianrapsody')).toBe(true);
    expect(fuzzySameTitle('blindinglights', 'blindinglihts')).toBe(true);
  });

  it('refuses short titles', () => {
    expect(fuzzySameTitle('love', 'lov')).toBe(false);
    expect(fuzzySameTitle('abcdefg', 'abcdefh')).toBe(false); // 7 chars
  });

  it('refuses titles whose digits differ', () => {
    expect(fuzzySameTitle('pianoconcertono1inbflatminor', 'pianoconcertono2inbflatminor')).toBe(false);
  });

  it('refuses unrelated titles', () => {
    expect(fuzzySameTitle('bohemianrhapsody', 'stairwaytoheaven')).toBe(false);
  });
});

// -------------------------------------------------------------------------
// KNOWN ISSUES (with fixes applied in workKey.ts, tested with plain it(...))
// -------------------------------------------------------------------------
describe('known issues (desired behavior)', () => {
  it('dash stripping must not eat real subtitles before a noise suffix', () => {
    expect(titleKey('Hold On - Part 2 - Remastered 2011')).toBe('holdonpart2');
  });

  it('"(With Love)" is a title, not a featured artist', () => {
    expect(titleKey('Song (With Love)')).toBe('songwithlove');
  });

  it('punctuation-only titles must not put "_" in the key', () => {
    expect(titleKey('___')).not.toContain('_');
  });

  it('punctuation-only artist names must not all collapse to "unknown"', () => {
    expect(artistKey('!!!')).not.toBe(artistKey('???'));
  });
});

describe('titleKey: Indian cinema, regional languages & audio variants', () => {
  it.each([
    ['Aaya Sher', 'aayasher'],
    ['Aaya Sher (From "The Paradise") (Telugu)', 'aayasher'],
    ['Aaya Sher (From "The Paradise") (Hindi)', 'aayasher'],
    ['Aaya Sher - Telugu', 'aayasher'],
    ['Aararai Kodi - Karoake', 'aararaikodi'],
    ['Aararai Kodi - Karaoke', 'aararaikodi'],
    ['Kesariya (From "Brahmastra")', 'kesariya'],
    ['Naatu Naatu (From "RRR")', 'naatunaatu'],
    ['Naatu Naatu - Telugu', 'naatunaatu'],
    ['Naatu Naatu - Hindi', 'naatunaatu'],
    ['Ordinary Person (From "Leo")', 'ordinaryperson'],
    ['Arabic Kuthu - Halamithi Habibo (From "Beast")', 'arabickuthuhalamithihabibo'],
  ])('%s -> %s', (input, expected) => {
    expect(titleKey(input)).toBe(expected);
  });
});

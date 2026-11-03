import { describe, it, expect } from 'vitest';
import { titleKey, fuzzySameTitle } from './workKey';

function cleanTitleForComparison(t = '') {
  return t
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/feat\..*|ft\..*|featuring\..*/gi, '')
    .replace(/\s*[-–—]\s*(?:remix|acoustic|live|instrumental|edit|slowed|reverb|sped up|remaster|radio|version|mix).*$/i, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

function doTitlesMatch(t1 = '', t2 = '') {
  if (!t1 || !t2) return false;
  try {
    const k1 = titleKey(t1);
    const k2 = titleKey(t2);
    if (k1 && k2 && (k1 === k2 || fuzzySameTitle(k1, k2))) return true;
  } catch (e) {}
  const c1 = cleanTitleForComparison(t1);
  const c2 = cleanTitleForComparison(t2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  if (c1.length >= 3 && c2.length >= 3 && (c1.includes(c2) || c2.includes(c1))) return true;
  return false;
}

describe('Queue title deduplication & collision prevention', () => {
  it('detects remasters, acoustic, live, and slowed versions as duplicate titles', () => {
    expect(doTitlesMatch('Die For You', 'Die For You - 2021 Remaster')).toBe(true);
    expect(doTitlesMatch('Die For You', 'Die For You (Live)')).toBe(true);
    expect(doTitlesMatch('Die For You', 'Die For You (Acoustic)')).toBe(true);
    expect(doTitlesMatch('Die For You', 'Die For You - Remix')).toBe(true);
    expect(doTitlesMatch('Die For You', 'Die For You [Slowed + Reverb]')).toBe(true);
    expect(doTitlesMatch('Die For You', 'Die For You (feat. Ariana Grande)')).toBe(true);
  });

  it('detects short titles correctly', () => {
    expect(doTitlesMatch('Stay', 'Stay - Acoustic')).toBe(true);
    expect(doTitlesMatch('Stay', 'Stay (Live from Tokyo)')).toBe(true);
    expect(doTitlesMatch('Hero', 'Hero - Remastered')).toBe(true);
  });

  it('keeps genuinely different songs distinct', () => {
    expect(doTitlesMatch('Starboy', 'Party Monster')).toBe(false);
    expect(doTitlesMatch('Levitating', 'Don’t Start Now')).toBe(false);
    expect(doTitlesMatch('Blinding Lights', 'Save Your Tears')).toBe(false);
  });

  it('detects Indian movie versions, language variants, and karaoke as duplicate titles', () => {
    expect(doTitlesMatch('Aaya Sher', 'Aaya Sher (From "The Paradise") (Telugu)')).toBe(true);
    expect(doTitlesMatch('Aaya Sher', 'Aaya Sher (From "The Paradise") (Hindi)')).toBe(true);
    expect(doTitlesMatch('Aaya Sher', 'Aaya Sher - Telugu')).toBe(true);
    expect(doTitlesMatch('Aaya Sher (From "The Paradise") (Telugu)', 'Aaya Sher (From "The Paradise") (Hindi)')).toBe(true);
    expect(doTitlesMatch('Naatu Naatu', 'Naatu Naatu (From "RRR")')).toBe(true);
    expect(doTitlesMatch('Kesariya', 'Kesariya (From "Brahmastra")')).toBe(true);
  });
});

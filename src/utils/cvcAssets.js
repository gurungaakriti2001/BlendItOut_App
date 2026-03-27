/**
 * CVC Assets — single source of truth for word data, image paths, and audio paths.
 *
 * Image paths are deterministic:  /images/cvc/{family}/{word}.jpeg
 * getWordImage("cat") => "/images/cvc/at/cat.jpeg"
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Canonical CVC word data — single source of truth.
 * Keys use the "-ab" format; values are arrays of words in that family.
 */
export const CVC_DATA = {
  "-ab": ["cab", "dab", "gab", "jab", "lab", "nab", "tab"],
  "-ad": ["bad", "dad", "had", "lad", "mad", "pad", "sad"],
  "-ag": ["bag", "gag", "hag", "lag", "nag", "rag", "sag", "tag", "wag"],
  "-am": ["dam", "ham", "jam", "ram", "yam"],
  "-an": ["ban", "can", "fan", "man", "pan", "ran", "tan", "van"],
  "-ap": ["cap", "gap", "lap", "map", "nap", "rap", "sap", "tap", "zap"],
  "-at": ["bat", "cat", "fat", "hat", "mat", "pat", "rat", "sat", "vat"],
  "-ed": ["bed", "fed", "led", "red", "wed"],
  "-eg": ["beg", "keg", "leg", "peg"],
  "-en": ["den", "hen", "men", "pen", "ten"],
  "-et": ["bet", "get", "jet", "let", "met", "net", "pet", "set", "vet", "wet", "yet"],
  "-id": ["bid", "did", "hid", "kid", "lid", "rid"],
  "-ig": ["big", "dig", "fig", "gig", "jig", "pig", "rig", "wig"],
  "-in": ["bin", "din", "fin", "jin", "pin", "sin", "tin", "win"],
  "-ip": ["dip", "hip", "lip", "nip", "rip", "sip", "tip", "zip"],
  "-it": ["bit", "fit", "hit", "kit", "lit", "pit", "sit", "wit"],
  "-od": ["cod", "god", "nod", "pod", "rod", "sod"],
  "-og": ["bog", "cog", "dog", "fog", "hog", "jog", "log"],
  "-op": ["cop", "hop", "mop", "pop", "top"],
  "-ot": ["cot", "dot", "got", "hot", "jot", "lot", "not", "pot", "rot", "tot"],
  "-ox": ["box", "cox", "fox", "lox", "pox"],
  "-ug": ["bug", "dug", "hug", "jug", "lug", "mug", "pug", "rug", "tug"],
  "-un": ["bun", "dun", "fun", "gun", "nun", "pun", "run", "sun"],
  "-up": ["cup", "pup", "sup", "yup"],
  "-us": ["bus", "pus"],
  "-ut": ["but", "cut", "gut", "hut", "jut", "nut", "rut"],
};

/** Set of all known CVC words for fast lookup. */
const ALL_WORDS = new Set(Object.values(CVC_DATA).flat());

/** Vowel → family codes (without the "-" prefix). */
export const WORD_FAMILIES = {
  A: ["ab", "ad", "ag", "am", "an", "ap", "at"],
  E: ["ed", "eg", "en", "et"],
  I: ["id", "ig", "in", "ip", "it"],
  O: ["od", "og", "op", "ot", "ox"],
  U: ["ug", "un", "up", "us", "ut"],
};

/** Flat list of all CVC words (lowercase). */
export const CVC_WORDS = [...ALL_WORDS];

/**
 * Get the initial consonants for a given word family code
 * (e.g. "ab" → ["c","d","g","j","l","n","t"]).
 */
export function getFamilyConsonants(familyCode) {
  const words = CVC_DATA[`-${familyCode}`] || [];
  return words.map(w => w[0]);
}

/**
 * Get image path for a CVC word.  Returns null for unknown words.
 * @param {string} word e.g. "cat"
 * @returns {string|null} path like "/images/cvc/at/cat.jpeg" or null
 */
export function getWordImage(word) {
  const w = word.toLowerCase();
  if (!ALL_WORDS.has(w)) return null;
  const family = w.slice(1);
  return `${BASE}/images/cvc/${family}/${w}.jpeg`;
}
export const LETTER_AUDIO = {
  a: `${BASE}/audio/letters/a.mp3`,
  b: `${BASE}/audio/letters/b.mp3`,
  c: `${BASE}/audio/letters/ck.mp3`,
  d: `${BASE}/audio/letters/d.mp3`,
  e: `${BASE}/audio/letters/e.mp3`,
  f: `${BASE}/audio/letters/f.mp3`,
  g: `${BASE}/audio/letters/g.mp3`,
  h: `${BASE}/audio/letters/h.mp3`,
  i: `${BASE}/audio/letters/i.mp3`,
  j: `${BASE}/audio/letters/j.mp3`,
  k: `${BASE}/audio/letters/ck.mp3`,
  l: `${BASE}/audio/letters/l.mp3`,
  m: `${BASE}/audio/letters/m.mp3`,
  n: `${BASE}/audio/letters/n.mp3`,
  o: `${BASE}/audio/letters/o.mp3`,
  p: `${BASE}/audio/letters/p.mp3`,
  qu: `${BASE}/audio/letters/qu.mp3`,
  r: `${BASE}/audio/letters/r.mp3`,
  s: `${BASE}/audio/letters/s.mp3`,
  t: `${BASE}/audio/letters/t.mp3`,
  u: `${BASE}/audio/letters/u.mp3`,
  v: `${BASE}/audio/letters/v.mp3`,
  w: `${BASE}/audio/letters/w.mp3`,
  x: `${BASE}/audio/letters/x.mp3`,
  y: `${BASE}/audio/letters/y.mp3`,
  z: `${BASE}/audio/letters/z.mp3`,
};

/** Vowel example word audio */
export const VOWEL_WORD_AUDIO = {
  a: `${BASE}/audio/vowel-words/a-apple.mp3`,
  e: `${BASE}/audio/vowel-words/e-elephant.mp3`,
  i: `${BASE}/audio/vowel-words/i-insect.mp3`,
  o: `${BASE}/audio/vowel-words/o-octopus.mp3`,
  u: `${BASE}/audio/vowel-words/u-up.mp3`,
};

/** Vowel Fun narration audio ("I make the sound …") */
export const VOWEL_FUN_AUDIO = {
  a: `${BASE}/audio/vowel-fun/a.mp3`,
  e: `${BASE}/audio/vowel-fun/e.mp3`,
  i: `${BASE}/audio/vowel-fun/i.mp3`,
  o: `${BASE}/audio/vowel-fun/o.mp3`,
  u: `${BASE}/audio/vowel-fun/u.mp3`,
};

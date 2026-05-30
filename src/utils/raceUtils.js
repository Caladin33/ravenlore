import racesData from '../data/races.json'

// Race name is the single source of truth stored on a character.
// The short key (e.g. 'elfDark') is only the internal index into races.json,
// so we derive it from the name on demand rather than storing/trusting a copy.
// Exact-name match means spaces in display names ("Dark Elf") are not a problem.

export const raceKeyFromName = (name) =>
  Object.keys(racesData).find(k => racesData[k].name === name) || 'human'

// Most callers want the race data object, not the key.
export const getRace = (name) =>
  racesData[raceKeyFromName(name)] || racesData.human

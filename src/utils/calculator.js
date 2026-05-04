// RavenLore Character Calculator
// Pure functions — no UI, no side effects.
// Takes character data + session state, returns all derived stats.
import attributeData from '../data/attributes.json'
import racesData from '../data/races.json'
import weaponsData from '../data/weapons.json'
import armorData from '../data/armor.json'

// ─────────────────────────────────────────────
// LOOKUP TABLES
// ─────────────────────────────────────────────

const STR_TABLE = attributeData.strength
const DEX_TABLE = attributeData.dexterity
const CON_TABLE = attributeData.constitution
const AW_TABLE  = attributeData.awareness
const WP_TABLE  = attributeData.willpower

function strLookup(val) { return (STR_TABLE[String(val)] || {}).damageBonus || 0 }
function dexExpertise(val) { return (DEX_TABLE[String(val)] || {}).expertise || 0 }
function dexInitiative(val) { return (DEX_TABLE[String(val)] || {}).initiative || 0 }
function dexPrecision(val) { return (DEX_TABLE[String(val)] || {}).precision || 0 }
function conTorsoHP(val) { return (CON_TABLE[String(val)] || {}).torsoHP || 0 }
function conWeight(val) { return (CON_TABLE[String(val)] || {}).weightAllowance || 0 }
function awSkillCap(val) { return (AW_TABLE[String(val)] || {}).skillCap || 0 }
function awEvasion(val) { return (AW_TABLE[String(val)] || {}).evasionBonus || 0 }
function wpArcane(val) { return (WP_TABLE[String(val)] || {}).arcanePower || 0 }

// ─────────────────────────────────────────────
// OBSERVATION TRAINING STEPPED TABLE
// ─────────────────────────────────────────────

const OT_TABLE = [
  { checkMod: 0, attrBonus: 0, evasionBonus: 0 },
  { checkMod: 1, attrBonus: 0, evasionBonus: 0 },
  { checkMod: 2, attrBonus: 0, evasionBonus: 1 },
  { checkMod: 2, attrBonus: 1, evasionBonus: 1 },
  { checkMod: 3, attrBonus: 1, evasionBonus: 1 },
  { checkMod: 4, attrBonus: 1, evasionBonus: 2 },
  { checkMod: 4, attrBonus: 2, evasionBonus: 2 },
]

function otBonus(rank) {
  return OT_TABLE[Math.min(rank, OT_TABLE.length - 1)] || OT_TABLE[0]
}

// ─────────────────────────────────────────────
// REFLEX TRAINING STEPPED TABLE
// ─────────────────────────────────────────────

const RT_TABLE = [
  { checkMod: 0, attrBonus: 0, initiativeBonus: 0 },
  { checkMod: 1, attrBonus: 0, initiativeBonus: 0 },
  { checkMod: 2, attrBonus: 0, initiativeBonus: 1 },
  { checkMod: 2, attrBonus: 1, initiativeBonus: 1 },
  { checkMod: 3, attrBonus: 1, initiativeBonus: 1 },
  { checkMod: 4, attrBonus: 1, initiativeBonus: 2 },
  { checkMod: 4, attrBonus: 2, initiativeBonus: 2 },
]

function rtBonus(rank) {
  return RT_TABLE[Math.min(rank, RT_TABLE.length - 1)] || RT_TABLE[0]
}

// ─────────────────────────────────────────────
// WEAPON MARK TABLES
// ─────────────────────────────────────────────

const MELEE_MARKS = {
  none:    { expertise: 0, precision: 0, damage: 0 },
  fox:     { expertise: 1, precision: 0, damage: 0 },
  serpent: { expertise: 1, precision: 2, damage: 0 },
  tiger:   { expertise: 3, precision: 2, damage: 1 },
  heron:   { expertise: 5, precision: 3, damage: 1 },
}

const RANGED_MARKS = {
  none:    { marksmanship: 0, precision: 0, damage: 0 },
  sparrow: { marksmanship: 1, precision: 0, damage: 0 },
  falcon:  { marksmanship: 1, precision: 0, damage: 1 },
  raven:   { marksmanship: 1, precision: 2, damage: 1 },
  eagle:   { marksmanship: 2, precision: 5, damage: 2 },
}

// ─────────────────────────────────────────────
// MANA MEAN TABLE
// ─────────────────────────────────────────────

const MANA_MEANS = {
  d3:  [2.0, 2.0, 2.0, 2.0, 2.0],
  d4:  [2.5, 3.0, 3.0, 3.0, 3.0],
  d6:  [3.5, 4.0, 4.5, 4.5, 4.5],
  d8:  [4.5, 5.0, 5.5, 6.0, 6.0],
  d10: [5.5, 6.0, 6.5, 7.0, 7.5],
  d12: [6.5, 7.0, 7.5, 8.0, 8.5],
}

const DIE_UPGRADE = { d3: 'd4', d4: 'd6', d6: 'd8', d8: 'd10', d10: 'd12', d12: 'd12' }

const MASTERY_TO_DIE = [null, 'd3', 'd4', 'd4', 'd6', 'd6', 'd8', 'd8', 'd10', 'd10']

// ─────────────────────────────────────────────
// HELPER: get skill rank from character
// ─────────────────────────────────────────────

function skillRank(char, skillName) {
  // Check martial skills
  const ms = char.martialSkills || {}
  if (ms[skillName]) return parseInt(ms[skillName].rank) || 0
  // Check arcane skills
  const as = char.arcaneSkills || {}
  if (as[skillName]) return parseInt(as[skillName].rank) || 0
  return 0
}

function skillKnown(char, skillName) {
  return skillRank(char, skillName) > 0
}

function hasSymbol(char, symbolName) {
  return (char.symbols || []).includes(symbolName)
}

function hasMark(char, markName) {
  return char.mark === markName
}

function hasMarkOrSymbol(char, name) {
  return hasMark(char, name) || hasSymbol(char, name)
}

// ─────────────────────────────────────────────
// WEAPON LOOKUP
// ─────────────────────────────────────────────

function getWeapon(weaponName) {
  if (!weaponName) return null
  return weaponsData.find(w => w.name.toLowerCase() === weaponName.toLowerCase()) || null
}

function getArmor(armorName) {
  if (!armorName || armorName === 'None') return armorData.bodyArmor[0]
  return armorData.bodyArmor.find(a => a.name.toLowerCase() === armorName.toLowerCase()) || armorData.bodyArmor[0]
}

function getHelm(helmName) {
  if (!helmName || helmName === 'None') return armorData.helms[0]
  return armorData.helms.find(h => h.name.toLowerCase() === helmName.toLowerCase()) || armorData.helms[0]
}

function getShieldSize(shieldType) {
  if (!shieldType) return null
  const size = shieldType.split('-')[0] // e.g. 'M-Metal' → 'M'
  const sizeMap = { S: 'Small', M: 'Medium', L: 'Large', T: 'Tower' }
  return armorData.shieldSizes.find(s => s.size === sizeMap[size]) || null
}

// ─────────────────────────────────────────────
// MAIN CALCULATOR
// ─────────────────────────────────────────────

export function calculate(char, session = {}) {
  const offHand = session.offHand || 'Empty'   // '2-Handed' | 'Dual Wield' | 'Shield' | 'Empty'
  const stance  = session.stance  || 'None'    // 'None' | 'Wind' | 'Wave' | 'Stone' | 'Flame'
  const unfettered = session.unfettered || false

  const raceKey = char.race ? char.race.charAt(0).toLowerCase() + char.race.slice(1).replace(/\s+/g, '') : 'human'
const race = racesData[raceKey] || racesData.human || {}
  const items = char.itemBonuses || {}

  // ── ATTRIBUTE SKILL RANKS ──────────────────
  const bbRank  = skillRank(char, 'Bodybuilding')
  const rtRank  = skillRank(char, 'Reflex Training')
  const condRank = skillRank(char, 'Conditioning')
  const otRank  = skillRank(char, 'Observation Training')
  const hrRank  = skillRank(char, 'Hardened Resolve')
  const persuRank = skillRank(char, 'Persuasion')

  const otData = otBonus(otRank)
  const rtData = rtBonus(rtRank)

  // ── EFFECTIVE ATTRIBUTES ───────────────────
  const strBase = (char.attributes?.str?.base || char.attributes?.str || 0)
  const dexBase = (char.attributes?.dex?.base || char.attributes?.dex || 0)
  const conBase = (char.attributes?.con?.base || char.attributes?.con || 0)
  const awBase  = (char.attributes?.aw?.base  || char.attributes?.aw  || 0)
  const chrBase = (char.attributes?.chr?.base || char.attributes?.chr || 0)
  const wpBase  = (char.attributes?.wp?.base  || char.attributes?.wp  || 0)

  // Mark of War gives +1 AW
  const markWarBonus = hasMarkOrSymbol(char, 'War') ? 1 : 0

  const STR = strBase + (race.strModifier || 0) + (items.str || 0) + Math.floor(bbRank / 3)
  const DEX = dexBase + (items.dex || 0) + Math.floor(rtRank / 3) + rtData.attrBonus
  const CON = conBase + (race.conModifier || 0) + (items.con || 0) + Math.floor(condRank / 3)
  const AW  = awBase  + (items.aw  || 0) + otData.attrBonus + markWarBonus
  const CHR = chrBase + (race.chrModifier || 0) + (items.chr || 0) + Math.floor(persuRank / 3)
  const WP  = wpBase  + (items.wp  || 0) + Math.floor(hrRank / 3)

  // ── ATTRIBUTE CHECK MODIFIERS ──────────────
  const helmName = char.armor?.head?.type || 'None'
  const helm = getHelm(helmName)
  const helmAwPenalty = -(helm?.awPenalty || 0)

  const gnomeAwBonus = (char.race === 'gnome') ? 1 : 0

  const strCheck = bbRank - Math.floor(bbRank / 3)
  const dexCheck = rtRank - Math.floor(rtRank / 3) + rtData.checkMod - (rtRank - Math.floor(rtRank / 3))  // = rtData.checkMod
  const conCheck = condRank - Math.floor(condRank / 3)
  const awCheck  = otData.checkMod + helmAwPenalty + gnomeAwBonus
  const chrCheck = persuRank - Math.floor(persuRank / 3)
  const wpCheck  = hrRank - Math.floor(hrRank / 3)

  // ── ADVANTAGE / DISADVANTAGE FLAGS ────────
  const advantageFlags = {
    str: char.race === 'halfling',
    dex: char.race === 'halfling',
    con: char.race === 'halfling' || char.race === 'dwarf',
    aw:  ['halfling','elfHigh','elfWood','elfDark','halfElf'].includes(char.race),
    chr: char.race === 'halfling',
    wp:  char.race === 'halfling' || char.race === 'dwarf',
  }

  const disadvantageFlags = {
    con: char.race === 'gnome' || char.race === 'elderling',
  }

  // ── ARCANE POWER ───────────────────────────
  const AP = wpArcane(WP) + (race.apModifier || 0) + (items.ap || 0)

  // ── ARMOR EVASION PENALTY ──────────────────
  const armorLocations = ['rArm', 'lArm', 'torso', 'lLeg', 'rLeg']
  let totalArmorEvasionPenalty = 0
  let plateCount = 0

  for (const loc of armorLocations) {
    const armorType = char.armor?.[loc]?.type || 'None'
    const a = getArmor(armorType)
    totalArmorEvasionPenalty += (a?.evasionPenaltyPerLocation || 0)
    if (armorType.toLowerCase().includes('plate')) plateCount++
  }
  // Add helm evasion penalty
  totalArmorEvasionPenalty += (helm?.evasionPenalty || 0)

  // ── UNFETTERED AUTO-CONDITIONS ─────────────
  const shieldEquipped = offHand === 'Shield'
  const weightAllowance = conWeight(CON) + STR
  const carryingWeight = char.carryingWeight || 0
  const unfetteredConditions = {
    weightOk: carryingWeight < (weightAllowance / 2),
    noShield: !shieldEquipped,
    plateOk: plateCount <= 1,
    armorPenaltyOk: totalArmorEvasionPenalty <= 1,
  }
  const canBeUnfettered = Object.values(unfetteredConditions).every(Boolean)
  const isUnfettered = canBeUnfettered && unfettered

  // ── HIT POINTS ────────────────────────────
  const chiRank = skillRank(char, 'Chi Mastery')
  const resilienceRank = skillRank(char, 'Resilience')
  const racialHP = race.hpModifier || 0
  const itemHP = items.hp || 0
  const markLifeBonus = hasMarkOrSymbol(char, 'Life') ? 3 : 0

  const torsoHP = conTorsoHP(CON) + chiRank + racialHP + itemHP + resilienceRank + markLifeBonus
  const legHP   = Math.floor(torsoHP / 2) + resilienceRank
  const armHP   = Math.floor(torsoHP / 3) + resilienceRank
  const headHP  = Math.ceil(torsoHP / 3)  + resilienceRank

  // ── SKILL CAP ─────────────────────────────
  const skillCap = awSkillCap(AW)

  // ── WEIGHT ALLOWANCE ──────────────────────
  // already calculated above

  // ── DAMAGE BONUS ──────────────────────────
  const punishingBlows = skillRank(char, 'Punishing Blows')
  const damageBonus = strLookup(STR) + punishingBlows

  // ── INITIATIVE ────────────────────────────
  const initiativeSkillRank = skillRank(char, 'Initiative')
  const initiative = dexInitiative(DEX) + rtData.initiativeBonus + initiativeSkillRank

  // ── MOVEMENT ──────────────────────────────
  const alacrityRank = skillRank(char, 'Alacrity')
  const windStanceRank = stance === 'Wind' ? skillRank(char, 'Wind Stance') : 0
  const movement = (race.move || 10) + alacrityRank + windStanceRank

  // ── EVASION ───────────────────────────────
  const evasiveMotionRank = skillRank(char, 'Evasive Motion')
  const expertShieldingRank = skillRank(char, 'Expert Shielding')
  const windsWhisperRank = skillRank(char, "Wind's Whisper")
  const symbolWisdomBonus = hasSymbol(char, 'Wisdom') ? 4 : 0
  const markWisdomBonus = hasMark(char, 'Wisdom') ? 0 : 0 // Mark of Wisdom gives aura slot, not evasion

  const shieldEvasion = shieldEquipped ? (getShieldSize(char.armor?.shield?.type)?.evasionBonus || 0) : 0
  const expertShieldBonus = shieldEquipped ? expertShieldingRank : 0

  const evasionRaw = awEvasion(AW)
    + evasiveMotionRank
    + otData.evasionBonus
    + expertShieldBonus
    + shieldEvasion
    + windsWhisperRank
    + windStanceRank
    + symbolWisdomBonus
    + (items.evasion || 0)
    - Math.floor(totalArmorEvasionPenalty)

  const evasion = Math.max(0, Math.min(20, evasionRaw))

  // ── REAR EVASION ──────────────────────────
  const aLeafOnTheWind = skillKnown(char, 'A Leaf on the Wind')
  const leafMult = aLeafOnTheWind ? 1 : 0.5

  const rearEvasionRaw = Math.floor(
    (windsWhisperRank + evasiveMotionRank) * leafMult
    + (awEvasion(AW) + otData.evasionBonus + windStanceRank + (items.evasion || 0) - Math.floor(totalArmorEvasionPenalty)) / 2
  )
  const rearEvasion = Math.max(0, Math.min(20, rearEvasionRaw))

  // ── SPELL HOOKS ───────────────────────────
  const spellcraftingRank = skillRank(char, 'Spellcrafting')
  const willMasteryRank = skillRank(char, 'Will Mastery')
  const spellHooks = Math.floor(AP / 2) + spellcraftingRank + Math.floor(willMasteryRank / 3)

  // ── MAX SPELLS KNOWN ──────────────────────
  const chaosMastery = skillRank(char, 'Chaos Mastery')
  const chiMastery   = skillRank(char, 'Chi Mastery')
  const elemMastery  = skillRank(char, 'Elemental Mastery')
  const orderMastery = skillRank(char, 'Order Mastery')
  const expandedHorizons = skillRank(char, 'Expanded Horizons')

  const maxSpellsKnown = AP
    + chaosMastery + chiMastery + elemMastery + orderMastery + willMasteryRank
    + expandedHorizons
    + orderMastery  // Order Mastery counts twice

  // ── MANA MEAN ─────────────────────────────
  const manaMasteryRank = Math.min(skillRank(char, 'Mana Mastery'), 4)
  const manaFontRank = skillRank(char, 'Mana Font')
  const masterWeaverKnown = skillKnown(char, 'Master Weaver')

  const colors = ['chaos', 'chi', 'elemental', 'order', 'will']
  const masteryRanks = {
    chaos: chaosMastery,
    chi: chiMastery,
    elemental: elemMastery,
    order: orderMastery,
    will: willMasteryRank,
  }

  let manaMean = 0
  const weavingDice = {}

  for (const color of colors) {
    const rank = masteryRanks[color]
    if (rank === 0) continue
    let die = MASTERY_TO_DIE[rank]
    if (masterWeaverKnown) die = DIE_UPGRADE[die] || die
    weavingDice[color] = die
    const mean = (MANA_MEANS[die] || MANA_MEANS['d3'])[manaMasteryRank]
    manaMean += mean
  }
  manaMean += manaFontRank
  manaMean = Math.round(manaMean * 10) / 10  // 1 decimal place

  // ── ARCANE SPELL PRECISION ─────────────────
  const arcaneAimRank = skillRank(char, 'Arcane Aim')
  const mischief = hasSymbol(char, 'Mischief') ? 3 : 0
  const spellPrecision = arcaneAimRank + mischief + windsWhisperRank

  // ── SKILL POINTS ──────────────────────────
  const basePointsPerLevel = 65 + (race.skillPointsPerLevelModifier || 0)
  const firstLevelBonus = race.firstLevelBonus !== false ? 65 : 0
  const markIronBonus = hasMarkOrSymbol(char, 'Iron') ? 2 * (char.level || 1) : 0
  const gmBonus = char.skillPoints?.bonusGiven || 0
  const totalPointsEarned = (basePointsPerLevel * (char.level || 1)) + firstLevelBonus + markIronBonus + gmBonus
  const totalPointsSpent = char.skillPoints?.totalSpent || 0
  const unspentPoints = totalPointsEarned - totalPointsSpent

  // ── GENERAL SKILLS ────────────────────────
  // Calculate score for each known general skill
  // (Free base requires the skill definition from generalSkills.json — done in the component)

  // ── WEAPON SLOTS ──────────────────────────
  const guidedWrath = skillKnown(char, 'Guided Wrath')
  const wellTrainedRank = skillRank(char, 'Well Trained')
  const meleeMasteryRank = skillRank(char, 'Melee Mastery')
  const hardHitting = skillKnown(char, 'Hard Hitting')
  const offShieldRank = skillRank(char, 'Offensive Shielding')
  const wardancingRank = skillRank(char, 'Wardancing')
  const duelingRank = skillRank(char, 'Dueling')
  const preciseStrikesRank = skillRank(char, 'Precise Strikes')
  const twistTheBlade = skillKnown(char, 'Twist the Blade')
  const committedStrikes = skillKnown(char, 'Committed Strikes')
  const martialArtist = skillKnown(char, 'Martial Artist')
  const victoriousDamageRank = skillRank(char, 'Victorious Damage')
  const cascadingStrikesRank = skillRank(char, 'Cascading Strikes')
  const victoriousPrecisionRank = skillRank(char, 'Victorious Precision')
  const armorPiercingRank = skillRank(char, 'Armor Piercing')
  const breachingBlows = skillKnown(char, 'Breaching Blows')
  const rendArmor = skillKnown(char, 'Rend Armor')
  const antiArmoredBlunt = skillRank(char, 'Anti-Armored Combat: Blunt')
  const cursedBladeRank = skillRank(char, 'Cursed Blade')
  const waveStanceRank = stance === 'Wave' ? skillRank(char, 'Wave Stance') : 0
  const stoneStanceRank = stance === 'Stone' ? skillRank(char, 'Stone Stance') : 0

  const racialPrecision = (char.race === 'elfWood') ? 3 : 0
  const mischievousPrecision = hasSymbol(char, 'Mischief') ? 3 : 0

  // DEX base values
  const dexExp = guidedWrath ? AP : dexExpertise(DEX)
  const dexPrec = dexPrecision(DEX)

  // MoV rates
  const movDamageRate = Math.round((victoriousDamageRank * 0.1 + cascadingStrikesRank * 0.1) * 10) / 10
  const movPrecisionRate = Math.round((victoriousPrecisionRank * 0.1 + (isUnfettered ? cascadingStrikesRank * 0.1 : 0)) * 10) / 10

  // Ranged skills
  const targetPracticeRank = skillRank(char, 'Target Practice')
  const archeryRank = skillRank(char, 'Archery')
  const crossbowMasteryRank = skillRank(char, 'Crossbow Mastery')
  const throwingMasteryRank = skillRank(char, 'Throwing Mastery')
  const preciseShotsRank = skillRank(char, 'Precise Shots')
  const lethalPrecisionRank = skillRank(char, 'Lethal Precision')
  const antiArmorArcheryRank = skillRank(char, 'Anti Armor Archery')
  const hurlingKnown = skillKnown(char, 'Hurling')
  const veryLongRangeKnown = skillKnown(char, 'Very Long Range')

  // ── CALCULATE PER MELEE WEAPON SLOT ───────
  function calcMeleeSlot(slot) {
    if (!slot || !slot.name) return null
    const weapon = getWeapon(slot.name)
    if (!weapon) return { name: slot.name, error: 'Weapon not found in table' }

    const mark = MELEE_MARKS[slot.mark?.toLowerCase() || 'none'] || MELEE_MARKS.none
    const isUnarmed = weapon.name.toLowerCase() === 'unarmed'
    const isQuickLight = ['Quick', 'Light'].includes(weapon.weaponClass)
    const isBlunt = weapon.flags?.blunt || false
    const isPiercing = weapon.flags?.piercing || false
    const isCursed = slot.isCursed || false

    // Expertise
    let expertise = dexExp + wellTrainedRank + meleeMasteryRank + mark.expertise + (slot.itemExpertiseBonus || 0)
    if (hardHitting) expertise += damageBonus
    if (offHand === 'Shield') expertise += offShieldRank
    else if (offHand === 'Dual Wield' || isUnarmed) expertise += wardancingRank
    else if (offHand === 'Empty' && isQuickLight && isUnfettered) expertise += duelingRank
    expertise += waveStanceRank

    // Applicable damage bonus
    let applicableDB = damageBonus
    if (weapon.flags?.noDamageBonus) {
      if (twistTheBlade && weapon.name.toLowerCase() === 'rapier') {
        applicableDB = Math.floor(damageBonus / 2)
      } else {
        applicableDB = 0
      }
    } else if (weapon.flags?.halfDamageBonus) {
      if (twistTheBlade && weapon.name.toLowerCase() === 'dagger') {
        applicableDB = damageBonus
      } else {
        applicableDB = Math.floor(damageBonus / 2)
      }
    } else if (committedStrikes && offHand === '2-Handed' && weapon.flags?.committedStrikes) {
      applicableDB = damageBonus * 2
    }

    // Damage die
    let damageDie = weapon.damage
    if (isUnarmed && martialArtist) damageDie = '1d4'

    // Total fixed damage
    const totalDamage = applicableDB + mark.damage + (slot.itemDamageBonus || 0) + stoneStanceRank

    // Precision
    let precision = dexPrec + preciseStrikesRank + wellTrainedRank + mark.precision
      + mischievousPrecision + windsWhisperRank + waveStanceRank
      + racialPrecision + (slot.itemPrecisionBonus || 0) + (items.precision || 0)
    if (offHand === 'Empty' && isQuickLight && isUnfettered) precision += duelingRank

    // Armor penetration
    let armorBypass = slot.itemAPBonus || 0
    if (isBlunt) armorBypass += antiArmoredBlunt
    if (isCursed) armorBypass += cursedBladeRank

    // MoV armor bypass rate
    const movBypassRate = isPiercing ? Math.round(armorPiercingRank * 0.5 * 10) / 10 : 0

    // Breaches
    const baseBreaches = weapon.breaches || 0
    const breachBonus = (isBlunt && breachingBlows) ? 1 : 0
    const breaches = (baseBreaches + breachBonus) * (rendArmor ? 2 : 1)

    return {
      name: weapon.name,
      weaponClass: weapon.weaponClass,
      combatDie: weapon.combatDie,
      damageDie,
      expertise,
      damage: totalDamage,
      precision,
      armorBypass,
      movBypassRate,
      breaches,
      movDamageRate,
      movPrecisionRate,
    }
  }

  // ── CALCULATE PER RANGED WEAPON SLOT ──────
  function calcRangedSlot(slot) {
    if (!slot || !slot.name) return null
    const weapon = getWeapon(slot.name)
    if (!weapon) return { name: slot.name, error: 'Weapon not found in table' }

    const mark = RANGED_MARKS[slot.mark?.toLowerCase() || 'none'] || RANGED_MARKS.none
    const isPiercing = weapon.flags?.piercing || false
    const weaponClass = weapon.weaponClass

    // Marksmanship
    let marksmanship = Math.floor(dexExpertise(DEX) / 2) + targetPracticeRank + mark.marksmanship + (slot.itemMarksmanshipBonus || 0)
    if (weaponClass === 'Bow') marksmanship += archeryRank
    else if (weaponClass === 'Crossbow') marksmanship += crossbowMasteryRank
    else if (weaponClass === 'Thrown') marksmanship += throwingMasteryRank

    // Damage
    const damageDie = weapon.damage
    const totalDamage = mark.damage + (slot.itemDamageBonus || 0)

    // Precision
    const precision = dexPrec + preciseShotsRank + targetPracticeRank + mark.precision
      + mischievousPrecision + windsWhisperRank + racialPrecision + (slot.itemPrecisionBonus || 0)

    // HS precision rate
    const hsPrecisionRate = Math.round(lethalPrecisionRank * 0.5 * 10) / 10

    // HS armor bypass rate (character level, not per weapon)
    const hsArmorBypassRate = (isPiercing || weaponClass === 'Bow' || weaponClass === 'Crossbow')
      ? Math.round(antiArmorArcheryRank * 0.25 * 10) / 10
      : 0

    // Ranges
    let ranges = { ...weapon.range }
    if (hurlingKnown && weaponClass === 'Thrown') {
      ranges = {
        type: 'ranged',
        short: ranges.short * 2,
        medium: ranges.medium * 2,
        long: ranges.long * 2,
      }
    }
    if (veryLongRangeKnown) {
      ranges.veryLong = ranges.long
    }

    return {
      name: weapon.name,
      weaponClass,
      combatDie: weapon.combatDie,
      damageDie,
      marksmanship,
      damage: totalDamage,
      precision,
      hsPrecisionRate,
      hsArmorBypassRate,
      ranges,
      movDamageRate,
    }
  }

  // Calculate all weapon slots
  const meleeSlots = (char.weapons?.melee || []).map(calcMeleeSlot)
  const rangedSlots = (char.weapons?.ranged || []).map(calcRangedSlot)

  // ── RETURN ALL DERIVED STATS ───────────────
  return {
    // Attributes
    attributes: {
      str: { effective: STR, checkMod: strCheck, advantage: advantageFlags.str, disadvantage: disadvantageFlags.str || false },
      dex: { effective: DEX, checkMod: rtData.checkMod, advantage: advantageFlags.dex, disadvantage: false },
      con: { effective: CON, checkMod: conCheck, advantage: advantageFlags.con, disadvantage: disadvantageFlags.con || false },
      aw:  { effective: AW,  checkMod: awCheck,  advantage: advantageFlags.aw,  disadvantage: false },
      chr: { effective: CHR, checkMod: chrCheck, advantage: advantageFlags.chr, disadvantage: false },
      wp:  { effective: WP,  checkMod: wpCheck,  advantage: advantageFlags.wp,  disadvantage: false },
    },

    // HP
    hp: { torso: torsoHP, leg: legHP, arm: armHP, head: headHP },

    // Combat
    initiative,
    movement,
    evasion,
    rearEvasion,
    skillCap,
    weightAllowance,
    damageBonus,

    // Magic
    arcanePower: AP,
    spellHooks,
    maxSpellsKnown,
    manaMean,
    weavingDice,
    spellPrecision,

    // Weapons
    meleeSlots,
    rangedSlots,

    // Skill points
    skillPoints: {
      totalEarned: totalPointsEarned,
      totalSpent: totalPointsSpent,
      unspent: unspentPoints,
    },

    // Session state echoed back
    session: { offHand, stance, unfettered: isUnfettered, canBeUnfettered },

    // Unfettered conditions for display
    unfetteredConditions,

    // MoV/HS rates (character level)
    movDamageRate,
    movPrecisionRate,
    hsArmorBypassRate: Math.round(antiArmorArcheryRank * 0.25 * 10) / 10,
  }
}

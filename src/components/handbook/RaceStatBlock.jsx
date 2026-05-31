const ATTR_NAMES = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  aw: 'Awareness', chr: 'Charisma', wp: 'Willpower'
}

function formatAttrBound(obj, label) {
  if (!obj || Object.keys(obj).length === 0) return null
  const byVal = {}
  for (const [k, v] of Object.entries(obj)) {
    if (!byVal[v]) byVal[v] = []
    byVal[v].push(ATTR_NAMES[k] || k)
  }
  return Object.entries(byVal)
    .map(([val, attrs]) => `${label} ${attrs.join(' and ')} ${val}`)
    .join(', ')
}

export default function RaceStatBlock({ race }) {
  if (!race) return null

  const parts = []

  const mins = formatAttrBound(race.attrMin, 'Minimum')
  if (mins) parts.push(mins)

  const maxs = formatAttrBound(race.attrMax, 'Maximum')
  if (maxs) parts.push(maxs)

  if (race.vision && race.vision !== 'None')
    parts.push(`${race.vision} ${race.visionRange} feet`)

  if (race.heightRange) parts.push(`Height ${race.heightRange}`)
  parts.push(`Move ${race.move}`)

  if (race.hpModifier !== 0)
    parts.push(`${race.hpModifier > 0 ? '+' : ''}${race.hpModifier} Hit Point in each body section`)

  const modFields = [
    ['strModifier', 'Strength'], ['conModifier', 'Constitution'],
    ['dexModifier', 'Dexterity'], ['awModifier', 'Awareness'],
    ['chrModifier', 'Charisma'], ['wpModifier', 'Willpower'],
    ['apModifier', 'Arcane Power'], ['precisionModifier', 'Precision'],
  ]
  for (const [field, label] of modFields) {
    const val = race[field]
    if (val && val !== 0) parts.push(`${val > 0 ? '+' : ''}${val} ${label}`)
  }

  if (race.skillPointsPerLevelModifier !== 0) {
    const v = race.skillPointsPerLevelModifier
    parts.push(`${v > 0 ? '+' : ''}${v} skill points per level`)
  }

  if (race.firstLevelBonus === false)
    parts.push('No first level skill point bonus')

  if (race.maintenanceModifier !== 0) {
    const pct = Math.abs(race.maintenanceModifier)
    parts.push(race.maintenanceModifier < 0
      ? `${pct}% off maintenance costs`
      : `${pct}% more maintenance costs`)
  }

  if (race.manaModifier && race.manaModifier !== 0)
    parts.push(`${race.manaModifier}% more mana`)

  if (race.naturalArmor && race.naturalArmor !== 0)
    parts.push(`Natural Armor ${race.naturalArmor}`)

  if (race.generalSkillBonus && race.generalSkillBonus !== 0) {
    const v = race.generalSkillBonus
    parts.push(`${v > 0 ? '+' : ''}${v}% General skill cap`)
  }

  if (race.advantages?.length) {
    const names = race.advantages.map(a => ATTR_NAMES[a] || a)
    parts.push(`Advantage on all ${names.join(' and ')} checks`)
  }
  if (race.disadvantages?.length) {
    const names = race.disadvantages.map(a => ATTR_NAMES[a] || a)
    parts.push(`Disadvantage on all ${names.join(' and ')} checks`)
  }

  const special = race.specialRules && race.specialRules !== 'None'
    ? race.specialRules : null

  return (
    <div className="race-stat-block">
      <p>
        <strong>{race.name}:</strong>{' '}
        {parts.join('. ')}.
      </p>
      {special && <p className="race-special-rules">{special}</p>}
    </div>
  )
}

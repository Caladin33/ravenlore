import { useState, useMemo } from 'react'
import martialSkillsData from '../data/martialSkills.json'
import generalSkillsData from '../data/generalSkills.json'
import arcaneSkillsData from '../data/arcaneSkills.json'
import attributeData from '../data/attributes.json'
import racesData from '../data/races.json'
import { GeneralSkillCard } from './GeneralSkillCard'
// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// ATTRIBUTE & SKILL SCORE CALCULATION
// ─────────────────────────────────────────────

function getEffectiveAttributes(char) {
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const attrs = char.attributes || {}
  const ms = char.martialSkills || {}

  function base(key) {
    return attrs[key]?.base || attrs[key] || 0
  }
  function skillRank(name) {
    return parseInt(ms[name]?.rank) || 0
  }

  const STR = base('str') + (race.strModifier || 0) + Math.floor(skillRank('Bodybuilding') / 3)
  const DEX = base('dex') + Math.floor(skillRank('Reflex Training') / 3)
  const CON = base('con') + (race.conModifier || 0) + Math.floor(skillRank('Conditioning') / 3)
  const AW  = base('aw')  + Math.floor(skillRank('Observation Training') / 3)
  const CHR = base('chr') + (race.chrModifier || 0) + Math.floor(skillRank('Persuasion') / 3)
  const WP  = base('wp')  + Math.floor(skillRank('Hardened Resolve') / 3)

  return { STR, DEX, CON, AW, CHR, WP }
}

function calcSkillScore(skill, char, attrs) {
  const formula = (skill.freeBase || '').toUpperCase().replace(/\s+/g, '')
  const pts = parseInt(char.generalSkills?.[skill.name]?.pointsInvested) || 0
  const mult = parseInt(skill.costMultiplier) || 1
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const racialBonus = race.generalSkillBonus || 0

  // Parse formula like 2STR+DEX, 2AW, CHR+AW, none
  let freeBase = 0
  if (formula && formula !== 'NONE' && formula !== '') {
    // Replace attribute names with values
    let expr = formula
      .replace(/STR/g, attrs.STR)
      .replace(/DEX/g, attrs.DEX)
      .replace(/CON/g, attrs.CON)
      .replace(/AW/g, attrs.AW)
      .replace(/CHR/g, attrs.CHR)
      .replace(/WP/g, attrs.WP)
    try {
      // Handle implicit multiplication like 2STR → already replaced to 2×value
      // but "2STR" becomes "217" not "2*17" so we need to handle prefix numbers
     // First insert * for implicit multiplication, THEN replace attributes
let expr = formula
  .replace(/(\d)(STR|DEX|CON|AW|CHR|WP)/g, '$1*$2')  // 2STR → 2*STR
  .replace(/STR/g, attrs.STR)
  .replace(/DEX/g, attrs.DEX)
  .replace(/CON/g, attrs.CON)
  .replace(/AW/g, attrs.AW)
  .replace(/CHR/g, attrs.CHR)
  .replace(/WP/g, attrs.WP)
      // eslint-disable-next-line no-new-func
      freeBase = Math.floor(Function('"use strict"; return (' + expr + ')')())
    } catch {
      freeBase = 0
    }
  }

  return (pts * mult) + freeBase + racialBonus
}
const TABS = ['General', 'Martial', 'Spiritual', 'Obscure']

const SPIRITUAL_CATEGORIES = ['spellcaster', 'guild', 'divine', 'balance']
const OBSCURE_CATEGORIES = ['infernal', 'lycanthropy', 'animal']

const SPIRITUAL_LABELS = {
  spellcaster: 'Arcane',
  guild: 'Guild',
  divine: 'Divine',
  balance: 'Balance',
}

const OBSCURE_LABELS = {
  infernal: 'Infernal',
  lycanthropy: 'Lycanthropy',
  animal: 'Animal',
}

function getAllArcaneSkills(data) {
  const skills = []
 for (const category of SPIRITUAL_CATEGORIES) {
    const list = data[category.toLowerCase()] || data[category] || []
    list.forEach(skill => skills.push({ ...skill, category }))
  }
  return skills
}

function getSkillRank(char, skillName) {
  const ms = char.martialSkills || {}
  const as = char.arcaneSkills || {}
  const gs = char.generalSkills || {}
  if (ms[skillName]) return parseInt(ms[skillName].rank) || 0
  if (as[skillName]) return parseInt(as[skillName].rank) || 0
  if (gs[skillName]) return parseInt(gs[skillName].pointsInvested) || 0
  return 0
}

function getPointsInvested(char, skillName, isGeneral) {
  if (isGeneral) {
    return parseInt(char.generalSkills?.[skillName]?.pointsInvested) || 0
  }
  const ms = char.martialSkills || {}
  const as = char.arcaneSkills || {}
  if (ms[skillName]) return parseInt(ms[skillName].pointsInvested) || 0
  if (as[skillName]) return parseInt(as[skillName].pointsInvested) || 0
  return 0
}

// ─────────────────────────────────────────────
// SKILL ROW
// ─────────────────────────────────────────────

function SkillRow({ skill, char, onUpdate, isGeneral, attrs }) {
  const [expanded, setExpanded] = useState(false)

  const name = skill.name || skill.Skill || ''
  const desc = skill.description || skill.Description || ''
  const costPerRank = parseInt(skill.costPerRank || skill['Cost/Rank'] || skill.costMultiplier) || 1
  const maxRank = parseInt(skill.maxRank || skill['Max Rank']) || 1
  const mcl = skill.mcl || skill['Max Total Points/Level'] || 'any'
  const prereq = skill.prereq || skill['Notes/Prerequisites'] || ''
  const maint = parseFloat(skill.maintenancePerRank || skill.maintenanceCost || 0) || 0

  const currentPoints = getPointsInvested(char, name, isGeneral)
  const currentRank = isGeneral ? currentPoints : (parseInt(char.martialSkills?.[name]?.rank || char.arcaneSkills?.[name]?.rank) || 0)

  const isActive = currentPoints > 0 || currentRank > 0

  const addPoints = (amount) => {
    onUpdate(name, currentPoints + amount, isGeneral)
  }

  const removePoints = (amount) => {
    onUpdate(name, Math.max(0, currentPoints - amount), isGeneral)
  }

  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      background: isActive ? 'rgba(201,168,76,.04)' : 'transparent',
    }}>
      {/* Main row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px', cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Skill name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '.95rem', fontFamily: 'Georgia, serif',
            color: isActive ? 'var(--gold2)' : 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </div>
          {prereq && (
            <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>
              Req: {prereq}
            </div>
          )}
        </div>

        {/* Rank / points display */}
        <div style={{ textAlign: 'center', minWidth: 40 }}>
          {isGeneral ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontWeight: 600, fontFamily: 'Georgia, serif' }}>
                {attrs ? calcSkillScore(skill, char, attrs) : '—'}
               </div>
             <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{currentPoints}pts</div>
         </div>
        ) : (
            <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontWeight: 600 }}>
              {currentRank > 0 ? `R${currentRank}` : '—'}
            </div>
          )}
          {maint > 0 && isActive && (
            <div style={{ fontSize: '.6rem', color: 'var(--text3)' }}>{maint * (currentRank || 1)}/lvl</div>
          )}
        </div>

        {/* Point controls */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => removePoints(costPerRank)}
            style={{
              width: 24, height: 24, background: 'var(--surface2)',
              border: '1px solid var(--border2)', borderRadius: 3,
              color: 'var(--text3)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>
          <div style={{ width: 32, textAlign: 'center', fontSize: '.8rem', color: 'var(--text2)' }}>
            {currentPoints}
          </div>
          <button
            onClick={() => addPoints(costPerRank)}
            style={{
              width: 24, height: 24, background: 'var(--surface2)',
              border: '1px solid var(--border2)', borderRadius: 3,
              color: 'var(--gold)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>

        {/* Expand arrow */}
        <div style={{ color: 'var(--text3)', fontSize: '.7rem', minWidth: 12 }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded description */}
      {expanded && (
        <div style={{
          padding: '0 14px 12px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg2)',
        }}>
          <div style={{
            fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.65,
            fontFamily: 'Georgia, serif', marginTop: 10,
          }}>
            {desc || 'No description available.'}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '.75rem', color: 'var(--text3)' }}>
            <span>Cost: {costPerRank}/rank</span>
            <span>Max: {maxRank} rank{maxRank > 1 ? 's' : ''}</span>
            {mcl !== 'any' && <span>MC/L: {mcl}</span>}
            {maint > 0 && <span>Maintenance: {maint}/rank/level</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function SkillEditor({ character, onSave, onBack }) {
  const [activeTab, setActiveTab] = useState('Martial')
  const [char, setChar] = useState(() => JSON.parse(JSON.stringify(character)))
  const [search, setSearch] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const arcaneSkills = useMemo(() => getAllArcaneSkills(arcaneSkillsData), [])
const effectiveAttrs = useMemo(() => getEffectiveAttributes(char), [char])
  // Calculate point totals
  const pointTotals = useMemo(() => {
    let martialSpent = 0
    let arcaneSpent = 0
    let generalSpent = 0

    Object.values(char.martialSkills || {}).forEach(s => {
      martialSpent += parseInt(s.pointsInvested) || 0
    })
    Object.values(char.arcaneSkills || {}).forEach(s => {
      arcaneSpent += parseInt(s.pointsInvested) || 0
    })
    Object.values(char.generalSkills || {}).forEach(s => {
      generalSpent += parseInt(s.pointsInvested) || 0
    })

    const totalSpent = martialSpent + arcaneSpent + generalSpent
    const race = char.race || 'human'

    // Basic point calculation
    const raceData = { halfling: 0, goblin: 6, ogre: -5, halfOgre: -5 }
    const raceMod = raceData[race] || 0
    const firstLevel = (race !== 'goblin' && race !== 'ogre') ? 65 : 0
    const totalEarned = (65 + raceMod) * (char.level || 1) + firstLevel + (char.skillPoints?.bonusGiven || 0)

    return { martialSpent, arcaneSpent, generalSpent, totalSpent, totalEarned, unspent: totalEarned - totalSpent }
  }, [char])

  // Update a skill's points invested
  const handleUpdate = (skillName, newPoints, isGeneral) => {
    setChar(prev => {
      const next = JSON.parse(JSON.stringify(prev))

      if (isGeneral) {
        if (!next.generalSkills) next.generalSkills = {}
        if (newPoints === 0) {
          delete next.generalSkills[skillName]
        } else {
          next.generalSkills[skillName] = { pointsInvested: newPoints }
        }
      } else {
        // Figure out which skill list it belongs to
        const isMartial = martialSkillsData.some(s => s.name === skillName)
        const targetList = isMartial ? 'martialSkills' : 'arcaneSkills'
        if (!next[targetList]) next[targetList] = {}

        // Find cost per rank to calculate rank
        let costPerRank = 1
        let maxRank = 1
        if (isMartial) {
          const skillDef = martialSkillsData.find(s => s.name === skillName)
          costPerRank = skillDef?.costPerRank || 1
          maxRank = skillDef?.maxRank || 1
        } else {
          const skillDef = arcaneSkills.find(s => s.name === skillName)
          costPerRank = skillDef?.costPerRank || 1
          maxRank = skillDef?.maxRank || 1
        }

        const rank = Math.min(Math.floor(newPoints / costPerRank), maxRank)
        const maint = isMartial
          ? (martialSkillsData.find(s => s.name === skillName)?.maintenancePerRank || 0)
          : (arcaneSkills.find(s => s.name === skillName)?.maintenancePerRank || 0)

        if (newPoints === 0) {
          delete next[targetList][skillName]
        } else {
          next[targetList][skillName] = {
            pointsInvested: newPoints,
            rank: rank,
            maintenanceCost: maint * rank,
          }
        }
      }

      return next
    })
  }

  // Filter skills based on search and active toggle
  const filterSkills = (skills) => {
    return skills.filter(skill => {
      const name = skill.name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase()) &&
          !(skill.description || '').toLowerCase().includes(search.toLowerCase())) return false
      if (showActiveOnly) {
        const pts = getPointsInvested(char, name, activeTab === 'General')
        const rank = getSkillRank(char, name)
        if (pts === 0 && rank === 0) return false
      }
      return true
    })
  }

  const handleSave = () => {
    onSave(char)
  }

  const tabBtn = (tab) => ({
    padding: '7px 18px',
    background: activeTab === tab ? 'rgba(201,168,76,.15)' : 'var(--surface)',
    border: `1px solid ${activeTab === tab ? 'var(--gold)' : 'var(--border)'}`,
    color: activeTab === tab ? 'var(--gold2)' : 'var(--text2)',
    borderRadius: 4, cursor: 'pointer',
    fontFamily: 'Georgia, serif', fontSize: '.85rem',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', borderRadius: 4, padding: '6px 14px',
            cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
          }}
        >
          ← Sheet
        </button>
        <div>
          <h2 style={{ color: 'var(--gold2)', margin: 0 }}>Skills — {character.name}</h2>
          <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>
            Level {char.level} {char.race}
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            marginLeft: 'auto', padding: '8px 20px',
            background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a',
            color: '#4a9e4a', borderRadius: 5, cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: '.9rem',
          }}
        >
          Save Changes
        </button>
      </div>

      {/* Point totals */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '12px 16px',
      }}>
        {[
          ['Earned', pointTotals.totalEarned],
          ['Spent', pointTotals.totalSpent],
          ['Unspent', pointTotals.unspent],
          ['General', pointTotals.generalSpent],
          ['Martial', pointTotals.martialSpent],
          ['Arcane', pointTotals.arcaneSpent],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: '.55rem', letterSpacing: '.15em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{lbl}</div>
            <div style={{
              fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif',
              color: lbl === 'Unspent' && val < 0 ? '#c94a4a' : 'var(--gold2)',
            }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {TABS.map(tab => (
          <button key={tab} style={tabBtn(tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '7px 12px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 4,
            fontFamily: 'Georgia, serif', fontSize: '.9rem',
          }}
        />
        <button
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          style={{
            padding: '7px 14px',
            background: showActiveOnly ? 'rgba(201,168,76,.15)' : 'var(--surface)',
            border: `1px solid ${showActiveOnly ? 'var(--gold)' : 'var(--border)'}`,
            color: showActiveOnly ? 'var(--gold2)' : 'var(--text3)',
            borderRadius: 4, cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: '.82rem',
          }}
        >
          Active Only
        </button>
      </div>

      {/* Skill list */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {activeTab === 'General' && (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10, padding: 14 }}>
    {filterSkills(generalSkillsData).map(skill => {
      const pts = parseInt(char.generalSkills?.[skill.name]?.pointsInvested) || 0
      const score = effectiveAttrs ? calcSkillScore(skill, char, effectiveAttrs) : 0
      const getSkillScore = (name) => {
        const s = generalSkillsData.find(x => x.name === name)
        if (!s) return 0
        return calcSkillScore(s, char, effectiveAttrs || {})
      }
      return (
        <GeneralSkillCard
          key={skill.name}
          skill={skill}
          score={score}
          pointsInvested={pts}
          getSkillScore={getSkillScore}
          onAdd={() => handleUpdate(skill.name, pts + 1, true)}
onRemove={() => handleUpdate(skill.name, Math.max(0, pts - 1), true)}
        />
      )
    })}
  </div>
)}

        {activeTab === 'Martial' && filterSkills(martialSkillsData).map(skill => (
          <SkillRow
            key={skill.name}
            skill={skill}
            char={char}
            onUpdate={handleUpdate}
            isGeneral={false}
          />
        ))}

        {(activeTab === 'Spiritual' || activeTab === 'Obscure') && (() => {
  const categories = activeTab === 'Spiritual' ? SPIRITUAL_CATEGORIES : OBSCURE_CATEGORIES
  const labels = activeTab === 'Spiritual' ? SPIRITUAL_LABELS : OBSCURE_LABELS
  return categories.map(category => {
    const categorySkills = filterSkills(
      (arcaneSkillsData[category] || []).map(s => ({ ...s, category }))
    )
    if (categorySkills.length === 0) return null
    return (
      <div key={category}>
        <div style={{
          padding: '6px 14px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          fontSize: '.6rem', letterSpacing: '.2em',
          color: 'var(--gold)', textTransform: 'uppercase',
        }}>
          {labels[category]}
        </div>
        {categorySkills.map(skill => (
          <SkillRow
            key={skill.name}
            skill={skill}
            char={char}
            onUpdate={handleUpdate}
            isGeneral={false}
          />
        ))}
      </div>
    )
  })
})()}
</div>
    </div>
  )
}
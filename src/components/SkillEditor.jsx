import { useState, useMemo } from 'react'
import martialSkillsData from '../data/martialSkills.json'
import generalSkillsData from '../data/generalSkills.json'
import arcaneSkillsData from '../data/arcaneSkills.json'
import attributeData from '../data/attributes.json'
import racesData from '../data/races.json'
import { GeneralSkillCard } from './GeneralSkillCard'
import { RankedSkillTable, THEMES } from './RankedSkillTable'
import selfImprovementData from '../data/selfImprovementSkills.json'

// ── OBSCURE CATEGORY KEYS ─────────────────────────────────────────────────────
const OBSCURE_CATEGORIES = ['infernal', 'lycanthropy', 'animal']
const SPIRITUAL_CATEGORIES = ['spellcaster', 'guild', 'divine', 'balance']

const SPIRITUAL_LABELS = {
  spellcaster: 'Arcane', guild: 'Guild', divine: 'Divine', balance: 'Balance',
}
const OBSCURE_LABELS = {
  infernal: 'Infernal', lycanthropy: 'Lycanthropy', animal: 'Animal',
}

// ── ATTRIBUTE CALCULATION ─────────────────────────────────────────────────────
function getEffectiveAttributes(char) {
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const attrs = char.attributes || {}
  const ms = char.martialSkills || {}
  const si = char.selfImprovementSkills || {}

  function base(key) { return attrs[key]?.base || attrs[key] || 0 }
  function skillRank(name) {
    return parseInt(si[name]?.rank) || parseInt(ms[name]?.rank) || 0
  }

  return {
    STR: base('str') + (race.strModifier || 0) + Math.floor(skillRank('Bodybuilding') / 3),
    DEX: base('dex') + Math.floor(skillRank('Reflex Training') / 3),
    CON: base('con') + (race.conModifier || 0) + Math.floor(skillRank('Conditioning') / 3),
    AW:  base('aw')  + Math.floor(skillRank('Observation Training') / 3),
    CHR: base('chr') + (race.chrModifier || 0) + Math.floor(skillRank('Persuasion') / 3),
    WP:  base('wp')  + Math.floor(skillRank('Hardened Resolve') / 3),
  }
}

function calcSkillScore(skill, char, attrs) {
  const formula = (skill.freeBase || '').toUpperCase().replace(/\s+/g, '')
  const pts = parseInt(char.generalSkills?.[skill.name]?.pointsInvested) || 0
  const mult = parseInt(skill.costMultiplier) || 1
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const racialBonus = race.generalSkillBonus || 0
  let freeBase = 0
  if (formula && formula !== 'NONE' && formula !== '') {
    let expr = formula
      .replace(/(\d)(STR|DEX|CON|AW|CHR|WP)/g, '$1*$2')
      .replace(/STR/g, attrs.STR).replace(/DEX/g, attrs.DEX)
      .replace(/CON/g, attrs.CON).replace(/AW/g, attrs.AW)
      .replace(/CHR/g, attrs.CHR).replace(/WP/g, attrs.WP)
    try { freeBase = Math.floor(Function('"use strict"; return (' + expr + ')')()) } catch { freeBase = 0 }
  }
  return (pts * mult) + freeBase + racialBonus
}

function getAllArcaneSkills(data) {
  const skills = []
  for (const category of [...SPIRITUAL_CATEGORIES, ...OBSCURE_CATEGORIES]) {
    const list = data[category.toLowerCase()] || data[category] || []
    list.forEach(skill => skills.push({ ...skill, category }))
  }
  return skills
}

function getPointsInvested(char, skillName, isGeneral) {
  if (isGeneral) return parseInt(char.generalSkills?.[skillName]?.pointsInvested) || 0
  const sources = [char.martialSkills, char.arcaneSkills, char.selfImprovementSkills]
  for (const src of sources) {
    if (src?.[skillName]) return parseInt(src[skillName].pointsInvested) || 0
  }
  return 0
}

const TABS = ['General', 'Martial', 'Spiritual', 'Obscure']

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SkillEditor({ character, onSave, onBack }) {
  const [activeTab, setActiveTab] = useState('Martial')
  const [char, setChar] = useState(() => JSON.parse(JSON.stringify(character)))
  const [gmMode, setGmMode] = useState(false)
  const [lockedPoints, setLockedPoints] = useState(() => {
    const locked = {}
    const allSkills = {
      ...character.martialSkills,
      ...character.arcaneSkills,
      ...character.selfImprovementSkills,
    }
    Object.entries(allSkills).forEach(([name, data]) => {
      locked[name] = parseInt(data.pointsInvested) || 0
    })
    return locked
  })
  const [search, setSearch] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const arcaneSkills = useMemo(() => getAllArcaneSkills(arcaneSkillsData), [])
  const effectiveAttrs = useMemo(() => getEffectiveAttributes(char), [char])

  // ── POINT TOTALS ────────────────────────────────────────────────────────────
  const pointTotals = useMemo(() => {
    // Self Improvement
    let selfImprovementSpent = 0
    Object.values(char.selfImprovementSkills || {}).forEach(s => {
      selfImprovementSpent += parseInt(s.pointsInvested) || 0
    })

    // Trades & Talents (general)
    let tradesSpent = 0
    Object.values(char.generalSkills || {}).forEach(s => {
      tradesSpent += parseInt(s.pointsInvested) || 0
    })

    const generalSpent = selfImprovementSpent + tradesSpent

    // Martial (melee, unfettered, ranged, leadership)
    let martialSpent = 0
    Object.values(char.martialSkills || {}).forEach(s => {
      martialSpent += parseInt(s.pointsInvested) || 0
    })

    // Spiritual vs Obscure — split arcaneSkills by category
    const obscureNames = new Set([
      ...OBSCURE_CATEGORIES.flatMap(cat => (arcaneSkillsData[cat] || []).map(s => s.name))
    ])

    let spiritualSpent = 0
    let obscureSpent = 0
    Object.entries(char.arcaneSkills || {}).forEach(([name, s]) => {
      const pts = parseInt(s.pointsInvested) || 0
      if (obscureNames.has(name)) obscureSpent += pts
      else spiritualSpent += pts
    })

    const totalSpent = generalSpent + martialSpent + spiritualSpent + obscureSpent

    // Earned
    const race = char.race || 'human'
    const raceData = { halfling: 0, goblin: 6, ogre: -5, halfOgre: -5 }
    const raceMod = raceData[race] || 0
    const firstLevel = (race !== 'goblin' && race !== 'ogre') ? 65 : 0
    const totalEarned = (65 + raceMod) * (char.level || 1) + firstLevel + (char.skillPoints?.bonusGiven || 0)

    return { generalSpent, martialSpent, spiritualSpent, obscureSpent, totalSpent, totalEarned, unspent: totalEarned - totalSpent }
  }, [char])

  // ── UPDATE HANDLER ──────────────────────────────────────────────────────────
  const handleUpdate = (skillName, newPoints, source) => {
    setChar(prev => {
      const next = JSON.parse(JSON.stringify(prev))

      if (source === 'general') {
        if (!next.generalSkills) next.generalSkills = {}
        if (newPoints === 0) delete next.generalSkills[skillName]
        else next.generalSkills[skillName] = { pointsInvested: newPoints }
        return next
      }

      if (source === 'selfImprovement') {
        if (!next.selfImprovementSkills) next.selfImprovementSkills = {}
        const skillDef = selfImprovementData.find(s => s.name === skillName)
        const costPerRank = skillDef?.costPerRank || 1
        const maxRank = parseInt(skillDef?.maxRank) || 1
        const rank = Math.min(Math.floor(newPoints / costPerRank), maxRank)
        const maint = skillDef?.maintenancePerRank || 0
        if (newPoints === 0) delete next.selfImprovementSkills[skillName]
        else next.selfImprovementSkills[skillName] = { pointsInvested: newPoints, rank, maintenanceCost: maint * rank }
        return next
      }

      // martial or arcane
      const isMartial = martialSkillsData.some(s => s.name === skillName)
      const targetList = isMartial ? 'martialSkills' : 'arcaneSkills'
      if (!next[targetList]) next[targetList] = {}

      let skillDef, costPerRank, maxRank
      if (isMartial) {
        skillDef = martialSkillsData.find(s => s.name === skillName)
        costPerRank = skillDef?.costPerRank || 1
        maxRank = parseInt(skillDef?.maxRank) || 1
      } else {
        skillDef = arcaneSkills.find(s => s.name === skillName)
        costPerRank = skillDef?.costPerRank || 1
        maxRank = parseInt(skillDef?.maxRank) || 1
      }

      const rank = Math.min(Math.floor(newPoints / costPerRank), isNaN(maxRank) ? 999 : maxRank)
      const maint = skillDef?.maintenancePerRank || 0

      if (newPoints === 0) delete next[targetList][skillName]
      else next[targetList][skillName] = { pointsInvested: newPoints, rank, maintenanceCost: maint * rank }

      return next
    })
  }

  const filterSkills = (skills) => {
    return skills.filter(skill => {
      const name = skill.name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase()) &&
          !(skill.description || '').toLowerCase().includes(search.toLowerCase())) return false
      if (showActiveOnly) {
        const pts = getPointsInvested(char, name, activeTab === 'General')
        if (pts === 0) return false
      }
      return true
    })
  }

  const handleSave = () => {
    const newLocked = {}
    Object.entries({ ...char.martialSkills, ...char.arcaneSkills, ...char.selfImprovementSkills }).forEach(([name, data]) => {
      newLocked[name] = parseInt(data.pointsInvested) || 0
    })
    setLockedPoints(newLocked)
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

      {/* Points + GM Mode + Save */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '12px 16px', alignItems: 'center',
      }}>
        {[
          ['Unspent', pointTotals.unspent],
          ['General', pointTotals.generalSpent],
          ['Martial', pointTotals.martialSpent],
          ['Spiritual', pointTotals.spiritualSpent],
          ['Obscure', pointTotals.obscureSpent],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: '.55rem', letterSpacing: '.15em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{lbl}</div>
            <div style={{
              fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif',
              color: lbl === 'Unspent' && val < 0 ? '#c94a4a' : 'var(--gold2)',
            }}>{val}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setGmMode(!gmMode)}
            style={{
              padding: '8px 16px',
              background: gmMode ? 'rgba(201,42,42,.2)' : 'var(--surface2)',
              border: `1px solid ${gmMode ? '#c94a4a' : 'var(--border)'}`,
              color: gmMode ? '#c94a4a' : 'var(--text3)',
              borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: '.85rem',
            }}
          >{gmMode ? '⚠ GM Mode ON' : 'GM Mode'}</button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a',
              color: '#4a9e4a', borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: '.9rem',
            }}
          >Save Changes</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
        >Active Only</button>
      </div>

      {/* Skill list */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>

        {activeTab === 'General' && (
          <div>
            <RankedSkillTable
              skills={filterSkills(selfImprovementData)}
              char={char}
              sectionLabel="Self Improvement"
              theme={THEMES.selfImprovement}
              level={char.level || 1}
              skillSource="selfImprovement"
              gmMode={gmMode}
              lockedPoints={lockedPoints}
              onUpdate={(name, newPts) => handleUpdate(name, newPts, 'selfImprovement')}
            />
            <div style={{ padding: '6px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: '.6rem', letterSpacing: '.2em', color: '#2d6b2d', textTransform: 'uppercase' }}>
              Trades &amp; Talents
            </div>
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
                    onAdd={() => handleUpdate(skill.name, pts + 1, 'general')}
                    onRemove={() => handleUpdate(skill.name, Math.max(0, pts - 1), 'general')}
                  />
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'Martial' && (() => {
          const martialSections = [
            { key: 'Melee',      label: 'Melee',      theme: THEMES.melee      },
            { key: 'Unfettered', label: 'Unfettered',  theme: THEMES.unfettered },
            { key: 'Ranged',     label: 'Ranged',      theme: THEMES.ranged     },
            { key: 'Leadership', label: 'Leadership',  theme: THEMES.leadership },
          ]
          return martialSections.map(section => {
            const sectionSkills = filterSkills(martialSkillsData.filter(s => s.category === section.key))
            if (sectionSkills.length === 0) return null
            return (
              <RankedSkillTable
                key={section.key}
                skills={sectionSkills}
                char={char}
                sectionLabel={section.label}
                theme={section.theme}
                level={char.level || 1}
                skillSource="martial"
                gmMode={gmMode}
                lockedPoints={lockedPoints}
                onUpdate={(name, newPts) => handleUpdate(name, newPts, 'martial')}
              />
            )
          })
        })()}

        {(activeTab === 'Spiritual' || activeTab === 'Obscure') && (() => {
          const categories = activeTab === 'Spiritual' ? SPIRITUAL_CATEGORIES : OBSCURE_CATEGORIES
          const labels = activeTab === 'Spiritual' ? SPIRITUAL_LABELS : OBSCURE_LABELS
          const themeMap = {
            spellcaster: THEMES.arcane, guild: THEMES.guild, divine: THEMES.divine, balance: THEMES.balance,
            infernal: THEMES.infernal, lycanthropy: THEMES.lycanthropy, animal: THEMES.animal,
          }
          return categories.map(category => {
            const categorySkills = filterSkills((arcaneSkillsData[category] || []).map(s => ({ ...s, category })))
            if (categorySkills.length === 0) return null
            return (
              <RankedSkillTable
                key={category}
                skills={categorySkills}
                char={char}
                sectionLabel={labels[category]}
                theme={themeMap[category]}
                level={char.level || 1}
                skillSource="arcane"
                gmMode={gmMode}
                lockedPoints={lockedPoints}
                onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
              />
            )
          })
        })()}

      </div>
    </div>
  )
}

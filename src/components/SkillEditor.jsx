import { useState, useMemo } from 'react'
import martialSkillsData from '../data/martialSkills.json'
import generalSkillsData from '../data/generalSkills.json'
import arcaneSkillsData from '../data/arcaneSkills.json'
import racesData from '../data/races.json'
import { GeneralSkillCard } from './GeneralSkillCard'
import { RankedSkillTable, THEMES } from './RankedSkillTable'
import SaveConfirmModal from './SaveConfirmModal'
import ConfirmModal from './ConfirmModal'
import selfImprovementData from '../data/selfImprovementSkills.json'

const OBSCURE_CATEGORIES = ['infernal', 'lycanthropy', 'animal']
const SPIRITUAL_CATEGORIES = ['spellcaster', 'guild', 'divine', 'balance']
const SPIRITUAL_LABELS = { spellcaster: 'Arcane', guild: 'Guild', divine: 'Divine', balance: 'Balance' }
const OBSCURE_LABELS = { infernal: 'Infernal', lycanthropy: 'Lycanthropy', animal: 'Animal' }

const DIVINE_MARKS = ['Blood','Death','Iron','Life','Light','Mischief','Passion','Storms','War','Wisdom']

const DIVINE_VOWS = [
  { name: 'Bloodless',  detail: 'No Edged Weapons',                       refusedBy: 'Blood'    },
  { name: 'Restraint',  detail: 'Quick and Light Weapons only',            refusedBy: 'Storms'   },
  { name: 'Humility',   detail: 'No Jewelry',                              refusedBy: 'Wisdom'   },
  { name: 'Barefoot',   detail: 'No Footwear',                             refusedBy: 'Light'    },
  { name: 'Poverty',    detail: 'No money, no gold or bejeweled anything', refusedBy: 'Iron'     },
  { name: 'Silence',    detail: 'Vocabulary of 1 word, or none.',          refusedBy: 'Passion'  },
  { name: 'Vengeance',  detail: 'Overriding priority',                     refusedBy: 'Death'    },
  { name: 'Charity',    detail: 'Must help when needed',                   refusedBy: 'Blood'    },
  { name: 'Decency',    detail: 'Must confront impropriety',               refusedBy: 'Wisdom'   },
  { name: 'Pain',       detail: 'Accept no healing',                       refusedBy: 'Life'     },
  { name: 'Service',    detail: 'To a church or order related to the God', refusedBy: 'Mischief' },
  { name: 'Peace',      detail: 'Kill Nothing',                            refusedBy: 'War'      },
]

const SHAMAN_VOWS = [
  { name: 'Bloodless Vow',      detail: 'No Edged Weapons',                    refusedBy: 'Blood'    },
  { name: 'Vow of Biting',      detail: 'Awkward Weapons only',                refusedBy: 'Storms'   },
  { name: 'Simple Vow',         detail: 'No Jewelry',                          refusedBy: 'Wisdom'   },
  { name: 'Barefoot Vow',       detail: 'No Footwear',                         refusedBy: 'Light'    },
  { name: 'Vow of Symbols',     detail: 'Fettered, other gods may be jealous', refusedBy: 'Iron'     },
  { name: 'Vow of "Your Word"', detail: 'Vocabulary of 1 word only.',          refusedBy: 'Passion'  },
  { name: 'Vow of Vengeance',   detail: 'Overriding priority',                 refusedBy: 'Death'    },
  { name: 'Vow of Caring',      detail: 'Must help when needed',               refusedBy: 'Blood'    },
  { name: 'Vow of Tradition',   detail: 'Must confront impropriety',           refusedBy: 'Wisdom'   },
  { name: 'Vow of Pain',        detail: 'Accept no healing',                   refusedBy: 'Life'     },
  { name: 'Vow of Loyalty',     detail: 'To the Chief',                        refusedBy: 'Mischief' },
  { name: 'Vow of Peace',       detail: 'Kill Nothing',                        refusedBy: 'War'      },
]

const MARK_BONUSES = {
  Blood:   'Auto-pass all Constitution checks.',
  Death:   'Immune to poison and disease. (Not shared by Auras)',
  Iron:    '+2 skill points every level, spent on the General page beyond the 5pt minimum.',
  Life:    '+3 maximum Torso Hit Points (affects other locations proportionally).',
  Light:   'Sense nearby Demons, Devils and Undead. Range depends on strength and number.',
  Mischief:'Your God may play tricks on your enemies. Mostly on you.',
  Passion: 'Advantage on all skill checks.',
  Storms:  'Immune to Lightning. (Not shared by Auras)',
  War:     '+1 Awareness.',
  Wisdom:  'May know one extra Aura (5 instead of 4 below level 15).',
}

const SHAMAN_BONUS_OVERRIDES = {
  Mischief: '+3 Precision instead of tricks.',
  Wisdom:   '+4 Evasion instead of the extra Aura.',
}

const selectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  color: 'var(--text)', borderRadius: 4, padding: '5px 8px',
  fontFamily: 'Georgia, serif', fontSize: '.85rem', cursor: 'pointer', width: '100%',
}

const lbl = {
  fontSize: '.6rem', letterSpacing: '.14em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif', display: 'block', marginBottom: 4,
}

// ── PATRON'S MARK PANEL ───────────────────────────────────────────────────────
function PatronMarkPanel({ char, onUpdate, gmMode }) {
  const pm = char.patronMark || {}
  const [mark, setMark] = useState(pm.mark || '')
  const [confirmModal, setConfirmModal] = useState(null)
  const [vow, setVow] = useState(pm.vow || '')
  const availableVows = DIVINE_VOWS.filter(v => v.refusedBy !== mark)
  const isLocked = pm.locked && !gmMode

  const handleSave = () => {
  if (!mark || !vow) return
  setConfirmModal({
    message: `Lock Mark of ${mark} with vow: "${vow}"? This cannot be changed without GM mode.`,
    onConfirm: () => { onUpdate({ ...pm, mark, vow, locked: true }); setConfirmModal(null) }
  })
}

  return (
    <div style={{ padding: '12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 140px' }}>
          <span style={lbl}>Divine Mark</span>
          {isLocked
            ? <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Mark of {pm.mark}</div>
            : <select value={mark} onChange={e => { setMark(e.target.value); setVow('') }} style={selectStyle}>
                <option value="">— Choose Mark —</option>
                {DIVINE_MARKS.map(m => <option key={m} value={m}>Mark of {m}</option>)}
              </select>
          }
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <span style={lbl}>Vow</span>
          {isLocked
            ? <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{pm.vow}</div>
            : <select value={vow} onChange={e => setVow(e.target.value)} style={selectStyle} disabled={!mark}>
                <option value="">— Choose Vow —</option>
                {availableVows.map(v => <option key={v.name} value={v.name}>{v.name} — {v.detail}</option>)}
              </select>
          }
        </div>
        {!isLocked && (
          <button onClick={handleSave} disabled={!mark || !vow}
            style={{ padding: '7px 16px', background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: mark && vow ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontSize: '.85rem', opacity: mark && vow ? 1 : 0.4 }}>
            Confirm &amp; Lock
          </button>
        )}
        {isLocked && gmMode && (
          <button onClick={() => onUpdate({ ...pm, locked: false })}
            style={{ padding: '7px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}>
            Unlock (GM)
          </button>
        )}
      </div>
      {mark && (
        <div style={{ marginTop: 10, fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic', borderLeft: '2px solid var(--gold)', paddingLeft: 10 }}>
          <strong style={{ color: 'var(--gold2)' }}>Mark of {mark}:</strong> {MARK_BONUSES[mark]}
        </div>
      )}
      {vow && (
        <div style={{ marginTop: 6, fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic', borderLeft: '2px solid var(--border2)', paddingLeft: 10 }}>
          <strong style={{ color: 'var(--text)' }}>{vow}:</strong> {DIVINE_VOWS.find(v => v.name === vow)?.detail}
        </div>
      )}
      {confirmModal && (
  <ConfirmModal
    message={confirmModal.message}
    onConfirm={confirmModal.onConfirm}
    onCancel={() => setConfirmModal(null)}
  />
)}
    </div>
  )
}

// ── SHAMAN SYMBOLS PANEL ──────────────────────────────────────────────────────
function ShamanSymbolsPanel({ char, onUpdate, gmMode }) {
  const symbols = char.shamanSymbols || []
  const [newSymbol, setNewSymbol] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [newVow, setNewVow] = useState('')
  const usedSymbols = new Set(symbols.map(s => s.symbol))
  const availableMarks = DIVINE_MARKS.filter(m => !usedSymbols.has(m))
  const availableVows = SHAMAN_VOWS.filter(v => v.refusedBy !== newSymbol)

 const addSymbol = () => {
  if (!newSymbol || !newVow) return
  setConfirmModal({
    message: `Add Symbol of ${newSymbol} with vow: "${newVow}"? This cannot be undone without GM mode.`,
    onConfirm: () => {
      onUpdate([...symbols, { symbol: newSymbol, vow: newVow, locked: true }])
      setNewSymbol(''); setNewVow('')
      setConfirmModal(null)
    }
  })
}

  const removeSymbol = (i) => {
    const next = [...symbols]; next.splice(i, 1); onUpdate(next)
  }

  return (
    <div style={{ padding: '12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
      {symbols.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '.9rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Symbol of {s.symbol}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {s.vow} — {SHAMAN_VOWS.find(v => v.name === s.vow)?.detail}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>
              {SHAMAN_BONUS_OVERRIDES[s.symbol] || MARK_BONUSES[s.symbol]}
            </div>
          </div>
          {gmMode && (
            <button onClick={() => removeSymbol(i)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.75rem' }}>
              Remove
            </button>
          )}
        </div>
      ))}
      {availableMarks.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: symbols.length > 0 ? 10 : 0 }}>
          <div style={{ flex: '1 1 140px' }}>
            <span style={lbl}>Add Symbol</span>
            <select value={newSymbol} onChange={e => { setNewSymbol(e.target.value); setNewVow('') }} style={selectStyle}>
              <option value="">— Choose Symbol —</option>
              {availableMarks.map(m => <option key={m} value={m}>Symbol of {m}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <span style={lbl}>Vow</span>
            <select value={newVow} onChange={e => setNewVow(e.target.value)} style={selectStyle} disabled={!newSymbol}>
              <option value="">— Choose Vow —</option>
              {availableVows.map(v => <option key={v.name} value={v.name}>{v.name} — {v.detail}</option>)}
            </select>
          </div>
          <button onClick={addSymbol} disabled={!newSymbol || !newVow}
            style={{ padding: '7px 16px', background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: newSymbol && newVow ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontSize: '.85rem', opacity: newSymbol && newVow ? 1 : 0.4 }}>
            Add Symbol
          </button>
        </div>
      )}
      {availableMarks.length === 0 && symbols.length > 0 && (
        <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 8 }}>All symbols claimed.</div>
      )}
      {confirmModal && (
  <ConfirmModal
    message={confirmModal.message}
    onConfirm={confirmModal.onConfirm}
    onCancel={() => setConfirmModal(null)}
  />
)}
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getEffectiveAttributes(char) {
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const attrs = char.attributes || {}
  const ms = char.martialSkills || {}
  const si = char.selfImprovementSkills || {}
  function base(key) { return attrs[key]?.base || attrs[key] || 0 }
  function skillRank(name) { return parseInt(si[name]?.rank) || parseInt(ms[name]?.rank) || 0 }
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

function getPointsInvested(char, skillName) {
  const sources = [char.martialSkills, char.arcaneSkills, char.selfImprovementSkills]
  for (const src of sources) {
    if (src?.[skillName]) return parseInt(src[skillName].pointsInvested) || 0
  }
  return parseInt(char.generalSkills?.[skillName]?.pointsInvested) || 0
}

const TABS = ['General', 'Martial', 'Spiritual', 'Obscure']

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SkillEditor({ character, onSave, onBack, isGM }) {
  const [activeTab, setActiveTab] = useState('Martial')
  const [char, setChar] = useState(() => JSON.parse(JSON.stringify(character)))
  const [gmMode, setGmMode] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [lockedPoints, setLockedPoints] = useState(() => {
    const locked = {}
    const allSkills = { ...character.martialSkills, ...character.arcaneSkills, ...character.selfImprovementSkills }
    Object.entries(allSkills).forEach(([name, data]) => { locked[name] = parseInt(data.pointsInvested) || 0 })
    return locked
  })
  const [search, setSearch] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const arcaneSkills = useMemo(() => getAllArcaneSkills(arcaneSkillsData), [])
  const effectiveAttrs = useMemo(() => getEffectiveAttributes(char), [char])

  const pointTotals = useMemo(() => {
    let selfImprovementSpent = 0
    Object.values(char.selfImprovementSkills || {}).forEach(s => { selfImprovementSpent += parseInt(s.pointsInvested) || 0 })
    let tradesSpent = 0
    Object.values(char.generalSkills || {}).forEach(s => { tradesSpent += parseInt(s.pointsInvested) || 0 })
    const generalSpent = selfImprovementSpent + tradesSpent
    let martialSpent = 0
    Object.values(char.martialSkills || {}).forEach(s => { martialSpent += parseInt(s.pointsInvested) || 0 })
    const obscureNames = new Set(OBSCURE_CATEGORIES.flatMap(cat => (arcaneSkillsData[cat] || []).map(s => s.name)))
    let spiritualSpent = 0, obscureSpent = 0
    Object.entries(char.arcaneSkills || {}).forEach(([name, s]) => {
      const pts = parseInt(s.pointsInvested) || 0
      if (obscureNames.has(name)) obscureSpent += pts
      else spiritualSpent += pts
    })

   const totalSpent = generalSpent + martialSpent + spiritualSpent + obscureSpent
    const totalEarned = (char.skillPoints?.totalEarned || 0) + (char.skillPoints?.bonusGiven || 0)
    const maintenancePaid = char.skillPoints?.maintenancePaid || 0
    return { generalSpent, martialSpent, spiritualSpent, obscureSpent, totalSpent, totalEarned, unspent: totalEarned - totalSpent - maintenancePaid }
  }, [char])
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
        const rank = Math.min(Math.floor(newPoints / costPerRank), isNaN(maxRank) ? 999 : maxRank)
        const maint = skillDef?.maintenancePerRank || 0
        if (newPoints === 0) delete next.selfImprovementSkills[skillName]
        else next.selfImprovementSkills[skillName] = { pointsInvested: newPoints, rank, maintenanceCost: maint * rank }
        return next
      }
      const isMartial = martialSkillsData.some(s => s.name === skillName)
      const targetList = isMartial ? 'martialSkills' : 'arcaneSkills'
      if (!next[targetList]) next[targetList] = {}
      const skillDef = isMartial ? martialSkillsData.find(s => s.name === skillName) : arcaneSkills.find(s => s.name === skillName)
      const costPerRank = skillDef?.costPerRank || 1
      const maxRankRaw = skillDef?.maxRank
      const maxRank = (maxRankRaw === 'any' || !maxRankRaw || isNaN(parseInt(maxRankRaw))) ? 999 : parseInt(maxRankRaw)
      const rank = Math.min(Math.floor(newPoints / costPerRank), maxRank)
      const maint = skillDef?.maintenancePerRank || 0
      if (newPoints === 0) delete next[targetList][skillName]
      else next[targetList][skillName] = { pointsInvested: newPoints, rank, maintenanceCost: maint * rank }
      return next
    })
  }

  const handlePatronMarkUpdate = (markData) => setChar(prev => ({ ...prev, patronMark: markData }))
  const handleShamanSymbolsUpdate = (symbols) => setChar(prev => ({ ...prev, shamanSymbols: symbols }))

  const filterSkills = (skills) => {
    return skills.filter(skill => {
      const name = skill.name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase()) && !(skill.description || '').toLowerCase().includes(search.toLowerCase())) return false
      if (showActiveOnly) {
        const pts = getPointsInvested(char, name)
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
  // Save original skills as base, new skills as pending
  const withPending = {
    ...character,  // use original character prop, not char
    pendingSkillChanges: {
      martialSkills: char.martialSkills,
      arcaneSkills: char.arcaneSkills,
      selfImprovementSkills: char.selfImprovementSkills,
      generalSkills: char.generalSkills,
    }
  }
  onSave(withPending)
  setShowConfirm(false)
}

  const tabBtn = (tab) => ({
    padding: '7px 18px',
    background: activeTab === tab ? 'rgba(201,168,76,.15)' : 'var(--surface)',
    border: `1px solid ${activeTab === tab ? 'var(--gold)' : 'var(--border)'}`,
    color: activeTab === tab ? 'var(--gold2)' : 'var(--text2)',
    borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
  })

  // Build specialRows for Divine — Patron's Mark panel appears below that skill row
  const buildDivineSpecialRows = () => {
    const patronRank = parseInt(char.arcaneSkills?.["Patron's Mark"]?.rank) || 0
    if (patronRank < 1) return {}
    return {
      "Patron's Mark": <PatronMarkPanel char={char} onUpdate={handlePatronMarkUpdate} gmMode={gmMode} />
    }
  }

  // Build specialRows for Guild — Shaman's Symbol panel appears below that skill row
  const buildGuildSpecialRows = () => {
    const shamanRank = parseInt(char.arcaneSkills?.["Shaman's Symbol"]?.rank) || 0
    if (shamanRank < 1) return {}
    return {
      "Shaman's Symbol": <ShamanSymbolsPanel char={char} onUpdate={handleShamanSymbolsUpdate} gmMode={gmMode} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>

      {/* Points + GM Mode + Save */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', alignItems: 'center' }}>
        {[
          ['Unspent', pointTotals.unspent],
          ['General', pointTotals.generalSpent],
          ['Martial', pointTotals.martialSpent],
          ['Spiritual', pointTotals.spiritualSpent],
          ['Obscure', pointTotals.obscureSpent],
        ].map(([l, val]) => (
          <div key={l} style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: '.55rem', letterSpacing: '.15em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif', color: l === 'Unspent' && val < 0 ? '#c94a4a' : 'var(--gold2)' }}>{val}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isGM && (
            <button onClick={() => setGmMode(!gmMode)} style={{ padding: '8px 16px', background: gmMode ? 'rgba(201,42,42,.2)' : 'var(--surface2)', border: `1px solid ${gmMode ? '#c94a4a' : 'var(--border)'}`, color: gmMode ? '#c94a4a' : 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem' }}>
              {gmMode ? '⚠ GM Mode ON' : 'GM Mode'}
            </button>
          )}
          <button onClick={() => setShowConfirm(true)} style={{ padding: '8px 20px', background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a', color: '#4a9e4a', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map(tab => <button key={tab} style={tabBtn(tab)} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, fontFamily: 'Georgia, serif', fontSize: '.9rem' }}
        />
        <button onClick={() => setShowActiveOnly(!showActiveOnly)} style={{ padding: '7px 14px', background: showActiveOnly ? 'rgba(201,168,76,.15)' : 'var(--surface)', border: `1px solid ${showActiveOnly ? 'var(--gold)' : 'var(--border)'}`, color: showActiveOnly ? 'var(--gold2)' : 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.82rem' }}>
          Active Only
        </button>
      </div>

      {/* Skill list */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>

        {activeTab === 'General' && (
          <div>
            <RankedSkillTable skills={filterSkills(selfImprovementData)} char={char} sectionLabel="Self Improvement" theme={THEMES.selfImprovement} level={char.level || 1} skillSource="selfImprovement" gmMode={gmMode} lockedPoints={lockedPoints} onUpdate={(name, newPts) => handleUpdate(name, newPts, 'selfImprovement')} unspentPoints={pointTotals.unspent}/>
           <div style={{ padding: '10px 12px', background: 'var(--bg)', borderBottom: '2px solid #4a9e4a', fontSize: '1rem', letterSpacing: '.25em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 600, textAlign: 'center' }}>Trades &amp; Talents</div>
{/* Column headers */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 72px', background: 'var(--bg2)', borderBottom: '1px solid rgba(74,158,74,.25)', minHeight: 44, alignItems: 'center' }}>
  <div style={{ padding: '0 12px', fontSize: '.85rem', letterSpacing: '.12em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Skill</div>
  <div style={{ textAlign: 'center', fontSize: '.7rem', letterSpacing: '.08em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Score</div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
    <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Pts</div>
    <div style={{ width: 36, height: 1, background: 'rgba(74,158,74,.25)' }} />
    <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Mult</div>
  </div>
</div>
<div>
              {filterSkills(generalSkillsData).map(skill => {
                const pts = parseInt(char.generalSkills?.[skill.name]?.pointsInvested) || 0
                const score = effectiveAttrs ? calcSkillScore(skill, char, effectiveAttrs) : 0
                const getSkillScore = (name) => { const s = generalSkillsData.find(x => x.name === name); return s ? calcSkillScore(s, char, effectiveAttrs || {}) : 0 }
               return <GeneralSkillCard
  key={skill.name}
  skill={skill}
  score={score}
  pointsInvested={pts}
  getSkillScore={getSkillScore}
  gmMode={gmMode}
  lockedPoints={lockedPoints}
  onUpdate={(newPts) => handleUpdate(skill.name, newPts, 'general')}
/>
              })}
            </div>
          </div>
        )}

        {activeTab === 'Martial' && (() => {
          const sections = [
            { key: 'Melee', label: 'Melee', theme: THEMES.melee },
            { key: 'Unfettered', label: 'Unfettered', theme: THEMES.unfettered },
            { key: 'Ranged', label: 'Ranged', theme: THEMES.ranged },
            { key: 'Leadership', label: 'Leadership', theme: THEMES.leadership },
          ]
          return sections.map(section => {
            const sectionSkills = filterSkills(martialSkillsData.filter(s => s.category === section.key))
            if (sectionSkills.length === 0) return null
            return <RankedSkillTable key={section.key} skills={sectionSkills} char={char} sectionLabel={section.label} theme={section.theme} level={char.level || 1} skillSource="martial" gmMode={gmMode} lockedPoints={lockedPoints} onUpdate={(name, newPts) => handleUpdate(name, newPts, 'martial')} unspentPoints={pointTotals.unspent}/>
          })
        })()}

        {(activeTab === 'Spiritual' || activeTab === 'Obscure') && (() => {
          const categories = activeTab === 'Spiritual' ? SPIRITUAL_CATEGORIES : OBSCURE_CATEGORIES
          const labels = activeTab === 'Spiritual' ? SPIRITUAL_LABELS : OBSCURE_LABELS
          const themeMap = { spellcaster: THEMES.arcane, guild: THEMES.guild, divine: THEMES.divine, balance: THEMES.balance, infernal: THEMES.infernal, lycanthropy: THEMES.lycanthropy, animal: THEMES.animal }
          return categories.map(category => {
            const categorySkills = filterSkills((arcaneSkillsData[category] || []).map(s => ({ ...s, category })))
            if (categorySkills.length === 0) return null
            const specialRows = category === 'divine' ? buildDivineSpecialRows() : category === 'guild' ? buildGuildSpecialRows() : undefined
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
                specialRows={specialRows}
                unspentPoints={pointTotals.unspent}
              />
            )
          })
        })()}

      {showConfirm && (
          <SaveConfirmModal
            original={character}
            updated={char}
            onConfirm={handleSave}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
      {confirmModal && (
  <ConfirmModal
    message={confirmModal.message}
    dangerous={confirmModal.dangerous}
    onConfirm={confirmModal.onConfirm}
    onCancel={() => setConfirmModal(null)}
  />
)}
    </div>
  )
}

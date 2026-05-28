// CharacterWizard.jsx
import { useState, useMemo, useEffect } from 'react'
import racesData from '../data/races.json'
import { loadAllCampaigns } from '../characterDB'
import attributeData from '../data/attributes.json'

// ── STYLES ────────────────────────────────────────────────────────────────────
const surface = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px' }
const lbl = { fontSize: '.6rem', letterSpacing: '.16em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', display: 'block', marginBottom: 4 }
const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontFamily: 'Georgia, serif', fontSize: '.95rem', padding: '8px 10px', width: '100%', boxSizing: 'border-box' }
const selectStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontFamily: 'Georgia, serif', fontSize: '.95rem', padding: '8px 10px', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }
const btnPrimary = { padding: '10px 24px', background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 600 }
const btnSecondary = { padding: '8px 18px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }
const sectionTitle = { fontSize: '.75rem', letterSpacing: '.2em', color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 14 }

const ATTRS = ['STR', 'DEX', 'CON', 'AW', 'CHR', 'WP']
const ATTR_LABELS = { STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', AW: 'Awareness', CHR: 'Charisma', WP: 'Willpower' }
const ATTR_KEYS = { STR: 'str', DEX: 'dex', CON: 'con', AW: 'aw', CHR: 'chr', WP: 'wp' }

// ── ATTRIBUTE TABLE LOOKUPS ───────────────────────────────────────────────────
function attrEffect(attr, val) {
  if (!val) return null
  const v = Math.max(1, Math.min(20, val))
  switch (attr) {
    case 'STR': { const db = attributeData.strength[String(v)]?.damageBonus ?? 0; return db !== 0 ? `Dmg ${db >= 0 ? '+' : ''}${db}` : null }
    case 'DEX': { const exp = attributeData.dexterity[String(v)]?.expertise ?? 0; const init = attributeData.dexterity[String(v)]?.initiative ?? 0; const parts = []; if (exp !== 0) parts.push(`Exp ${exp >= 0 ? '+' : ''}${exp}`); if (init !== 0) parts.push(`Init ${init >= 0 ? '+' : ''}${init}`); return parts.length ? parts.join(', ') : null }
    case 'CON': { const hp = attributeData.constitution[String(v)]?.torsoHP ?? 0; return `Torso HP ${hp}` }
    case 'AW': { const sc = attributeData.awareness[String(v)]?.skillCap ?? 0; const ev = attributeData.awareness[String(v)]?.evasionBonus ?? 0; const parts = [`Cap ${sc}`]; if (ev > 0) parts.push(`Ev +${ev}`); return parts.join(', ') }
    case 'CHR': return null
    case 'WP': { const ap = attributeData.willpower[String(v)]?.arcanePower ?? 0; return ap > 0 ? `Arc.Power ${ap}` : null }
    default: return null
  }
}

// ── RACE VALIDATION ───────────────────────────────────────────────────────────
function raceValidForAttrs(raceKey, attrs) {
  const race = racesData[raceKey]
  if (!race) return false
  const min = race.attrMin || {}
  const max = race.attrMax || {}
  for (const [key, minVal] of Object.entries(min)) {
    const attrKey = Object.keys(ATTR_KEYS).find(k => ATTR_KEYS[k] === key)
    const val = attrs[attrKey]
    if (val === undefined) continue // not assigned yet
    if (val < minVal) return false
  }
  for (const [key, maxVal] of Object.entries(max)) {
    const attrKey = Object.keys(ATTR_KEYS).find(k => ATTR_KEYS[k] === key)
    const val = attrs[attrKey]
    if (val === undefined) continue
    if (val > maxVal) return false
  }
  return true
}

function getRaceRequirements(raceKey) {
  const race = racesData[raceKey]
  if (!race) return ''
  const min = race.attrMin || {}
  const max = race.attrMax || {}
  const parts = []
  const nameMap = { str: 'STR', dex: 'DEX', con: 'CON', aw: 'AW', chr: 'CHR', wp: 'WP' }
  Object.entries(min).forEach(([k, v]) => parts.push(`${nameMap[k]} ${v}+`))
  Object.entries(max).forEach(([k, v]) => parts.push(`${nameMap[k]} max ${v}`))
  return parts.join(', ')
}

function getStartingPoints(raceKey) {
  const race = racesData[raceKey]
  if (!race) return 130
  const base = 65 + (race.skillPointsPerLevelModifier || 0)
  const firstBonus = race.firstLevelBonus !== false ? 65 : 0
  return base + firstBonus
}

// ── DICE ROLLING ──────────────────────────────────────────────────────────────
function roll4d6kh3() {
  const dice = [1,2,3,4].map(() => Math.ceil(Math.random() * 6))
  dice.sort((a, b) => b - a)
  return { dice, total: dice[0] + dice[1] + dice[2] }
}

function applyThresholdFix(rolls) {
  const fixed = [...rolls]
  const totals = rolls.map(r => r.total)
  const has17 = totals.some(t => t >= 17)
  const count16 = totals.filter(t => t >= 16).length
  if (!has17 && count16 < 2) {
    const sorted = [...rolls].map((r, i) => ({ ...r, idx: i })).sort((a, b) => b.total - a.total)
    const thirdIdx = sorted[2].idx
    const newVal = Math.ceil(Math.random() * 3) + 15
    fixed[thirdIdx] = { dice: ['★'], total: newVal, fixed: true }
  }
  return fixed
}

function generateHardcoreSet() {
  return Array.from({ length: 7 }, () => {
    const dice = [1,2,3].map(() => Math.ceil(Math.random() * 6))
    return { dice, total: dice.reduce((a,b) => a+b, 0), hardcore: true }
  })
}

function generateAllSets(method) {
  if (method === 'hardcore') {
    return Array.from({ length: 3 }, () => generateHardcoreSet())
  }
  return Array.from({ length: 3 }, () => applyThresholdFix(Array.from({ length: 7 }, () => roll4d6kh3())))
}

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? 'var(--gold)' : (i < current ? 'var(--gold2)' : 'var(--border)'), transition: 'all .3s' }} />
      ))}
    </div>
  )
}

// ── STEP 1: NAME & PLAYER ─────────────────────────────────────────────────────
function StepNamePlayer({ data, onChange, existingNames }) {
  const [campaigns, setCampaigns] = useState([])
  useEffect(() => { loadAllCampaigns().then(setCampaigns) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionTitle}>Your Character</div>
      <div>
        <span style={lbl}>Character Name</span>
        <input style={inputStyle} value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} placeholder="Can be changed later in Bio..." />
        {existingNames.includes(data.name.trim()) && data.name.trim() && (
  <div style={{ marginTop: 6, color: '#c94a4a', fontSize: '.8rem', fontFamily: 'Georgia, serif' }}>
    ⚠ A character named "{data.name.trim()}" already exists.
  </div>
)}
      </div>
      <div>
        <span style={lbl}>Player Name</span>
        <input style={inputStyle} value={data.player} onChange={e => onChange({ ...data, player: e.target.value })} placeholder="Your name..." />
      </div>
      <div>
        <span style={lbl}>Campaign</span>
        <select style={selectStyle} value={data.campaignId || ''} onChange={e => onChange({ ...data, campaignId: e.target.value || null })}>
          <option value="">I don't know yet</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
     <div>
        <span style={lbl}>Rolling Method</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {[
            ['standard', '🎲 Standard', '4d6 drop lowest, 3 sets. Minimum quality guaranteed.'],
            ['hardcore', '⚔ Hardcore', '3d6, 3 sets, no modifiers, no guarantees. For the brave.'],
          ].map(([value, label, desc]) => (
            <div key={value} onClick={() => onChange({ ...data, rollMethod: value })} style={{
              padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
              border: `2px solid ${(data.rollMethod || 'standard') === value ? (value === 'hardcore' ? '#c94a4a' : 'var(--gold)') : 'var(--border)'}`,
              background: (data.rollMethod || 'standard') === value ? (value === 'hardcore' ? 'rgba(201,74,74,.08)' : 'rgba(201,168,76,.08)') : 'var(--bg2)',
              transition: 'all .15s',
            }}>
              <div style={{ fontSize: '.92rem', fontFamily: 'Georgia, serif', fontWeight: 600, color: (data.rollMethod || 'standard') === value ? (value === 'hardcore' ? '#c94a4a' : 'var(--gold2)') : 'var(--text)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div> 
    </div>
  )
}

// ── STEP 2: ROLL ──────────────────────────────────────────────────────────────
function StepRoll({ data, onChange }) {
  const [sets, setSets] = useState(data.rollSets || null)
  const [selected, setSelected] = useState(data.selectedSet ?? null)

  const doRoll = () => {
    const newSets = generateAllSets(data.rollMethod || 'standard')
    setSets(newSets)
    setSelected(null)
    onChange({ ...data, rollSets: newSets, selectedSet: null, rolledValues: null })
  }

  const selectSet = (i) => {
    setSelected(i)
    onChange({ ...data, selectedSet: i, rolledValues: sets[i].map(r => r.total) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={sectionTitle}>Roll Attributes</div>
      <div style={{ fontSize: '.83rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>
        {data.rollMethod === 'hardcore'
          ? '⚔ Hardcore mode: Three sets of 7 rolls (3d6, no modifiers, no guarantees). Choose the set you prefer.'
          : 'Three sets of 7 rolls (4d6, drop lowest). If no roll is 17+ or two 16+, the third-highest is replaced with a 1d3+15 roll (★). Choose the set you prefer.'
        }
      </div>
      {!sets && <button onClick={doRoll} style={btnPrimary}>🎲 Roll Attributes</button>}
      {sets && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sets.map((set, si) => {
            const isSel = selected === si
            const sorted = [...set.map(r => r.total)].sort((a,b) => b-a)
            return (
              <div key={si} onClick={() => selectSet(si)} style={{ padding: '12px 14px', borderRadius: 7, cursor: 'pointer', border: `2px solid ${isSel ? 'var(--gold)' : 'var(--border)'}`, background: isSel ? 'rgba(201,168,76,.08)' : 'var(--bg2)', transition: 'all .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <span style={{ ...lbl, marginBottom: 0, color: isSel ? (data.rollMethod === 'hardcore' ? '#c94a4a' : 'var(--gold)') : 'var(--text3)' }}>
                  {data.rollMethod === 'hardcore' ? `⚔ Set ${si + 1}` : `Set ${si + 1}`}
                </span>
                  {isSel && <span style={{ fontSize: '.7rem', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>✓ Selected</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {set.map((roll, ri) => (
                    <div key={ri} style={{ textAlign: 'center', minWidth: 34, background: roll.fixed ? 'rgba(201,168,76,.15)' : 'var(--bg)', border: `1px solid ${roll.fixed ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 5, padding: '4px 5px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: roll.fixed ? 'var(--gold2)' : 'var(--text)', fontFamily: 'Georgia, serif' }}>{roll.total}</div>
                      <div style={{ fontSize: '.5rem', color: 'var(--text3)' }}>{roll.fixed ? '★' : roll.dice.join('+')}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
                  Best 6: {sorted.slice(0,6).join(' · ')} · Total: {sorted.slice(0,6).reduce((a,b)=>a+b,0)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── STEP 3: ASSIGN & PREVIEW ──────────────────────────────────────────────────
function StepAssign({ data, onChange }) {
  const values = data.rolledValues || []
  const [assignedMap, setAssignedMap] = useState(data.assignedMap || {}) // { ATTR: valueIndex }
  const [discardIdx, setDiscardIdx] = useState(data.discardIdx ?? null)
  const [selIdx, setSelIdx] = useState(null)

  const usedIndices = new Set([...Object.values(assignedMap), ...(discardIdx !== null ? [discardIdx] : [])])

  const save = (map, dIdx) => {
    const attrs = {}
    Object.entries(map).forEach(([attr, idx]) => { attrs[attr] = values[idx] })
    setAssignedMap(map)
    setDiscardIdx(dIdx)
    onChange({ ...data, assignedMap: map, discardIdx: dIdx, finalAttrs: attrs })
  }

  const handleValueTap = (idx) => {
    if (usedIndices.has(idx)) {
      // Unassign
      const newMap = { ...assignedMap }
      const attr = Object.keys(newMap).find(k => newMap[k] === idx)
      if (attr) { delete newMap[attr]; save(newMap, discardIdx) }
      else if (discardIdx === idx) save(assignedMap, null)
      setSelIdx(null)
    } else {
      setSelIdx(selIdx === idx ? null : idx)
    }
  }

  const handleAttrTap = (attr) => {
    if (selIdx === null) {
      // Unassign this attr
      const newMap = { ...assignedMap }; delete newMap[attr]; save(newMap, discardIdx)
    } else {
      const newMap = { ...assignedMap, [attr]: selIdx }; save(newMap, discardIdx); setSelIdx(null)
    }
  }

  const handleDiscardTap = () => {
    if (selIdx !== null) { save(assignedMap, selIdx); setSelIdx(null) }
  }

  // Current attribute values for preview
  const currentAttrs = {}
  Object.entries(assignedMap).forEach(([attr, idx]) => { currentAttrs[attr] = values[idx] })

  // Valid races given current assignments
  const validRaces = Object.keys(racesData).filter(key => raceValidForAttrs(key, currentAttrs))
  const allAssigned = Object.keys(assignedMap).length === 6 && discardIdx !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={sectionTitle}>Assign Attributes</div>
      <div style={{ fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
        Tap a value to select it, then tap an attribute to assign it. Tap Discard to discard the selected value. Tap an assigned attribute to unassign it.
      </div>

      {/* Value chips */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', padding: '12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
        {values.map((v, i) => {
          const isUsed = usedIndices.has(i)
          const isSel = selIdx === i
          const isAssigned = Object.values(assignedMap).includes(i)
          const isDiscard = discardIdx === i
          return (
            <div key={i} onClick={() => handleValueTap(i)} style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.05rem', transition: 'all .15s', border: `2px solid ${isSel ? 'var(--gold)' : isDiscard ? '#c94a4a' : isAssigned ? '#4a9e4a' : 'var(--border)'}`, background: isSel ? 'rgba(201,168,76,.2)' : isDiscard ? 'rgba(201,74,74,.12)' : isAssigned ? 'rgba(74,158,74,.1)' : 'var(--bg)', color: isSel ? 'var(--gold2)' : isDiscard ? '#c94a4a' : isAssigned ? '#4a9e4a' : 'var(--text)', opacity: isUsed && !isSel ? 0.6 : 1 }}>
              {v}
            </div>
          )
        })}
        <div onClick={handleDiscardTap} style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: selIdx !== null ? 'pointer' : 'default', border: `2px solid ${discardIdx !== null ? '#c94a4a' : 'var(--border)'}`, background: discardIdx !== null ? 'rgba(201,74,74,.1)' : 'var(--bg2)', opacity: selIdx !== null ? 1 : 0.35 }}>
          <span style={{ fontSize: '.55rem', color: discardIdx !== null ? '#c94a4a' : 'var(--text3)', fontFamily: 'Georgia, serif', textAlign: 'center', letterSpacing: '.04em', lineHeight: 1.3 }}>DIS<br/>CARD</span>
        </div>
      </div>

      {/* Attribute slots with live preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ATTRS.map(attr => {
          const assignedIdx = assignedMap[attr]
          const hasVal = assignedIdx !== undefined
          const val = hasVal ? values[assignedIdx] : null
          const effect = hasVal ? attrEffect(attr, val) : null
          const isReady = selIdx !== null && !usedIndices.has(selIdx)
          return (
            <div key={attr} onClick={() => handleAttrTap(attr)} style={{ padding: '9px 11px', borderRadius: 7, cursor: 'pointer', border: `2px solid ${hasVal ? '#4a9e4a' : isReady ? 'var(--gold)' : 'var(--border)'}`, background: hasVal ? 'rgba(74,158,74,.06)' : isReady ? 'rgba(201,168,76,.04)' : 'var(--bg2)', transition: 'all .15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '.72rem', color: 'var(--gold)', fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '.08em' }}>{attr}</div>
                  <div style={{ fontSize: '.6rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>{ATTR_LABELS[attr]}</div>
                  {effect && <div style={{ fontSize: '.62rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', marginTop: 2 }}>{effect}</div>}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: hasVal ? '#4a9e4a' : 'var(--text3)', lineHeight: 1 }}>
                  {hasVal ? val : '—'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Valid races preview */}
      {Object.keys(assignedMap).length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ ...lbl, marginBottom: 6, color: 'var(--gold)' }}>Available Races ({validRaces.length})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {validRaces.map(key => (
              <span key={key} style={{ fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}>
                {racesData[key].name}
              </span>
            ))}
            {validRaces.length === 0 && <span style={{ fontSize: '.75rem', color: '#c94a4a', fontFamily: 'Georgia, serif' }}>No races available with current assignments — try rearranging.</span>}
          </div>
        </div>
      )}

      {allAssigned && <div style={{ padding: '8px 12px', background: 'rgba(74,158,74,.08)', border: '1px solid #4a9e4a', borderRadius: 5, fontSize: '.8rem', color: '#4a9e4a', fontFamily: 'Georgia, serif' }}>✓ All attributes assigned.</div>}
    </div>
  )
}

// ── STEP 4: CHOOSE RACE ───────────────────────────────────────────────────────
function StepRace({ data, onChange }) {
  const currentAttrs = data.finalAttrs || {}
  const validRaces = Object.keys(racesData).filter(key => raceValidForAttrs(key, currentAttrs))
  const [selected, setSelected] = useState(data.raceKey || '')

  const select = (key) => {
    setSelected(key)
    onChange({ ...data, raceKey: key })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={sectionTitle}>Choose Your Race</div>
      <div style={{ fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
        Only races compatible with your attribute rolls are shown.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {validRaces.map(key => {
          const race = racesData[key]
          const isSel = selected === key
          const pts = getStartingPoints(key)
          const reqs = getRaceRequirements(key)
          return (
            <div key={key} onClick={() => select(key)} style={{ padding: '12px 14px', borderRadius: 7, cursor: 'pointer', border: `2px solid ${isSel ? 'var(--gold)' : 'var(--border)'}`, background: isSel ? 'rgba(201,168,76,.08)' : 'var(--bg2)', transition: 'all .2s' }}>
              {/* Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '1rem', color: isSel ? 'var(--gold2)' : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: isSel ? 600 : 400 }}>{race.name}</span>
                {isSel && <span style={{ fontSize: '.65rem', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>✓ Selected</span>}
              </div>
              {/* Description */}
              {race.description && (
                <div style={{ fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 8 }}>{race.description}</div>
              )}
              {/* Stats */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                {[
                  ['Start Pts', pts],
                  ['Pts/Level', 65 + (race.skillPointsPerLevelModifier || 0)],
                  ['Move', race.move],
                  ['HP Mod', race.hpModifier !== 0 ? (race.hpModifier > 0 ? `+${race.hpModifier}` : race.hpModifier) : '—'],
                  race.vision !== 'None' ? ['Vision', race.vision] : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} style={{ textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: '.52rem', letterSpacing: '.12em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: '.88rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>
              {/* Attribute modifiers */}
              {[
                race.strModifier ? `STR ${race.strModifier > 0 ? '+' : ''}${race.strModifier}` : null,
                race.conModifier ? `CON ${race.conModifier > 0 ? '+' : ''}${race.conModifier}` : null,
                race.chrModifier ? `CHR ${race.chrModifier > 0 ? '+' : ''}${race.chrModifier}` : null,
                race.apModifier ? `Arc.Power ${race.apModifier > 0 ? '+' : ''}${race.apModifier}` : null,
                race.precisionModifier ? `PR ${race.precisionModifier > 0 ? '+' : ''}${race.precisionModifier}` : null,
                race.naturalArmor ? `Natural AR ${race.naturalArmor}` : null,
                race.maintenanceModifier ? `Maintenance ${race.maintenanceModifier > 0 ? '+' : ''}${race.maintenanceModifier}%` : null,
              ].filter(Boolean).length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[
                    race.strModifier ? `STR ${race.strModifier > 0 ? '+' : ''}${race.strModifier}` : null,
                    race.conModifier ? `CON ${race.conModifier > 0 ? '+' : ''}${race.conModifier}` : null,
                    race.chrModifier ? `CHR ${race.chrModifier > 0 ? '+' : ''}${race.chrModifier}` : null,
                    race.apModifier ? `Arc.Power ${race.apModifier > 0 ? '+' : ''}${race.apModifier}` : null,
                    race.precisionModifier ? `PR ${race.precisionModifier > 0 ? '+' : ''}${race.precisionModifier}` : null,
                    race.naturalArmor ? `Natural AR ${race.naturalArmor}` : null,
                    race.maintenanceModifier ? `Maintenance ${race.maintenanceModifier > 0 ? '+' : ''}${race.maintenanceModifier}%` : null,
                  ].filter(Boolean).map(t => (
                    <span key={t} style={{ fontSize: '.72rem', color: 'var(--gold)', fontFamily: 'Georgia, serif', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 3, padding: '1px 6px' }}>{t}</span>
                  ))}
                </div>
              )}
              {/* Special rules */}
              {race.specialRules && race.specialRules !== 'None' && (
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', lineHeight: 1.5, borderLeft: '2px solid var(--border2)', paddingLeft: 8 }}>{race.specialRules}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MAIN WIZARD ───────────────────────────────────────────────────────────────
const STEPS = ['Name', 'Roll', 'Assign', 'Race']

export default function CharacterWizard({ userId, existingNames, onComplete, onCancel }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    name: '', player: '', raceKey: '',
    rollSets: null, selectedSet: null, rolledValues: null,
    assignedMap: {}, discardIdx: null, finalAttrs: {},
  })

  const canAdvance = useMemo(() => {
    if (step === 0) return data.name.trim() && data.player.trim() && !existingNames.includes(data.name.trim())
    if (step === 1) return data.rolledValues !== null
    if (step === 2) return Object.keys(data.assignedMap || {}).length === 6
    if (step === 3) return !!data.raceKey
    return false
  }, [step, data])

  const handleCreate = () => {
    const race = racesData[data.raceKey]
    const startingPoints = getStartingPoints(data.raceKey)
    const attrs = data.finalAttrs || {}

    const newCharacter = {
      hardcore: data.rollMethod === 'hardcore',
      name: data.name.trim(),
      player: data.player.trim(),
      race: race?.name || '',
      raceKey: data.raceKey,
      raceLocked: true,
      level: 1,
      attributes: {
        str: { base: attrs.STR || 10 },
        dex: { base: attrs.DEX || 10 },
        con: { base: attrs.CON || 10 },
        aw:  { base: attrs.AW  || 10 },
        chr: { base: attrs.CHR || 10 },
        wp:  { base: attrs.WP  || 10 },
      },
      skillPoints: { totalEarned: startingPoints, bonusGiven: 0, maintenancePaid: 0 },
      martialSkills: {}, arcaneSkills: {}, selfImprovementSkills: {}, generalSkills: {},
      armor: {}, hp: { current: {} },
      weapons: { melee: [null, null], ranged: [null] },
      knownSpells: [], spellHooks: [],
      status: 'creation',
      levelUpAuthorized: false,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    }
    onComplete(newCharacter)
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 4px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>New Character</h1>
        <div style={{ fontSize: '.72rem', color: 'var(--text3)', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </div>
      </div>

      <StepIndicator current={step} total={STEPS.length} />

      <div style={surface}>
        {step === 0 && <StepNamePlayer data={data} onChange={setData} existingNames={existingNames} />}
        {step === 1 && <StepRoll data={data} onChange={setData} />}
        {step === 2 && <StepAssign data={data} onChange={setData} />}
        {step === 3 && <StepRace data={data} onChange={setData} />}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <button onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} style={btnSecondary}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance}
            style={{ ...btnPrimary, opacity: canAdvance ? 1 : 0.4, cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
            {step === 2 ? 'Choose Race →' : 'Next →'}
          </button>
        ) : (
          <button onClick={handleCreate} disabled={!canAdvance}
            style={{ ...btnPrimary, opacity: canAdvance ? 1 : 0.4, cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
            Create Character
          </button>
        )}
      </div>
    </div>
  )
}

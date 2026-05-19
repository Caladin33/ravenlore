// GeneralSkillCard.jsx
import { useState } from 'react'
import attributeData from '../data/attributes.json'

const G = {
  primary:   '#4a9e4a',
  primary2:  '#6abf6a',
  surface:   'rgba(74,158,74,.06)',
  border:    'rgba(74,158,74,.25)',
  borderAct: 'rgba(74,158,74,.5)',
  dim:       'rgba(74,158,74,.1)',
}

const GRID = '1fr 52px 72px'

// ── MAXIMUM PARSER ────────────────────────────────────────────────────────────
function parseMaximum(formula, attrs, isOgier) {
  if (!formula) return null
  const f = formula.trim()
  const ogierBonus = isOgier ? 10 : 0

  if (f === 'SC') {
    const sc = attributeData.awareness?.[String(Math.max(1, Math.min(20, attrs.aw)))]?.skillCap ?? 100
    return sc + ogierBonus
  }
  if (f === '2SC') {
    const sc = attributeData.awareness?.[String(Math.max(1, Math.min(20, attrs.aw)))]?.skillCap ?? 100
    return sc * 2 + ogierBonus
  }
  const match = f.match(/^(\d+)(Str|Dex|Con|Aw|Chr|Wp)$/i)
  if (match) {
    const mult = parseInt(match[1])
    const key = match[2].toLowerCase()
    const attrMap = { str: attrs.str, dex: attrs.dex, con: attrs.con, aw: attrs.aw, chr: attrs.chr, wp: attrs.wp }
    return mult * (attrMap[key] || 10) + ogierBonus
  }
  return null
}

// ── PREREQ PARSER ─────────────────────────────────────────────────────────────
function parsePrereq(prereqStr) {
  if (!prereqStr || prereqStr.toLowerCase() === 'none') return { type: 'none' }
  const str = prereqStr.trim()
  if (str.includes('<')) {
    const parts = str.split(/\n|\band\b|\bor\b/i).map(s => s.trim()).filter(Boolean)
    const caps = parts.filter(p => p.startsWith('<')).map(p => p.replace('<', '').trim())
    const isOr = str.toLowerCase().includes(' or')
    return { type: 'cap', caps, logic: isOr ? 'or' : 'and', raw: str }
  }
  const minMatch = str.match(/^(\d+)\+\s*(.+)$/)
  if (minMatch) return { type: 'min', score: parseInt(minMatch[1]), skill: minMatch[2].trim(), raw: str }
  if (str.toLowerCase().includes('trainer')) return { type: 'trainer', raw: str }
  return { type: 'narrative', raw: str }
}

function checkCap(prereq, score, getSkillScore) {
  if (prereq.type !== 'cap') return { capped: false }
  const capValues = prereq.caps.map(s => ({ skill: s, score: getSkillScore(s) }))
  if (prereq.logic === 'or') {
    const maxCap = Math.max(...capValues.map(c => c.score))
    const limiter = capValues.find(c => c.score === maxCap)
    return { capped: score >= maxCap, capValue: maxCap, capBy: limiter?.skill }
  } else {
    const minCap = Math.min(...capValues.map(c => c.score))
    const limiter = capValues.find(c => c.score === minCap)
    return { capped: score >= minCap, capValue: minCap, capBy: limiter?.skill }
  }
}

function checkMin(prereq, getSkillScore) {
  if (prereq.type !== 'min') return { met: true }
  const score = getSkillScore(prereq.skill)
  return { met: score >= prereq.score, score, required: prereq.score, skill: prereq.skill }
}

// ── EDITABLE POINTS ───────────────────────────────────────────────────────────
function EditablePoints({ value, onCommit, isActive }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)

  const startEdit = () => { setDraft(String(value)); setError(null); setEditing(true) }
  const commit = () => {
    const num = parseInt(draft)
    if (isNaN(num) || num < 0) { setError('Must be ≥ 0'); return }
    const result = onCommit(num)
    if (result?.error) { setError(result.error) }
    else { setError(null); setEditing(false) }
  }
  const cancel = () => { setEditing(false); setError(null) }

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <input
          autoFocus value={draft}
          onChange={e => { setDraft(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
          onBlur={commit} onFocus={e => e.target.select()}
          style={{
            width: 52, textAlign: 'center', background: 'var(--bg)',
            border: `1px solid ${error ? '#c94a4a' : G.primary}`,
            color: 'var(--text)', borderRadius: 3, padding: '2px 4px',
            fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700,
          }}
        />
        {error && <div style={{ fontSize: '.55rem', color: '#c94a4a', textAlign: 'center', maxWidth: 72, lineHeight: 1.3 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div onClick={startEdit} title="Click to edit" style={{
      fontSize: '1rem', fontWeight: 700, fontFamily: 'Georgia, serif',
      color: isActive ? G.primary2 : 'var(--text2)',
      cursor: 'pointer', textAlign: 'center',
      borderBottom: `1px dotted ${isActive ? G.primary : 'var(--border2)'}`,
      minWidth: 24, display: 'inline-block',
    }}>
      {value}
    </div>
  )
}

// ── SKILL ROW ─────────────────────────────────────────────────────────────────
export function GeneralSkillCard({ skill, score, pointsInvested, onAdd, onRemove, getSkillScore, onUpdate, lockedPoints, gmMode, stats, character, tourId }) {
  const [expanded, setExpanded] = useState(false)

  const prereq = parsePrereq(skill.prereq)
  const costMult = parseInt(skill.costMultiplier) || 1
  const capResult = checkCap(prereq, score, getSkillScore)
  const minResult = prereq.type === 'min' ? checkMin(prereq, getSkillScore) : { met: true }
  const isActive = pointsInvested > 0
  const isBlocked = prereq.type === 'min' && !minResult.met
  const locked = lockedPoints?.[skill.name] || 0

  const isOgier = character?.raceKey === 'ogier' || character?.race === 'Ogier'

  const effectiveAttrs = {
    str: stats?.attributes?.str?.effective ?? (typeof character?.attributes?.str === 'object' ? character.attributes.str.base : character?.attributes?.str) ?? 10,
    dex: stats?.attributes?.dex?.effective ?? (typeof character?.attributes?.dex === 'object' ? character.attributes.dex.base : character?.attributes?.dex) ?? 10,
    con: stats?.attributes?.con?.effective ?? (typeof character?.attributes?.con === 'object' ? character.attributes.con.base : character?.attributes?.con) ?? 10,
    aw:  stats?.attributes?.aw?.effective  ?? (typeof character?.attributes?.aw  === 'object' ? character.attributes.aw.base  : character?.attributes?.aw)  ?? 10,
    chr: stats?.attributes?.chr?.effective ?? (typeof character?.attributes?.chr === 'object' ? character.attributes.chr.base : character?.attributes?.chr) ?? 10,
    wp:  stats?.attributes?.wp?.effective  ?? (typeof character?.attributes?.wp  === 'object' ? character.attributes.wp.base  : character?.attributes?.wp)  ?? 10,
  }

  const maxValue = parseMaximum(skill.maximum, effectiveAttrs, isOgier)
  const atMax = maxValue !== null && score >= maxValue

  const handleCommit = (newPoints) => {
    if (!gmMode && newPoints < locked) return { error: `Cannot go below ${locked} (locked from last save)` }
    if (!minResult.met && newPoints > 0) return { error: `Requires ${prereq.skill} ${prereq.score}+` }
    if (!gmMode && capResult.capped && newPoints > pointsInvested) return { error: `Capped at ${capResult.capValue} by ${capResult.capBy}` }
    // Calculate what the new score would be
    const currentScore = score
    const pointDelta = newPoints - pointsInvested
    const newScore = currentScore + pointDelta * costMult
    if (!gmMode && maxValue !== null && newScore > maxValue) {
      return { error: `Maximum score is ${maxValue}${isOgier ? ' (includes +10 Ogier bonus)' : ''}` }
    }
    if (onUpdate) onUpdate(newPoints)
    else if (newPoints > pointsInvested) onAdd()
    else onRemove()
    return {}
  }

  const prereqLine = () => {
    if (prereq.type === 'none') return null
    if (prereq.type === 'cap') {
      return capResult.capped
        ? <span style={{ color: '#c94a4a' }}>⚠ Capped at {capResult.capValue} by {capResult.capBy}</span>
        : <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Cap: {prereq.caps.join(prereq.logic === 'or' ? ' or ' : ' and ')}</span>
    }
    if (prereq.type === 'min') {
      return minResult.met
        ? <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Req: {prereq.skill} {prereq.score}+ ✓</span>
        : <span style={{ color: '#c94a4a' }}>⚠ Requires {prereq.skill} {prereq.score}+ (currently {minResult.score})</span>
    }
    if (prereq.type === 'trainer') return <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Requires in-game trainer</span>
    return <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>{prereq.raw}</span>
  }

  return (
    <>
      <div data-tour={tourId || undefined} style={{
        display: 'grid', gridTemplateColumns: GRID, alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: isActive ? G.dim : 'transparent',
        minHeight: 48, opacity: isBlocked ? 0.55 : 1,
      }}>
        {/* Skill name + prereq */}
        <div style={{ padding: '8px 12px', cursor: 'pointer', minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
            fontSize: '.92rem', fontFamily: 'Georgia, serif',
            color: isActive ? G.primary2 : (isBlocked ? 'var(--text3)' : 'var(--text)'),
            fontWeight: isActive ? 600 : 400,
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.name}</span>
            <span style={{ fontSize: '.58rem', color: 'var(--text3)', opacity: .5, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
          </div>
          {prereq.type !== 'none' && (
            <div style={{ fontSize: '.62rem', marginTop: 2 }}>{prereqLine()}</div>
          )}
          {atMax && (
            <div style={{ fontSize: '.6rem', color: '#c9a84c', fontFamily: 'Georgia, serif', marginTop: 1 }}>⚑ At maximum</div>
          )}
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', padding: '8px 4px' }}>
          <div style={{
            fontSize: isActive ? '1.2rem' : '.95rem',
            fontWeight: isActive ? 700 : 400,
            fontFamily: 'Georgia, serif',
            color: atMax ? '#c9a84c' : (capResult.capped ? '#c94a4a' : (isActive ? G.primary2 : G.primary)),
            lineHeight: 1,
          }}>
            {score}
          </div>
          {maxValue !== null && (
            <div style={{ fontSize: '.55rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 1 }}>
              /{maxValue}
            </div>
          )}
        </div>

        {/* Points invested */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: 2 }}>
          <EditablePoints value={pointsInvested} onCommit={handleCommit} isActive={isActive} />
          <div style={{ width: 36, height: 1, background: isActive ? G.borderAct : 'var(--border)' }} />
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
            ×{costMult}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '10px 12px 14px 12px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: skill.description ? 8 : 0, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '.55rem', letterSpacing: '.12em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Cost Multiplier</div>
              <div style={{ fontSize: '.9rem', color: G.primary2, fontFamily: 'Georgia, serif', fontWeight: 600 }}>×{costMult} per point</div>
            </div>
            {skill.maximum && (
              <div>
                <div style={{ fontSize: '.55rem', letterSpacing: '.12em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Maximum</div>
                <div style={{ fontSize: '.9rem', color: G.primary2, fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                  {maxValue !== null ? maxValue : skill.maximum}
                  {isOgier && maxValue !== null && <span style={{ fontSize: '.7rem', color: '#c9a84c', marginLeft: 6 }}>(+10 Ogier)</span>}
                  <span style={{ fontSize: '.7rem', color: 'var(--text3)', marginLeft: 6 }}>({skill.maximum})</span>
                </div>
              </div>
            )}
          </div>
          {skill.description && (
            <div style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.65, fontFamily: 'Georgia, serif' }}>{skill.description}</div>
          )}
        </div>
      )}
    </>
  )
}

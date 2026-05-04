// RankedSkillCard.jsx
// Reusable card for ranked skills (Self Improvement, Martial, Spiritual, Obscure)
// Color theme passed as props

import { useState } from 'react'

export function RankedSkillCard({ skill, rank, pointsInvested, onAdd, onRemove, theme }) {
  const [expanded, setExpanded] = useState(false)

  const name = skill.name || ''
  const desc = skill.description || ''
  const costPerRank = parseInt(skill.costPerRank) || 1
  const maxRank = skill.maxRank || 1
  const mcl = skill.mcl || 'any'
  const maint = parseFloat(skill.maintenancePerRank) || 0
  const prereq = skill.prereq || ''

  const atMax = maxRank !== 'any' && rank >= parseInt(maxRank)
  const addBlocked = atMax
  const removeBlocked = pointsInvested <= 0

  const isActive = rank > 0

  // Theme defaults to neutral gold
  const T = theme || {
    primary: 'var(--gold)',
    primary2: 'var(--gold2)',
    surface: 'rgba(201,168,76,.06)',
    border: 'rgba(201,168,76,.25)',
    borderAct: 'rgba(201,168,76,.5)',
  }

  return (
    <div style={{
      background: isActive ? T.surface : 'var(--surface)',
      border: `1px solid ${isActive ? T.borderAct : T.border}`,
      borderRadius: 7,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>

      {/* Header: name + rank + controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '1rem', fontFamily: 'Georgia, serif',
            color: 'var(--text)', marginBottom: 3, fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '.68rem', color: T.primary }}>
            <span>{costPerRank}pts/rank</span>
            <span>·</span>
            <span>Max: {maxRank}</span>
            {mcl !== 'any' && mcl !== 'Any' && <><span>·</span><span>MC/L: {mcl}</span></>}
            {maint > 0 && isActive && <><span>·</span><span style={{ color: '#c94a4a' }}>{(maint * rank).toFixed(2)}/lvl maint</span></>}
          </div>
          {prereq && prereq !== 'none' && (
            <div style={{ fontSize: '.65rem', color: 'var(--text3)', marginTop: 2, fontStyle: 'italic' }}>
              Req: {prereq}
            </div>
          )}
        </div>

        {/* Rank display */}
        <div style={{ textAlign: 'center', minWidth: 36 }}>
          <div style={{
            fontSize: '1.5rem', fontWeight: 700,
            fontFamily: 'Georgia, serif',
            color: isActive ? T.primary2 : 'var(--text3)',
            lineHeight: 1,
          }}>
            {rank}
          </div>
          <div style={{ fontSize: '.55rem', color: 'var(--text3)', letterSpacing: '.1em' }}>
            RANK
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={onRemove}
            disabled={removeBlocked}
            style={{
              width: 26, height: 26,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 4, color: removeBlocked ? 'var(--text3)' : 'var(--text2)',
              fontSize: 16, cursor: removeBlocked ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: removeBlocked ? 0.35 : 1,
            }}
          >−</button>

          {/* Points invested */}
          <div style={{
            minWidth: 36, textAlign: 'center',
            background: 'var(--bg)', border: `1px solid ${T.border}`,
            borderRadius: 4, padding: '3px 4px',
          }}>
            <div style={{
              fontSize: '1rem', color: T.primary2,
              fontWeight: 700, fontFamily: 'Georgia, serif', lineHeight: 1,
            }}>
              {pointsInvested}
            </div>
          </div>

          <button
            onClick={onAdd}
            disabled={addBlocked}
            style={{
              width: 26, height: 26,
              background: addBlocked ? 'var(--bg2)' : `${T.surface}`,
              border: `1px solid ${addBlocked ? 'var(--border)' : T.primary}`,
              borderRadius: 4,
              color: addBlocked ? 'var(--text3)' : T.primary,
              fontSize: 16, cursor: addBlocked ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: addBlocked ? 0.35 : 1,
            }}
          >+</button>
        </div>

        {/* Expand toggle */}
        {desc && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text3)', cursor: 'pointer',
              fontSize: '.7rem', padding: '0 2px', flexShrink: 0,
            }}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Description — shown on click */}
      {expanded && desc && (
        <div style={{
          fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.65,
          fontFamily: 'Georgia, serif',
          borderTop: `1px solid ${T.border}`, paddingTop: 8,
        }}>
          {desc}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// THEME DEFINITIONS
// ─────────────────────────────────────────────

export const THEMES = {
  selfImprovement: {
    primary:  '#d4847a',
    primary2: '#e8a09a',
    surface:  'rgba(212,132,122,.08)',
    border:   'rgba(212,132,122,.25)',
    borderAct:'rgba(212,132,122,.5)',
  },
  melee: {
    primary:  '#8a8a9a',
    primary2: '#aaaabb',
    surface:  'rgba(138,138,154,.08)',
    border:   'rgba(138,138,154,.25)',
    borderAct:'rgba(138,138,154,.5)',
  },
  unfettered: {
    primary:  '#9a7a5a',
    primary2: '#b8966e',
    surface:  'rgba(154,122,90,.08)',
    border:   'rgba(154,122,90,.25)',
    borderAct:'rgba(154,122,90,.5)',
  },
  ranged: {
    primary:  '#5a8a5a',
    primary2: '#7aaa7a',
    surface:  'rgba(90,138,90,.08)',
    border:   'rgba(90,138,90,.25)',
    borderAct:'rgba(90,138,90,.5)',
  },
  leadership: {
    primary:  '#3a5a8a',
    primary2: '#5a7aaa',
    surface:  'rgba(58,90,138,.08)',
    border:   'rgba(58,90,138,.25)',
    borderAct:'rgba(58,90,138,.5)',
  },
  arcane: {
    primary:  '#7a5a9a',
    primary2: '#9a7aba',
    surface:  'rgba(122,90,154,.08)',
    border:   'rgba(122,90,154,.25)',
    borderAct:'rgba(122,90,154,.5)',
  },
  guild: {
    primary:  '#6a4a8a',
    primary2: '#8a6aaa',
    surface:  'rgba(106,74,138,.08)',
    border:   'rgba(106,74,138,.25)',
    borderAct:'rgba(106,74,138,.5)',
  },
  divine: {
    primary:  '#9a8a3a',
    primary2: '#baaa5a',
    surface:  'rgba(154,138,58,.08)',
    border:   'rgba(154,138,58,.25)',
    borderAct:'rgba(154,138,58,.5)',
  },
  balance: {
    primary:  '#9a8a6a',
    primary2: '#baaa8a',
    surface:  'rgba(154,138,106,.08)',
    border:   'rgba(154,138,106,.25)',
    borderAct:'rgba(154,138,106,.5)',
  },
  infernal: {
    primary:  '#8a2a2a',
    primary2: '#aa4a4a',
    surface:  'rgba(138,42,42,.08)',
    border:   'rgba(138,42,42,.25)',
    borderAct:'rgba(138,42,42,.5)',
  },
  lycanthropy: {
    primary:  '#5a5a6a',
    primary2: '#7a7a8a',
    surface:  'rgba(90,90,106,.08)',
    border:   'rgba(90,90,106,.25)',
    borderAct:'rgba(90,90,106,.5)',
  },
  animal: {
    primary:  '#9a6a2a',
    primary2: '#ba8a4a',
    surface:  'rgba(154,106,42,.08)',
    border:   'rgba(154,106,42,.25)',
    borderAct:'rgba(154,106,42,.5)',
  },
}

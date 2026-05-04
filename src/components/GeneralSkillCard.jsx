// GeneralSkillCard.jsx
// Green-themed card for general skills

import { useState } from 'react'

// ─────────────────────────────────────────────
// THEME COLORS
// ─────────────────────────────────────────────

const G = {
  primary:   '#4a9e4a',   // green
  primary2:  '#6abf6a',   // light green
  surface:   'rgba(74,158,74,.06)',
  border:    'rgba(74,158,74,.25)',
  borderAct: 'rgba(74,158,74,.5)',
  dim:       'rgba(74,158,74,.35)',
}

// ─────────────────────────────────────────────
// PREREQ PARSER
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────

export function GeneralSkillCard({ skill, score, pointsInvested, onAdd, onRemove, getSkillScore }) {
  const prereq = parsePrereq(skill.prereq)
  const costMult = parseInt(skill.costMultiplier) || 1
  const maxStr = skill.maximum || 'SC'

  const capResult = checkCap(prereq, score, getSkillScore)
  const minResult = prereq.type === 'min' ? checkMin(prereq, getSkillScore) : { met: true }

  const wouldBeScore = score + costMult
  const addBlocked = capResult.capped
    || (prereq.type === 'cap' && wouldBeScore > capResult.capValue)
    || !minResult.met
  const removeBlocked = pointsInvested <= 0
  const isActive = pointsInvested > 0
  const isBlocked = prereq.type === 'min' && !minResult.met

  return (
    <div style={{
      background: isActive ? G.surface : 'var(--surface)',
      border: `1px solid ${isActive ? G.borderAct : G.border}`,
      borderRadius: 7,
      padding: '14px 16px',
      opacity: isBlocked ? 0.55 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>

      {/* Header: name + score + controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>

        {/* Name + cost info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '1.05rem', fontFamily: 'Georgia, serif',
            color: isBlocked ? 'var(--text3)' : 'var(--text)',
            marginBottom: 4, fontWeight: 600,
          }}>
            {skill.name}
          </div>
          <div style={{ fontSize: '.8rem', color: G.dim, letterSpacing: '.03em' }}>
            1pt = +{costMult} &nbsp;·&nbsp; Max: {maxStr}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{
            fontSize: '1.6rem', fontWeight: 700,
            fontFamily: 'Georgia, serif',
            color: capResult.capped ? '#c94a4a' : (isActive ? G.primary2 : G.primary),
            lineHeight: 1,
          }}>
            {score}
          </div>
        </div>

        {/* Controls */}
        {!isBlocked && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={onRemove}
              disabled={removeBlocked}
              style={{
                width: 28, height: 28,
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 4, color: removeBlocked ? 'var(--text3)' : 'var(--text2)',
                fontSize: 18, cursor: removeBlocked ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: removeBlocked ? 0.35 : 1,
              }}
            >−</button>

            {/* Points invested box */}
            <div style={{
              minWidth: 40, textAlign: 'center',
              background: 'var(--bg)', border: `1px solid ${G.border}`,
              borderRadius: 4, padding: '3px 6px',
            }}>
              <div style={{
                fontSize: '1.1rem', color: G.primary2,
                fontWeight: 700, fontFamily: 'Georgia, serif', lineHeight: 1,
              }}>
                {pointsInvested}
              </div>
            </div>

            <button
              onClick={onAdd}
              disabled={addBlocked}
              style={{
                width: 28, height: 28,
                background: addBlocked ? 'var(--bg2)' : `rgba(74,158,74,.15)`,
                border: `1px solid ${addBlocked ? 'var(--border)' : G.primary}`,
                borderRadius: 4,
                color: addBlocked ? 'var(--text3)' : G.primary,
                fontSize: 18, cursor: addBlocked ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: addBlocked ? 0.35 : 1,
              }}
            >+</button>
          </div>
        )}
      </div>

      {/* Description */}
      {skill.description && (
        <div style={{
          fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.65,
          fontFamily: 'Georgia, serif',
        }}>
          {skill.description}
        </div>
      )}

      {/* Prereq */}
      {prereq.type !== 'none' && (
        <div style={{
          fontSize: '.78rem', fontFamily: 'Georgia, serif',
          borderTop: `1px solid ${G.border}`, paddingTop: 7,
        }}>
          {prereq.type === 'cap' && (
            <div style={{ color: capResult.capped ? '#c94a4a' : 'var(--text3)' }}>
              {capResult.capped
                ? `⚠ Capped at ${capResult.capValue} by ${capResult.capBy}`
                : `Cap: cannot exceed ${prereq.caps.join(prereq.logic === 'or' ? ' or ' : ' and ')}`
              }
            </div>
          )}
          {prereq.type === 'min' && (
            <div style={{ color: minResult.met ? 'var(--text3)' : '#c94a4a' }}>
              {minResult.met
                ? `Req: ${prereq.skill} ${prereq.score}+ ✓`
                : `⚠ Requires ${prereq.skill} ${prereq.score}+ (currently ${minResult.score})`
              }
            </div>
          )}
          {prereq.type === 'trainer' && (
            <div style={{ color: 'var(--text3)', fontStyle: 'italic' }}>
              Requires in-game trainer
            </div>
          )}
          {prereq.type === 'narrative' && (
            <div style={{ color: 'var(--text3)', fontStyle: 'italic' }}>
              {prereq.raw}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// SaveConfirmModal.jsx
// Reusable save confirmation dialog

import martialSkillsData from '../data/martialSkills.json'
import arcaneSkillsData from '../data/arcaneSkills.json'
import selfImprovementData from '../data/selfImprovementSkills.json'

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getAllSkillDefs() {
  const defs = {}
  const addSkills = (list) => list.forEach(s => { defs[s.name] = s })
  addSkills(martialSkillsData)
  addSkills(selfImprovementData)
  ;['spellcaster','guild','divine','balance','infernal','lycanthropy','animal'].forEach(cat => {
    addSkills((arcaneSkillsData[cat] || []))
  })
  return defs
}

const SKILL_DEFS = getAllSkillDefs()

function calcMaintenance(char) {
  return [
    ...Object.values(char.martialSkills || {}),
    ...Object.values(char.arcaneSkills || {}),
    ...Object.values(char.selfImprovementSkills || {}),
  ].reduce((sum, data) => {
    const pts = parseInt(data.pointsInvested) || 0
    return sum + (pts > 0 ? Math.floor(parseFloat(data.maintenanceCost) || 0) : 0)
  }, 0)
}

function calcSpent(char) {
  return [
    ...Object.values(char.martialSkills || {}),
    ...Object.values(char.arcaneSkills || {}),
    ...Object.values(char.selfImprovementSkills || {}),
    ...Object.values(char.generalSkills || {}),
  ].reduce((sum, s) => sum + (parseInt(s.pointsInvested) || 0), 0)
}

function getSkillChanges(original, updated) {
  const changes = []
  const allSources = [
    ['martialSkills', original.martialSkills || {}, updated.martialSkills || {}],
    ['arcaneSkills', original.arcaneSkills || {}, updated.arcaneSkills || {}],
    ['selfImprovementSkills', original.selfImprovementSkills || {}, updated.selfImprovementSkills || {}],
    ['generalSkills', original.generalSkills || {}, updated.generalSkills || {}],
  ]

  const allSkillNames = new Set()
  allSources.forEach(([, orig, upd]) => {
    Object.keys(orig).forEach(k => allSkillNames.add(k))
    Object.keys(upd).forEach(k => allSkillNames.add(k))
  })

  allSkillNames.forEach(name => {
    let oldPts = 0, newPts = 0, oldRank = 0, newRank = 0
    allSources.forEach(([, orig, upd]) => {
      if (orig[name]) { oldPts = parseInt(orig[name].pointsInvested) || 0; oldRank = parseInt(orig[name].rank) || 0 }
      if (upd[name]) { newPts = parseInt(upd[name].pointsInvested) || 0; newRank = parseInt(upd[name].rank) || 0 }
    })
    if (oldPts !== newPts) {
      const isGeneral = !!(original.generalSkills?.[name] || updated.generalSkills?.[name])
      changes.push({ name, oldPts, newPts, oldRank, newRank, isGeneral, delta: newPts - oldPts })
    }
  })

  return changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const lbl = {
  fontSize: '.6rem', letterSpacing: '.14em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif',
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SaveConfirmModal({ original, updated, onConfirm, onCancel, title = 'Save Changes' }) {
  const changes = getSkillChanges(original, updated)
  const oldMaint = calcMaintenance(original)
  const newMaint = calcMaintenance(updated)
  const maintChanged = oldMaint !== newMaint

  const oldSpent = calcSpent(original)
  const newSpent = calcSpent(updated)
  const oldEarned = (original.skillPoints?.totalEarned ?? 0) + (original.skillPoints?.bonusGiven ?? 0)
  const newEarned = (updated.skillPoints?.totalEarned ?? 0) + (updated.skillPoints?.bonusGiven ?? 0)
  const oldMaintPaid = original.skillPoints?.maintenancePaid ?? 0
  const newMaintPaid = updated.skillPoints?.maintenancePaid ?? 0
  const oldAvailable = oldEarned - oldSpent - oldMaintPaid
  const newAvailable = newEarned - newSpent - newMaintPaid
  const availableChanged = oldAvailable !== newAvailable

  const increased = changes.filter(c => c.delta > 0)
  const decreased = changes.filter(c => c.delta < 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: 22, maxWidth: 480, width: '100%',
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,.7)',
      }}>
        <h2 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 4, fontSize: '1.2rem' }}>
          {title}
        </h2>
        <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginBottom: 18 }}>
          Review changes before saving
        </div>

        {/* Skill point summary */}
        {availableChanged && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ ...lbl, marginBottom: 8 }}>Skill Points</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ ...lbl, marginBottom: 2 }}>Available</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '.95rem' }}>
                  <span style={{ color: 'var(--text3)' }}>{oldAvailable}</span>
                  <span style={{ color: 'var(--text3)', margin: '0 6px' }}>→</span>
                  <span style={{ color: newAvailable < 0 ? '#c94a4a' : 'var(--gold2)', fontWeight: 600 }}>{newAvailable}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance summary */}
        <div style={{
          background: maintChanged ? (newMaint > oldMaint ? 'rgba(201,74,74,.08)' : 'rgba(74,158,74,.08)') : 'var(--bg2)',
          border: `1px solid ${maintChanged ? (newMaint > oldMaint ? 'rgba(201,74,74,.3)' : 'rgba(74,158,74,.3)') : 'var(--border)'}`,
          borderRadius: 6, padding: '10px 14px', marginBottom: 14,
        }}>
          <div style={{ ...lbl, marginBottom: 6 }}>Maintenance / Level Up</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Georgia, serif' }}>
            <span style={{ fontSize: '1.1rem', color: 'var(--text2)' }}>{oldMaint}</span>
            <span style={{ color: 'var(--text3)' }}>→</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: newMaint > oldMaint ? '#c94a4a' : (newMaint < oldMaint ? '#4a9e4a' : 'var(--gold2)') }}>
              {newMaint}
            </span>
            {maintChanged && (
              <span style={{ fontSize: '.8rem', color: newMaint > oldMaint ? '#c94a4a' : '#4a9e4a', fontStyle: 'italic' }}>
                ({newMaint > oldMaint ? '+' : ''}{newMaint - oldMaint} per level up)
              </span>
            )}
          </div>
        </div>

        {/* Skill changes */}
        {changes.length === 0 && (
          <div style={{ fontSize: '.85rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 14 }}>
            No skill changes.
          </div>
        )}

        {increased.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...lbl, marginBottom: 6, color: '#4a9e4a' }}>Increased</div>
            {increased.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', marginBottom: 3, background: 'rgba(74,158,74,.06)', border: '1px solid rgba(74,158,74,.2)', borderRadius: 4 }}>
                <span style={{ fontSize: '.88rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{c.name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {!c.isGeneral && (
                    <span style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
                      R{c.oldRank} → R{c.newRank}
                    </span>
                  )}
                  <span style={{ fontSize: '.82rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                    {c.oldPts} → {c.newPts} (+{c.delta})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {decreased.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...lbl, marginBottom: 6, color: '#c94a4a' }}>Decreased / Removed</div>
            {decreased.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', marginBottom: 3, background: 'rgba(201,74,74,.06)', border: '1px solid rgba(201,74,74,.2)', borderRadius: 4 }}>
                <span style={{ fontSize: '.88rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{c.name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {!c.isGeneral && (
                    <span style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
                      R{c.oldRank} → R{c.newRank}
                    </span>
                  )}
                  <span style={{ fontSize: '.82rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                    {c.oldPts} → {c.newPts} ({c.delta})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '8px 22px', background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a', color: '#4a9e4a', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem', fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

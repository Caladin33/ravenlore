// GMView.jsx
import { useState, useEffect } from 'react'
import { loadCampaignCharacters, saveCharacterByOwner } from '../characterDB'

// ── STYLES ────────────────────────────────────────────────────────────────────
const surface = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }
const lbl = { fontSize: '.58rem', letterSpacing: '.16em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', display: 'block', marginBottom: 3 }
const val = { fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }

// ── PENDING DIFF ──────────────────────────────────────────────────────────────
function PendingDiff({ original, pending, onApprove, onReject }) {
  return (
    <div style={{ marginTop: 12 }}>
      <SaveConfirmModal
        original={original}
        updated={pending}
        onConfirm={onApprove}
        onCancel={onReject}
        title="Pending Skill Changes"
        confirmLabel="Approve"
        cancelLabel="Reject"
        inline
      />
    </div>
  )
}

// ── CHARACTER CARD ────────────────────────────────────────────────────────────
function CharacterCard({ char, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const hasPending = !!char.pendingSkillChanges
  const isLevelUpAuth = !!char.levelUpAuthorized
  const status = char.status || 'active'

  // Build pending character state for diff
  const pendingChar = hasPending ? {
    ...char,
    martialSkills: char.pendingSkillChanges.martialSkills || char.martialSkills,
    arcaneSkills: char.pendingSkillChanges.arcaneSkills || char.arcaneSkills,
    selfImprovementSkills: char.pendingSkillChanges.selfImprovementSkills || char.selfImprovementSkills,
    generalSkills: char.pendingSkillChanges.generalSkills || char.generalSkills,
  } : null

const handleApprove = () => {
  const pending = char.pendingSkillChanges || {}
  const updated = JSON.parse(JSON.stringify({ ...char, pendingSkillChanges: null }))

  Object.entries(pending).forEach(([name, { category, newPts }]) => {
    const categoryMap = {
      martial: 'martialSkills',
      arcane: 'arcaneSkills',
      selfImprovement: 'selfImprovementSkills',
      general: 'generalSkills',
    }
    const skillKey = categoryMap[category]
    if (skillKey) {
      if (!updated[skillKey]) updated[skillKey] = {}
      if (newPts === 0) {
        delete updated[skillKey][name]
      } else {
        updated[skillKey][name] = { ...pending[name].skillData, pointsInvested: newPts }
      }
    }
  })

  onUpdate(updated)
  setShowDiff(false)
}
  const handleReject = () => {
    const updated = { ...char, pendingSkillChanges: null }
    onUpdate(updated)
    setShowDiff(false)
  }

  const toggleLevelUp = () => {
    onUpdate({ ...char, levelUpAuthorized: !isLevelUpAuth })
  }

  const statusColor = hasPending ? '#c9a84c' : status === 'creation' ? '#4a90d9' : '#4a9e4a'
  const statusLabel = hasPending ? '⏳ Pending Approval' : status === 'creation' ? '🔵 In Creation' : '✓ Active'

  return (
    <div style={{ ...surface, padding: '12px 16px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        {char.imageUrl && (
          <img src={char.imageUrl} alt={char.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border2)', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{char.name}</span>
            {char.hardcore && <span style={{ fontSize: '.65rem', color: '#c94a4a' }}>⚔</span>}
            {hasPending && <span style={{ fontSize: '.62rem', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', color: 'var(--gold)', borderRadius: 3, padding: '1px 6px', flexShrink: 0 }}>Pending</span>}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
            Level {char.level} {char.race} · <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>
        <span style={{ fontSize: '.6rem', color: 'var(--text3)', opacity: .5 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded controls */}
      {expanded && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              ['Level', char.level],
              ['Race', char.race],
              ['Skill Pts', (char.skillPoints?.totalEarned ?? 0) + (char.skillPoints?.bonusGiven ?? 0)],
              ['Unspent', (() => {
                const earned = (char.skillPoints?.totalEarned ?? 0) + (char.skillPoints?.bonusGiven ?? 0)
                const spent = [
                  ...Object.values(char.martialSkills || {}),
                  ...Object.values(char.arcaneSkills || {}),
                  ...Object.values(char.selfImprovementSkills || {}),
                  ...Object.values(char.generalSkills || {}),
                ].reduce((s, d) => s + (parseInt(d.pointsInvested) || 0), 0)
                const maint = char.skillPoints?.maintenancePaid ?? 0
                return earned - spent - maint
              })()],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center', minWidth: 50 }}>
                <span style={lbl}>{l}</span>
                <span style={{ ...val, fontSize: '.9rem' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Pending changes */}
          {hasPending && (
            <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>⏳ Skill changes pending approval</span>
                <button onClick={() => setShowDiff(!showDiff)} style={{ padding: '4px 12px', background: 'none', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>
                  {showDiff ? 'Hide' : 'Review'}
                </button>
              </div>
              {showDiff && pendingChar && (
                <div style={{ marginTop: 12 }}>
                  <InlineDiff original={char} onApprove={handleApprove} onReject={handleReject} />
                </div>
              )}
            </div>
          )}

          {/* Level Up Authorization */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '.85rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>Level Up Authorization</span>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 2 }}>
                {isLevelUpAuth ? 'Player can level up to ' + (char.level + 1) : 'Level up locked'}
              </div>
            </div>
            <button onClick={toggleLevelUp} style={{
              padding: '7px 16px',
              background: isLevelUpAuth ? 'rgba(201,74,74,.15)' : 'rgba(74,158,74,.15)',
              border: `1px solid ${isLevelUpAuth ? '#c94a4a' : '#4a9e4a'}`,
              color: isLevelUpAuth ? '#c94a4a' : '#4a9e4a',
              borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
            }}>
              {isLevelUpAuth ? 'Revoke' : 'Authorize'}
            </button>
          </div>

          {/* Bonus Points */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...lbl, marginBottom: 0 }}>Bonus Skill Points</span>
            <input type="number" value={char.skillPoints?.bonusGiven ?? 0}
              onChange={e => onUpdate({ ...char, skillPoints: { ...char.skillPoints, bonusGiven: parseInt(e.target.value) || 0 } })}
              style={{ width: 60, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '4px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}
            />
          </div>

        </div>
      )}
    </div>
  )
}

// ── INLINE DIFF ───────────────────────────────────────────────────────────────
function InlineDiff({ original, onApprove, onReject }) {
  const changes = getSkillChanges(original)
  const oldMaint = calcMaintenance(original)
  const newMaint = oldMaint
  const maintChanged = false

  const increased = changes.filter(c => c.delta > 0)
  const decreased = changes.filter(c => c.delta < 0)

  return (
    <div>
      {/* Maintenance */}
      <div style={{ background: maintChanged ? (newMaint > oldMaint ? 'rgba(201,74,74,.08)' : 'rgba(74,158,74,.08)') : 'var(--bg2)', border: `1px solid ${maintChanged ? (newMaint > oldMaint ? 'rgba(201,74,74,.3)' : 'rgba(74,158,74,.3)') : 'var(--border)'}`, borderRadius: 5, padding: '8px 12px', marginBottom: 10 }}>
        <div style={{ ...lbl, marginBottom: 4 }}>Maintenance / Level Up</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif' }}>
          <span style={{ color: 'var(--text2)' }}>{oldMaint}</span>
          <span style={{ color: 'var(--text3)' }}>→</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: newMaint > oldMaint ? '#c94a4a' : (newMaint < oldMaint ? '#4a9e4a' : 'var(--gold2)') }}>{newMaint}</span>
          {maintChanged && <span style={{ fontSize: '.75rem', color: newMaint > oldMaint ? '#c94a4a' : '#4a9e4a', fontStyle: 'italic' }}>({newMaint > oldMaint ? '+' : ''}{newMaint - oldMaint}/level)</span>}
        </div>
      </div>

      {/* Skill changes */}
      {changes.length === 0 && <div style={{ fontSize: '.82rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 10 }}>No skill changes.</div>}
      {increased.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ ...lbl, color: '#4a9e4a', marginBottom: 4 }}>Increased</div>
          {increased.map(c => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(74,158,74,.06)', border: '1px solid rgba(74,158,74,.2)', borderRadius: 3, marginBottom: 2 }}>
              <span style={{ fontSize: '.85rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{c.name}</span>
              <span style={{ fontSize: '.8rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{c.oldPts} → {c.newPts} (+{c.delta})</span>
            </div>
          ))}
        </div>
      )}
      {decreased.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...lbl, color: '#c94a4a', marginBottom: 4 }}>Decreased / Removed</div>
          {decreased.map(c => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(201,74,74,.06)', border: '1px solid rgba(201,74,74,.2)', borderRadius: 3, marginBottom: 2 }}>
              <span style={{ fontSize: '.85rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{c.name}</span>
              <span style={{ fontSize: '.8rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{c.oldPts} → {c.newPts} ({c.delta})</span>
            </div>
          ))}
        </div>
      )}

      {/* Approve / Reject */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onReject} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
          Reject
        </button>
        <button onClick={onApprove} style={{ flex: 1, padding: '8px', background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a', color: '#4a9e4a', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem', fontWeight: 600 }}>
          Approve
        </button>
      </div>
    </div>
  )
}

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────
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

function getSkillChanges(char) {
  const pending = char.pendingSkillChanges || {}
  return Object.entries(pending)
    .map(([name, { oldPts, newPts }]) => ({
      name,
      oldPts,
      newPts,
      delta: newPts - oldPts,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

// ── MAIN GM VIEW ──────────────────────────────────────────────────────────────
export default function GMView({ userId, onBack }) {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [charactersByCampaign, setCharactersByCampaign] = useState({})
  const [activeCampaign, setActiveCampaign] = useState(null)

  const load = async () => {
    setLoading(true)
    const result = await loadCampaignCharacters(userId)
    setCampaigns(result.campaigns || [])
    setCharactersByCampaign(result.charactersByCampaign || {})
    if (result.campaigns?.length > 0 && !activeCampaign) {
      setActiveCampaign(result.campaigns[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpdate = async (char) => {
    await saveCharacterByOwner(char, char._ownerId)
    await load()
  }

  const activeChars = activeCampaign ? (charactersByCampaign[activeCampaign] || []) : []
  const pendingCount = activeChars.filter(c => c.pendingSkillChanges).length

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>Loading campaigns...</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontSize: '1.3rem', marginBottom: 2 }}>GM View</h2>
          {pendingCount > 0 && (
            <div style={{ fontSize: '.78rem', color: '#c9a84c', fontFamily: 'Georgia, serif' }}>
              {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <button onClick={onBack} style={{ padding: '7px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem' }}>
          ← Back
        </button>
      </div>

      {/* Campaign tabs */}
      {campaigns.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {campaigns.map(c => (
            <button key={c.id} onClick={() => setActiveCampaign(c.id)} style={{
              padding: '6px 16px',
              background: activeCampaign === c.id ? 'rgba(201,168,76,.15)' : 'var(--surface)',
              border: `1px solid ${activeCampaign === c.id ? 'var(--gold)' : 'var(--border)'}`,
              color: activeCampaign === c.id ? 'var(--gold2)' : 'var(--text2)',
              borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
            }}>
              {c.name}
              {(charactersByCampaign[c.id] || []).filter(ch => ch.pendingSkillChanges).length > 0 && (
                <span style={{ marginLeft: 6, fontSize: '.65rem', color: '#c9a84c' }}>●</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Character list */}
      {campaigns.length === 0 ? (
        <div style={{ ...surface, textAlign: 'center', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
          No campaigns found. Create a campaign in Supabase and assign characters to it.
        </div>
      ) : activeChars.length === 0 ? (
        <div style={{ ...surface, textAlign: 'center', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
          No characters in this campaign yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Pending first */}
          {[...activeChars].sort((a, b) => (b.pendingSkillChanges ? 1 : 0) - (a.pendingSkillChanges ? 1 : 0)).map(char => (
            <CharacterCard key={char.name} char={char} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

// GMView.jsx
import { useState, useEffect } from 'react'
import { loadCampaignCharacters, loadAllCampaignCharacters, saveCharacterByOwner } from '../characterDB'

// ── STYLES ────────────────────────────────────────────────────────────────────
const surface = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }
const lbl = { fontSize: '.58rem', letterSpacing: '.16em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', display: 'block', marginBottom: 3 }
const val = { fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }

// ── INLINE DIFF (skill change review) ────────────────────────────────────────
function InlineDiff({ original, onApprove, onReject }) {
  const pending = original.pendingSkillChanges || {}

  const changes = Object.entries(pending).map(([name, { oldPts, newPts }]) => ({
    name, oldPts, newPts, delta: newPts - oldPts,
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const increased = changes.filter(c => c.delta > 0)
  const decreased = changes.filter(c => c.delta < 0)

  const oldMaint = [
    ...Object.values(original.martialSkills || {}),
    ...Object.values(original.arcaneSkills || {}),
    ...Object.values(original.selfImprovementSkills || {}),
  ].reduce((sum, d) => {
    const pts = parseInt(d.pointsInvested) || 0
    return sum + (pts > 0 ? Math.floor(parseFloat(d.maintenanceCost) || 0) : 0)
  }, 0)

  // Build pending state to calculate new maintenance
  const pendingSkills = {
    martialSkills: { ...original.martialSkills },
    arcaneSkills: { ...original.arcaneSkills },
    selfImprovementSkills: { ...original.selfImprovementSkills },
  }
  const categoryMap = { martial: 'martialSkills', arcane: 'arcaneSkills', selfImprovement: 'selfImprovementSkills', general: 'generalSkills' }
  Object.entries(pending).forEach(([name, { category, newPts, skillData }]) => {
    const key = categoryMap[category]
    if (key) {
      if (newPts === 0) delete pendingSkills[key]?.[name]
      else pendingSkills[key] = { ...(pendingSkills[key] || {}), [name]: { ...skillData, pointsInvested: newPts } }
    }
  })
  const newMaint = [
    ...Object.values(pendingSkills.martialSkills || {}),
    ...Object.values(pendingSkills.arcaneSkills || {}),
    ...Object.values(pendingSkills.selfImprovementSkills || {}),
  ].reduce((sum, d) => {
    const pts = parseInt(d.pointsInvested) || 0
    return sum + (pts > 0 ? Math.floor(parseFloat(d.maintenanceCost) || 0) : 0)
  }, 0)
  const maintChanged = newMaint !== oldMaint

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...lbl, marginBottom: 4 }}>Maintenance / Level Up</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Georgia, serif' }}>
          <span style={{ color: 'var(--text2)' }}>{oldMaint}</span>
          <span style={{ color: 'var(--text3)' }}>→</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: newMaint > oldMaint ? '#c94a4a' : (newMaint < oldMaint ? '#4a9e4a' : 'var(--gold2)') }}>{newMaint}</span>
          {maintChanged && <span style={{ fontSize: '.75rem', color: newMaint > oldMaint ? '#c94a4a' : '#4a9e4a', fontStyle: 'italic' }}>({newMaint > oldMaint ? '+' : ''}{newMaint - oldMaint}/level)</span>}
        </div>
      </div>

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

// ── CHARACTER CARD ────────────────────────────────────────────────────────────
function CharacterCard({ char, onUpdate, onOpen }) {
  const [expanded, setExpanded] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const hasPending = !!char.pendingSkillChanges
  const isLevelUpAuth = !!char.levelUpAuthorized
  const status = char.status || 'active'

  const handleApprove = () => {
    const pending = char.pendingSkillChanges || {}
    // Deep clone, clear pending, preserve _ownerId for the save call
    const updated = JSON.parse(JSON.stringify({ ...char, pendingSkillChanges: null }))
    const categoryMap = { martial: 'martialSkills', arcane: 'arcaneSkills', selfImprovement: 'selfImprovementSkills', general: 'generalSkills' }

    Object.entries(pending).forEach(([name, { category, newPts, skillData }]) => {
      const skillKey = categoryMap[category]
      if (skillKey) {
        if (!updated[skillKey]) updated[skillKey] = {}
        if (newPts === 0) delete updated[skillKey][name]
        else updated[skillKey][name] = { ...skillData, pointsInvested: newPts }
      }
    })

    onUpdate(updated)   // _ownerId is still on updated, handleUpdate uses it then strips it
    setShowDiff(false)
  }

  const handleReject = () => {
    onUpdate({ ...char, pendingSkillChanges: null })
    setShowDiff(false)
  }

  const toggleLevelUp = () => onUpdate({ ...char, levelUpAuthorized: !isLevelUpAuth })

  const statusColor = hasPending ? '#c9a84c' : status === 'creation' ? '#4a90d9' : '#4a9e4a'
  const statusLabel = hasPending ? '⏳ Pending' : status === 'creation' ? '🔵 In Creation' : '✓ Active'

  return (
    <div style={{ ...surface, padding: '12px 16px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <img src={char.imageUrl || '/default-token.png'} alt={char.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border2)', flexShrink: 0 }} />
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
          <span style={{ fontSize: '.6rem', color: 'var(--text3)', opacity: .5, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {/* Open button — always visible */}
        <button
          onClick={() => onOpen(char)}
          style={{
            padding: '5px 14px', background: 'rgba(201,168,76,.1)',
            border: '1px solid var(--gold)', color: 'var(--gold2)',
            borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif',
            fontSize: '.8rem', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          Open →
        </button>
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

          {/* Pending skill changes */}
          {hasPending && (
            <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>⏳ Skill changes pending approval</span>
                <button onClick={() => setShowDiff(!showDiff)} style={{ padding: '4px 12px', background: 'none', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>
                  {showDiff ? 'Hide' : 'Review'}
                </button>
              </div>
              {showDiff && (
                <InlineDiff original={char} onApprove={handleApprove} onReject={handleReject} />
              )}
            </div>
          )}

          {/* Level Up Authorization */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '.85rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>Level Up Authorization</span>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 2 }}>
                {isLevelUpAuth ? `Player can level up to ${(char.level || 1) + 1}` : 'Level up locked'}
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
        </div>
      )}
    </div>
  )
}

// ── CAMPAIGN SECTION (a named campaign + its character list) ──────────────────
function CampaignSection({ campaign, characters, onUpdate, onOpen, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const pendingCount = characters.filter(c => c.pendingSkillChanges).length
  const sorted = [...characters].sort((a, b) => (b.pendingSkillChanges ? 1 : 0) - (a.pendingSkillChanges ? 1 : 0))

  return (
    <div style={{ ...surface, padding: 0, overflow: 'hidden' }}>
      {/* Campaign header */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', background: 'var(--bg2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '.95rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{campaign.name}</span>
          <span style={{ fontSize: '.65rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>{characters.length} character{characters.length !== 1 ? 's' : ''}</span>
          {pendingCount > 0 && (
            <span style={{ fontSize: '.62rem', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', color: 'var(--gold)', borderRadius: 3, padding: '1px 6px' }}>
              {pendingCount} pending
            </span>
          )}
        </div>
        <span style={{ fontSize: '.6rem', color: 'var(--text3)', opacity: .5 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px' }}>
          {sorted.length === 0 ? (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '6px 4px' }}>No characters assigned.</div>
          ) : (
            sorted.map(char => (
              <CharacterCard key={char.name + char._ownerId} char={char} onUpdate={onUpdate} onOpen={onOpen} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── BUCKET SECTION (My Campaigns / Other Campaigns / No Campaign) ─────────────
function BucketSection({ title, color, campaigns, noCampaignChars, onUpdate, onOpen, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const totalPending = campaigns
    ? campaigns.reduce((n, { characters }) => n + characters.filter(c => c.pendingSkillChanges).length, 0)
    : noCampaignChars.filter(c => c.pendingSkillChanges).length

  return (
    <div>
      {/* Bucket header */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer', marginBottom: open ? 8 : 0 }}
      >
        <span style={{ fontSize: '.65rem', letterSpacing: '.18em', color: color || 'var(--gold)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{title}</span>
        {totalPending > 0 && (
          <span style={{ fontSize: '.62rem', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.4)', color: 'var(--gold)', borderRadius: 3, padding: '1px 6px' }}>
            {totalPending} pending
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '.6rem', color: 'var(--text3)', opacity: .5 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 4 }}>
          {/* Campaign-based bucket */}
          {campaigns && campaigns.map(({ campaign, characters }) => (
            <CampaignSection
              key={campaign.id}
              campaign={campaign}
              characters={characters}
              onUpdate={onUpdate}
              onOpen={onOpen}
              defaultOpen={campaigns.length === 1}
            />
          ))}
          {campaigns && campaigns.length === 0 && (
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '4px 8px' }}>None.</div>
          )}

          {/* No-campaign bucket */}
          {noCampaignChars && (
            noCampaignChars.length === 0 ? (
              <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '4px 8px' }}>None.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...noCampaignChars]
                  .sort((a, b) => (b.pendingSkillChanges ? 1 : 0) - (a.pendingSkillChanges ? 1 : 0))
                  .map(char => (
                    <CharacterCard key={char.name + char._ownerId} char={char} onUpdate={onUpdate} onOpen={onOpen} />
                  ))
                }
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── MAIN GM VIEW ──────────────────────────────────────────────────────────────
export default function GMView({ userId, isSuperuser, onBack, onOpenAsGM }) {
  const [loading, setLoading] = useState(true)

  // Regular GM state
  const [campaigns, setCampaigns] = useState([])
  const [charactersByCampaign, setCharactersByCampaign] = useState({})
  const [activeCampaign, setActiveCampaign] = useState(null)

  // Superuser state
  const [myCampaigns, setMyCampaigns] = useState([])
  const [otherCampaigns, setOtherCampaigns] = useState([])
  const [noCampaignChars, setNoCampaignChars] = useState([])

  const load = async () => {
    setLoading(true)
    if (isSuperuser) {
      const result = await loadAllCampaignCharacters(userId)
      setMyCampaigns(result.myCampaigns || [])
      setOtherCampaigns(result.otherCampaigns || [])
      setNoCampaignChars(result.noCampaignChars || [])
    } else {
      const result = await loadCampaignCharacters(userId)
      setCampaigns(result.campaigns || [])
      setCharactersByCampaign(result.charactersByCampaign || {})
      if (result.campaigns?.length > 0 && !activeCampaign) {
        setActiveCampaign(result.campaigns[0].id)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpdate = async (char) => {
    const ownerId = char._ownerId
    await saveCharacterByOwner(char, ownerId)
    await load()
  }

  // ── Pending counts for header ─────────────────────────────────────────────
  const totalPending = isSuperuser
    ? [
        ...myCampaigns.flatMap(({ characters }) => characters),
        ...otherCampaigns.flatMap(({ characters }) => characters),
        ...noCampaignChars,
      ].filter(c => c.pendingSkillChanges).length
    : (activeCampaign ? (charactersByCampaign[activeCampaign] || []) : []).filter(c => c.pendingSkillChanges).length

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>Loading campaigns...</div>
  )

  // ── SUPERUSER VIEW ────────────────────────────────────────────────────────
  if (isSuperuser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontSize: '1.3rem', marginBottom: 2 }}>GM View</h2>
            <div style={{ fontSize: '.7rem', color: '#c94a4a', fontFamily: 'Georgia, serif', letterSpacing: '.1em', textTransform: 'uppercase' }}>Superuser</div>
            {totalPending > 0 && (
              <div style={{ fontSize: '.78rem', color: '#c9a84c', fontFamily: 'Georgia, serif', marginTop: 2 }}>
                {totalPending} pending approval{totalPending > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button onClick={onBack} style={{ padding: '7px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem' }}>
            ← Back
          </button>
        </div>

        <BucketSection
          title="My Campaigns"
          color="var(--gold)"
          campaigns={myCampaigns}
          onUpdate={handleUpdate}
          onOpen={onOpenAsGM}
          defaultOpen={true}
        />
        <BucketSection
          title="Other Campaigns"
          color="var(--text2)"
          campaigns={otherCampaigns}
          onUpdate={handleUpdate}
          onOpen={onOpenAsGM}
          defaultOpen={false}
        />
        <BucketSection
          title="No Campaign"
          color="#c94a4a"
          noCampaignChars={noCampaignChars}
          onUpdate={handleUpdate}
          onOpen={onOpenAsGM}
          defaultOpen={true}
        />
      </div>
    )
  }

  // ── REGULAR GM VIEW ───────────────────────────────────────────────────────
  const activeChars = activeCampaign ? (charactersByCampaign[activeCampaign] || []) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontSize: '1.3rem', marginBottom: 2 }}>GM View</h2>
          {totalPending > 0 && (
            <div style={{ fontSize: '.78rem', color: '#c9a84c', fontFamily: 'Georgia, serif' }}>
              {totalPending} pending approval{totalPending > 1 ? 's' : ''}
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
          No campaigns found. Create a campaign in Supabase and assign yourself as GM.
        </div>
      ) : activeChars.length === 0 ? (
        <div style={{ ...surface, textAlign: 'center', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
          No characters in this campaign yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...activeChars]
            .sort((a, b) => (b.pendingSkillChanges ? 1 : 0) - (a.pendingSkillChanges ? 1 : 0))
            .map(char => (
              <CharacterCard key={char.name} char={char} onUpdate={handleUpdate} onOpen={onOpenAsGM} />
            ))
          }
        </div>
      )}
    </div>
  )
}

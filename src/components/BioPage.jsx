// BioPage.jsx
// Character biography, image, and level up wizard
import { useState, useMemo } from 'react'
import racesData from '../data/races.json'

// ── RACES LIST ────────────────────────────────────────────────────────────────
const RACE_OPTIONS = Object.entries(racesData).map(([key, r]) => ({ key, name: r.name })).sort((a, b) => a.name.localeCompare(b.name))

// ── STYLES ────────────────────────────────────────────────────────────────────
const surface = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '16px 18px',
}

const lbl = {
  fontSize: '.6rem', letterSpacing: '.16em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif',
  display: 'block', marginBottom: 4,
}

const sectionTitle = {
  fontSize: '.75rem', letterSpacing: '.2em', color: 'var(--gold)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 12,
}

const inputStyle = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 4, color: 'var(--text)', fontFamily: 'Georgia, serif',
  fontSize: '.9rem', padding: '6px 10px', width: '100%', boxSizing: 'border-box',
}

const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6,
}

const selectStyle = {
  ...inputStyle, cursor: 'pointer',
}

const saveBtn = {
  padding: '8px 20px', background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a',
  color: '#4a9e4a', borderRadius: 5, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: '.9rem',
}

const field = (label, children) => (
  <div style={{ marginBottom: 12 }}>
    <span style={lbl}>{label}</span>
    {children}
  </div>
)

// ── LEVEL UP WIZARD ───────────────────────────────────────────────────────────
function LevelUpWizard({ character, stats, onUpdate, onClose }) {
  const currentLevel = character.level || 1
  const currentMaint = stats?.skillPoints?.currentMaintenance ?? 0

  // Calculate default points for next level
  const raceKey = character.race
    ? Object.keys(racesData).find(k => racesData[k].name === character.race) || 'human'
    : 'human'
  const race = racesData[raceKey] || racesData.human
  const basePoints = 65 + (race.skillPointsPerLevelModifier || 0)
  const ironBonus = character.patronMark?.mark === 'Iron' ? 2 : 0

  const [pointsThisLevel, setPointsThisLevel] = useState(basePoints + ironBonus)
  const [confirmed, setConfirmed] = useState(false)

  const currentEarned = character.skillPoints?.totalEarned ?? 0
  const currentMaintenancePaid = character.skillPoints?.maintenancePaid ?? 0

  const newEarned = currentEarned + pointsThisLevel
  const newMaintenancePaid = currentMaintenancePaid + currentMaint
  const newLevel = currentLevel + 1

  const handleConfirm = () => {
    onUpdate({
      ...character,
      level: newLevel,
      skillPoints: {
        ...character.skillPoints,
        totalEarned: newEarned,
        maintenancePaid: newMaintenancePaid,
      }
    })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: 24, maxWidth: 420, width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)',
      }}>
        <h2 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 4, fontSize: '1.3rem' }}>
          Level Up
        </h2>
        <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginBottom: 20 }}>
          Level {currentLevel} → {newLevel}
        </div>

        {/* Points this level */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>Skill Points Gained This Level</span>
          <input
            type="number"
            value={pointsThisLevel}
            onChange={e => setPointsThisLevel(parseInt(e.target.value) || 0)}
            style={{ ...inputStyle, width: 80 }}
          />
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 4 }}>
            Base {basePoints}{ironBonus > 0 ? ` + ${ironBonus} (Iron Mark)` : ''}
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '12px 14px', marginBottom: 20,
        }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text3)', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 10 }}>Summary</div>
          {[
            ['Points Earned', `${currentEarned} → ${newEarned}`],
            ['Maintenance Paid', `${currentMaintenancePaid} → ${newMaintenancePaid} (+${currentMaint})`],
            ['Level', `${currentLevel} → ${newLevel}`],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.82rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>{l}</span>
              <span style={{ fontSize: '.82rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
            Cancel
          </button>
         <button onClick={handleConfirm} disabled={!character.levelUpAuthorized}
            style={{ ...saveBtn, opacity: character.levelUpAuthorized ? 1 : 0.4, cursor: character.levelUpAuthorized ? 'pointer' : 'not-allowed' }}>
            {character.levelUpAuthorized ? 'Confirm Level Up' : 'Awaiting GM Authorization'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN BIO PAGE ─────────────────────────────────────────────────────────────
export default function BioPage({ character, onUpdateCharacter, stats, isGM }) {
 const [gmMode, setGmMode] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [raceLocked, setRaceLocked] = useState(!!(character.race && character.raceLocked))
  const [showMaintBreakdown, setShowMaintBreakdown] = useState(false)
  const bio = character.bio || {}
  const sp = character.skillPoints || {}

  const updateBio = (field, value) => {
    onUpdateCharacter({ ...character, bio: { ...bio, [field]: value } })
  }

  const updateChar = (field, value) => {
    onUpdateCharacter({ ...character, [field]: value })
  }

  // Live maintenance calculation
  const currentMaintenance = useMemo(() => {
    const allSkills = [
      ...Object.values(character.martialSkills || {}),
      ...Object.values(character.arcaneSkills || {}),
      ...Object.values(character.selfImprovementSkills || {}),
    ]
    return allSkills.reduce((sum, s) => sum + (parseInt(s.maintenanceCost) || 0), 0)
  }, [character])

  // Skill points display
  const totalEarned = sp.totalEarned ?? 0
  const bonusGiven = sp.bonusGiven ?? 0
  const maintenancePaid = sp.maintenancePaid ?? 0
  const totalSpent = stats?.skillPoints?.totalSpent ?? 0
  const available = totalEarned + bonusGiven - totalSpent - maintenancePaid

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>

      {/* Level Up Wizard */}
      {showLevelUp && (
        <LevelUpWizard
          character={character}
          stats={{ ...stats, skillPoints: { ...(stats?.skillPoints || {}), currentMaintenance } }}
          onUpdate={onUpdateCharacter}
          onClose={() => setShowLevelUp(false)}
        />
      )}
      {/* Creation banner */}
      {character.status === 'creation' && (
        <div style={{ padding: '14px 18px', background: 'rgba(201,168,76,.08)', border: '1px solid var(--gold)', borderRadius: 8, fontFamily: 'Georgia, serif' }}>
          <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontWeight: 600, marginBottom: 6 }}>Welcome to RavenLore!</div>
          <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.7 }}>
            Gameplay begins at level 3. Fill out your bio here, then go to <strong style={{ color: 'var(--gold)' }}>Skills</strong> to spend your {character.skillPoints?.totalEarned ?? 0} starting points. When you're done, save for GM approval — your GM will then enable your first level up.
          </div>
        </div>
      )}
      {/* Header row: GM mode + Level Up */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {isGM && (
        <button
          onClick={() => setGmMode(!gmMode)}
          style={{
            padding: '7px 14px', background: gmMode ? 'rgba(201,42,42,.2)' : 'none',
            border: `1px solid ${gmMode ? '#c94a4a' : 'var(--border)'}`,
            color: gmMode ? '#c94a4a' : 'var(--text3)',
            borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
          }}
        >{gmMode ? '⚠ GM Mode ON' : 'GM Mode'}</button>
          )}
        <button 
          onClick={() => setShowLevelUp(true)} 
          disabled={!character.levelUpAuthorized && !gmMode}
          style={{ ...saveBtn, opacity: (character.levelUpAuthorized || gmMode) ? 1 : 0.4, cursor: (character.levelUpAuthorized || gmMode) ? 'pointer' : 'not-allowed' }}
        >
          {character.levelUpAuthorized ? 'Level Up →' : gmMode ? 'Level Up (GM) →' : '🔒 Level Up'}
        </button>
      </div>

      {/* Skill Points Summary */}
      <div style={surface}>
        <div style={sectionTitle}>Skill Points</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            ['Available', available, available < 0 ? '#c94a4a' : 'var(--gold2)'],
            ['Earned', totalEarned, 'var(--gold2)'],
            ['Spent', totalSpent, 'var(--text2)'],
            ['Maint. Paid', maintenancePaid, 'var(--text2)'],
          ].map(([l, v, color]) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ ...lbl, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif', color }}>{v}</div>
            </div>
          ))}

          {/* Cur. Maint with breakdown tooltip */}
          <div style={{ textAlign: 'center', minWidth: 70, position: 'relative' }}>
            <div style={{ ...lbl, marginBottom: 2 }}>Cur. Maint.</div>
            <div
              onClick={() => setShowMaintBreakdown(!showMaintBreakdown)}
              style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif', color: currentMaintenance > 0 ? '#c94a4a' : 'var(--text3)', cursor: 'pointer', borderBottom: '1px dotted currentColor' }}
            >
              {currentMaintenance}
            </div>
            {showMaintBreakdown && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: '10px 14px', zIndex: 100, minWidth: 200, marginTop: 6, boxShadow: '0 4px 20px rgba(0,0,0,.5)' }}>
                <div style={{ ...lbl, marginBottom: 8 }}>Breakdown</div>
                {[
                  ...Object.entries(character.martialSkills || {}),
                  ...Object.entries(character.arcaneSkills || {}),
                  ...Object.entries(character.selfImprovementSkills || {}),
                ].filter(([, data]) => {
                  const pts = parseInt(data.pointsInvested) || 0
                  return pts > 0 && Math.floor(parseFloat(data.maintenanceCost) || 0) > 0
                }).map(([name, data]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
                    <span style={{ fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{name}</span>
                    <span style={{ fontSize: '.8rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                      {Math.floor(parseFloat(data.maintenanceCost) || 0)}/lvl
                    </span>
                  </div>
                ))}
                {currentMaintenance === 0 && (
                  <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No maintenance costs</div>
                )}
                <button onClick={() => setShowMaintBreakdown(false)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.75rem', fontFamily: 'Georgia, serif' }}>Close</button>
              </div>
            )}
          </div>

          {gmMode && (
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <span style={lbl}>Bonus Pts</span>
              <input
                type="number"
                value={bonusGiven}
                onChange={e => onUpdateCharacter({ ...character, skillPoints: { ...sp, bonusGiven: parseInt(e.target.value) || 0 } })}
                style={{ ...inputStyle, width: 70, textAlign: 'center', padding: '3px 6px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Character image + core info */}
      <div style={{ ...surface, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Token image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: 8,
            border: '2px solid var(--border2)',
            background: 'var(--bg2)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {character.imageUrl
              ? <img src={character.imageUrl} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', textAlign: 'center', padding: 8 }}>No image</span>
            }
          </div>
          {gmMode && (
            <input
              placeholder="Image URL..."
              value={character.imageUrl || ''}
              onChange={e => updateChar('imageUrl', e.target.value)}
              style={{ ...inputStyle, fontSize: '.72rem', width: 120 }}
            />
          )}
        </div>

        {/* Core fields */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field('Name',
              <input style={inputStyle} value={character.name || ''} onChange={e => updateChar('name', e.target.value)} />
            )}
            {field('Player',
              <input style={inputStyle} value={character.player || ''} onChange={e => updateChar('player', e.target.value)} />
            )}
            {field('Profession',
              <input style={inputStyle} value={character.profession || ''} onChange={e => updateChar('profession', e.target.value)} />
            )}
            {field('Level',
              <div style={{ fontSize: '1.1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, padding: '6px 0' }}>
                {character.level || 1}
                {gmMode && (
                  <button
                    onClick={() => onUpdateCharacter({ ...character, level: Math.max(1, (character.level || 1) - 1) })}
                    style={{ marginLeft: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: '.8rem' }}
                  >−</button>
                )}
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              {field('Race',
  raceLocked && !gmMode
    ? <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, padding: '6px 0' }}>{character.race}</div>
    : <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={character.race || ''} onChange={e => updateChar('race', e.target.value)} style={selectStyle}>
          <option value="">— Choose Race —</option>
          {RACE_OPTIONS.map(r => <option key={r.key} value={r.name}>{r.name}</option>)}
        </select>
        {gmMode && raceLocked && (
          <button
            onClick={() => { if (window.confirm('Unlock race selection for the player?')) { setRaceLocked(false); onUpdateCharacter({ ...character, raceLocked: false }) } }}
            style={{ padding: '5px 10px', background: 'none', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem', whiteSpace: 'nowrap' }}
          >Unlock</button>
        )}
        {!raceLocked && (
          <button
            onClick={() => { if (window.confirm(`Lock race as ${character.race}? This cannot be changed without GM mode.`)) { setRaceLocked(true); onUpdateCharacter({ ...character, raceLocked: true }) } }}
            style={{ padding: '5px 10px', background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem', whiteSpace: 'nowrap' }}
          >Lock</button>
        )}
      </div>
)}
            </div>
          </div>
        </div>
      </div>

      {/* Physical description */}
      <div style={surface}>
        <div style={sectionTitle}>Physical Description</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {field('Age', <input style={inputStyle} value={bio.age || ''} onChange={e => updateBio('age', e.target.value)} />)}
          {field('Height', <input style={inputStyle} value={bio.height || ''} onChange={e => updateBio('height', e.target.value)} />)}
          {field('Weight', <input style={inputStyle} value={bio.weight || ''} onChange={e => updateBio('weight', e.target.value)} />)}
          {field('Build', <input style={inputStyle} value={bio.build || ''} onChange={e => updateBio('build', e.target.value)} />)}
          {field('Hair', <input style={inputStyle} value={bio.hair || ''} onChange={e => updateBio('hair', e.target.value)} />)}
          {field('Eyes', <input style={inputStyle} value={bio.eyes || ''} onChange={e => updateBio('eyes', e.target.value)} />)}
        </div>
        {field('Intelligence / Demeanor',
          <textarea style={textareaStyle} value={bio.intelligence || ''} onChange={e => updateBio('intelligence', e.target.value)} placeholder="Describe the character's intelligence and general demeanor..." />
        )}
      </div>

      {/* Languages */}
      <div style={surface}>
        <div style={sectionTitle}>Languages</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {field('Spoken', <input style={inputStyle} value={bio.languagesSpoken || ''} onChange={e => updateBio('languagesSpoken', e.target.value)} placeholder="Common, Elvish..." />)}
          {field('Read / Written', <input style={inputStyle} value={bio.languagesRead || ''} onChange={e => updateBio('languagesRead', e.target.value)} placeholder="Common, Elvish..." />)}
        </div>
      </div>

      {/* Special */}
      <div style={surface}>
        <div style={sectionTitle}>Special &amp; Powers</div>
        {field('Special Traits',
          <textarea style={textareaStyle} value={bio.special || ''} onChange={e => updateBio('special', e.target.value)} placeholder="Racial abilities, unique traits..." />
        )}
        {field('Powers / Injuries',
          <textarea style={textareaStyle} value={bio.powersInjuries || ''} onChange={e => updateBio('powersInjuries', e.target.value)} placeholder="Current powers, ongoing injuries, conditions..." />
        )}
      </div>

      {/* Background */}
      <div style={surface}>
        <div style={sectionTitle}>Background</div>
        {field('Personal History',
          <textarea style={{ ...textareaStyle, minHeight: 120 }} value={bio.personalHistory || ''} onChange={e => updateBio('personalHistory', e.target.value)} placeholder="Where did this character come from?..." />
        )}
        {field('Goals',
          <textarea style={textareaStyle} value={bio.goals || ''} onChange={e => updateBio('goals', e.target.value)} placeholder="What does this character want?..." />
        )}
        {field('Fears',
          <textarea style={textareaStyle} value={bio.fears || ''} onChange={e => updateBio('fears', e.target.value)} placeholder="What does this character fear?..." />
        )}
      </div>

      {/* Connections */}
      <div style={surface}>
        <div style={sectionTitle}>Connections</div>
        {field('Important People',
          <textarea style={textareaStyle} value={bio.importantPeople || ''} onChange={e => updateBio('importantPeople', e.target.value)} placeholder="Family, friends, mentors..." />
        )}
        {field('Enemies',
          <textarea style={textareaStyle} value={bio.enemies || ''} onChange={e => updateBio('enemies', e.target.value)} placeholder="Who wants this character dead?..." />
        )}
        {field('Contacts',
          <textarea style={textareaStyle} value={bio.contacts || ''} onChange={e => updateBio('contacts', e.target.value)} placeholder="Useful allies, informants, merchants..." />
        )}
      </div>

    </div>
  )
}

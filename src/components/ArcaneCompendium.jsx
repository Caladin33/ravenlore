import { useState, useMemo } from 'react'
import spells from '../data/spells.json'
import magicData from '../data/magic.json'

const COLORS = {
  chaos:     { name: 'Chaos',     also: 'White', dot: '#ffffff' },
  chi:       { name: 'Chi',       also: 'Green', dot: '#4a9e4a' },
  elemental: { name: 'Elemental', also: 'Red',   dot: '#c94a4a' },
  order:     { name: 'Order',     also: 'Black', dot: '#555555' },
  will:      { name: 'Will',      also: 'Blue',  dot: '#4a7ec9' },
}

const SCHOOL_COLORS = Object.fromEntries(
  Object.entries(magicData.schools).map(([k, v]) => [v.name, v.colors])
)

const GUILD_COLORS = Object.fromEntries(
  Object.entries(magicData.guilds).map(([k, v]) => [v.name, v.colors])
)

const ALL_SCHOOLS = [...new Set(spells.map(s => s.school))].sort()

function getSchoolColors(schoolName) {
  return SCHOOL_COLORS[schoolName] || []
}

function isWordOfPower(spell) {
  return spell.description?.includes('Word of Power')
}

function isUnlocked(spell, ranks) {
  if (spell.is_ars_mortis && ranks.elemental > 0) return false
  if (spell.is_guild && spell.guild) {
    const guildKey = Object.keys(magicData.guilds).find(
      k => magicData.guilds[k].name === spell.guild
    )
    if (guildKey) {
      return magicData.guilds[guildKey].colors.every(c => ranks[c] >= spell.level)
    }
    return false
  }
  return getSchoolColors(spell.school).every(c => ranks[c] >= spell.level)
}

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────

function ToggleBtn({ active, onClick, children, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 13px',
        background: active ? (accent ? 'rgba(74,158,74,.15)' : 'rgba(201,168,76,.18)') : '#1f1a12',
        border: `1px solid ${active ? (accent ? '#4a9e4a' : '#c9a84c') : '#3a2e1e'}`,
        color: active ? (accent ? '#4a9e4a' : '#e8c96a') : '#b8a888',
        borderRadius: 4, cursor: 'pointer',
        fontFamily: 'Georgia, serif', fontSize: '.78rem',
        letterSpacing: '.04em', whiteSpace: 'nowrap',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}

function WPBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(74,126,201,.15)',
      border: '1px solid #4a7ec9',
      borderRadius: 3,
      padding: '1px 5px',
      fontSize: '.58rem',
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      letterSpacing: '.08em',
      color: '#4a7ec9',
      marginLeft: 6,
      flexShrink: 0,
      verticalAlign: 'middle',
    }}>WP</span>
  )
}

// ── SPELL HOOKS ───────────────────────────────────────────────────────────────
function SpellHooksSection({ hookCount, hooks, knownSpells, onChange }) {
  if (!hookCount || hookCount === 0) return null

  // Only non-WoP known spells can be hung
  const hangable = knownSpells.filter(s => !isWordOfPower(s))

  const setHook = (i, val) => {
    const next = [...hooks]
    next[i] = val
    onChange(next)
  }

  return (
    <div style={{
      background: '#13100a', border: '1px solid #3a2e1e',
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{
        fontSize: '.58rem', letterSpacing: '.2em', color: '#7a6a50',
        textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Georgia, serif',
      }}>
        Spell Hooks — {hookCount} available
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: hookCount }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 120px', maxWidth: 'calc(25% - 6px)', minWidth: 120 }}>
            <span style={{
              fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em',
              textTransform: 'uppercase', fontFamily: 'Georgia, serif',
            }}>Hook {i + 1}</span>
            <select
              value={hooks[i] || ''}
              onChange={e => setHook(i, e.target.value)}
              style={{
                background: hooks[i] ? 'rgba(201,168,76,.08)' : '#1f1a12',
                border: `1px solid ${hooks[i] ? '#c9a84c' : '#3a2e1e'}`,
                color: hooks[i] ? '#e8c96a' : '#7a6a50',
                borderRadius: 4, padding: '5px 8px',
                fontFamily: 'Georgia, serif', fontSize: '.82rem',
                cursor: 'pointer', width: '100%',
              }}
            >
              <option value="">— Empty —</option>
              {hangable.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ArcaneCompendium({ character, onUpdateCharacter, stats }) {
  // Read mastery ranks from character skills
  const arcane = character?.arcaneSkills || {}
  const getRank = (name) => parseInt(arcane[name]?.rank || 0)

  const ranks = {
    chaos:     getRank('Chaos Mastery'),
    chi:       getRank('Chi Mastery'),
    elemental: getRank('Elemental Mastery'),
    order:     getRank('Order Mastery'),
    will:      getRank('Will Mastery'),
  }

  // Known spells — stored as array of spell objects on character
  const knownSpells = useMemo(() => {
    const knownIds = new Set((character?.knownSpells || []).map(s => s.id))
    return spells.filter(s => knownIds.has(s.id))
  }, [character?.knownSpells])

  const knownIds = useMemo(() => new Set(knownSpells.map(s => s.id)), [knownSpells])

  const toggleKnown = (spell) => {
    const current = character?.knownSpells || []
    let updated
    if (knownIds.has(spell.id)) {
      updated = current.filter(s => s.id !== spell.id)
    } else {
      updated = [...current, { id: spell.id, name: spell.name, level: spell.level, school: spell.school, range: spell.range, duration: spell.duration }]
    }
    onUpdateCharacter({ ...character, knownSpells: updated })
  }

  // Spell hooks
  const hookCount = stats?.spellHooks ?? 0
  const hooks = character?.spellHooks || []
  const setHooks = (val) => onUpdateCharacter({ ...character, spellHooks: val })

  const [filterSchool, setFilterSchool] = useState(null)
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [showKnownOnly, setShowKnownOnly] = useState(false)
  const [previewAll, setPreviewAll] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const checkUnlocked = (spell) => previewAll ? true : isUnlocked(spell, ranks)

  const filtered = useMemo(() => {
    return spells.filter(spell => {
      if (filterSchool && spell.school !== filterSchool) return false
      const unlocked = previewAll ? true : isUnlocked(spell, ranks)
      if (showUnlockedOnly && !unlocked) return false
      if (showKnownOnly && !knownIds.has(spell.id)) return false
      if (search) {
        const q = search.toLowerCase()
        if (!spell.name.toLowerCase().includes(q) &&
            !spell.description.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [ranks, knownIds, filterSchool, showUnlockedOnly, showKnownOnly, previewAll, search])

  const unlockedCount = useMemo(() =>
    spells.filter(s => isUnlocked(s, ranks)).length
  , [ranks])

  const maxSpells = stats?.maxSpellsKnown ?? '?'

  const groupedByLevel = useMemo(() => {
    const groups = {}
    filtered.forEach(spell => {
      if (!groups[spell.level]) groups[spell.level] = []
      groups[spell.level].push(spell)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, spellList]) => ({
        level: Number(level),
        spells: spellList,
        unlockedInGroup: spellList.filter(s => isUnlocked(s, ranks)).length,
      }))
  }, [filtered, ranks])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ color: '#e8c96a', letterSpacing: '.08em', margin: 0, fontSize: '1.5rem' }}>
            Spells
          </h2>
          
        </div>

        {/* Mastery ranks — colored numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.85rem', color: '#7a6a50', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            Masteries:
          </span>
          {Object.entries(COLORS).map(([key, col]) => (
            <span key={key} style={{
              fontSize: '1.5rem', fontWeight: 600,
              color: ranks[key] > 0 ? col.dot : '#3a2e1e',
              fontFamily: 'Georgia, serif',
              textShadow: ranks[key] > 0 ? `0 0 8px ${col.dot}66` : 'none',
              minWidth: 16, textAlign: 'center',
            }}>
              {ranks[key]}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[
            [unlockedCount, 'Unlocked'],
            [`${knownSpells.length} of ${maxSpells}`, 'Known'],
            [spells.length, 'Total'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', color: '#e8c96a', fontWeight: 600, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Spell Hooks */}
      <SpellHooksSection
        hookCount={hookCount}
        hooks={hooks}
        knownSpells={knownSpells}
        onChange={setHooks}
      />

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          placeholder="Search spells..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 14px',
            background: '#1f1a12', border: '1px solid #3a2e1e',
            color: '#e8dcc8', borderRadius: 6,
            fontFamily: 'Georgia, serif', fontSize: '1rem',
          }}
        />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ToggleBtn active={filterSchool === null} onClick={() => setFilterSchool(null)}>
            All Schools
          </ToggleBtn>
          {ALL_SCHOOLS.map(school => (
            <ToggleBtn
              key={school}
              active={filterSchool === school}
              onClick={() => setFilterSchool(filterSchool === school ? null : school)}
            >
              {school}
            </ToggleBtn>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <ToggleBtn
            active={showUnlockedOnly}
            onClick={() => { setShowUnlockedOnly(!showUnlockedOnly); setShowKnownOnly(false); setPreviewAll(false) }}
          >
            🔓 Unlocked Only
          </ToggleBtn>
          <ToggleBtn
            active={showKnownOnly}
            onClick={() => { setShowKnownOnly(!showKnownOnly); setShowUnlockedOnly(false); setPreviewAll(false) }}
          >
            ✦ Known Only
          </ToggleBtn>
          <ToggleBtn
            active={previewAll}
            accent={true}
            onClick={() => { setPreviewAll(!previewAll); setShowUnlockedOnly(false); setShowKnownOnly(false) }}
          >
            {previewAll ? '👁 Preview Mode On' : '👁 Preview All'}
          </ToggleBtn>
          <span style={{ color: '#7a6a50', fontSize: '.78rem', marginLeft: 4 }}>
            {filtered.length} spells
          </span>
        </div>
        {previewAll && (
          <div style={{ fontSize: '.75rem', color: '#4a9e4a', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
            Preview mode — showing all spells as unlocked. Your actual ranks are unchanged.
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* Spell list */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {groupedByLevel.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center', color: '#7a6a50',
              background: '#13100a', border: '1px solid #3a2e1e', borderRadius: 8,
              fontFamily: 'Georgia, serif',
            }}>
              No spells match your filters.
            </div>
          ) : groupedByLevel.map(({ level, spells: levelSpells, unlockedInGroup }) => (
            <div key={level}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 14px', background: '#0d0b07',
                borderTop: '1px solid #3a2e1e', borderBottom: '1px solid #3a2e1e',
                position: 'sticky', top: 0, zIndex: 10,
              }}>
                <span style={{ fontSize: '.63rem', letterSpacing: '.2em', color: '#7a6a50', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
                  Level {level}
                </span>
                <span style={{ fontSize: '.63rem', color: previewAll ? '#4a9e4a' : '#7a6a50', fontFamily: 'Georgia, serif' }}>
                  {previewAll ? `${levelSpells.length}/${levelSpells.length}` : `${unlockedInGroup}/${levelSpells.length}`} unlocked
                </span>
              </div>

              {levelSpells.map(spell => {
                const unlocked = checkUnlocked(spell)
                const actuallyUnlocked = isUnlocked(spell, ranks)
                const isKnown = knownIds.has(spell.id)
                const isSelected = selected?.id === spell.id
                const isWoP = isWordOfPower(spell)

                return (
                  <div
                    key={spell.id}
                    onClick={() => setSelected(isSelected ? null : spell)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid #3a2e1e',
                      background: isSelected ? '#261f15' : (isKnown ? 'rgba(201,168,76,.04)' : 'transparent'),
                      opacity: unlocked ? 1 : 0.38,
                      transition: 'background .12s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isKnown}
                      disabled={!actuallyUnlocked}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleKnown(spell)}
                      style={{ accentColor: '#c9a84c', flexShrink: 0, width: 15, height: 15 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '1rem',
                        color: spell.is_ars_mortis ? '#c94a4a' : (unlocked ? (isKnown ? '#e8c96a' : '#e8dcc8') : '#7a6a50'),
                        fontFamily: 'Georgia, serif',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        display: 'flex', alignItems: 'center', gap: 0,
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {spell.name}
                        </span>
                        {isWoP && <WPBadge />}
                        {spell.is_guild && (
                          <span style={{ marginLeft: 7, fontSize: '.62rem', color: '#c9a84c', flexShrink: 0 }}>
                            [{spell.guild}]
                          </span>
                        )}
                        {spell.is_ars_mortis && (
                          <span style={{ marginLeft: 7, fontSize: '.62rem', color: '#7a6a50', flexShrink: 0 }}>
                            [A.M.]
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '.7rem', color: '#7a6a50', marginTop: 1 }}>
                        {spell.school}{spell.duration && ` · ${spell.duration}`}
                      </div>
                    </div>
                    {isKnown && (
                      <span style={{ fontSize: '.6rem', color: '#c9a84c', letterSpacing: '.1em', flexShrink: 0 }}>
                        KNOWN
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            width: 290, background: '#1f1a12', border: '1px solid #4a3c28',
            borderRadius: 8, padding: 18, flexShrink: 0,
            position: 'sticky', top: 0,
            maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
          }}>
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'none', border: '1px solid #3a2e1e',
                color: '#7a6a50', borderRadius: 4,
                width: 26, height: 26, cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >✕</button>

            <div style={{
              fontSize: '.58rem', color: '#7a6a50', letterSpacing: '.15em',
              textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Georgia, serif',
              paddingRight: 30,
            }}>
              {selected.school} · Level {selected.level}
              {selected.is_guild && ` · ${selected.guild}`}
              {selected.is_ars_mortis && ' · Ars Mortis'}
            </div>

            <div style={{
              fontSize: '1.15rem',
              color: selected.is_ars_mortis ? '#c94a4a' : '#e8c96a',
              marginBottom: 4, fontWeight: 600, fontFamily: 'Georgia, serif',
              display: 'flex', alignItems: 'center', gap: 6, paddingRight: 30,
            }}>
              {selected.name}
              {isWordOfPower(selected) && <WPBadge />}
            </div>

            {isWordOfPower(selected) && (
              <div style={{ fontSize: '.72rem', color: '#4a7ec9', fontStyle: 'italic', marginBottom: 10, fontFamily: 'Georgia, serif' }}>
                1 action to cast, no roll required
              </div>
            )}

            <div style={{
              fontSize: '.85rem', color: '#b8a888', lineHeight: 1.65,
              marginBottom: 14, fontFamily: 'Georgia, serif',
            }}>
              {selected.is_ars_mortis && (
                <div style={{ fontSize: '.72rem', color: '#c94a4a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Georgia, serif', borderLeft: '2px solid #c94a4a', paddingLeft: 8 }}>
                  ⚠ Forbidden School — Ars Mortis
                </div>
              )}
              {selected.description}
            </div>

            <div style={{
              borderTop: '1px solid #3a2e1e', paddingTop: 12,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              marginBottom: 14,
            }}>
              {[['Range', selected.range], ['Duration', selected.duration], ['Area', selected.area]].map(([label, val]) => (
                <div key={label} style={{
                  background: '#13100a', border: '1px solid #3a2e1e',
                  borderRadius: 4, padding: '7px 10px',
                  gridColumn: label === 'Area' ? '1 / -1' : 'auto',
                }}>
                  <div style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 3, fontFamily: 'Georgia, serif' }}>{label}</div>
                  <div style={{ fontSize: '.85rem', color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7, fontFamily: 'Georgia, serif' }}>
                Requires
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(selected.is_guild && selected.guild
                  ? (GUILD_COLORS[selected.guild] || [])
                  : getSchoolColors(selected.school)
                ).map(c => (
                  <div key={c} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#261f15', border: '1px solid #3a2e1e',
                    borderRadius: 4, padding: '4px 9px', fontSize: '.75rem',
                    fontFamily: 'Georgia, serif',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[c]?.dot, flexShrink: 0 }} />
                    <span style={{ color: '#b8a888' }}>{COLORS[c]?.name} {selected.level}+</span>
                    {ranks[c] >= selected.level
                      ? <span style={{ color: '#4a9e4a' }}>✓</span>
                      : <span style={{ color: '#c94a4a' }}>✗</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={!isUnlocked(selected, ranks)}
              onClick={() => toggleKnown(selected)}
              style={{
                width: '100%', padding: '9px 0',
                background: knownIds.has(selected.id) ? '#261f15' : 'rgba(201,168,76,.12)',
                border: `1px solid ${knownIds.has(selected.id) ? '#3a2e1e' : '#c9a84c'}`,
                color: knownIds.has(selected.id) ? '#7a6a50' : '#e8c96a',
                borderRadius: 5, fontSize: '.9rem', letterSpacing: '.04em',
                cursor: isUnlocked(selected, ranks) ? 'pointer' : 'not-allowed',
                opacity: isUnlocked(selected, ranks) ? 1 : 0.4,
                fontFamily: 'Georgia, serif',
              }}
            >
              {knownIds.has(selected.id) ? '− Remove from Known' : '✦ Add to Known'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

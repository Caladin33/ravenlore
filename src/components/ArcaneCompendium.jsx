import { useState, useMemo } from 'react'
import spells from '../data/spells.json'
import magicData from '../data/magic.json'
import ConfirmModal from './ConfirmModal'
import druidFormsData from '../data/druidForms.json'

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

// ── DRUID FORM SPELLS ─────────────────────────────────────────────────────────
const FORM_SPELLS = {
  'Mammalian Form': 'mammal',
  'Avian Form':     'avian',
  'Aquatic Form':   'aquatic',
  'Reptilian Form': 'reptilian',
  'Exotic Form':    'exotic',
}
const CATEGORY_LABELS = {
  mammal: 'Mammal', avian: 'Avian', aquatic: 'Aquatic',
  reptilian: 'Reptilian', exotic: 'Exotic',
}

function getSchoolColors(schoolName) {
  return SCHOOL_COLORS[schoolName] || []
}
function isWordOfPower(spell) {
  return spell.description?.includes('Word of Power')
}
function isUnlocked(spell, ranks) {
  if (spell.is_ars_mortis && ranks.elemental > 0) return false
  if (spell.is_guild && spell.guild) {
    const guildKey = Object.keys(magicData.guilds).find(k => magicData.guilds[k].name === spell.guild)
    if (guildKey) return magicData.guilds[guildKey].colors.every(c => ranks[c] >= spell.level)
    return false
  }
  return getSchoolColors(spell.school).every(c => ranks[c] >= spell.level)
}

// ── DRUID FORM SELECTOR ───────────────────────────────────────────────────────
function DruidFormSelector({ category, character, onSelect, onClose }) {
  const [selected, setSelected] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const forms = druidFormsData.filter(f => f.category === category)
  const alreadyChosen = character.druidForms?.[category]?.form

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#1f1a12', border: '1px solid #4a9e4a', borderRadius: 10, padding: 22, maxWidth: 500, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.8)' }}>
        <h3 style={{ color: '#4a9e4a', fontFamily: 'Georgia, serif', marginBottom: 6, fontSize: '1.1rem' }}>
          🐾 Choose Your {CATEGORY_LABELS[category]} Form
        </h3>
        {alreadyChosen && (
          <div style={{ fontSize: '.8rem', color: '#c94a4a', fontFamily: 'Georgia, serif', marginBottom: 10, fontStyle: 'italic' }}>
            ⚠ You previously chose {alreadyChosen}. This choice is already locked.
          </div>
        )}
        <div style={{ fontSize: '.82rem', color: '#b8a888', fontFamily: 'Georgia, serif', marginBottom: 16, lineHeight: 1.5 }}>
          This choice is permanent and cannot be changed without GM intervention. Choose carefully.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {forms.map(form => (
            <div key={form.name} onClick={() => setSelected(form.name)} style={{
              padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
              border: `2px solid ${selected === form.name ? '#4a9e4a' : '#3a2e1e'}`,
              background: selected === form.name ? 'rgba(74,158,74,.08)' : '#13100a',
              transition: 'all .15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '.95rem', color: selected === form.name ? '#4a9e4a' : '#e8dcc8', fontFamily: 'Georgia, serif', fontWeight: selected === form.name ? 600 : 400 }}>{form.name}</span>
                <span style={{ fontSize: '.72rem', color: '#7a6a50', fontFamily: 'Georgia, serif' }}>{form.movement}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '.72rem', color: '#7a6a50', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
                <span>HP: {form.naturalMaxHP}</span>
                <span>Dmg: {form.damage}</span>
                <span>PR: {form.pr}</span>
                <span>EV: {form.ev}</span>
                <span>Attack: {form.attack}</span>
                {form.naturalArmor > 0 && <span style={{ color: '#4a9e4a' }}>AR: +{form.naturalArmor}</span>}
              </div>
              {form.specialAbilities && (
                <div style={{ fontSize: '.68rem', color: '#7a6a50', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{form.specialAbilities}</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid #3a2e1e', color: '#7a6a50', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Decide Later
          </button>
         <button onClick={() => {
            if (!selected) return
            setConfirmModal({
              message: `Lock ${selected} as your ${CATEGORY_LABELS[category]} form? This cannot be changed without GM mode.`,
              onConfirm: () => { onSelect(selected); setConfirmModal(null) }
            })
          }} disabled={!selected}
            style={{ padding: '8px 20px', background: selected ? 'rgba(74,158,74,.15)' : '#13100a', border: `1px solid ${selected ? '#4a9e4a' : '#3a2e1e'}`, color: selected ? '#4a9e4a' : '#7a6a50', borderRadius: 5, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Confirm Form
          </button>
        </div>
      </div>
      {confirmModal && (
  <ConfirmModal
    message={confirmModal.message}
    onConfirm={confirmModal.onConfirm}
    onCancel={() => setConfirmModal(null)}
  />
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

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
function ToggleBtn({ active, onClick, children, accent }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 13px',
      background: active ? (accent ? 'rgba(74,158,74,.15)' : 'rgba(201,168,76,.18)') : '#1f1a12',
      border: `1px solid ${active ? (accent ? '#4a9e4a' : '#c9a84c') : '#3a2e1e'}`,
      color: active ? (accent ? '#4a9e4a' : '#e8c96a') : '#b8a888',
      borderRadius: 4, cursor: 'pointer',
      fontFamily: 'Georgia, serif', fontSize: '.78rem',
      letterSpacing: '.04em', whiteSpace: 'nowrap', transition: 'all .15s',
    }}>{children}</button>
  )
}

function WPBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(74,126,201,.15)', border: '1px solid #4a7ec9',
      borderRadius: 3, padding: '1px 5px', fontSize: '.58rem',
      fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '.08em',
      color: '#4a7ec9', marginLeft: 6, flexShrink: 0, verticalAlign: 'middle',
    }}>WP</span>
  )
}

// ── SPELL HOOKS ───────────────────────────────────────────────────────────────
function SpellHooksSection({ hookCount, hooks, knownSpells, onChange }) {
  if (!hookCount || hookCount === 0) return null
  const hangable = knownSpells.filter(s => !isWordOfPower(s))
  const setHook = (i, val) => { const next = [...hooks]; next[i] = val; onChange(next) }
  return (
    <div style={{ background: '#13100a', border: '1px solid #3a2e1e', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: '.58rem', letterSpacing: '.2em', color: '#7a6a50', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Georgia, serif' }}>
        Spell Hooks — {hookCount} available
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: hookCount }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 120px', maxWidth: 'calc(25% - 6px)', minWidth: 120 }}>
            <span style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Hook {i + 1}</span>
            <select value={hooks[i] || ''} onChange={e => setHook(i, e.target.value)} style={{
              background: hooks[i] ? 'rgba(201,168,76,.08)' : '#1f1a12',
              border: `1px solid ${hooks[i] ? '#c9a84c' : '#3a2e1e'}`,
              color: hooks[i] ? '#e8c96a' : '#7a6a50',
              borderRadius: 4, padding: '5px 8px',
              fontFamily: 'Georgia, serif', fontSize: '.82rem', cursor: 'pointer', width: '100%',
            }}>
              <option value="">— Empty —</option>
              {hangable.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ArcaneCompendium({ character, onUpdateCharacter, stats }) {
  const arcane = character?.arcaneSkills || {}
  const getRank = (name) => parseInt(arcane[name]?.rank || 0)
  const ranks = {
    chaos:     getRank('Chaos Mastery'),
    chi:       getRank('Chi Mastery'),
    elemental: getRank('Elemental Mastery'),
    order:     getRank('Order Mastery'),
    will:      getRank('Will Mastery'),
  }

  const knownSpells = useMemo(() => {
    const knownIds = new Set((character?.knownSpells || []).map(s => s.id))
    return spells.filter(s => knownIds.has(s.id))
  }, [character?.knownSpells])

  const knownIds = useMemo(() => new Set(knownSpells.map(s => s.id)), [knownSpells])

  // Druid form selection state
  const [pendingFormCategory, setPendingFormCategory] = useState(null)

  const toggleKnown = (spell) => {
    const current = character?.knownSpells || []
    let updated
    if (knownIds.has(spell.id)) {
      updated = current.filter(s => s.id !== spell.id)
      onUpdateCharacter({ ...character, knownSpells: updated })
    } else {
      updated = [...current, { id: spell.id, name: spell.name, level: spell.level, school: spell.school, range: spell.range, duration: spell.duration }]
      const category = FORM_SPELLS[spell.name]
      const alreadyChosen = category && character.druidForms?.[category]?.locked
      onUpdateCharacter({ ...character, knownSpells: updated })
      // Prompt form selection if this is a form spell and no form chosen yet
      if (category && !alreadyChosen) {
        setPendingFormCategory(category)
      }
    }
  }

  const hookCount = stats?.spellHooks ?? 0
  const hooks = character?.spellHooks || []
  const setHooks = (val) => onUpdateCharacter({ ...character, spellHooks: val })

  const [filterSchool, setFilterSchool] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
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
        if (!spell.name.toLowerCase().includes(q) && !spell.description.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [ranks, knownIds, filterSchool, showUnlockedOnly, showKnownOnly, previewAll, search])

  const unlockedCount = useMemo(() => spells.filter(s => isUnlocked(s, ranks)).length, [ranks])
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

      {/* Druid form selector modal */}
      {pendingFormCategory && (
        <DruidFormSelector
          category={pendingFormCategory}
          character={character}
          onSelect={(formName) => {
            onUpdateCharacter({
              ...character,
              druidForms: {
                ...character.druidForms,
                [pendingFormCategory]: { form: formName, locked: true }
              }
            })
            setPendingFormCategory(null)
          }}
          onClose={() => setPendingFormCategory(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ color: '#e8c96a', letterSpacing: '.08em', margin: 0, fontSize: '1.5rem' }}>Spells</h2>
        </div>
        <div data-tour="spells-mastery-ranks" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(COLORS).map(([key, col]) => (
            <div key={key} style={{ textAlign: 'center', background: ranks[key] > 0 ? `${col.dot}14` : '#1a1510', border: `1px solid ${ranks[key] > 0 ? col.dot : '#3a2e1e'}`, borderRadius: 6, padding: '6px 10px', minWidth: 44 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: ranks[key] > 0 ? col.dot : '#3a2e1e', textShadow: ranks[key] > 0 ? `0 0 8px ${col.dot}66` : 'none', lineHeight: 1, marginBottom: 3 }}>{ranks[key]}</div>
              <div style={{ fontSize: '.52rem', color: ranks[key] > 0 ? col.dot : '#3a2e1e', letterSpacing: '.08em', fontFamily: 'Georgia, serif', opacity: ranks[key] > 0 ? .85 : .4 }}>{col.name}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[[unlockedCount, 'Unlocked'], [`${knownSpells.length} of ${maxSpells}`, 'Known'], [spells.length, 'Total']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', color: '#e8c96a', fontWeight: 600, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chosen druid forms display */}
      {character.druidForms && Object.values(character.druidForms).some(f => f?.form) && (
        <div style={{ background: 'rgba(74,158,74,.06)', border: '1px solid rgba(74,158,74,.25)', borderRadius: 7, padding: '10px 14px' }}>
          <div style={{ fontSize: '.6rem', letterSpacing: '.16em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>Chosen Druid Forms</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(character.druidForms).filter(([, v]) => v?.form).map(([cat, v]) => (
              <div key={cat} style={{ background: '#13100a', border: '1px solid rgba(74,158,74,.3)', borderRadius: 5, padding: '5px 10px' }}>
                <div style={{ fontSize: '.55rem', color: '#7a6a50', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{CATEGORY_LABELS[cat]}</div>
                <div style={{ fontSize: '.88rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{v.form}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spell Hooks */}
      <SpellHooksSection hookCount={hookCount} hooks={hooks} knownSpells={knownSpells} onChange={setHooks} />

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Search spells..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 14px', background: '#1f1a12', border: '1px solid #3a2e1e', color: '#e8dcc8', borderRadius: 6, fontFamily: 'Georgia, serif', fontSize: '1rem' }} />
       <div data-tour="spells-school-filters" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <ToggleBtn active={filterSchool === null} onClick={() => setFilterSchool(null)}>All Schools</ToggleBtn>
            {ALL_SCHOOLS.map(school => (
              <ToggleBtn key={school} active={filterSchool === school} onClick={() => setFilterSchool(filterSchool === school ? null : school)}>{school}</ToggleBtn>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleBtn active={showUnlockedOnly} onClick={() => { setShowUnlockedOnly(!showUnlockedOnly); setShowKnownOnly(false); setPreviewAll(false) }}>🔓 Unlocked Only</ToggleBtn>
            <ToggleBtn active={showKnownOnly} onClick={() => { setShowKnownOnly(!showKnownOnly); setShowUnlockedOnly(false); setPreviewAll(false) }}>✦ Known Only</ToggleBtn>
            <ToggleBtn active={previewAll} accent onClick={() => { setPreviewAll(!previewAll); setShowUnlockedOnly(false); setShowKnownOnly(false) }}>{previewAll ? '👁 Preview Mode On' : '👁 Preview All'}</ToggleBtn>
            <span style={{ color: '#7a6a50', fontSize: '.78rem', marginLeft: 4 }}>{filtered.length} spells</span>
          </div>
        </div>
        {previewAll && <div style={{ fontSize: '.75rem', color: '#4a9e4a', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Preview mode — showing all spells as unlocked. Your actual ranks are unchanged.</div>}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Spell list */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {groupedByLevel.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7a6a50', background: '#13100a', border: '1px solid #3a2e1e', borderRadius: 8, fontFamily: 'Georgia, serif' }}>
              No spells match your filters.
            </div>
          ) : groupedByLevel.map(({ level, spells: levelSpells, unlockedInGroup }) => (
            <div key={level}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: '#0d0b07', borderTop: '1px solid #3a2e1e', borderBottom: '1px solid #3a2e1e', position: 'sticky', top: 0, zIndex: 10 }}>
                <span style={{ fontSize: '.63rem', letterSpacing: '.2em', color: '#7a6a50', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Level {level}</span>
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
                const isFormSpell = !!FORM_SPELLS[spell.name]
                return (
                 <div key={spell.id} data-tour={spell.id === levelSpells[0]?.id && level === groupedByLevel[0]?.level ? 'spells-first-spell' : undefined} onClick={() => setSelected(isSelected ? null : spell)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
                    borderBottom: '1px solid #3a2e1e',
                    background: isSelected ? '#261f15' : (isKnown ? 'rgba(201,168,76,.04)' : 'transparent'),
                    opacity: unlocked ? 1 : 0.38, transition: 'background .12s',
                  }}>
                    <input type="checkbox" checked={isKnown} disabled={!actuallyUnlocked && !isKnown}
                      onClick={e => e.stopPropagation()} onChange={() => toggleKnown(spell)}
                      style={{ accentColor: '#c9a84c', flexShrink: 0, width: 15, height: 15 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1rem', color: spell.is_ars_mortis ? '#c94a4a' : (unlocked ? (isKnown ? '#e8c96a' : '#e8dcc8') : '#7a6a50'), fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 0 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spell.name}</span>
                        {isWoP && <WPBadge />}
                        {isFormSpell && <span style={{ marginLeft: 6, fontSize: '.58rem', color: '#4a9e4a', flexShrink: 0 }}>🐾</span>}
                        {spell.is_guild && <span style={{ marginLeft: 7, fontSize: '.62rem', color: '#c9a84c', flexShrink: 0 }}>[{spell.guild}]</span>}
                        {spell.is_ars_mortis && <span style={{ marginLeft: 7, fontSize: '.62rem', color: '#7a6a50', flexShrink: 0 }}>[A.M.]</span>}
                      </div>
                      <div style={{ fontSize: '.7rem', color: '#7a6a50', marginTop: 1 }}>{spell.school}{spell.duration && ` · ${spell.duration}`}</div>
                    </div>
                    {isKnown && <span style={{ fontSize: '.6rem', color: '#c9a84c', letterSpacing: '.1em', flexShrink: 0 }}>KNOWN</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 290, background: '#1f1a12', border: '1px solid #4a3c28', borderRadius: 8, padding: 18, flexShrink: 0, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: '1px solid #3a2e1e', color: '#7a6a50', borderRadius: 4, width: 26, height: 26, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>

            <div style={{ fontSize: '.58rem', color: '#7a6a50', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Georgia, serif', paddingRight: 30 }}>
              {selected.school} · Level {selected.level}
              {selected.is_guild && ` · ${selected.guild}`}
              {selected.is_ars_mortis && ' · Ars Mortis'}
            </div>

            <div style={{ fontSize: '1.15rem', color: selected.is_ars_mortis ? '#c94a4a' : '#e8c96a', marginBottom: 4, fontWeight: 600, fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center', gap: 6, paddingRight: 30 }}>
              {selected.name}
              {isWordOfPower(selected) && <WPBadge />}
            </div>

            {isWordOfPower(selected) && (
              <div style={{ fontSize: '.72rem', color: '#4a7ec9', fontStyle: 'italic', marginBottom: 10, fontFamily: 'Georgia, serif' }}>1 action to cast, no roll required</div>
            )}

            {/* Form spell notice */}
            {FORM_SPELLS[selected.name] && (
              <div style={{ fontSize: '.75rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', marginBottom: 10, padding: '6px 10px', background: 'rgba(74,158,74,.08)', border: '1px solid rgba(74,158,74,.25)', borderRadius: 5 }}>
                🐾 Learning this spell lets you choose your {CATEGORY_LABELS[FORM_SPELLS[selected.name]]} form.
                {character.druidForms?.[FORM_SPELLS[selected.name]]?.form && (
                  <span style={{ color: '#7a6a50' }}> Chosen: {character.druidForms[FORM_SPELLS[selected.name]].form}</span>
                )}
              </div>
            )}

            <div style={{ fontSize: '.85rem', color: '#b8a888', lineHeight: 1.65, marginBottom: 14, fontFamily: 'Georgia, serif' }}>
              {selected.is_ars_mortis && (
                <div style={{ fontSize: '.72rem', color: '#c94a4a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Georgia, serif', borderLeft: '2px solid #c94a4a', paddingLeft: 8 }}>
                  ⚠ Forbidden School — Ars Mortis
                </div>
              )}
              {selected.description}
            </div>

            <div style={{ borderTop: '1px solid #3a2e1e', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[['Range', selected.range], ['Duration', selected.duration], ['Area', selected.area]].map(([label, val]) => (
                <div key={label} style={{ background: '#13100a', border: '1px solid #3a2e1e', borderRadius: 4, padding: '7px 10px', gridColumn: label === 'Area' ? '1 / -1' : 'auto' }}>
                  <div style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 3, fontFamily: 'Georgia, serif' }}>{label}</div>
                  <div style={{ fontSize: '.85rem', color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7, fontFamily: 'Georgia, serif' }}>Requires</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(selected.is_guild && selected.guild
                  ? (GUILD_COLORS[selected.guild] || [])
                  : getSchoolColors(selected.school)
                ).map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#261f15', border: '1px solid #3a2e1e', borderRadius: 4, padding: '4px 9px', fontSize: '.75rem', fontFamily: 'Georgia, serif' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[c]?.dot, flexShrink: 0 }} />
                    <span style={{ color: '#b8a888' }}>{COLORS[c]?.name} {selected.level}+</span>
                    {ranks[c] >= selected.level ? <span style={{ color: '#4a9e4a' }}>✓</span> : <span style={{ color: '#c94a4a' }}>✗</span>}
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={!isUnlocked(selected, ranks) && !knownIds.has(selected.id)}
              onClick={() => toggleKnown(selected)}
              style={{
                width: '100%', padding: '9px 0',
                background: knownIds.has(selected.id) ? '#261f15' : 'rgba(201,168,76,.12)',
                border: `1px solid ${knownIds.has(selected.id) ? '#3a2e1e' : '#c9a84c'}`,
                color: knownIds.has(selected.id) ? '#7a6a50' : '#e8c96a',
                borderRadius: 5, fontSize: '.9rem', letterSpacing: '.04em',
                cursor: isUnlocked(selected, ranks) ? 'pointer' : 'not-allowed',
                opacity: (isUnlocked(selected, ranks) || knownIds.has(selected.id)) ? 1 : 0.4,
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

// ─────────────────────────────────────────────────────────────────────────────
// SheetTopSections.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ── MAGIC COLOR THEMES ────────────────────────────────────────────────────────
const MAGIC_COLORS = {
  order:     { label: 'Order',     dieLabel: 'Black', bg: '#0d0d0d', accent: '#ffffff', text: '#ffffff', border: '#444444' },
  will:      { label: 'Will',      dieLabel: 'Blue',  bg: '#0d1a2e', accent: '#4a90d9', text: '#90c4ff', border: '#2a5a8a' },
  chaos:     { label: 'Chaos',     dieLabel: 'White', bg: '#e8e8e8', accent: '#111111', text: '#111111', border: '#aaaaaa' },
  elemental: { label: 'Elemental', dieLabel: 'Red',   bg: '#1e0a0a', accent: '#c94a4a', text: '#ff9090', border: '#7a2a2a' },
  chi:       { label: 'Chi',       dieLabel: 'Green', bg: '#0a1a0a', accent: '#4a9e4a', text: '#90d490', border: '#2a6a2a' },
}

const COLOR_ORDER = ['order', 'will', 'chaos', 'elemental', 'chi']

// ── SHIELD LOOKUP HELPERS ─────────────────────────────────────────────────────
const SIZE_MAP = { S: 'Small', M: 'Medium', L: 'Large', T: 'Tower' }

const SHIELD_SIZES = [
  { size: 'Small',  evasionBonus: 6  },
  { size: 'Medium', evasionBonus: 8  },
  { size: 'Large',  evasionBonus: 12 },
  { size: 'Tower',  evasionBonus: 16 },
]

const SHIELD_MATERIALS = [
  { material: 'Leather', ar: 0,  hp: 20, minStr: { Small: 6,  Medium: 6,  Large: 9,  Tower: 13 } },
  { material: 'Wood',    ar: 5,  hp: 35, minStr: { Small: 7,  Medium: 10, Large: 13, Tower: 16 } },
  { material: 'Metal',   ar: 12, hp: 40, minStr: { Small: 8,  Medium: 12, Large: 14, Tower: 17 } },
]

function parseShieldType(type) {
  if (!type || type === 'None') return null
  const [sizeCode, material] = type.split('-')
  const size = SIZE_MAP[sizeCode]
  if (!size || !material) return null
  return { size, material }
}

function getShieldStats(type) {
  const parsed = parseShieldType(type)
  if (!parsed) return { evasionBonus: 0, ar: 0, hp: 0, minStr: 0 }
  const sizeData = SHIELD_SIZES.find(s => s.size === parsed.size)
  const matData  = SHIELD_MATERIALS.find(m => m.material === parsed.material)
  return {
    evasionBonus: sizeData?.evasionBonus ?? 0,
    ar:           matData?.ar ?? 0,
    hp:           matData?.hp ?? 0,
    minStr:       matData?.minStr?.[parsed.size] ?? 0,
  }
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const lbl = {
  fontSize: '.55rem',
  letterSpacing: '.16em',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  fontFamily: 'Georgia, serif',
  display: 'block',
  marginBottom: 2,
}

const hdrLbl = { ...lbl, fontSize: '.75rem' }

const cell = {
  padding: '6px 8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
}

const val = {
  fontSize: '1.05rem',
  color: 'var(--gold2)',
  fontFamily: 'Georgia, serif',
  fontWeight: 600,
  lineHeight: 1.1,
}

const dimVal = { ...val, fontSize: '.9rem', color: 'var(--text2)' }

const nudgeBtn = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  color: 'var(--text3)',
  borderRadius: 3,
  width: 18,
  height: 18,
  cursor: 'pointer',
  fontSize: '.75rem',
  lineHeight: 1,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const selectStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border2)',
  color: 'var(--text)',
  borderRadius: 4,
  padding: '3px 4px',
  fontFamily: 'Georgia, serif',
  fontSize: '.72rem',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'center',
}

const rowDivider = { borderBottom: '1px solid var(--border)' }

// ── EDITABLE NUMBER ───────────────────────────────────────────────────────────
function EditableNum({ value, onChange, min = 0, max = 999, capMax = false }) {
  // capMax: when true, + is disabled at max, and value > max shows red
  const atMax = capMax && value >= max
  const overMax = capMax && value > max
  const numColor = overMax ? '#c94a4a' : 'var(--gold2)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={nudgeBtn}>−</button>
      <span style={{ ...val, minWidth: 24, textAlign: 'center', color: numColor }}>{value}</span>
      <button
        onClick={() => { if (!atMax) onChange(value + 1) }}
        style={{ ...nudgeBtn, opacity: atMax ? 0.3 : 1, cursor: atMax ? 'default' : 'pointer' }}
      >+</button>
    </div>
  )
}

// ── ENCUMBRANCE BAR ───────────────────────────────────────────────────────────
function EncumbranceBar({ current, max }) {
  const pct = max > 0 ? Math.min(1, current / max) : 0
  const overHalf = current > max / 2
  const color = pct >= 1 ? '#c94a4a' : overHalf ? '#c9a84c' : '#4a9e4a'
  return (
    <div style={{ width: '100%' }}>
      <span style={{ ...lbl, textAlign: 'center' }}>{current} / {max} lbs</span>
      <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border2)', zIndex: 1 }} />
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 3, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: ATTRIBUTE BLOCK
// ─────────────────────────────────────────────────────────────────────────────

export function AttributeBlock({ stats, character, onUpdateCharacter, offHand, stance, unfettered, onOffHandChange, onStanceChange, onUnfetteredChange }) {
  const attrs = stats.attributes
  const sp = stats.skillPoints

  const currentMana = character.currentMana ?? 0
  const setMana = (v) => onUpdateCharacter({ ...character, currentMana: v })

  const arcane = character.arcaneSkills || {}
  const masteryRank = (name) => parseInt(arcane[name]?.rank || 0)
  const colorData = [
    { key: 'order',     rank: masteryRank('Order Mastery') },
    { key: 'will',      rank: masteryRank('Will Mastery') },
    { key: 'chaos',     rank: masteryRank('Chaos Mastery') },
    { key: 'elemental', rank: masteryRank('Elemental Mastery') },
    { key: 'chi',       rank: masteryRank('Chi Mastery') },
  ]

  const getBase = (attr) => {
    const a = character.attributes?.[attr]
    return typeof a === 'object' ? (a.base ?? 0) : (a ?? 0)
  }

  const COLS = '60px 160px 80px 70px 1fr 1fr 1fr'
  const rowStyle = { display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', ...rowDivider }
  const headerStyle = { ...rowStyle, background: 'var(--bg2)' }

  const attrNameCell = (name) => (
    <div style={{ ...cell, alignItems: 'flex-start' }}>
      <span style={{ ...hdrLbl, color: 'var(--gold)', letterSpacing: '.2em' }}>{name}</span>
    </div>
  )

  const baseCell = (attr) => (
    <div style={cell}><span style={dimVal}>{getBase(attr)}</span></div>
  )

  const effCell = (attrKey) => (
    <div style={cell}><span style={val}>{attrs[attrKey].effective}</span></div>
  )

  const checkCell = (attrKey) => {
    const cm = attrs[attrKey].checkMod
    return <div style={cell}><span style={dimVal}>{cm >= 0 ? '+' : ''}{cm}</span></div>
  }

  const derived = (label, content) => (
    <div style={cell}>
      <span style={lbl}>{label}</span>
      {content}
    </div>
  )

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ ...cell, ...hdrLbl }}>Rolled</div>
        <div style={{ ...cell, ...hdrLbl, alignItems: 'flex-start' }}>Attribute</div>
        <div style={{ ...cell, ...hdrLbl }}>Current</div>
        <div style={{ ...cell, ...hdrLbl }}>Check</div>
        <div style={{ ...cell, ...hdrLbl, gridColumn: 'span 3' }}>Derived</div>
      </div>

      {/* STR */}
      <div style={rowStyle}>
        {baseCell('str')}
        {attrNameCell('Strength')}
        {effCell('str')}
        {checkCell('str')}
        {derived('Dmg Bonus', <span style={val}>{stats.damageBonus >= 0 ? '+' : ''}{stats.damageBonus}</span>)}
        {derived('Unspent SP', <span style={{ ...val, color: sp.unspent < 0 ? '#c94a4a' : 'var(--gold2)' }}>{sp.unspent}</span>)}
        {derived('Move / Action', <span style={val}>{stats.movement} ft</span>)}
      </div>

      {/* DEX */}
      <div style={rowStyle}>
        {baseCell('dex')}
        {attrNameCell('Dexterity')}
        {effCell('dex')}
        {checkCell('dex')}
        {derived('Expertise', <span style={val}>{stats.meleeSlots?.[0]?.expertise ?? '—'}</span>)}
        {derived('Initiative', <span style={val}>+{stats.initiative}</span>)}
        {derived('Precision', <span style={val}>{stats.meleeSlots?.[0]?.precision ?? '—'}</span>)}
      </div>

      {/* CON */}
      <div style={rowStyle}>
        {baseCell('con')}
        {attrNameCell('Constitution')}
        {effCell('con')}
        {checkCell('con')}
        <div style={{ ...cell, gridColumn: 'span 2' }}>
          <EncumbranceBar current={character.carryingWeight ?? 0} max={stats.weightAllowance} />
        </div>
        {derived('Darkvision', <span style={val}>{character.darkvision ?? 'None'}</span>)}
      </div>

      {/* AW */}
      <div style={rowStyle}>
        {baseCell('aw')}
        {attrNameCell('Awareness')}
        {effCell('aw')}
        {checkCell('aw')}
        {derived('Skill Cap', <span style={val}>{stats.skillCap}</span>)}
        {derived('Evasion', <span style={val}>{stats.evasion}</span>)}
        {derived('Rear Evasion', <span style={val}>{stats.rearEvasion}</span>)}
      </div>

      {/* CHR */}
      <div style={rowStyle}>
        {baseCell('chr')}
        {attrNameCell('Charisma')}
        {effCell('chr')}
        {checkCell('chr')}
        <div style={{ ...cell, gridColumn: 'span 2' }}>
          <span style={lbl}>Spells Known</span>
          <span style={val}>
            {character.knownSpells?.length ?? 0}
            <span style={{ color: 'var(--text3)', fontWeight: 400 }}> of {stats.maxSpellsKnown} Max</span>
          </span>
        </div>
        {derived('Spell Hooks', <span style={val}>{stats.spellHooks}</span>)}
      </div>

      {/* WP */}
      <div style={rowStyle}>
        {baseCell('wp')}
        {attrNameCell('Willpower')}
        {effCell('wp')}
        {checkCell('wp')}
        {derived('Arc. Power', <span style={val}>{stats.arcanePower}</span>)}
        {derived('Mana Mean', <span style={val}>{stats.manaMean}</span>)}
        {derived('Current Mana', <EditableNum value={currentMana} onChange={setMana} max={999} />)}
      </div>

      {/* Magic Row 1 — Max Spell Level */}
      <MagicRow label="Max Spell Level" colorData={colorData} renderValue={(key, rank) =>
        rank === 0
          ? <span style={{ color: MAGIC_COLORS[key].border, fontSize: '.8rem' }}>—</span>
          : <span style={{ ...val, color: MAGIC_COLORS[key].accent }}>Lv {rank}</span>
      } />

      {/* Magic Row 2 — Weaving Die */}
      <MagicRow label="Weaving Die" colorData={colorData} renderValue={(key) => {
        const die = stats.weavingDice?.[key] ?? null
        return die
          ? <span style={{ ...val, color: MAGIC_COLORS[key].accent }}>{die}</span>
          : <span style={{ color: MAGIC_COLORS[key].border, fontSize: '.8rem' }}>none</span>
      }} useDieLabel />

      {/* Session row */}
      <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr 1fr 1fr', background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '4px 0' }}>
        <div style={{ ...cell, alignItems: 'flex-start' }}>
          <span style={hdrLbl}>Session State</span>
        </div>
        <div style={cell}>
          <span style={lbl}>Off-hand</span>
          <select
            value={offHand}
            onChange={e => onOffHandChange(e.target.value)}
            style={selectStyle}
          >
            {['Empty', '2-Handed', 'Dual Wield', 'Shield'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={cell}>
          <span style={lbl}>Stance</span>
          <select
            value={stance}
            onChange={e => onStanceChange(e.target.value)}
            style={selectStyle}
          >
            {['None', 'Wind', 'Wave', 'Stone', 'Flame'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {stats.session.canBeUnfettered && (
          <div style={cell}>
            <span style={lbl}>Unfettered</span>
            <button
              onClick={() => onUnfetteredChange(!unfettered)}
              style={{
                padding: '3px 14px',
                background: unfettered ? 'rgba(74,158,74,.15)' : 'var(--surface2)',
                border: `1px solid ${unfettered ? '#4a9e4a' : 'var(--border2)'}`,
                color: unfettered ? '#4a9e4a' : 'var(--text3)',
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: '.8rem',
              }}
            >{unfettered ? 'Yes' : 'No'}</button>
          </div>
        )}
        {!stats.session.canBeUnfettered && (
          <div style={cell}>
            <span style={lbl}>Unfettered</span>
            <span style={{ ...dimVal, fontSize: '.8rem', color: 'var(--text3)' }}>No</span>
          </div>
        )}
      </div>

    </div>
  )
}

function MagicRow({ label, colorData, renderValue, useDieLabel = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '370px repeat(5, 1fr)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ ...cell, background: 'var(--bg2)', alignItems: 'flex-start' }}>
        <span style={hdrLbl}>{label}</span>
      </div>
      {COLOR_ORDER.map(key => {
        const theme = MAGIC_COLORS[key]
        const rank = colorData.find(c => c.key === key)?.rank ?? 0
        const rowLabel = useDieLabel ? theme.dieLabel : theme.label
        return (
          <div key={key} style={{
            background: theme.bg,
            borderLeft: `2px solid ${theme.border}`,
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <span style={{ ...lbl, color: theme.text, letterSpacing: '.14em' }}>{rowLabel}</span>
            {renderValue(key, rank)}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: ARMOR / HP TABLE
// ─────────────────────────────────────────────────────────────────────────────

const ARMOR_LOCATIONS = ['head', 'rArm', 'lArm', 'torso', 'lLeg', 'rLeg']
const LOC_LABELS = { head: 'Head', rArm: 'R. Arm', lArm: 'L. Arm', torso: 'Torso', lLeg: 'L. Leg', rLeg: 'R. Leg' }

const ARMOR_TYPES = [
  'None','Cloth Poor','Cloth Good',
  'Leather Poor','Leather Good','Leather Great',
  'Studded Fair','Studded Great',
  'Scale Poor','Scale Fair','Scale Great','Elderling Scale',
  'Elven Chain','Chain Fair','Chain Great','Dwarven Chain',
  'Field Plate Poor','Field Plate Fair','Field Plate Great',
  'Full Plate Poor','Full Plate Fair','Full Plate Great',
]

const HELM_TYPES = [
  'None','Small Leather','Small Wood','Small Metal',
  'Medium Leather','Medium Wood','Medium Metal',
  'Large Leather','Large Metal','Visored Metal','Mining Hood',
  'Small Garlock','Medium Garlock','Large Garlock',
]

const SHIELD_TYPES = [
  'None','S-Leather','S-Wood','S-Metal',
  'M-Leather','M-Wood','M-Metal',
  'L-Leather','L-Wood','L-Metal',
  'T-Leather','T-Wood','T-Metal',
]

export function ArmorHPTable({ stats, character, onUpdateCharacter }) {
  const armor = character.armor || {}
  const hp = character.hp || {}
  const currentHP = hp.current || {}
  const maxHP = stats.hp

  const shieldType = armor.shield?.type || 'None'
  const shieldStats = getShieldStats(shieldType)

  const updateArmor = (loc, field, value) => {
    onUpdateCharacter({
      ...character,
      armor: { ...armor, [loc]: { ...(armor[loc] || {}), [field]: value } }
    })
  }

  const updateHP = (loc, value) => {
    onUpdateCharacter({ ...character, hp: { ...hp, current: { ...currentHP, [loc]: value } } })
  }

  const updateGlobal = (field, value) => {
    onUpdateCharacter({ ...character, [field]: value })
  }

  const getMaxHP = (loc) => {
    if (loc === 'head')  return maxHP.head
    if (loc === 'torso') return maxHP.torso
    if (loc === 'lArm' || loc === 'rArm') return maxHP.arm
    if (loc === 'lLeg' || loc === 'rLeg') return maxHP.leg
    return 0
  }

  const getAR = (loc) => armor[loc]?.ar ?? 0
  const getEvPenalty = (loc) => armor[loc]?.evasionPenalty ?? 0

  const COLS = '110px repeat(6, 1fr) 90px 110px'

  const rowLabel = (content) => (
    <div style={{ ...cell, background: 'var(--bg2)' }}>
      <span style={lbl}>{content}</span>
    </div>
  )

  const shieldCol = (content) => (
    <div style={{ ...cell, borderLeft: '1px solid var(--border2)' }}>{content}</div>
  )

  const globalCol = (content) => (
    <div style={{ ...cell, borderLeft: '1px solid var(--border2)', background: 'rgba(255,255,255,.02)' }}>{content}</div>
  )

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', overflowX: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, borderBottom: '1px solid var(--border2)' }}>
        <div style={{ ...cell, background: 'var(--bg2)' }} />
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ ...cell, background: 'var(--bg2)' }}>
            <span style={{ ...lbl, color: 'var(--gold)', letterSpacing: '.18em' }}>{LOC_LABELS[loc]}</span>
          </div>
        ))}
        <div style={{ ...cell, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)' }}>
          <span style={{ ...lbl, color: 'var(--gold)', letterSpacing: '.18em' }}>Shield</span>
        </div>
        <div style={{ ...cell, background: 'var(--bg2)', borderLeft: '1px solid var(--border2)' }}>
          <span style={{ ...lbl, color: 'var(--gold)', letterSpacing: '.18em' }}>Global</span>
        </div>
      </div>

      {/* Evasion Penalty */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Ev. Penalty')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={cell}><span style={dimVal}>{getEvPenalty(loc)}</span></div>
        ))}
        {shieldCol(<div><span style={lbl}>Ev. Bonus</span><span style={val}>{shieldStats.evasionBonus}</span></div>)}
        {globalCol(null)}
      </div>

      {/* Max HP */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Max HP')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={cell}><span style={val}>{getMaxHP(loc)}</span></div>
        ))}
        {shieldCol(<span style={val}>{shieldStats.hp}</span>)}
        {globalCol(<div><span style={lbl}>Barrier HP</span><EditableNum value={hp.barrierHP ?? 0} onChange={v => onUpdateCharacter({ ...character, hp: { ...hp, barrierHP: v } })} /></div>)}
      </div>

      {/* Current HP */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Current HP')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={cell}>
            <EditableNum value={currentHP[loc] ?? getMaxHP(loc)} onChange={v => updateHP(loc, v)} max={getMaxHP(loc)} capMax />
          </div>
        ))}
        {shieldCol(<EditableNum value={hp.shieldCurrent ?? shieldStats.hp} onChange={v => onUpdateCharacter({ ...character, hp: { ...hp, shieldCurrent: v } })} max={shieldStats.hp} capMax />)}
        {globalCol(<div><span style={lbl}>Temp HP</span><EditableNum value={hp.tempHP ?? 0} onChange={v => onUpdateCharacter({ ...character, hp: { ...hp, tempHP: v } })} /></div>)}
      </div>

      {/* Armor Rating */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Armor Rating')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={cell}><span style={val}>{getAR(loc)}</span></div>
        ))}
        {shieldCol(<span style={val}>{shieldStats.ar}</span>)}
        {globalCol(<div><span style={lbl}>Global AR +</span><EditableNum value={character.globalARBonus ?? 0} onChange={v => updateGlobal('globalARBonus', v)} /></div>)}
      </div>

      {/* Breaches — Shield shows Min STR */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Breaches')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={cell}>
            <EditableNum value={armor[loc]?.breaches ?? 0} onChange={v => updateArmor(loc, 'breaches', v)} />
          </div>
        ))}
        {shieldCol(<div><span style={lbl}>Min STR</span><span style={val}>{shieldStats.minStr}</span></div>)}
        {globalCol(<div><span style={lbl}>Natural AR</span><EditableNum value={character.naturalAR ?? 0} onChange={v => updateGlobal('naturalAR', v)} /></div>)}
      </div>

      {/* Armor Type dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS }}>
        {rowLabel('Armor Type')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={cell}>
            <select value={armor[loc]?.type || 'None'} onChange={e => updateArmor(loc, 'type', e.target.value)} style={selectStyle}>
              {(loc === 'head' ? HELM_TYPES : ARMOR_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
        <div style={{ ...cell, borderLeft: '1px solid var(--border2)' }}>
          <select value={shieldType} onChange={e => updateArmor('shield', 'type', e.target.value)} style={selectStyle}>
            {SHIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ ...cell, borderLeft: '1px solid var(--border2)', background: 'rgba(255,255,255,.02)' }} />
      </div>

    </div>
  )
}

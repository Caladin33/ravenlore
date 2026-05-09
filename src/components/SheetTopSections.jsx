// SheetTopSections.jsx
import { useState } from 'react'
import attributeData from '../data/attributes.json'

// ── MAGIC COLOR THEMES ────────────────────────────────────────────────────────
const MAGIC_COLORS = {
  order:     { label: 'Order',     dieLabel: 'Black', bg: '#0d0d0d', accent: '#ffffff', text: '#ffffff', border: '#444444' },
  will:      { label: 'Will',      dieLabel: 'Blue',  bg: '#0d1a2e', accent: '#4a90d9', text: '#90c4ff', border: '#2a5a8a' },
  chaos:     { label: 'Chaos',     dieLabel: 'White', bg: '#e8e8e8', accent: '#111111', text: '#111111', border: '#aaaaaa' },
  elemental: { label: 'Elemental', dieLabel: 'Red',   bg: '#1e0a0a', accent: '#c94a4a', text: '#ff9090', border: '#7a2a2a' },
  chi:       { label: 'Chi',       dieLabel: 'Green', bg: '#0a1a0a', accent: '#4a9e4a', text: '#90d490', border: '#2a6a2a' },
}
const COLOR_ORDER = ['order', 'will', 'chaos', 'elemental', 'chi']

// ── ATTRIBUTE TABLE LOOKUPS ───────────────────────────────────────────────────
function lookupAttr(table, val, field) {
  const row = attributeData[table]?.[String(Math.max(1, Math.min(20, val)))]
  return row?.[field] ?? 0
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const lbl = {
  fontSize: '.55rem', letterSpacing: '.16em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif', display: 'block', marginBottom: 2,
}

const val = {
  fontSize: '1.05rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif',
  fontWeight: 600, lineHeight: 1.1,
}

const dimVal = { ...val, fontSize: '.9rem', color: 'var(--text2)' }

const hdrLbl = { ...lbl, fontSize: '.75rem' }

const selectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  color: 'var(--text)', borderRadius: 4, padding: '3px 6px',
  fontFamily: 'Georgia, serif', fontSize: '.82rem', cursor: 'pointer',
}

const rowDivider = { borderBottom: '1px solid var(--border)' }

// ── COMPLIANCE CHECK ──────────────────────────────────────────────────────────
function getComplianceIssues(stats, character) {
  const issues = []
 // Calculate spent points live, same as Skills page
const liveSpent = [
  ...Object.values(character.martialSkills || {}),
  ...Object.values(character.arcaneSkills || {}),
  ...Object.values(character.selfImprovementSkills || {}),
  ...Object.values(character.generalSkills || {}),
].reduce((sum, s) => sum + (parseInt(s.pointsInvested) || 0), 0)
const liveUnspent = (stats.skillPoints.totalEarned ?? 0) - liveSpent
if (liveUnspent < 0) issues.push(`Over budget by ${Math.abs(liveUnspent)} skill pts`)
  const knownCount = character.knownSpells?.length ?? 0
  if (knownCount > stats.maxSpellsKnown) issues.push(`${knownCount - stats.maxSpellsKnown} spell(s) over max known`)

  // Unfettered check
  const hasUnfetteredSkills = Object.entries(character.martialSkills || {}).some(([name, data]) => {
    const isUnfetteredSkill = name.toLowerCase().includes('unfetter')
    return isUnfetteredSkill && (parseInt(data.rank) || 0) > 0
  })
  if (hasUnfetteredSkills) {
    const carriedWeight = character.carryingWeight ?? 0
    const halfMax = (stats.weightAllowance ?? 0) / 2
    const shieldEquipped = character.armor?.shield?.type && character.armor.shield.type !== 'None'
    const plateCount = ['rArm', 'lArm', 'torso', 'lLeg', 'rLeg'].filter(loc => {
      const t = character.armor?.[loc]?.type || ''
      return t.toLowerCase().includes('plate')
    }).length

    if (carriedWeight > halfMax) issues.push('Not Unfettered: over half carry weight')
    else if (shieldEquipped) issues.push('Not Unfettered: shield equipped')
    else if (plateCount > 1) issues.push('Not Unfettered: too much plate armor')
  }

  return issues
}

// ── EDITABLE MANA ─────────────────────────────────────────────────────────────
function EditableMana({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (editing) {
    return (
      <input
        autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { const n = parseInt(draft); if (!isNaN(n)) onChange(n); setEditing(false) }
          if (e.key === 'Escape') setEditing(false)
        }}
        onBlur={() => { const n = parseInt(draft); if (!isNaN(n)) onChange(n); setEditing(false) }}
        onFocus={e => e.target.select()}
        style={{ width: 48, textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--gold)', color: 'var(--text)', borderRadius: 3, padding: '2px 4px', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700 }}
      />
    )
  }
  return (
    <span onClick={() => { setDraft(String(value)); setEditing(true) }} style={{ ...val, cursor: 'pointer', borderBottom: '1px dotted var(--gold)' }}>
      {value}
    </span>
  )
}

// ── ATTRIBUTE ROW ─────────────────────────────────────────────────────────────
function AttrRow({ abbr, fullName, current, checkMod, derivedLabel, derivedValue, detailContent, T }) {
  const [expanded, setExpanded] = useState(false)
  const checkColor = checkMod >= 0 ? 'var(--text2)' : '#c94a4a'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, ...rowDivider, minHeight: 44 }}>
        {/* Attr name + current + check — all in one cell, clickable to expand */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', minWidth: 0, flex: '0 0 auto' }}
        >
          <span style={{ fontSize: '.85rem', color: 'var(--gold)', fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '.06em', minWidth: 28 }}>{abbr}</span>
          <span style={{ ...val, fontSize: '1.1rem' }}>{current}</span>
          <span style={{ fontSize: '.82rem', color: checkColor, fontFamily: 'Georgia, serif' }}>
            {checkMod >= 0 ? '+' : ''}{checkMod}
          </span>
          <span style={{ fontSize: '.55rem', color: 'var(--text3)', opacity: .5 }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {/* Derived stat — takes remaining space */}
        <div style={{ flex: 1, padding: '8px 12px 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {derivedValue !== null && derivedValue !== undefined && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '.6rem', color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginRight: 6 }}>{derivedLabel}</span>
              <span style={val}>{derivedValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && detailContent && (
        <div style={{ padding: '10px 14px 12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {detailContent}
        </div>
      )}
    </>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ ...lbl, marginBottom: 2 }}>{label}</div>
      <div style={{ ...val, fontSize: '.95rem' }}>{value}</div>
    </div>
  )
}

// ── MAGIC ROWS ────────────────────────────────────────────────────────────────
function MagicRows({ ranks, weavingDice }) {
  return (
    <>
      {/* Row 1: Mastery Ranks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexWrap: 'wrap', ...rowDivider, background: 'var(--bg2)' }}>
        <span style={{ ...lbl, marginBottom: 0, marginRight: 4, whiteSpace: 'nowrap' }}>Masteries:</span>
        {COLOR_ORDER.map(key => {
          const theme = MAGIC_COLORS[key]
          const rank = ranks[key] ?? 0
          return (
            <span key={key} style={{
              fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Georgia, serif',
              color: rank > 0 ? theme.accent : '#3a2e1e',
              textShadow: rank > 0 ? `0 0 8px ${theme.accent}55` : 'none',
              minWidth: 18, textAlign: 'center',
              // special bg for chaos (white text on white needs bg)
              background: key === 'chaos' && rank > 0 ? '#555' : 'transparent',
              borderRadius: 3, padding: key === 'chaos' ? '0 3px' : '0',
            }}>
              {rank}
            </span>
          )
        })}
      </div>

      {/* Row 2: Weaving Dice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', flexWrap: 'wrap', ...rowDivider }}>
        {COLOR_ORDER.map(key => {
          const theme = MAGIC_COLORS[key]
          const die = weavingDice?.[key] ?? null
          return (
            <div key={key} style={{
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 4, padding: '2px 8px',
              fontSize: '.8rem', fontFamily: 'Georgia, serif',
              color: die ? theme.accent : theme.border,
              fontWeight: die ? 600 : 400,
            }}>
              {die ?? '—'}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── SESSION / VISION / MOVE ROW ───────────────────────────────────────────────
function SessionRow({ stats, character, onUpdateCharacter, offHand, stance, onOffHandChange, onStanceChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '8px 12px', background: 'var(--bg2)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={lbl}>Off-hand</span>
        <select value={offHand} onChange={e => onOffHandChange(e.target.value)} style={selectStyle}>
          {['Empty', '2-Handed', 'Dual Wield', 'Shield'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={lbl}>Stance</span>
        <select value={stance} onChange={e => onStanceChange(e.target.value)} style={selectStyle}>
          {['None', 'Wind', 'Wave', 'Stone', 'Flame'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={lbl}>Vision</span>
        <span style={dimVal}>{character.darkvision ?? 'Normal'}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={lbl}>Move</span>
        <span style={dimVal}>{stats.movement} ft</span>
      </div>
    </div>
  )
}

// ── MAIN ATTRIBUTE BLOCK ──────────────────────────────────────────────────────
export function AttributeBlock({ stats, character, onUpdateCharacter, offHand, stance, onOffHandChange, onStanceChange, onUnfetteredChange }) {
  const attrs = stats.attributes
  const sp = stats.skillPoints
  const arcane = character?.arcaneSkills || {}
  const si = character?.selfImprovementSkills || {}
  const ms = character?.martialSkills || {}

  const getMasteryRank = (name) => parseInt(arcane[name]?.rank || 0)
  const ranks = {
    order:     getMasteryRank('Order Mastery'),
    will:      getMasteryRank('Will Mastery'),
    chaos:     getMasteryRank('Chaos Mastery'),
    elemental: getMasteryRank('Elemental Mastery'),
    chi:       getMasteryRank('Chi Mastery'),
  }

  const getBase = (attr) => {
    const a = character.attributes?.[attr]
    return typeof a === 'object' ? (a.base ?? 0) : (a ?? 0)
  }

  const currentMana = character.currentMana ?? 0
  const setMana = (v) => onUpdateCharacter({ ...character, currentMana: v })

  const carriedLbs = Math.floor(character.carryingWeight ?? 0)
  const maxWeight = stats.weightAllowance ?? 0

  // Evasion display: front(rear)
  const evasionDisplay = `${stats.evasion}(${stats.rearEvasion})`

  // DEX table lookups
  const dexVal = attrs.dex.effective
  const dexExpertise = lookupAttr('dexterity', dexVal, 'expertise')
  const dexPrecision = lookupAttr('dexterity', dexVal, 'precision')

  // AW table lookups
  const awVal = attrs.aw.effective
  const awEvasionBonus = lookupAttr('awareness', awVal, 'evasionBonus')

  // Compliance
  const issues = getComplianceIssues(stats, character)
  const inCompliance = issues.length === 0

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>

      {/* STR */}
      <AttrRow
        abbr="STR" fullName="Strength"
        current={attrs.str.effective} checkMod={attrs.str.checkMod}
        derivedLabel="Dmg Bonus" derivedValue={stats.damageBonus >= 0 ? `+${stats.damageBonus}` : stats.damageBonus}
        detailContent={<DetailItem label="Rolled STR" value={getBase('str')} />}
      />

      {/* DEX */}
      <AttrRow
        abbr="DEX" fullName="Dexterity"
        current={attrs.dex.effective} checkMod={attrs.dex.checkMod}
        derivedLabel="Initiative" derivedValue={`+${stats.initiative}`}
        detailContent={<>
          <DetailItem label="Rolled DEX" value={getBase('dex')} />
          <DetailItem label="Exp. Bonus" value={dexExpertise >= 0 ? `+${dexExpertise}` : dexExpertise} />
          <DetailItem label="PR Bonus" value={dexPrecision >= 0 ? `+${dexPrecision}` : dexPrecision} />
        </>}
      />

      {/* CON */}
      <AttrRow
        abbr="CON" fullName="Constitution"
        current={attrs.con.effective} checkMod={attrs.con.checkMod}
        derivedLabel={null} derivedValue={
          <span style={{ fontSize: '.85rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>
            Carrying {carriedLbs} of {maxWeight} lbs
          </span>
        }
        detailContent={<DetailItem label="Rolled CON" value={getBase('con')} />}
      />

      {/* AW */}
      <AttrRow
        abbr="AW" fullName="Awareness"
        current={attrs.aw.effective} checkMod={attrs.aw.checkMod}
        derivedLabel="Evasion" derivedValue={evasionDisplay}
        detailContent={<>
          <DetailItem label="Rolled AW" value={getBase('aw')} />
          <DetailItem label="Skill Cap" value={stats.skillCap} />
          <DetailItem label="Ev. Bonus (AW)" value={awEvasionBonus >= 0 ? `+${awEvasionBonus}` : awEvasionBonus} />
        </>}
      />

      {/* CHR */}
      <AttrRow
        abbr="CHR" fullName="Charisma"
        current={attrs.chr.effective} checkMod={attrs.chr.checkMod}
        derivedLabel={null} derivedValue={
          inCompliance
            ? <span style={{ fontSize: '.78rem', color: '#4a9e4a', fontFamily: 'Georgia, serif' }}>✓ All Good</span>
            : <span style={{ fontSize: '.72rem', color: '#c94a4a', fontFamily: 'Georgia, serif' }}>⚠ {issues[0]}{issues.length > 1 ? ` +${issues.length - 1}` : ''}</span>
        }
        detailContent={<>
          <DetailItem label="Rolled CHR" value={getBase('chr')} />
          {!inCompliance && (
            <div>
              <div style={{ ...lbl, marginBottom: 4 }}>Issues</div>
              {issues.map((issue, i) => (
                <div key={i} style={{ fontSize: '.8rem', color: '#c94a4a', fontFamily: 'Georgia, serif', marginBottom: 2 }}>⚠ {issue}</div>
              ))}
            </div>
          )}
        </>}
      />

      {/* WP */}
      <AttrRow
        abbr="WP" fullName="Willpower"
        current={attrs.wp.effective} checkMod={attrs.wp.checkMod}
        derivedLabel="Mana" derivedValue={<EditableMana value={currentMana} onChange={setMana} />}
        detailContent={<>
          <DetailItem label="Rolled WP" value={getBase('wp')} />
          <DetailItem label="Arc. Power" value={stats.arcanePower} />
          <DetailItem label="Mana Mean" value={stats.manaMean} />
        </>}
      />

      {/* Magic Row 1: Mastery Ranks + Weaving Dice */}
      <MagicRows ranks={ranks} weavingDice={stats.weavingDice} />

      {/* Session / Vision / Move */}
      <SessionRow
        stats={stats}
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        offHand={offHand}
        stance={stance}
        onOffHandChange={onOffHandChange}
        onStanceChange={onStanceChange}
      />

    </div>
  )
}

// ── SHIELD LOOKUP ─────────────────────────────────────────────────────────────
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

// ── ARMOR / HP TABLE ─────────────────────────────────────────────────────────
const ARMOR_LOCATIONS = ['head', 'rArm', 'lArm', 'torso', 'lLeg', 'rLeg']
const LOC_LABELS = { head: 'Head', rArm: 'R.Arm', lArm: 'L.Arm', torso: 'Torso', lLeg: 'L.Leg', rLeg: 'R.Leg' }

const ARMOR_TYPES = [
  'None','Cloth Poor','Cloth Good','Leather Poor','Leather Good','Leather Great',
  'Studded Fair','Studded Great','Scale Poor','Scale Fair','Scale Great','Elderling Scale',
  'Elven Chain','Chain Fair','Chain Great','Dwarven Chain',
  'Field Plate Poor','Field Plate Fair','Field Plate Great',
  'Full Plate Poor','Full Plate Fair','Full Plate Great',
]
const HELM_TYPES = [
  'None','Small Leather','Small Wood','Small Metal','Medium Leather','Medium Wood','Medium Metal',
  'Large Leather','Large Metal','Visored Metal','Mining Hood','Small Garlock','Medium Garlock','Large Garlock',
]
const SHIELD_TYPES = [
  'None','S-Leather','S-Wood','S-Metal','M-Leather','M-Wood','M-Metal',
  'L-Leather','L-Wood','L-Metal','T-Leather','T-Wood','T-Metal',
]

const nudgeBtn = {
  background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text3)',
  borderRadius: 3, width: 18, height: 18, cursor: 'pointer', fontSize: '.75rem',
  lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function EditableNum({ value, onChange, min = 0, max = 999, capMax = false }) {
  const atMax = capMax && value >= max
  const overMax = capMax && value > max
  const numColor = overMax ? '#c94a4a' : 'var(--gold2)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={nudgeBtn}>−</button>
      <span style={{ ...val, minWidth: 24, textAlign: 'center', color: numColor, fontSize: '.95rem' }}>{value}</span>
      <button onClick={() => { if (!atMax) onChange(value + 1) }} style={{ ...nudgeBtn, opacity: atMax ? 0.3 : 1, cursor: atMax ? 'default' : 'pointer' }}>+</button>
    </div>
  )
}

const armorSelectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)',
  borderRadius: 4, padding: '3px 4px', fontFamily: 'Georgia, serif', fontSize: '.72rem',
  cursor: 'pointer', width: '100%', textAlign: 'center',
}

export function ArmorHPTable({ stats, character, onUpdateCharacter }) {
  const armor = character.armor || {}
  const hp = character.hp || {}
  const currentHP = hp.current || {}
  const maxHP = stats.hp

  const shieldType = armor.shield?.type || 'None'
  const shieldStats = getShieldStats(shieldType)

  const updateArmor = (loc, field, value) => {
    onUpdateCharacter({ ...character, armor: { ...armor, [loc]: { ...(armor[loc] || {}), [field]: value } } })
  }
  const updateHP = (loc, value) => {
    onUpdateCharacter({ ...character, hp: { ...hp, current: { ...currentHP, [loc]: value } } })
  }
  const updateGlobal = (field, value) => onUpdateCharacter({ ...character, [field]: value })

  const getMaxHP = (loc) => {
    if (loc === 'head') return maxHP.head
    if (loc === 'torso') return maxHP.torso
    if (loc === 'lArm' || loc === 'rArm') return maxHP.arm
    if (loc === 'lLeg' || loc === 'rLeg') return maxHP.leg
    return 0
  }

  const COLS = '90px repeat(6, 1fr) 80px 100px'

  const rowLabel = (content) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', background: 'var(--bg2)' }}>
      <span style={lbl}>{content}</span>
    </div>
  )

  const shieldCol = (content) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', borderLeft: '1px solid var(--border2)' }}>{content}</div>
  )

  const globalCol = (content) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', borderLeft: '1px solid var(--border2)', background: 'rgba(255,255,255,.02)', gap: 2 }}>{content}</div>
  )

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', overflowX: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, borderBottom: '1px solid var(--border2)' }}>
        <div style={{ background: 'var(--bg2)', padding: '6px 8px' }} />
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ background: 'var(--bg2)', padding: '6px 4px', textAlign: 'center' }}>
            <span style={{ ...lbl, color: 'var(--gold)', letterSpacing: '.12em' }}>{LOC_LABELS[loc]}</span>
          </div>
        ))}
        <div style={{ background: 'var(--bg2)', padding: '6px 4px', textAlign: 'center', borderLeft: '1px solid var(--border2)' }}>
          <span style={{ ...lbl, color: 'var(--gold)' }}>Shield</span>
        </div>
        <div style={{ background: 'var(--bg2)', padding: '6px 4px', textAlign: 'center', borderLeft: '1px solid var(--border2)' }}>
          <span style={{ ...lbl, color: 'var(--gold)' }}>Global</span>
        </div>
      </div>

      {/* Ev. Penalty */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Ev. Pen.')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <span style={dimVal}>{armor[loc]?.evasionPenalty ?? 0}</span>
          </div>
        ))}
        {shieldCol(<div style={{ textAlign: 'center' }}><span style={lbl}>Ev. Bonus</span><span style={dimVal}>{shieldStats.evasionBonus}</span></div>)}
        {globalCol(null)}
      </div>

      {/* Max HP */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Max HP')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <span style={val}>{getMaxHP(loc)}</span>
          </div>
        ))}
        {shieldCol(<span style={val}>{shieldStats.hp}</span>)}
        {globalCol(<><span style={lbl}>Barrier HP</span><EditableNum value={hp.barrierHP ?? 0} onChange={v => onUpdateCharacter({ ...character, hp: { ...hp, barrierHP: v } })} /></>)}
      </div>

      {/* Current HP */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Cur. HP')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ padding: '4px 2px', display: 'flex', justifyContent: 'center' }}>
            <EditableNum value={currentHP[loc] ?? getMaxHP(loc)} onChange={v => updateHP(loc, v)} max={getMaxHP(loc)} capMax />
          </div>
        ))}
        {shieldCol(<EditableNum value={hp.shieldCurrent ?? shieldStats.hp} onChange={v => onUpdateCharacter({ ...character, hp: { ...hp, shieldCurrent: v } })} max={shieldStats.hp} capMax />)}
        {globalCol(<><span style={lbl}>Temp HP</span><EditableNum value={hp.tempHP ?? 0} onChange={v => onUpdateCharacter({ ...character, hp: { ...hp, tempHP: v } })} /></>)}
      </div>

      {/* AR */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('AR')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <span style={val}>{armor[loc]?.ar ?? 0}</span>
          </div>
        ))}
        {shieldCol(<span style={val}>{shieldStats.ar}</span>)}
        {globalCol(<><span style={lbl}>Global AR+</span><EditableNum value={character.globalARBonus ?? 0} onChange={v => updateGlobal('globalARBonus', v)} /></>)}
      </div>

      {/* Breaches — Shield shows Min STR */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, ...rowDivider }}>
        {rowLabel('Breaches')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ padding: '4px 2px', display: 'flex', justifyContent: 'center' }}>
            <EditableNum value={armor[loc]?.breaches ?? 0} onChange={v => updateArmor(loc, 'breaches', v)} />
          </div>
        ))}
        {shieldCol(<div style={{ textAlign: 'center' }}><span style={lbl}>Min STR</span><span style={val}>{shieldStats.minStr}</span></div>)}
        {globalCol(<><span style={lbl}>Natural AR</span><EditableNum value={character.naturalAR ?? 0} onChange={v => updateGlobal('naturalAR', v)} /></>)}
      </div>

      {/* Armor Type */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS }}>
        {rowLabel('Type')}
        {ARMOR_LOCATIONS.map(loc => (
          <div key={loc} style={{ padding: '4px 2px' }}>
            <select value={armor[loc]?.type || 'None'} onChange={e => updateArmor(loc, 'type', e.target.value)} style={armorSelectStyle}>
              {(loc === 'head' ? HELM_TYPES : ARMOR_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
        <div style={{ padding: '4px 2px', borderLeft: '1px solid var(--border2)' }}>
          <select value={shieldType} onChange={e => updateArmor('shield', 'type', e.target.value)} style={armorSelectStyle}>
            {SHIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ borderLeft: '1px solid var(--border2)', background: 'rgba(255,255,255,.02)' }} />
      </div>

    </div>
  )
}

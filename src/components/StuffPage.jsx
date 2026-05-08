// ─────────────────────────────────────────────────────────────────────────────
// StuffPage.jsx
// ─────────────────────────────────────────────────────────────────────────────

const lbl = {
  fontSize: '.6rem',
  letterSpacing: '.16em',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  fontFamily: 'Georgia, serif',
}

const sectionTitle = {
  fontSize: '.75rem',
  letterSpacing: '.2em',
  color: 'var(--gold)',
  textTransform: 'uppercase',
  fontFamily: 'Georgia, serif',
  marginBottom: 10,
}

const surface = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '14px 16px',
}

const inputStyle = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 3,
  color: 'var(--text)',
  fontFamily: 'Georgia, serif',
  fontSize: '.82rem',
  padding: '4px 6px',
  width: '100%',
  boxSizing: 'border-box',
}

const addBtn = {
  background: 'none',
  border: '1px solid var(--border)',
  color: 'var(--text3)',
  borderRadius: 4,
  padding: '4px 12px',
  fontFamily: 'Georgia, serif',
  fontSize: '.75rem',
  cursor: 'pointer',
  marginTop: 8,
  letterSpacing: '.08em',
}

const removeBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--text3)',
  cursor: 'pointer',
  fontSize: '.85rem',
  padding: '0 4px',
  lineHeight: 1,
  opacity: 0.5,
  flexShrink: 0,
}

const selectAll = e => e.target.select()

// ── INVENTORY ─────────────────────────────────────────────────────────────────
const INV_COLS = '16px 1fr 32px 46px 42px'

function InventoryHeader() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: INV_COLS, gap: 4, marginBottom: 4 }}>
      <div />
      <div style={lbl}>Item</div>
      <div style={{ ...lbl, textAlign: 'center' }}>#</div>
      <div style={{ ...lbl, textAlign: 'center' }}>Loc</div>
      <div style={{ ...lbl, textAlign: 'center' }}>Lbs</div>
    </div>
  )
}

function InventoryRow({ row, onChange, onRemove }) {
  const update = (field, val) => onChange({ ...row, [field]: val })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: INV_COLS, gap: 4, marginBottom: 3, alignItems: 'center' }}>
      <button style={removeBtn} onClick={onRemove}>×</button>
      <input
        style={inputStyle}
        value={row.item || ''}
        onChange={e => update('item', e.target.value)}
        placeholder="—"
      />
      <input
        style={{ ...inputStyle, textAlign: 'center' }}
        value={row.qty || ''}
        onChange={e => update('qty', e.target.value)}
        onFocus={selectAll}
        placeholder="1"
        maxLength={3}
      />
      <input
        style={{ ...inputStyle, textAlign: 'center' }}
        value={row.loc || ''}
        onChange={e => update('loc', e.target.value)}
        placeholder="—"
        maxLength={8}
      />
      <input
        style={{ ...inputStyle, textAlign: 'center' }}
        value={row.lbs || ''}
        onChange={e => update('lbs', e.target.value)}
        onFocus={selectAll}
        placeholder="0"
        maxLength={6}
      />
    </div>
  )
}

function InventorySection({ title, rows, onChange }) {
  const addRow = () => onChange([...rows, { item: '', qty: '', loc: '', lbs: '' }])
  const updateRow = (i, val) => { const r = [...rows]; r[i] = val; onChange(r) }
  const removeRow = (i) => { const r = [...rows]; r.splice(i, 1); onChange(r) }

  return (
    <div style={{ ...surface, flex: '1 1 260px', minWidth: 0 }}>
      <div style={sectionTitle}>{title}</div>
      <InventoryHeader />
      {rows.map((row, i) => (
        <InventoryRow key={i} row={row} onChange={v => updateRow(i, v)} onRemove={() => removeRow(i)} />
      ))}
      <button style={addBtn} onClick={addRow}>+ Add Row</button>
    </div>
  )
}

// ── SPECIAL ITEMS ─────────────────────────────────────────────────────────────
const SPEC_COLS = '16px 1fr 46px 42px'

function SpecialItemsSection({ items, onChange }) {
  const addRow = () => onChange([...items, { item: '', loc: '', lbs: '' }])
  const updateRow = (i, val) => { const r = [...items]; r[i] = val; onChange(r) }
  const removeRow = (i) => { const r = [...items]; r.splice(i, 1); onChange(r) }

  return (
    <div style={{ ...surface }}>
      <div style={sectionTitle}>Special Items</div>
      <div style={{ display: 'grid', gridTemplateColumns: SPEC_COLS, gap: 4, marginBottom: 4 }}>
        <div />
        <div style={lbl}>Item</div>
        <div style={{ ...lbl, textAlign: 'center' }}>Loc</div>
        <div style={{ ...lbl, textAlign: 'center' }}>Lbs</div>
      </div>
      {items.map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: SPEC_COLS, gap: 4, marginBottom: 3, alignItems: 'center' }}>
          <button style={removeBtn} onClick={() => removeRow(i)}>×</button>
          <input
            style={inputStyle}
            value={row.item || ''}
            onChange={e => updateRow(i, { ...row, item: e.target.value })}
            placeholder="—"
          />
          <input
            style={{ ...inputStyle, textAlign: 'center' }}
            value={row.loc || ''}
            onChange={e => updateRow(i, { ...row, loc: e.target.value })}
            placeholder="—"
            maxLength={8}
          />
          <input
            style={{ ...inputStyle, textAlign: 'center' }}
            value={row.lbs || ''}
            onChange={e => updateRow(i, { ...row, lbs: e.target.value })}
            onFocus={selectAll}
            placeholder="0"
            maxLength={6}
          />
        </div>
      ))}
      <button style={addBtn} onClick={addRow}>+ Add Row</button>
    </div>
  )
}

// ── COINS ─────────────────────────────────────────────────────────────────────
const COIN_TYPES = ['P.P', 'G.P', 'S.P', 'C.P']

function CoinsSection({ money, onChange }) {
  const update = (type, field, val) =>
    onChange({ ...money, [type]: { ...(money[type] || {}), [field]: val } })

  const totalCoins = COIN_TYPES.reduce((sum, t) =>
    sum + (parseInt(money[t]?.party || 0) + parseInt(money[t]?.mine || 0)), 0)
  const coinLbs = (totalCoins / 50).toFixed(1)

  return (
    <div style={{ ...surface, flex: '1 1 180px', minWidth: 0 }}>
      <div style={sectionTitle}>Coins</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1fr', gap: 4, marginBottom: 4 }}>
        <div style={{ ...lbl, textAlign: 'center' }}>Party</div>
        <div />
        <div style={{ ...lbl, textAlign: 'center' }}>Mine</div>
      </div>
      {COIN_TYPES.map(type => (
        <div key={type} style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1fr', gap: 4, marginBottom: 3, alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, textAlign: 'center', padding: '3px 4px' }}
            value={money[type]?.party || ''}
            onChange={e => update(type, 'party', e.target.value)}
            onFocus={selectAll}
            placeholder="0"
            maxLength={5}
          />
          <div style={{
            background: '#1a1060',
            borderRadius: 3,
            padding: '4px 2px',
            textAlign: 'center',
            fontSize: '.78rem',
            color: 'var(--gold2)',
            fontFamily: 'Georgia, serif',
            letterSpacing: '.04em',
          }}>{type}</div>
          <input
            style={{ ...inputStyle, textAlign: 'center', padding: '3px 4px' }}
            value={money[type]?.mine || ''}
            onChange={e => update(type, 'mine', e.target.value)}
            onFocus={selectAll}
            placeholder="0"
            maxLength={5}
          />
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>
        {coinLbs} lbs ({totalCoins} coins)
      </div>
    </div>
  )
}

// ── GEMS ──────────────────────────────────────────────────────────────────────
function GemsSection({ money, onChange }) {
  const gems = money.gems || Array(5).fill(null).map(() => ({ name: '', party: '', mine: '' }))

  const updateGem = (i, field, val) => {
    const g = [...gems]
    g[i] = { ...g[i], [field]: val }
    onChange({ ...money, gems: g })
  }

  return (
    <div style={{ ...surface, flex: '1 1 200px', minWidth: 0 }}>
      <div style={sectionTitle}>Gems</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', gap: 4, marginBottom: 4 }}>
        <div style={{ ...lbl, textAlign: 'center' }}>Party</div>
        <div />
        <div style={{ ...lbl, textAlign: 'center' }}>Mine</div>
      </div>
      {gems.map((gem, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', gap: 4, marginBottom: 3, alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, textAlign: 'center', padding: '3px 4px' }}
            value={gem.party || ''}
            onChange={e => updateGem(i, 'party', e.target.value)}
            onFocus={selectAll}
            placeholder="0"
          />
          <input
            style={{ ...inputStyle, textAlign: 'center', padding: '3px 2px', fontSize: '.72rem' }}
            value={gem.name || ''}
            onChange={e => updateGem(i, 'name', e.target.value)}
            placeholder="type"
            maxLength={12}
          />
          <input
            style={{ ...inputStyle, textAlign: 'center', padding: '3px 4px' }}
            value={gem.mine || ''}
            onChange={e => updateGem(i, 'mine', e.target.value)}
            onFocus={selectAll}
            placeholder="0"
          />
        </div>
      ))}
    </div>
  )
}

// ── MAGIC BONUSES ─────────────────────────────────────────────────────────────
const BONUS_FIELDS = [
  { key: 'str',     label: 'STR' },
  { key: 'dex',     label: 'DEX' },
  { key: 'con',     label: 'CON' },
  { key: 'aw',      label: 'AW' },
  { key: 'chr',     label: 'CHR' },
  { key: 'wp',      label: 'WP' },
  { key: 'ap',      label: 'Arc.P' },
  { key: 'mana',    label: 'Mana' },
  { key: 'evasion', label: 'Evasion' },
]

function MagicBonusesSection({ bonuses, onChange }) {
  const update = (key, val) => onChange({ ...bonuses, [key]: val === '' ? 0 : parseInt(val) || 0 })

  return (
    <div style={surface}>
      <div style={sectionTitle}>Magic Item Bonuses</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {BONUS_FIELDS.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 52, flex: '1 1 52px', maxWidth: 80 }}>
            <span style={lbl}>{label}</span>
            <input
              style={{ ...inputStyle, textAlign: 'center', padding: '4px 6px' }}
              value={bonuses[key] ?? 0}
              onChange={e => update(key, e.target.value)}
              onFocus={selectAll}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        These bonuses feed into derived stats on the Sheet tab.
      </div>
    </div>
  )
}

// ── ENCUMBRANCE ───────────────────────────────────────────────────────────────
function EncumbranceDisplay({ carried, money, stats }) {
  const invLbs = (carried || []).reduce((sum, row) => {
    const qty = parseFloat(row.qty) || 1
    const lbs = parseFloat(row.lbs) || 0
    return sum + qty * lbs
  }, 0)

  const totalCoins = COIN_TYPES.reduce((sum, t) =>
    sum + (parseInt(money?.[t]?.party || 0) + parseInt(money?.[t]?.mine || 0)), 0)
  const coinLbs = totalCoins / 50
  const totalCarried = Math.round((invLbs + coinLbs) * 10) / 10
  const maxWeight = stats?.weightAllowance ?? 0
  const pct = maxWeight > 0 ? totalCarried / maxWeight : 0
  const color = pct >= 1 ? '#c94a4a' : pct > 0.5 ? '#c9a84c' : 'var(--gold2)'

  return (
    <div style={{ ...surface, padding: '10px 16px' }}>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: '.95rem', color }}>
        Carrying <strong>{totalCarried}</strong> lbs of <strong>{maxWeight}</strong> Max
        {pct >= 1 && <span style={{ marginLeft: 12, fontSize: '.78rem', fontStyle: 'italic' }}>— Encumbered</span>}
        {pct > 0.5 && pct < 1 && <span style={{ marginLeft: 12, fontSize: '.78rem', fontStyle: 'italic' }}>— Over half load</span>}
      </span>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function StuffPage({ character, onUpdateCharacter, stats }) {
  const stuff = character.stuff || {}
  const update = (field, val) =>
    onUpdateCharacter({ ...character, stuff: { ...stuff, [field]: val } })

  const carried    = stuff.carried    || Array(15).fill(null).map(() => ({ item: '', qty: '', loc: '', lbs: '' }))
  const notCarried = stuff.notCarried || Array(5).fill(null).map(() => ({ item: '', qty: '', loc: '', lbs: '' }))
  const special    = stuff.special    || Array(5).fill(null).map(() => ({ item: '', loc: '', lbs: '' }))
  const money      = stuff.money      || {}
  const bonuses    = stuff.magicBonuses || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>

      <EncumbranceDisplay carried={carried} money={money} stats={stats} />

      {/* Left: Carried | Right: Not Carried + Special Items stacked */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <InventorySection title="Carried" rows={carried} onChange={v => update('carried', v)} />
        <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InventorySection title="Not Carried" rows={notCarried} onChange={v => update('notCarried', v)} />
          <SpecialItemsSection items={special} onChange={v => update('special', v)} />
        </div>
      </div>

      {/* Money side by side */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <CoinsSection money={money} onChange={v => update('money', v)} />
        <GemsSection money={money} onChange={v => update('money', v)} />
      </div>

      <MagicBonusesSection bonuses={bonuses} onChange={v => update('magicBonuses', v)} />

    </div>
  )
}

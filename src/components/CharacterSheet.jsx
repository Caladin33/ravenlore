import { useState, useMemo } from 'react'
import { calculate } from '../utils/calculator'
import { AttributeBlock, ArmorHPTable } from './SheetTopSections'
import weaponsData from '../data/weapons.json'

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
const surface = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '14px 18px',
}
const label = {
  fontSize: '.58rem', letterSpacing: '.18em', color: 'var(--text3)',
  textTransform: 'uppercase', marginBottom: 4, display: 'block', fontFamily: 'Georgia, serif',
}
const statBox = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 5, padding: '8px 10px', textAlign: 'center', minWidth: 52,
}
const statVal = {
  fontSize: '1.2rem', color: 'var(--gold2)', fontWeight: 600,
  fontFamily: 'Georgia, serif', lineHeight: 1,
}

function Section({ title, children, style }) {
  return (
    <div style={{ ...surface, ...style }}>
      <div style={{ ...label, marginBottom: 12, color: 'var(--gold)', letterSpacing: '.2em' }}>{title}</div>
      {children}
    </div>
  )
}
function StatBox({ label: lbl, value, color }) {
  return (
    <div style={statBox}>
      <div style={{ ...label, marginBottom: 4 }}>{lbl}</div>
      <div style={{ ...statVal, color: color || 'var(--gold2)' }}>{value ?? '—'}</div>
    </div>
  )
}

// ── WEAPON MARKS ──────────────────────────────────────────────────────────────
const MELEE_MARK_OPTIONS = ['none', 'fox', 'serpent', 'tiger', 'heron']
const RANGED_MARK_OPTIONS = ['none', 'sparrow', 'falcon', 'eagle', 'hawk']
const MARK_LABELS = { none:'None', fox:'Fox', serpent:'Serpent', tiger:'Tiger', heron:'Heron', sparrow:'Sparrow', falcon:'Falcon', eagle:'Eagle', hawk:'Hawk' }

// Available marks based on character's skill ranks
function getAvailableMarks(char, markList) {
  return markList.filter(m => {
    if (m === 'none') return true
    const skillName = m.charAt(0).toUpperCase() + m.slice(1) + ' Mark'
    return (parseInt(char.martialSkills?.[skillName]?.rank) || 0) >= 1
  })
}

// ── WEAPON SLOT EDITOR ────────────────────────────────────────────────────────
function WeaponSlotEditor({ slot, onSave, onClose, char, isRanged }) {
  const [name, setName] = useState(slot.name || '')
  const [mark, setMark] = useState(slot.mark || 'none')
  const [itemExpertiseBonus, setItemExpertiseBonus] = useState(slot.itemExpertiseBonus || 0)
  const [itemDamageBonus, setItemDamageBonus] = useState(slot.itemDamageBonus || 0)
  const [itemPrecisionBonus, setItemPrecisionBonus] = useState(slot.itemPrecisionBonus || 0)
  const [itemAPBonus, setItemAPBonus] = useState(slot.itemAPBonus || 0)
  const [itemMarksmanshipBonus, setItemMarksmanshipBonus] = useState(slot.itemMarksmanshipBonus || 0)
  const [isCursed, setIsCursed] = useState(slot.isCursed || false)

  const weapons = weaponsData.filter(w => isRanged ? w.isRanged : !w.isRanged)
  const markOptions = getAvailableMarks(char, isRanged ? RANGED_MARK_OPTIONS : MELEE_MARK_OPTIONS)
  const selectedWeapon = weaponsData.find(w => w.name === name)

  const numInput = (value, setter, lbl) => (
    <div style={{ flex: '1 1 80px' }}>
      <div style={{ ...label, marginBottom: 4 }}>{lbl}</div>
      <input type="number" value={value}
        onChange={e => setter(parseInt(e.target.value) || 0)}
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}
      />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10, padding: 22, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.7)' }}>
        <h3 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 16, fontSize: '1.1rem' }}>
          {isRanged ? 'Ranged' : 'Melee'} Weapon Slot
        </h3>

        {/* Weapon select */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 4 }}>Weapon</div>
          <select value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem', cursor: 'pointer' }}>
            <option value="">— Choose Weapon —</option>
            {weapons.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
          </select>
        </div>

        {/* Weapon info display */}
        {selectedWeapon && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
              <span><span style={{ color: 'var(--text3)' }}>Die: </span>{selectedWeapon.combatDie}</span>
              <span><span style={{ color: 'var(--text3)' }}>Dmg: </span>{selectedWeapon.damage}</span>
              <span><span style={{ color: 'var(--text3)' }}>Class: </span>{selectedWeapon.weaponClass}</span>
              <span><span style={{ color: 'var(--text3)' }}>Breaches: </span>{selectedWeapon.breaches}</span>
              {selectedWeapon.precisionMod !== 0 && <span><span style={{ color: 'var(--text3)' }}>PR mod: </span>{selectedWeapon.precisionMod > 0 ? '+' : ''}{selectedWeapon.precisionMod}</span>}
            </div>
            {selectedWeapon.specialRules && selectedWeapon.specialRules !== 'none' && (
              <div style={{ color: 'var(--text3)', fontStyle: 'italic', fontSize: '.75rem' }}>{selectedWeapon.specialRules}</div>
            )}
          </div>
        )}

        {/* Mark select */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 4 }}>Weapon Mark</div>
          <select value={mark} onChange={e => setMark(e.target.value)}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem', cursor: 'pointer' }}>
            {markOptions.map(m => <option key={m} value={m}>{MARK_LABELS[m]}</option>)}
          </select>
        </div>

        {/* Fixed bonuses */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 8, color: 'var(--gold)' }}>Item / Magic Bonuses</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isRanged
              ? numInput(itemMarksmanshipBonus, setItemMarksmanshipBonus, 'Marksmanship')
              : numInput(itemExpertiseBonus, setItemExpertiseBonus, 'Expertise')}
            {numInput(itemDamageBonus, setItemDamageBonus, 'Damage')}
            {numInput(itemPrecisionBonus, setItemPrecisionBonus, 'Precision')}
            {numInput(itemAPBonus, setItemAPBonus, 'Armor Bypass')}
          </div>
        </div>

        {/* Cursed blade toggle (melee only) */}
        {!isRanged && (
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="cursed" checked={isCursed} onChange={e => setIsCursed(e.target.checked)} />
            <label htmlFor="cursed" style={{ ...label, marginBottom: 0, cursor: 'pointer' }}>Cursed Blade</label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Cancel</button>
          <button onClick={() => {
            onSave({ name, mark, itemExpertiseBonus, itemDamageBonus, itemPrecisionBonus, itemAPBonus, itemMarksmanshipBonus, isCursed })
            onClose()
          }} disabled={!name}
            style={{ padding: '8px 20px', background: name ? 'rgba(74,158,74,.15)' : 'var(--bg2)', border: `1px solid ${name ? '#4a9e4a' : 'var(--border)'}`, color: name ? '#4a9e4a' : 'var(--text3)', borderRadius: 5, cursor: name ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── WEAPON SLOT ROW ───────────────────────────────────────────────────────────
function WeaponSlotRow({ slot, calcSlot, onEdit, onRemove, isRanged }) {
  const [expanded, setExpanded] = useState(false)

  if (!slot || !slot.name) {
    return (
      <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '.82rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', flex: 1 }}>Empty slot</span>
        <button onClick={onEdit} style={{ padding: '4px 12px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}>+ Assign</button>
      </div>
    )
  }

  if (!calcSlot || calcSlot.error) {
    return (
      <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', color: '#c94a4a', fontSize: '.8rem', fontFamily: 'Georgia, serif' }}>
        ⚠ {slot.name}: {calcSlot?.error || 'Error'}
        <button onClick={onEdit} style={{ marginLeft: 10, padding: '2px 8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, cursor: 'pointer', fontSize: '.75rem' }}>Edit</button>
      </div>
    )
  }

  // Format display strings
  const expLabel = isRanged ? 'Mksm.' : 'Exp.'
  const expVal = isRanged ? calcSlot.marksmanship : calcSlot.expertise

  const dmgFixed = calcSlot.damage
  const dmgMoV = calcSlot.movDamageRate
  const dmgStr = `${calcSlot.damageDie}${dmgFixed >= 0 ? '+' : ''}${dmgFixed}${dmgMoV > 0 ? `+${dmgMoV}/MoV` : ''}`

  const prFixed = calcSlot.precision
  const prMoV = isRanged ? calcSlot.hsPrecisionRate : calcSlot.movPrecisionRate
  const prStr = `${prFixed >= 0 ? '' : ''}${prFixed}${prMoV > 0 ? `+${prMoV}/MoV` : ''}`

  const apFixed = isRanged ? 0 : calcSlot.armorBypass
  const apMoV = isRanged ? calcSlot.hsArmorBypassRate : calcSlot.movBypassRate
  const apStr = (apFixed === 0 && (!apMoV || apMoV === 0)) ? '—' : `${apFixed}${apMoV > 0 ? `+${apMoV}/MoV` : ''}`

  const markLabel = slot.mark && slot.mark !== 'none' ? MARK_LABELS[slot.mark] : null

  return (
    <>
      <div style={{ borderBottom: expanded ? 'none' : '1px solid var(--border)', padding: '8px 0' }}>
        {/* Always-visible row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Weapon name + mark chip */}
          <div style={{ flex: '1 1 120px', minWidth: 0, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '.92rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {slot.name}
              </span>
              {markLabel && (
                <span style={{ fontSize: '.6rem', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {markLabel}
                </span>
              )}
              <span style={{ fontSize: '.55rem', color: 'var(--text3)', opacity: .5, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* Stats */}
          {[
            [expLabel, expVal],
            ['Dmg', dmgStr],
            ['PR', prStr],
            ['AByp', apStr],
          ].map(([lbl, v]) => (
            <div key={lbl} style={{ textAlign: 'center', minWidth: 48, flexShrink: 0 }}>
              <div style={{ ...label, marginBottom: 1 }}>{lbl}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{v}</div>
            </div>
          ))}

          {/* Edit button */}
          <button onClick={onEdit} style={{ padding: '3px 8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.72rem', flexShrink: 0 }}>⚙</button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '10px 12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', marginBottom: 2 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
            {[
              ['Combat Die', calcSlot.combatDie],
              ['Weapon Class', calcSlot.weaponClass],
              ['Breaches', calcSlot.breaches],
              ...(isRanged ? [['Ranges', (() => {
                const r = calcSlot.ranges
                return r?.type === 'ranged' ? [r.short, r.medium, r.long, r.veryLong].filter(Boolean).join('/') : 'Melee'
              })()]] : []),
            ].map(([lbl, v]) => (
              <div key={lbl}>
                <div style={{ ...label, marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: '.9rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Item bonuses if any */}
          {(slot.itemExpertiseBonus || slot.itemDamageBonus || slot.itemPrecisionBonus || slot.itemAPBonus || slot.itemMarksmanshipBonus || slot.isCursed) && (
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Item bonuses:
              {slot.itemExpertiseBonus ? ` Exp+${slot.itemExpertiseBonus}` : ''}
              {slot.itemMarksmanshipBonus ? ` Mksm+${slot.itemMarksmanshipBonus}` : ''}
              {slot.itemDamageBonus ? ` Dmg+${slot.itemDamageBonus}` : ''}
              {slot.itemPrecisionBonus ? ` PR+${slot.itemPrecisionBonus}` : ''}
              {slot.itemAPBonus ? ` AByp+${slot.itemAPBonus}` : ''}
              {slot.isCursed ? ' Cursed' : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={onEdit} style={{ padding: '5px 14px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}>Edit Slot</button>
            <button onClick={onRemove} style={{ padding: '5px 14px', background: 'none', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}>Remove</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── WEAPON SLOTS SECTION ──────────────────────────────────────────────────────
function WeaponSlots({ character, onUpdateCharacter, stats }) {
  const [editingSlot, setEditingSlot] = useState(null) // { type: 'melee'|'ranged', index: number }

  const meleeSlots = character.weapons?.melee || [null, null]
  const rangedSlots = character.weapons?.ranged || [null]

  const updateSlots = (type, newSlots) => {
    onUpdateCharacter({ ...character, weapons: { ...character.weapons, [type]: newSlots } })
  }

  const saveSlot = (type, index, slotData) => {
    const slots = type === 'melee' ? [...meleeSlots] : [...rangedSlots]
    slots[index] = slotData
    updateSlots(type, slots)
  }

  const removeSlot = (type, index) => {
    const slots = type === 'melee' ? [...meleeSlots] : [...rangedSlots]
    slots[index] = null
    updateSlots(type, slots)
  }

  const addSlot = (type) => {
    const slots = type === 'melee' ? [...meleeSlots] : [...rangedSlots]
    slots.push(null)
    updateSlots(type, slots)
  }

  const sectionHdr = (title) => (
    <div style={{ ...label, color: 'var(--gold)', letterSpacing: '.2em', marginBottom: 8, fontSize: '.65rem' }}>{title}</div>
  )

  return (
    <div style={surface}>
      {editingSlot && (
        <WeaponSlotEditor
          slot={(editingSlot.type === 'melee' ? meleeSlots : rangedSlots)[editingSlot.index] || {}}
          char={character}
          isRanged={editingSlot.type === 'ranged'}
          onSave={(data) => saveSlot(editingSlot.type, editingSlot.index, data)}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {/* Melee */}
      {sectionHdr('Melee Weapons')}
      {meleeSlots.map((slot, i) => (
        <WeaponSlotRow
          key={i}
          slot={slot}
          calcSlot={stats.meleeSlots[i]}
          isRanged={false}
          onEdit={() => setEditingSlot({ type: 'melee', index: i })}
          onRemove={() => removeSlot('melee', i)}
        />
      ))}
      <button onClick={() => addSlot('melee')}
        style={{ marginTop: 8, padding: '4px 12px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>
        + Add Melee Slot
      </button>

      {/* Ranged */}
      <div style={{ marginTop: 16 }}>
        {sectionHdr('Ranged Weapons')}
        {rangedSlots.map((slot, i) => (
          <WeaponSlotRow
            key={i}
            slot={slot}
            calcSlot={stats.rangedSlots[i]}
            isRanged={true}
            onEdit={() => setEditingSlot({ type: 'ranged', index: i })}
            onRemove={() => removeSlot('ranged', i)}
          />
        ))}
        <button onClick={() => addSlot('ranged')}
          style={{ marginTop: 8, padding: '4px 12px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>
          + Add Ranged Slot
        </button>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CharacterSheet({ character, onBack, onEditSkills, onUpdateCharacter }) {
  const [offHand, setOffHand] = useState(character.offHand || 'Empty')
  const [stance, setStance] = useState(character.stance || 'None')
  const [unfettered, setUnfettered] = useState(false)

  const handleOffHandChange = (val) => { setOffHand(val); onUpdateCharacter({ ...character, offHand: val }) }
  const handleStanceChange = (val) => { setStance(val); onUpdateCharacter({ ...character, stance: val }) }

  const stats = useMemo(() => {
    try { return calculate(character, { offHand, stance, unfettered }) }
    catch (e) { console.error('Calculator error:', e); return null }
  }, [character, offHand, stance, unfettered])

  if (!stats) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
      Error calculating stats. Check console for details.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <AttributeBlock
        stats={stats} character={character} onUpdateCharacter={onUpdateCharacter}
        offHand={offHand} stance={stance} unfettered={unfettered}
        onOffHandChange={handleOffHandChange} onStanceChange={handleStanceChange}
        onUnfetteredChange={setUnfettered}
      />
      <ArmorHPTable stats={stats} character={character} onUpdateCharacter={onUpdateCharacter} />
      <WeaponSlots character={character} onUpdateCharacter={onUpdateCharacter} stats={stats} />

      {/* Skill Points */}
      <Section title="Skill Points">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatBox label="Earned" value={stats.skillPoints.totalEarned} />
          <StatBox label="Spent" value={stats.skillPoints.totalSpent} />
          <StatBox label="Unspent" value={stats.skillPoints.unspent} color={stats.skillPoints.unspent < 0 ? '#c94a4a' : 'var(--gold2)'} />
        </div>
      </Section>

      {/* Biography preview */}
      {(character.bio?.personalHistory || character.bio?.goals || character.bio?.fears) && (
        <Section title="Biography">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['History', character.bio?.personalHistory],
              ['Goals', character.bio?.goals],
              ['Fears', character.bio?.fears],
              ['Enemies', character.bio?.enemies],
              ['Contacts', character.bio?.contacts],
            ].filter(([, v]) => v).map(([lbl, val]) => (
              <div key={lbl}>
                <div style={label}>{lbl}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6, fontFamily: 'Georgia, serif' }}>{val}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

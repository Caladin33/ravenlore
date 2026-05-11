import { useState, useMemo } from 'react'
import { calculate } from '../utils/calculator'
import { AttributeBlock, ArmorHPTable } from './SheetTopSections'
import weaponsData from '../data/weapons.json'
import druidFormsData from '../data/druidForms.json'

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

function getAvailableMarks(char, markList) {
  return markList.filter(m => {
    if (m === 'none') return true
    const skillName = m.charAt(0).toUpperCase() + m.slice(1) + ' Mark'
    return (parseInt(char.martialSkills?.[skillName]?.rank) || 0) >= 1
  })
}

// ── DRUID FORM HELPERS ────────────────────────────────────────────────────────
function getFormData(formName) {
  if (!formName || formName === 'None') return null
  return druidFormsData.find(f => f.name === formName) || null
}

// ── WEAPON SLOT EDITOR ────────────────────────────────────────────────────────
function WeaponSlotEditor({ slot, onSave, onClose, char, isRanged }) {
  const [name, setName] = useState(slot.name || '')
  const [slotLabel, setSlotLabel] = useState(slot.slotLabel || slot.name || '')
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

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 4 }}>Slot Name</div>
          <input value={slotLabel} onChange={e => setSlotLabel(e.target.value)}
            placeholder={name || 'e.g. Magic Dagger, Backup Sword...'}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 4 }}>Weapon</div>
          <select value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem', cursor: 'pointer' }}>
            <option value="">— Choose Weapon —</option>
            {weapons.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
          </select>
        </div>

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

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 4 }}>Weapon Mark</div>
          <select value={mark} onChange={e => setMark(e.target.value)}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: '.9rem', cursor: 'pointer' }}>
            {markOptions.map(m => <option key={m} value={m}>{MARK_LABELS[m]}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 8, color: 'var(--gold)' }}>Item / Magic Bonuses</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isRanged
              ? numInput(itemMarksmanshipBonus, setItemMarksmanshipBonus, 'To Hit')
              : numInput(itemExpertiseBonus, setItemExpertiseBonus, 'Expertise')}
            {numInput(itemDamageBonus, setItemDamageBonus, 'Damage')}
            {numInput(itemPrecisionBonus, setItemPrecisionBonus, 'Precision')}
            {numInput(itemAPBonus, setItemAPBonus, 'Armor Bypass')}
          </div>
        </div>

        {!isRanged && (
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="cursed" checked={isCursed} onChange={e => setIsCursed(e.target.checked)} />
            <label htmlFor="cursed" style={{ ...label, marginBottom: 0, cursor: 'pointer' }}>Cursed Blade</label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Cancel</button>
          <button onClick={() => {
            onSave({ name, slotLabel: slotLabel || name, mark, itemExpertiseBonus, itemDamageBonus, itemPrecisionBonus, itemAPBonus, itemMarksmanshipBonus, isCursed })
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
function WeaponSlotRow({ slot, calcSlot, onEdit, onRemove, isRanged, activeFormData }) {
  const [expanded, setExpanded] = useState(false)

  const isUnarmedWithForm = !isRanged && slot?.name === 'Unarmed' && activeFormData

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

  const expLabel = isRanged ? 'To Hit' : 'Exp.'
  const expVal = isRanged ? calcSlot.marksmanship : calcSlot.expertise

  const movLabel = isRanged ? 'HS' : 'MoV'
  const dmgFixed = isUnarmedWithForm ? 0 : calcSlot.damage
  const dmgMoV = calcSlot.movDamageRate
  const dmgMain = isUnarmedWithForm ? activeFormData.damage : `${calcSlot.damageDie}${dmgFixed >= 0 ? '+' : ''}${dmgFixed}`
  const dmgSuffix = (!isUnarmedWithForm && dmgMoV > 0) ? { num: `+${dmgMoV}/`, lbl: movLabel } : null

  const prFixed = calcSlot.precision
  const prMoV = isRanged ? calcSlot.hsPrecisionRate : calcSlot.movPrecisionRate
  const prMain = `${prFixed}`
  const prSuffix = prMoV > 0 ? { num: `+${prMoV}/`, lbl: movLabel } : null

  const apFixed = isRanged ? 0 : (calcSlot.armorBypass ?? 0)
  const apMoV = isRanged ? calcSlot.hsArmorBypassRate : calcSlot.movBypassRate
  const apMain = (apFixed === 0 && (!apMoV || apMoV === 0)) ? '—' : `${apFixed}`
  const apSuffix = (apMoV > 0 && apMain !== '—') ? { num: `+${apMoV}/`, lbl: movLabel } : null

  const markLabel = slot.mark && slot.mark !== 'none' ? MARK_LABELS[slot.mark] : null
  const displayName = isUnarmedWithForm ? `${slot.slotLabel || slot.name} (${activeFormData.attack})` : (slot.slotLabel || slot.name)

  return (
    <>
      <div style={{ borderBottom: expanded ? 'none' : '1px solid var(--border)', padding: '8px 0', background: isUnarmedWithForm ? 'rgba(74,158,74,.04)' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ flex: '1 1 80px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '.88rem', color: isUnarmedWithForm ? '#4a9e4a' : 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              {markLabel && (
                <span style={{ fontSize: '.55rem', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {markLabel}
                </span>
              )}
              <span style={{ fontSize: '.55rem', color: 'var(--text3)', opacity: .5, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>

          {[
            [expLabel, String(expVal), null],
            ['Dmg', dmgMain, dmgSuffix],
            ['PR', prMain, prSuffix],
            ['AB', apMain, apSuffix],
          ].map(([lbl, main, suffix]) => (
            <div key={lbl} style={{ textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
              <div style={{ fontSize: '.5rem', letterSpacing: '.1em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 1 }}>{lbl}</div>
              <div style={{ fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{main}</span>
                {suffix && (
                  <>
                    <span style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{suffix.num}</span>
                    <span style={{ fontSize: '.52rem', color: 'var(--text3)' }}>{suffix.lbl}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '10px 12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', marginBottom: 2 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
            {isUnarmedWithForm ? (
              <>
                <div><div style={label}>Form Attack</div><div style={{ fontSize: '.9rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{activeFormData.attack}</div></div>
                <div><div style={label}>Form Damage</div><div style={{ fontSize: '.9rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{activeFormData.damage}</div></div>
                <div><div style={label}>Natural Armor</div><div style={{ fontSize: '.9rem', color: '#4a9e4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{activeFormData.naturalArmor || 0}</div></div>
              </>
            ) : (
              [
                ['Combat Die', calcSlot.combatDie],
                ['Weapon Class', calcSlot.weaponClass],
                ['Breaches', calcSlot.breaches],
                ...(isRanged ? [['Ranges', (() => {
                  const r = calcSlot.ranges
                  return r?.type === 'ranged' ? [r.short, r.medium, r.long, r.veryLong].filter(Boolean).join('/') : 'Melee'
                })()]] : []),
              ].map(([lbl, v]) => (
                <div key={lbl}>
                  <div style={label}>{lbl}</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{v}</div>
                </div>
              ))
            )}
          </div>
          {(slot.itemExpertiseBonus || slot.itemDamageBonus || slot.itemPrecisionBonus || slot.itemAPBonus || slot.itemMarksmanshipBonus || slot.isCursed) && (
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 8 }}>
              Item bonuses:
              {slot.itemExpertiseBonus ? ` Exp+${slot.itemExpertiseBonus}` : ''}
              {slot.itemMarksmanshipBonus ? ` ToHit+${slot.itemMarksmanshipBonus}` : ''}
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
  const [editingSlot, setEditingSlot] = useState(null)

  const meleeSlots = character.weapons?.melee || [null, null]
  const rangedSlots = character.weapons?.ranged || [null]
  const activeFormData = getFormData(character.activeForm)

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

      {sectionHdr('Melee Weapons')}
      {meleeSlots.map((slot, i) => (
        <WeaponSlotRow
          key={i}
          slot={slot}
          calcSlot={stats.meleeSlots[i]}
          isRanged={false}
          activeFormData={activeFormData}
          onEdit={() => setEditingSlot({ type: 'melee', index: i })}
          onRemove={() => removeSlot('melee', i)}
        />
      ))}
      <button onClick={() => addSlot('melee')}
        style={{ marginTop: 8, padding: '4px 12px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>
        + Add Melee Slot
      </button>

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
export default function CharacterSheet({ character, onBack, onEditSkills, onUpdateCharacter, onRefresh }) {
  const [offHand, setOffHand] = useState(character.offHand || 'Empty')
  const [stance, setStance] = useState(character.stance || 'None')
  const [unfettered, setUnfettered] = useState(false)

  const handleOffHandChange = (val) => { setOffHand(val); onUpdateCharacter({ ...character, offHand: val }) }
  const handleStanceChange = (val) => { setStance(val); onUpdateCharacter({ ...character, stance: val }) }

  const stats = useMemo(() => {
    try { return calculate(character, { offHand, stance, unfettered }) }
    catch (e) { console.error('Calculator error:', e); return null }
  }, [character, offHand, stance, unfettered])

  const currentMaintenance = useMemo(() => {
    return [
      ...Object.values(character.martialSkills || {}),
      ...Object.values(character.arcaneSkills || {}),
      ...Object.values(character.selfImprovementSkills || {}),
    ].reduce((sum, data) => {
      const pts = parseInt(data.pointsInvested) || 0
      return sum + (pts > 0 ? Math.floor(parseFloat(data.maintenanceCost) || 0) : 0)
    }, 0)
  }, [character])

  if (!stats) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
      Error calculating stats. Check console for details.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>

      {/* Banners */}
      {character.pendingSkillChanges && (
        <div style={{ padding: '10px 16px', background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, fontSize: '.85rem', color: 'var(--gold)', fontFamily: 'Georgia, serif', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⏳ Skill changes are pending GM approval.</span>
          <button onClick={onRefresh} style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>↻ Refresh</button>
        </div>
      )}
      {character.levelUpAuthorized && (
        <div style={{ padding: '10px 16px', background: 'rgba(74,158,74,.08)', border: '1px solid #4a9e4a', borderRadius: 7, fontSize: '.85rem', color: '#4a9e4a', fontFamily: 'Georgia, serif' }}>
          ✓ Level up authorized! Go to Bio to level up.
        </div>
      )}
      {character.status === 'creation' && (
        <div style={{ padding: '10px 16px', background: 'rgba(74,144,217,.08)', border: '1px solid #4a90d9', borderRadius: 7, fontSize: '.82rem', color: '#4a90d9', fontFamily: 'Georgia, serif' }}>
          🔵 Gameplay begins at level 3. Spend your level 1 skill points in Skills, then save for GM approval.
        </div>
      )}

      <AttributeBlock
        stats={stats} character={character} onUpdateCharacter={onUpdateCharacter}
        offHand={offHand} stance={stance}
        onOffHandChange={handleOffHandChange} onStanceChange={handleStanceChange}
      />

      <ArmorHPTable stats={stats} character={character} onUpdateCharacter={onUpdateCharacter} />
      <WeaponSlots character={character} onUpdateCharacter={onUpdateCharacter} stats={stats} />

      {/* Skill Points */}
      <Section title="Skill Points">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            ['Available', stats.skillPoints.unspent, stats.skillPoints.unspent < 0 ? '#c94a4a' : 'var(--gold2)'],
            ['Earned', stats.skillPoints.totalEarned, 'var(--gold2)'],
            ['Spent', stats.skillPoints.totalSpent, 'var(--text2)'],
            ['Maint. Paid', stats.skillPoints.maintenancePaid, 'var(--text2)'],
            ['Cur. Maint.', currentMaintenance, currentMaintenance > 0 ? '#c94a4a' : 'var(--text3)'],
          ].map(([l, v, color]) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: '.55rem', letterSpacing: '.15em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Georgia, serif' }}>{l}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif', color }}>{v ?? '—'}</div>
            </div>
          ))}
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

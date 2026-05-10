import { useState, useMemo } from 'react'
import { calculate } from '../utils/calculator'
import { AttributeBlock, ArmorHPTable } from './SheetTopSections'

// ─────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────

const surface = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '14px 18px',
}

const label = {
  fontSize: '.58rem',
  letterSpacing: '.18em',
  color: 'var(--text3)',
  textTransform: 'uppercase',
  marginBottom: 4,
  display: 'block',
  fontFamily: 'Georgia, serif',
}

const statBox = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '8px 10px',
  textAlign: 'center',
  minWidth: 52,
}

const statVal = {
  fontSize: '1.2rem',
  color: 'var(--gold2)',
  fontWeight: 600,
  fontFamily: 'Georgia, serif',
  lineHeight: 1,
}

function Section({ title, children, style }) {
  return (
    <div style={{ ...surface, ...style }}>
      <div style={{ ...label, marginBottom: 12, color: 'var(--gold)', letterSpacing: '.2em' }}>
        {title}
      </div>
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

// ─────────────────────────────────────────────
// WEAPON ROWS
// ─────────────────────────────────────────────

function MeleeRow({ slot }) {
  if (!slot) return null
  if (slot.error) return (
    <div style={{ padding: '8px 0', color: 'var(--text3)', fontSize: '.8rem' }}>
      {slot.name}: {slot.error}
    </div>
  )

  const damageStr = `${slot.damageDie}${slot.damage >= 0 ? '+' : ''}${slot.damage}${slot.movDamageRate > 0 ? ` +${slot.movDamageRate}/MoV` : ''}`
  const precStr = `${slot.precision}${slot.movPrecisionRate > 0 ? ` +${slot.movPrecisionRate}/MoV` : ''}`
  const apStr = slot.armorBypass > 0 || slot.movBypassRate > 0
    ? `${slot.armorBypass}${slot.movBypassRate > 0 ? ` +${slot.movBypassRate}/MoV` : ''}`
    : '—'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1.5fr 1fr 0.7fr',
      gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: '.9rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{slot.name}</div>
        <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{slot.combatDie} · {slot.weaponClass}</div>
      </div>
      <div style={{ fontSize: '.95rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>{slot.expertise}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{damageStr}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{precStr}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{apStr}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>{slot.breaches || '—'}</div>
    </div>
  )
}

function RangedRow({ slot }) {
  if (!slot) return null
  if (slot.error) return (
    <div style={{ padding: '8px 0', color: 'var(--text3)', fontSize: '.8rem' }}>
      {slot.name}: {slot.error}
    </div>
  )

  const damageStr = `${slot.damageDie}${slot.damage >= 0 ? '+' : ''}${slot.damage}${slot.movDamageRate > 0 ? ` +${slot.movDamageRate}/HS` : ''}`
  const precStr = `${slot.precision}${slot.hsPrecisionRate > 0 ? ` +${slot.hsPrecisionRate}/HS` : ''}`
  const r = slot.ranges
  const rangeStr = r?.type === 'ranged'
    ? [r.short, r.medium, r.long, r.veryLong].filter(Boolean).join('/')
    : 'Melee'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1.5fr 1.5fr',
      gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: '.9rem', color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{slot.name}</div>
        <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{slot.combatDie} · {slot.weaponClass}</div>
      </div>
      <div style={{ fontSize: '.95rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>{slot.marksmanship}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{damageStr}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{precStr}</div>
      <div style={{ fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{rangeStr}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function CharacterSheet({ character, onBack, onEditSkills, onUpdateCharacter }) {
  const [offHand, setOffHand] = useState(character.offHand || 'Empty')
  const [stance, setStance] = useState(character.stance || 'None')
  const [unfettered, setUnfettered] = useState(false)

  const handleOffHandChange = (val) => {
    setOffHand(val)
    onUpdateCharacter({ ...character, offHand: val })
  }

  const handleStanceChange = (val) => {
    setStance(val)
    onUpdateCharacter({ ...character, stance: val })
  }

  const stats = useMemo(() => {
    try {
      return calculate(character, { offHand, stance, unfettered })
    } catch (e) {
      console.error('Calculator error:', e)
      return null
    }
  }, [character, offHand, stance, unfettered])

  if (!stats) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
      Error calculating stats. Check console for details.
    </div>
  )

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100, width: '100%' }}>

      <AttributeBlock
        stats={stats}
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        offHand={offHand}
        stance={stance}
        unfettered={unfettered}
        onOffHandChange={handleOffHandChange}
        onStanceChange={handleStanceChange}
        onUnfetteredChange={setUnfettered}
      />

      <ArmorHPTable
        stats={stats}
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />

      {/* Melee Weapons */}
      {stats.meleeSlots.some(Boolean) && (
        <Section title="Melee Weapons">
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1.5fr 1fr 0.7fr',
            gap: 8, marginBottom: 6,
          }}>
            {['Weapon', 'Expertise', 'Damage', 'Precision', 'Armor Pen', 'Breach'].map(h => (
              <div key={h} style={label}>{h}</div>
            ))}
          </div>
          {stats.meleeSlots.map((slot, i) => slot && <MeleeRow key={i} slot={slot} />)}
        </Section>
      )}

      {/* Ranged Weapons */}
      {stats.rangedSlots.some(Boolean) && (
        <Section title="Ranged Weapons">
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1.5fr 1.5fr',
            gap: 8, marginBottom: 6,
          }}>
            {['Weapon', 'Marksmanship', 'Damage', 'Precision', 'Ranges'].map(h => (
              <div key={h} style={label}>{h}</div>
            ))}
          </div>
          {stats.rangedSlots.map((slot, i) => slot && <RangedRow key={i} slot={slot} />)}
        </Section>
      )}

      {/* Skill Points */}
      <Section title="Skill Points">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatBox label="Earned" value={stats.skillPoints.totalEarned} />
          <StatBox label="Spent" value={stats.skillPoints.totalSpent} />
          <StatBox
            label="Unspent"
            value={stats.skillPoints.unspent}
            color={stats.skillPoints.unspent < 0 ? '#c94a4a' : 'var(--gold2)'}
          />
        </div>
      </Section>

      

      {/* Biography */}
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

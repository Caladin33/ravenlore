import { useState, useMemo } from 'react'
import { calculate } from '../utils/calculator'

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

const statSub = {
  fontSize: '.6rem',
  color: 'var(--text3)',
  marginTop: 3,
  fontFamily: 'Georgia, serif',
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

function StatBox({ label: lbl, value, sub, color }) {
  return (
    <div style={statBox}>
      <div style={{ ...label, marginBottom: 4 }}>{lbl}</div>
      <div style={{ ...statVal, color: color || 'var(--gold2)' }}>{value ?? '—'}</div>
      {sub && <div style={statSub}>{sub}</div>}
    </div>
  )
}

function Dropdown({ label: lbl, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={label}>{lbl}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--surface2)', border: '1px solid var(--border2)',
          color: 'var(--text)', borderRadius: 4, padding: '5px 8px',
          fontFamily: 'Georgia, serif', fontSize: '.85rem', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─────────────────────────────────────────────
// HP BAR
// ─────────────────────────────────────────────

function HPSection({ label: lbl, current, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
  const color = pct > 0.5 ? '#4a9e4a' : pct > 0.25 ? '#c9a84c' : '#c94a4a'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 70 }}>
      <div style={{ ...label, marginBottom: 0 }}>{lbl}</div>
      <div style={{ fontSize: '.95rem', color, fontWeight: 600, fontFamily: 'Georgia, serif' }}>
        {current}/{max}
      </div>
      <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 2, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// WEAPON ROW
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

export default function CharacterSheet({ character, onBack, onEditSkills }) {
  console.log('CharacterSheet props:', { character: !!character, onBack: !!onBack, onEditSkills: !!onEditSkills })
  const [offHand, setOffHand] = useState('Empty')
  const [stance, setStance] = useState('None')
  const [unfettered, setUnfettered] = useState(false)

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

  const hp = character.hp || {}
  const currentHP = hp.current || {}
  const maxHP = stats.hp

  const attrs = stats.attributes

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>

      {/* Back button + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', borderRadius: 4, padding: '6px 14px',
            cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
          }}
        >
          ← Characters
        </button>
        <button
onClick={onEditSkills} 
  style={{
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text3)', borderRadius: 4, padding: '6px 14px',
    cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
  }}
>
  Edit Skills
</button>
        <div>
          <h2 style={{ color: 'var(--gold2)', margin: 0, fontSize: '1.5rem' }}>{character.name}</h2>
          <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
            Level {character.level} {character.race} {character.profession && `· ${character.profession}`}
            {character.player && ` · Player: ${character.player}`}
          </div>
        </div>
      </div>

      {/* Session state dropdowns */}
      <Section title="Combat State">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Dropdown
            label="Off-hand"
            value={offHand}
            onChange={setOffHand}
            options={['Empty', '2-Handed', 'Dual Wield', 'Shield']}
          />
          <Dropdown
            label="Stance"
            value={stance}
            onChange={setStance}
            options={['None', 'Wind', 'Wave', 'Stone', 'Flame']}
          />
          {stats.session.canBeUnfettered && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={label}>Unfettered</span>
              <button
                onClick={() => setUnfettered(!unfettered)}
                style={{
                  padding: '5px 14px',
                  background: unfettered ? 'rgba(74,158,74,.15)' : 'var(--surface2)',
                  border: `1px solid ${unfettered ? '#4a9e4a' : 'var(--border2)'}`,
                  color: unfettered ? '#4a9e4a' : 'var(--text3)',
                  borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'Georgia, serif', fontSize: '.85rem',
                }}
              >
                {unfettered ? 'Yes' : 'No'}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <StatBox label="Evasion" value={stats.evasion} sub={`Rear: ${stats.rearEvasion}`} />
            <StatBox label="Initiative" value={`+${stats.initiative}`} />
            <StatBox label="Movement" value={stats.movement} sub="ft/action" />
            <StatBox label="Skill Cap" value={stats.skillCap} />
            <StatBox label="Carry" value={stats.weightAllowance} sub="lbs max" />
          </div>
        </div>
      </Section>

      {/* Attributes */}
      <Section title="Attributes">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(attrs).map(([key, val]) => (
            <div key={key} style={{ ...statBox, flex: '1 1 80px' }}>
              <div style={label}>{key.toUpperCase()}</div>
              <div style={statVal}>{val.effective}</div>
              <div style={{ ...statSub, color: val.checkMod >= 0 ? 'var(--text3)' : '#c94a4a' }}>
                ({val.checkMod >= 0 ? '+' : ''}{val.checkMod})
              </div>
              {val.advantage && <div style={{ fontSize: '.55rem', color: '#4a9e4a', marginTop: 2 }}>ADV</div>}
              {val.disadvantage && <div style={{ fontSize: '.55rem', color: '#c94a4a', marginTop: 2 }}>DIS</div>}
            </div>
          ))}
        </div>
      </Section>

      {/* Hit Points */}
      <Section title="Hit Points">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            ['R. Arm', currentHP.rArm, maxHP.arm],
            ['Head', currentHP.head, maxHP.head],
            ['L. Arm', currentHP.lArm, maxHP.arm],
            ['Torso', currentHP.torso, maxHP.torso],
            ['L. Leg', currentHP.lLeg, maxHP.leg],
            ['R. Leg', currentHP.rLeg, maxHP.leg],
          ].map(([loc, cur, max]) => (
            <HPSection key={loc} label={loc} current={cur ?? max} max={max} />
          ))}
        </div>
        {character.hp?.barrierHP > 0 && (
          <div style={{ marginTop: 10, fontSize: '.8rem', color: 'var(--text2)' }}>
            Barrier HP: {character.hp.barrierHP}
          </div>
        )}
      </Section>

      {/* Damage Bonus + Magic Summary */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Section title="Combat" style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatBox label="Dmg Bonus" value={stats.damageBonus >= 0 ? `+${stats.damageBonus}` : stats.damageBonus} />
            <StatBox label="MoV Dmg" value={stats.movDamageRate > 0 ? `+${stats.movDamageRate}/MoV` : '—'} />
            <StatBox label="MoV Prec" value={stats.movPrecisionRate > 0 ? `+${stats.movPrecisionRate}/MoV` : '—'} />
            <StatBox label="HS AP" value={stats.hsArmorBypassRate > 0 ? `+${stats.hsArmorBypassRate}/HS` : '—'} />
            <StatBox label="Spell Prec" value={stats.spellPrecision > 0 ? `+${stats.spellPrecision}` : '—'} />
          </div>
        </Section>

        <Section title="Magic" style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatBox label="Arc. Power" value={stats.arcanePower} />
            <StatBox label="Spell Hooks" value={stats.spellHooks} />
            <StatBox label="Max Spells" value={stats.maxSpellsKnown} />
            <StatBox label="Mana Mean" value={stats.manaMean} />
          </div>
          {Object.keys(stats.weavingDice).length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(stats.weavingDice).map(([color, die]) => (
                <div key={color} style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '3px 8px', fontSize: '.75rem',
                  color: 'var(--text2)', fontFamily: 'Georgia, serif',
                }}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}: {die}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

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

      {/* Armor */}
      <Section title="Armor">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            ['R. Arm', character.armor?.rArm],
            ['Head', character.armor?.head],
            ['L. Arm', character.armor?.lArm],
            ['Torso', character.armor?.torso],
            ['L. Leg', character.armor?.lLeg],
            ['R. Leg', character.armor?.rLeg],
            ['Shield', character.armor?.shield],
          ].map(([loc, a]) => (
            <div key={loc} style={{ ...statBox, minWidth: 80 }}>
              <div style={label}>{loc}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>
                {a?.type || 'None'}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--gold2)', marginTop: 2 }}>
                AR {a?.ar ?? 0}
              </div>
              {(a?.breaches || 0) > 0 && (
                <div style={{ fontSize: '.65rem', color: '#c94a4a', marginTop: 1 }}>
                  {a.breaches} breach{a.breaches > 1 ? 'es' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
        {stats.session.unfettered && (
          <div style={{ marginTop: 8, fontSize: '.78rem', color: '#4a9e4a', fontStyle: 'italic' }}>
            ✓ Unfettered
          </div>
        )}
      </Section>

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

      {/* Known Spells */}
      {character.knownSpells?.length > 0 && (
        <Section title={`Spells Known (${character.knownSpells.length}/${stats.maxSpellsKnown})`}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {character.knownSpells.map((spell, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '3px 10px', fontSize: '.78rem',
                color: 'var(--text2)', fontFamily: 'Georgia, serif',
              }}>
                {spell.name} {spell.level && <span style={{ color: 'var(--text3)' }}>Lv{spell.level}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

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

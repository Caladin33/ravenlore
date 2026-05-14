// skillFormatting.js
// Pre-formatted descriptions for skills that had table layouts in the source data.
// Each entry is either type:'ranklist' or type:'table'.
// This avoids changing the JSON and keeps rendering concerns separate.

const lbl = {
  fontSize: '.55rem', letterSpacing: '.14em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif',
}
const cell = {
  fontSize: '.82rem', color: 'var(--text2)', fontFamily: 'Georgia, serif',
  padding: '3px 10px 3px 0', verticalAlign: 'top',
}
const hdrCell = {
  fontSize: '.6rem', letterSpacing: '.12em', color: 'var(--gold)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif',
  padding: '0 10px 6px 0', borderBottom: '1px solid var(--border)',
  textAlign: 'left',
}
const rankCell = {
  ...cell, color: 'var(--gold2)', fontWeight: 600, whiteSpace: 'nowrap',
}

// ── MASTERY TABLE ─────────────────────────────────────────────────────────────
function MasteryTable({ intro, dieName, ranks }) {
  return (
    <div>
      <div style={{ fontSize: '.83rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.5 }}>{intro}</div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...hdrCell }}>Rank</th>
            <th style={{ ...hdrCell }}>{dieName}</th>
            <th style={{ ...hdrCell }}>Extra Spells</th>
            <th style={{ ...hdrCell }}>Max Level</th>
          </tr>
        </thead>
        <tbody>
          {ranks.map(([rank, die, spells, level]) => (
            <tr key={rank}>
              <td style={rankCell}>{rank}</td>
              <td style={cell}>{die}</td>
              <td style={cell}>{spells}</td>
              <td style={cell}>{level}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 8, fontStyle: 'italic' }}>
        * 1d12 only possible with Master Weaver skill
      </div>
    </div>
  )
}

const MASTERY_RANKS = [
  ['1', '1d3', '1', '1'],
  ['2', '1d4', '2', '2'],
  ['3', '1d4', '3', '3'],
  ['4', '1d6', '4', '4'],
  ['5', '1d6', '5', '5'],
  ['6', '1d8', '6', '6'],
  ['7', '1d8', '7', '7'],
  ['8', '1d10', '8', '8'],
  ['9', '1d10 / 1d12*', '9', '9'],
]

// ── RANK LIST ─────────────────────────────────────────────────────────────────
function RankList({ intro, ranks, note }) {
  return (
    <div>
      {intro && <div style={{ fontSize: '.83rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.5 }}>{intro}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {ranks.map(([rank, desc]) => (
          <div key={rank} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ ...rankCell, minWidth: 52, flexShrink: 0 }}>Rank {rank}:</span>
            <span style={{ fontSize: '.83rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{desc}</span>
          </div>
        ))}
      </div>
      {note && <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 10, fontStyle: 'italic', borderLeft: '2px solid var(--border2)', paddingLeft: 8 }}>{note}</div>}
    </div>
  )
}

// ── GENERIC TABLE ─────────────────────────────────────────────────────────────
function GenericTable({ intro, headers, rows, note }) {
  return (
    <div>
      {intro && <div style={{ fontSize: '.83rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.5 }}>{intro}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              {headers.map(h => <th key={h} style={{ ...hdrCell }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((val, j) => (
                  <td key={j} style={j === 0 ? rankCell : cell}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 10, fontStyle: 'italic', borderLeft: '2px solid var(--border2)', paddingLeft: 8 }}>{note}</div>}
    </div>
  )
}

// ── SKILL FORMATTING MAP ──────────────────────────────────────────────────────
export const SKILL_FORMATS = {

  // ── MASTERY SKILLS ──────────────────────────────────────────────────────────
  'Order Mastery': () => (
    <MasteryTable
      intro="Determines the quality of your dice and maximum spell level when channeling the power of Order."
      dieName="Black Die Quality"
      ranks={MASTERY_RANKS}
    />
  ),
  'Will Mastery': () => (
    <MasteryTable
      intro="Determines the quality of your dice and maximum spell level when channeling the power of Will."
      dieName="Blue Die Quality"
      ranks={MASTERY_RANKS}
    />
  ),
  'Chaos Mastery': () => (
    <MasteryTable
      intro="Determines the quality of your dice and maximum spell level when channeling the power of Chaos."
      dieName="White Die Quality"
      ranks={MASTERY_RANKS}
    />
  ),
  'Elemental Mastery': () => (
    <MasteryTable
      intro="Determines the quality of your dice and maximum spell level when channeling the power of the Elements."
      dieName="Red Die Quality"
      ranks={MASTERY_RANKS}
    />
  ),
  'Chi Mastery': () => (
    <MasteryTable
      intro="Determines the quality of your dice and maximum spell level when channeling the power of Chi."
      dieName="Green Die Quality"
      ranks={MASTERY_RANKS}
    />
  ),

  // ── MANA MASTERY ────────────────────────────────────────────────────────────
  'Mana Mastery': () => (
    <RankList ranks={[
      ['1', 'Reroll all 1s when generating mana.'],
      ['2', 'Also reroll all 2s on d6s or larger when generating mana.'],
      ['3', 'Also reroll all 3s on d8s or larger when generating mana.'],
      ['4', 'Also reroll all 4s on d10s when generating mana.'],
    ]} />
  ),

  // ── WIND STANCE ─────────────────────────────────────────────────────────────
  'Wind Stance': () => (
    <RankList
      intro="+1 foot/action and +1 Evasion per rank. -1 penalty to all ranged attacks against you per 2 ranks. Additional abilities below:"
      ranks={[
        ['3', 'You can wall jump double the height of your normal jump.'],
        ['6', 'You can run along walls for short distances.'],
        ['9', 'You can now run on water for short distances.'],
      ]}
    />
  ),

  // ── CURSED BLADE ────────────────────────────────────────────────────────────
  'Cursed Blade': () => (
    <GenericTable
      intro="Target Melee Weapon becomes cursed and linked to the caster, granting increasing benefits with rank. All benefits apply if the weapon is thrown."
      headers={['Rank', 'AP', 'PR', 'Other Effects']}
      rows={[
        ['1', '1', '1', '1 damage/round to anyone else grasping it.'],
        ['2', '2', '2', 'Always know its direction.'],
        ['3', '3', '3', 'Summon the weapon 1/week (9 actions).'],
        ['4', '4', '4', 'Melee Crit number reduced by 1.'],
        ['5', '5', '5', 'Every wound caused heals you 1 HP.'],
        ['6', '6', '6', 'You can hear what it hears.'],
      ]}
    />
  ),

  // ── CURSED BOW ──────────────────────────────────────────────────────────────
  'Cursed Bow': () => (
    <GenericTable
      intro="Target Ranged Weapon becomes cursed and linked to the caster, granting increasing benefits with rank."
      headers={['Rank', 'AP', 'PR', 'Other Effects']}
      rows={[
        ['1', '1', '1', '1 damage/round to anyone else grasping it.'],
        ['2', '2', '2', 'Always know its direction.'],
        ['3', '3', '3', 'Summon the weapon 1/week (9 actions).'],
        ['4', '4', '4', 'Ranged Crit number reduced by 1.'],
        ['5', '5', '5', 'Every wound caused heals you 1 HP.'],
        ['6', '6', '6', 'You can hear what it hears.'],
      ]}
    />
  ),

  // ── RUTHLESS TEMPO ──────────────────────────────────────────────────────────
  'Ruthless Tempo': () => (
    <GenericTable
      intro="Improves your chance to roll a critical with melee attacks. The table below shows the total natural roll needed for a critical, by combat die type and Ruthless Tempo rank."
      headers={['Rank', 'D12', 'D10', 'D8', 'D6']}
      rows={[
        ['0 (base)', '23', '20', '16', '12'],
        ['1', '22', '19', '16', '12'],
        ['2', '21', '18', '15', '11'],
        ['3', '20', '17', '14', '11'],
        ['4', '19', '16', '13', '10'],
      ]}
    />
  ),

  // ── THE WOLF WITHIN ─────────────────────────────────────────────────────────
  'The Wolf Within': () => (
    <RankList ranks={[
      ['1', 'Phase 2 starts 6 days before the full moon and ends 6 days afterwards instead of 3. (13 days instead of 7)'],
      ['2', 'Phase 2 starts 10 days before the full moon and ends 10 days afterwards. (21 days)'],
      ['3', 'Phase 2 effects apply all the time.'],
    ]} />
  ),

  // ── EMBRACE THE WOLF ────────────────────────────────────────────────────────
  'Embrace the Wolf': () => (
    <RankList ranks={[
      ['1', 'The Willpower Check on full moon nights does not prevent transformation. Instead, if passed, you remain aware of yourself and may attempt to resist any specific action with a Willpower Check 25.'],
      ['2', 'You will transform when provoked enough any time in phase 2. (rage or pain)'],
      ['3', 'When transformed you are in complete control of your actions, subject to Willpower Checks when the GM feels an action is very tempting to the wolf.'],
      ['4', 'You may transform at will anytime in phase 2.'],
    ]} />
  ),

  // ── BODYBUILDING ────────────────────────────────────────────────────────────
  'Bodybuilding': () => (
    <RankList
      ranks={[
        ['1', '+1 on Strength Checks.'],
        ['2', '+2 on Strength Checks.'],
        ['3', '+1 Strength attribute.'],
        ['4', '+3 on Strength Checks.'],
        ['5', '+4 on Strength Checks.'],
        ['6', '+2 Strength attribute (total). +4 Strength Checks (does not apply to combat rolls, only checks such as forcing a locked door).'],
      ]}
      note="No more than 40 points can be spent on this skill during any given level."
    />
  ),

  // ── CONDITIONING ────────────────────────────────────────────────────────────
  'Conditioning': () => (
    <RankList ranks={[
      ['1', '+1 on Constitution Checks.'],
      ['2', '+2 on Constitution Checks.'],
      ['3', '+1 Constitution attribute.'],
      ['4', '+3 on Constitution Checks.'],
      ['5', '+4 on Constitution Checks.'],
      ['6', '+2 Constitution attribute (total).'],
    ]}
    note="No more than 40 points can be spent on this skill during any given level."
    />
  ),

  // ── HARDENED RESOLVE ────────────────────────────────────────────────────────
  'Hardened Resolve': () => (
    <RankList ranks={[
      ['1', '+1 on Willpower Checks.'],
      ['2', '+2 on Willpower Checks.'],
      ['3', '+1 Willpower attribute.'],
      ['4', '+3 on Willpower Checks.'],
      ['5', '+4 on Willpower Checks.'],
      ['6', '+2 Willpower attribute (total).'],
    ]}
    note="No more than 40 points can be spent on this skill during any given level."
    />
  ),

  // ── OBSERVATION TRAINING ────────────────────────────────────────────────────
  'Observation Training': () => (
    <RankList ranks={[
      ['1', '+1 on Awareness Checks.'],
      ['2', '+2 on Awareness Checks.'],
      ['3', '+1 Awareness attribute.'],
      ['4', '+3 on Awareness Checks.'],
      ['5', '+4 on Awareness Checks.'],
      ['6', '+2 Awareness attribute (total).'],
    ]}
    note="No more than 40 points can be spent on this skill during any given level."
    />
  ),

  // ── PERSUASION ──────────────────────────────────────────────────────────────
  'Persuasion': () => (
    <RankList ranks={[
      ['1', '+1 on Charisma Checks.'],
      ['2', '+2 on Charisma Checks.'],
      ['3', '+1 Charisma attribute.'],
      ['4', '+3 on Charisma Checks.'],
      ['5', '+4 on Charisma Checks.'],
      ['6', '+2 Charisma attribute (total).'],
    ]}
    note="No more than 40 points can be spent on this skill during any given level."
    />
  ),

  // ── REFLEX TRAINING ─────────────────────────────────────────────────────────
  'Reflex Training': () => (
    <RankList ranks={[
      ['1', '+1 on Dexterity Checks.'],
      ['2', '+2 on Dexterity Checks.'],
      ['3', '+1 Dexterity attribute.'],
      ['4', '+3 on Dexterity Checks.'],
      ['5', '+4 on Dexterity Checks.'],
      ['6', '+2 Dexterity attribute (total).'],
    ]}
    note="No more than 40 points can be spent on this skill during any given level."
    />
  ),
}

// ── FORMATTED DESCRIPTION COMPONENT ──────────────────────────────────────────
export function FormattedSkillDescription({ skillName, fallback }) {
  const formatter = SKILL_FORMATS[skillName]
  if (formatter) return formatter()
  if (!fallback) return null
  return (
    <div style={{ fontSize: '.83rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
      {fallback}
    </div>
  )
}

// BioPage.jsx
// Character biography, image, and level up wizard
import { useState, useMemo, useEffect } from 'react'
import racesData from '../data/races.json'
import ConfirmModal from './ConfirmModal'
import { supabase } from '../supabase'
import { loadAllCampaigns } from '../characterDB'
import armorData from '../data/armor.json'
import { getRace } from '../utils/raceUtils'

// ── RACES LIST ────────────────────────────────────────────────────────────────
const RACE_OPTIONS = Object.entries(racesData).map(([key, r]) => ({ key, name: r.name })).sort((a, b) => a.name.localeCompare(b.name))

// ── STYLES ────────────────────────────────────────────────────────────────────
const surface = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '16px 18px',
}

const lbl = {
  fontSize: '.6rem', letterSpacing: '.16em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif',
  display: 'block', marginBottom: 4,
}

const sectionTitle = {
  fontSize: '.75rem', letterSpacing: '.2em', color: 'var(--gold)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 12,
}

const inputStyle = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 4, color: 'var(--text)', fontFamily: 'Georgia, serif',
  fontSize: '.9rem', padding: '6px 10px', width: '100%', boxSizing: 'border-box',
}

const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6,
}

const selectStyle = {
  ...inputStyle, cursor: 'pointer',
}

const saveBtn = {
  padding: '8px 20px', background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a',
  color: '#4a9e4a', borderRadius: 5, cursor: 'pointer',
  fontFamily: 'Georgia, serif', fontSize: '.9rem',
}

const field = (label, children) => (
  <div style={{ marginBottom: 12 }}>
    <span style={lbl}>{label}</span>
    {children}
  </div>
)

// ── ROLL20 EXPORT ─────────────────────────────────────────────────────────────
function getBodyArmor(code) {
  if (!code || code === 'None') return armorData.bodyArmor[0]
  return armorData.bodyArmor.find(a => a.code === code) || armorData.bodyArmor[0]
}
function getHelm(code) {
  if (!code || code === 'None') return armorData.helms[0]
  return armorData.helms.find(h => h.code === code) || armorData.helms[0]
}
function getShieldMat(code) {
  if (!code || code === 'None') return null
  const matMap = { L: 'Leather', W: 'Wood', M: 'Metal' }
  const mat = matMap[code[1]]
  return armorData.shieldMaterials.find(m => m.material === mat) || null
}
function getShieldSize(code) {
  if (!code || code === 'None') return null
  const sizeMap = { S: 'Small', M: 'Medium', L: 'Large', T: 'Tower' }
  const size = sizeMap[code[0]]
  return armorData.shieldSizes.find(s => s.size === size) || null
}

function exportName(character) {
  const form = character.activeForm && character.activeForm !== 'None' ? character.activeForm : null
  if (!form) return character.name || 'Unknown'
  const firstName = (character.name || '').split(/[\s-]/)[0]
  return `${firstName} the ${form}`
}

function buildSetAttr(character, stats) {
  const name = exportName(character)
  const armor = character.armor || {}

  // AR per body section (humanoid layout)
  // BS1=Torso, BS2=R.Leg, BS3=L.Leg, BS4=R.Arm, BS5=L.Arm, BS6=Head
  const helmCode  = armor.head?.type  || 'None'
  const torsoCode = armor.torso?.type || 'None'
  const rArmCode  = armor.rArm?.type  || 'None'
  const lArmCode  = armor.lArm?.type  || 'None'
  const rLegCode  = armor.rLeg?.type  || 'None'
  const lLegCode  = armor.lLeg?.type  || 'None'
  const shieldCode = armor.shield?.type || 'None'

 // Blow Deflection: +rank AR on each plate location, and on head if metal helm
  const BS6AR = (getHelm(helmCode)?.arHead ?? 0)        + (stats.deflectionAR?.head  ?? 0)
  const BS1AR = (getBodyArmor(torsoCode)?.arTorso ?? 0) + (stats.deflectionAR?.torso ?? 0)
  const BS4AR = (getBodyArmor(rArmCode)?.arArms ?? 0)   + (stats.deflectionAR?.rArm  ?? 0)
  const BS5AR = (getBodyArmor(lArmCode)?.arArms ?? 0)   + (stats.deflectionAR?.lArm  ?? 0)
  const BS2AR = (getBodyArmor(rLegCode)?.arArms ?? 0)   + (stats.deflectionAR?.rLeg  ?? 0)
  const BS3AR = (getBodyArmor(lLegCode)?.arArms ?? 0)   + (stats.deflectionAR?.lLeg  ?? 0)

  const shieldMat = getShieldMat(shieldCode)
  const shieldHP  = shieldMat?.hp ?? 0

  // Helper: coerce undefined/null to 0
  const v = (x) => x ?? 0
const stanceRank = (n) => parseInt(character.arcaneSkills?.[n]?.rank) || 0
const martialRank = (n) => parseInt(character.martialSkills?.[n]?.rank) || 0
const manaMasteryRank = Math.min(parseInt(character.arcaneSkills?.['Mana Mastery']?.rank) || 0, 4)
const manaItemBonus = character.stuff?.magicBonuses?.mana ?? 0
  // Combat die: strip leading 'd' to get plain number
  const cd = (dieStr) => parseInt(String(dieStr ?? '0').replace(/\D/g, '')) || 0

  function checkAdv(attr) {
  const { advantage, disadvantage } = stats.attributes[attr]
  if (advantage && disadvantage) return 1
  if (advantage) return 2
  if (disadvantage) return 0
  return 1
}

  // Weaving dice — export as plain number (e.g. 6 for d6, 0 if none)
  const dieMap = {
    chaos: 'White_Die', chi: 'Green_Die', elemental: 'Red_Die',
    order: 'Black_Die', will: 'Blue_Die',
  }
  const weavingParts = Object.entries(dieMap).map(([color, attr]) => {
    const dieStr = stats.weavingDice?.[color] || '0'
    const num = parseInt(String(dieStr).replace(/\D/g, '')) || 0
    return `--${attr}|${num}`
  })

  // Melee slots S1–S4, pad to 4 with empty slots
  const meleeSlots = (stats.meleeSlots || []).filter(Boolean).slice(0, 4)
  const slotParts = []

  for (let i = 0; i < 4; i++) {
    const n = i + 1
    const slot = meleeSlots[i]
    if (slot) {
      const slotName = slot.formAttack ? `${slot.slotLabel || slot.name} (${slot.formAttack})` : (slot.slotLabel || slot.name)
      const dmgDie = slot.formDamage != null ? slot.formDamage : (slot.damageDie || '-')
      const dmgTotal = slot.formDamage != null ? 0 : v(slot.damage)
      slotParts.push(`--S${n}_name|${slotName} --S${n}_combat_die|${cd(slot.combatDie)} --S${n}_expertise|${v(slot.expertise)} --S${n}_damage_die|${dmgDie} --S${n}_totalDamage|${dmgTotal} --S${n}_precision|${v(slot.precision)} --S${n}_crit_number|${v(slot.critNumber)} --S${n}_crit_damage|${v(slot.critDamage)} --S${n}_Breeches|${v(slot.breaches)} --S${n}_ar_bypass|${v(slot.armorBypass)} --S${n}_mov_ap|${v(slot.movBypassRate)}`)
    } else {
      slotParts.push(`--S${n}_name| --S${n}_combat_die|0 --S${n}_expertise|0 --S${n}_damage_die|- --S${n}_totalDamage|0 --S${n}_precision|0 --S${n}_crit_number|0 --S${n}_crit_damage|0 --S${n}_Breeches|0 --S${n}_ar_bypass|0 --S${n}_mov_ap|0`)
    }
  }

  // Shield slot S5
  const s5 = stats.shieldSlot
  if (s5) {
    slotParts.push(`--S5_name|${s5.slotLabel || s5.name} --S5_combat_die|${cd(s5.combatDie)} --S5_expertise|${v(s5.expertise)} --S5_damage|${v(s5.damage)} --S5_precision|${v(s5.precision)} --S5_crit_number|${v(s5.critNumber)} --S5_crit_damage|${v(s5.critDamage)} --S5_ar_bypass|${v(s5.armorBypass)} --S5_mov_ap|${v(s5.movBypassRate)}`)
  } else {
    slotParts.push(`--S5_name| --S5_combat_die|0 --S5_expertise|0 --S5_damage|0 --S5_precision|0 --S5_crit_number|0 --S5_crit_damage|0 --S5_ar_bypass|0 --S5_mov_ap|0`)
  }

  // Ranged slots S6–S7, pad to 2 with empty slots
  const rangedSlots = (stats.rangedSlots || []).filter(Boolean).slice(0, 2)
  for (let i = 0; i < 2; i++) {
    const n = i + 6
    const slot = rangedSlots[i]
    if (slot) {
      const ranges = slot.ranges || {}
      const rangeStr = [ranges.short, ranges.medium, ranges.long, ranges.veryLong].filter(Boolean).join('/')
      slotParts.push(`--S${n}_name|${slot.slotLabel || slot.name} --S${n}_combat_die|${cd(slot.combatDie)} --S${n}_marksmanship|${v(slot.marksmanship)} --S${n}_damage_die|${slot.damageDie || '-'} --S${n}_totalDamage|${v(slot.damage)} --S${n}_Breeches|${v(slot.breaches)} --S${n}_precision|${v(slot.precision)} --S${n}_crit_damage|${v(slot.critDamage)} --S${n}_ar_bypass|${v(slot.armorBypass)} --S${n}_hs_damage|${v(slot.hsDamageRate)} --S${n}_hs_pr|${v(slot.hsPrecisionRate)} --S${n}_hs_ap|${v(slot.hsArmorBypassRate)} --S${n}_range|${rangeStr}`)
    } else {
      slotParts.push(`--S${n}_name| --S${n}_combat_die|0 --S${n}_marksmanship|0 --S${n}_damage_die|- --S${n}_totalDamage|0 --S${n}_precision|0 --S${n}_crit_damage|0 --S${n}_ar_bypass|0 --S${n}_hs_damage|0 --S${n}_Breeches|0 --S${n}_hs_pr|0 --S${n}_hs_ap|0 --S${n}_range|`)
    }
  }

  // General skill scores — undefined → 0, fix capitalisation for Transformed_Acrobatics
  const skillParts = Object.entries(stats.generalSkillScores || {}).map(([key, val]) => {
    const fixedKey = key.replace('Skill_transformed_acrobatics', 'Skill_Transformed_Acrobatics')
    return `--${fixedKey}|${v(val)}`
  })

  const parts = [
    `!setattr --name ${name}`,
    `--Strength|${v(stats.attributes?.str?.effective)} --Dexterity|${v(stats.attributes?.dex?.effective)} --Constitution|${v(stats.attributes?.con?.effective)} --Awareness|${v(stats.attributes?.aw?.effective)} --Charisma|${v(stats.attributes?.chr?.effective)} --Willpower|${v(stats.attributes?.wp?.effective)}`,
    `--Str_adv|${checkAdv('str')} --Str_mod|${v(stats.attributes.str.checkMod)} --Dex_adv|${checkAdv('dex')} --Dex_mod|${v(stats.attributes.dex.checkMod)} --Con_adv|${checkAdv('con')} --Con_mod|${v(stats.attributes.con.checkMod)} --Aw_adv|${checkAdv('aw')} --Aw_mod|${v(stats.attributes.aw.checkMod)} --Chr_adv|${checkAdv('chr')} --Chr_mod|${v(stats.attributes.chr.checkMod)} --WP_adv|${checkAdv('wp')} --WP_mod|${v(stats.attributes.wp.checkMod)}`,
    `--Evasion|${v(stats.evasionNoShield)} --Evasion_Shield|${v(stats.evasion)} --RearEV|${v(stats.rearEvasion)} --initiative_bonus|${v(stats.initiative)} --Damage_Bonus|${v(stats.damageBonus)} --Committed_Strikes|${v(stats.committedStrikesRank)} --Parry_rank|${v(stats.parryRank)} --Combat_Intensity|${martialRank('Combat Intensity')} --MoV_Damage_Rate|${v(stats.movDamageRate)} --MoV_PR_Rate|${v(stats.movPrecisionRate)} --Move|${v(stats.movement)}`,
    `--BonusAR|${v(stats.bonusAR)} --NaturalArmor|${v(stats.naturalArmor)} --ShieldAR|${v(stats.shieldAR)} --ShieldHP|${shieldHP}`,
    `--BS1AR|${BS1AR} --BS2AR|${BS2AR} --BS3AR|${BS3AR} --BS4AR|${BS4AR} --BS5AR|${BS5AR} --BS6AR|${BS6AR}`,
    `--BS1HP|${v(stats.hp?.torso)} --BS2HP|${v(stats.hp?.leg)} --BS3HP|${v(stats.hp?.leg)} --BS4HP|${v(stats.hp?.arm)} --BS5HP|${v(stats.hp?.arm)} --BS6HP|${v(stats.hp?.head)}`,
    `--Char_Level|${character.level || 1}`,
    `--Race|${character.race || ''}`,
    `--Arcane_Power|${v(stats.arcanePower)} --ArcaneMentalityRank|${v(stats.arcaneMentality)} --Mana_mastery_rank|${manaMasteryRank} --Mana_bonus|${v(manaItemBonus)} --Yellow_Die|0`,
    `--Wind_Stance_Rank|${stanceRank('Wind Stance')} --Wave_Stance_Rank|${stanceRank('Wave Stance')} --Stone_Stance_Rank|${stanceRank('Stone Stance')} --Flame_Stance_Rank|${stanceRank('Flame Stance')}`,
    ...weavingParts,
    ...slotParts,
    ...skillParts,
  ]

  return parts.join(' ')
}

function Roll20ExportModal({ character, stats, onClose }) {
  const [step, setStep] = useState('confirm')
  const [copied, setCopied] = useState(false)
  const name = exportName(character)
  const exportText = step === 'export' ? buildSetAttr(character, stats) : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  }
  const boxStyle = {
    background: 'var(--surface)', border: '1px solid var(--border2)',
    borderRadius: 10, padding: 24, maxWidth: 560, width: '100%',
    maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 8px 40px rgba(0,0,0,.7)',
  }
  const rowStyle = {
    display: 'flex', gap: 12, marginBottom: 10, alignItems: 'baseline',
  }
  const rowLbl = {
    fontSize: '.6rem', letterSpacing: '.16em', color: 'var(--text3)',
    textTransform: 'uppercase', fontFamily: 'Georgia, serif', minWidth: 64,
  }
  const rowVal = {
    fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600,
  }

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <h3 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 20, fontSize: '1.1rem' }}>
          Roll20 Export
        </h3>

        {step === 'confirm' ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={rowStyle}>
                <span style={rowLbl}>Name</span>
                <span style={rowVal}>{name}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
                Cancel
              </button>
              <button onClick={() => setStep('export')} style={{ padding: '8px 20px', background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem', fontWeight: 600 }}>
                Proceed
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginBottom: 12 }}>
              Copy the text below and paste it into Roll20 chat.
            </div>
            <textarea
              readOnly
              value={exportText}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text2)', fontFamily: 'monospace',
                fontSize: '.72rem', padding: '10px 12px', minHeight: 200,
                resize: 'vertical', lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
                Close
              </button>
              <button onClick={handleCopy} style={{ padding: '8px 20px', background: copied ? 'rgba(74,158,74,.15)' : 'rgba(201,168,76,.15)', border: `1px solid ${copied ? '#4a9e4a' : 'var(--gold)'}`, color: copied ? '#4a9e4a' : 'var(--gold2)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem', fontWeight: 600, transition: 'all .2s' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── LEVEL UP WIZARD ───────────────────────────────────────────────────────────
function LevelUpWizard({ character, stats, onUpdate, onClose }) {
  const currentLevel = character.level || 1
  const currentMaint = stats?.skillPoints?.currentMaintenance ?? 0

  // Calculate default points for next level
 const race = getRace(character.race)
  const basePoints = 65 + (race.skillPointsPerLevelModifier || 0)
  const ironBonus = character.patronMark?.mark === 'Iron' ? 2 : 0

  const [pointsThisLevel, setPointsThisLevel] = useState(basePoints + ironBonus)
  const [confirmed, setConfirmed] = useState(false)

  const currentEarned = character.skillPoints?.totalEarned ?? 0
  const currentMaintenancePaid = character.skillPoints?.maintenancePaid ?? 0

  const newEarned = currentEarned + pointsThisLevel
  const newMaintenancePaid = currentMaintenancePaid + currentMaint
  const newLevel = currentLevel + 1

  const handleConfirm = () => {
    onUpdate({
      ...character,
      level: newLevel,
      levelUpAuthorized: false,
      skillPoints: {
        ...character.skillPoints,
        totalEarned: newEarned,
        maintenancePaid: newMaintenancePaid,
      }
    })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: 24, maxWidth: 420, width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,.6)',
      }}>
        <h2 style={{ color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 4, fontSize: '1.3rem' }}>
          Level Up
        </h2>
        <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginBottom: 20 }}>
          Level {currentLevel} → {newLevel}
        </div>

        {/* Points this level */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>Skill Points Gained This Level</span>
          <input
            type="number"
            value={pointsThisLevel}
            onChange={e => setPointsThisLevel(parseInt(e.target.value) || 0)}
            style={{ ...inputStyle, width: 80 }}
          />
          <div style={{ fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 4 }}>
            Base {basePoints}{ironBonus > 0 ? ` + ${ironBonus} (Iron Mark)` : ''}
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '12px 14px', marginBottom: 20,
        }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text3)', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 10 }}>Summary</div>
          {[
            ['Points Earned', `${currentEarned} → ${newEarned}`],
            ['Maintenance Paid', `${currentMaintenancePaid} → ${newMaintenancePaid} (+${currentMaint})`],
            ['Level', `${currentLevel} → ${newLevel}`],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.82rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>{l}</span>
              <span style={{ fontSize: '.82rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}>
            Cancel
          </button>
         <button onClick={handleConfirm} disabled={!character.levelUpAuthorized}
            style={{ ...saveBtn, opacity: character.levelUpAuthorized ? 1 : 0.4, cursor: character.levelUpAuthorized ? 'pointer' : 'not-allowed' }}>
            {character.levelUpAuthorized ? 'Confirm Level Up' : 'Awaiting GM Authorization'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN BIO PAGE ─────────────────────────────────────────────────────────────
export default function BioPage({ character, onUpdateCharacter, stats, gmModeActive, onRestartTour, onNavigate }) {
  const gmMode = !!gmModeActive
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [raceLocked, setRaceLocked] = useState(!!(character.race && character.raceLocked))
  const [showMaintBreakdown, setShowMaintBreakdown] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)
  useEffect(() => { loadAllCampaigns().then(setCampaigns) }, [])
  const bio = character.bio || {}
  const sp = character.skillPoints || {}

  const updateBio = (field, value) => {
    onUpdateCharacter({ ...character, bio: { ...bio, [field]: value } })
  }

  const updateChar = (field, value) => {
    onUpdateCharacter({ ...character, [field]: value })
  }

  // Live maintenance calculation
  const currentMaintenance = useMemo(() => {
    const allSkills = [
      ...Object.values(character.martialSkills || {}),
      ...Object.values(character.arcaneSkills || {}),
      ...Object.values(character.selfImprovementSkills || {}),
    ]
    return allSkills.reduce((sum, s) => sum + (parseInt(s.maintenanceCost) || 0), 0)
  }, [character])

  // Skill points display
 const totalEarned = stats?.skillPoints?.totalEarned ?? 0
  const bonusGiven = stats?.skillPoints?.bonusGiven ?? 0
  const maintenancePaid = stats?.skillPoints?.maintenancePaid ?? 0
  const totalSpent = stats?.skillPoints?.totalSpent ?? 0
  const available = stats?.skillPoints?.unspent ?? (totalEarned - totalSpent - maintenancePaid)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>

      {/* Level Up Wizard */}
      {showLevelUp && (
        <LevelUpWizard
          character={character}
          stats={{ ...stats, skillPoints: { ...(stats?.skillPoints || {}), currentMaintenance } }}
          onUpdate={onUpdateCharacter}
          onClose={() => setShowLevelUp(false)}
        />
      )}
      {/* Roll20 Export Modal */}
      {showExport && gmMode && (
        <Roll20ExportModal
          character={character}
          stats={stats}
          onClose={() => setShowExport(false)}
        />
      )}
      {/* Header row: GM mode + Level Up + Tour */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

        <button 
          data-tour="bio-levelup-btn"
          onClick={() => setShowLevelUp(true)} 
          disabled={!character.levelUpAuthorized && !gmMode}
          style={{ ...saveBtn, opacity: (character.levelUpAuthorized || gmMode) ? 1 : 0.4, cursor: (character.levelUpAuthorized || gmMode) ? 'pointer' : 'not-allowed' }}
        >
          {character.levelUpAuthorized ? 'Level Up →' : gmMode ? 'Level Up (GM) →' : '🔒 Level Up'}
        </button>
        {gmMode && (
          <button
            onClick={() => setShowExport(true)}
            style={{ padding: '8px 20px', background: 'rgba(74,144,217,.1)', border: '1px solid #4a90d9', color: '#4a90d9', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem' }}
          >
            Roll20 Export
          </button>
        )}
        <button
  data-tour="bio-handbook-btn"
  onClick={() => window.open('https://docs.google.com/document/d/1qD5UADHYXfC_W0bHLyy_Z_ZEkz_gZi8IgBeZMPLBnKI/edit?tab=t.0', '_blank')}
  style={{
    marginLeft: 'auto', padding: '7px 12px',
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text3)', borderRadius: 4, cursor: 'pointer',
    fontFamily: 'Georgia, serif', fontSize: '.78rem', letterSpacing: '.06em',
  }}
>{'📖 Handbook'}</button>
        {onRestartTour && (
          <button
            data-tour="bio-restart-tour"
            onClick={onRestartTour}
            title="Restart the new player tour"
            style={{
               padding: '7px 12px',
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text3)', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: '.78rem', letterSpacing: '.06em',
            }}
          >❓ Tour</button>
        )}
      </div>

      {/* Skill Points Summary */}
      <div data-tour="bio-skillpoints" style={surface}>
        <div style={sectionTitle}>Skill Points</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            ['Unspent', available, available < 0 ? '#c94a4a' : 'var(--gold2)'],
            ['Earned', totalEarned, 'var(--gold2)'],
            ['Spent', totalSpent, 'var(--text2)'],
            ['Maint. Paid', maintenancePaid, 'var(--text2)'],
          ].map(([l, v, color]) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ ...lbl, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif', color }}>{v}</div>
            </div>
          ))}

          {/* Cur. Maint with breakdown tooltip */}
          <div style={{ textAlign: 'center', minWidth: 70, position: 'relative' }}>
            <div style={{ ...lbl, marginBottom: 2 }}>Maint next lvl</div>
            <div
              onClick={() => setShowMaintBreakdown(!showMaintBreakdown)}
              style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'Georgia, serif', color: currentMaintenance > 0 ? '#c94a4a' : 'var(--text3)', cursor: 'pointer', borderBottom: '1px dotted currentColor' }}
            >
              {currentMaintenance}
            </div>
            {showMaintBreakdown && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: '10px 14px', zIndex: 100, minWidth: 200, marginTop: 6, boxShadow: '0 4px 20px rgba(0,0,0,.5)' }}>
                <div style={{ ...lbl, marginBottom: 8 }}>Breakdown</div>
                {[
                  ...Object.entries(character.martialSkills || {}),
                  ...Object.entries(character.arcaneSkills || {}),
                  ...Object.entries(character.selfImprovementSkills || {}),
                ].filter(([, data]) => {
                  const pts = parseInt(data.pointsInvested) || 0
                  return pts > 0 && Math.floor(parseFloat(data.maintenanceCost) || 0) > 0
                }).map(([name, data]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
                    <span style={{ fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{name}</span>
                    <span style={{ fontSize: '.8rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                     {Math.floor(parseFloat(data.maintenanceCost) || 0)}
                    </span>
                  </div>
                ))}
                {currentMaintenance === 0 && (
                  <div style={{ fontSize: '.8rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No maintenance costs</div>
                )}
                <button onClick={() => setShowMaintBreakdown(false)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.75rem', fontFamily: 'Georgia, serif' }}>Close</button>
              </div>
            )}
          </div>

          {gmMode && (
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <span style={lbl}>Bonus Pts</span>
              <input
                type="number"
                value={bonusGiven}
                onChange={e => onUpdateCharacter({ ...character, skillPoints: { ...sp, bonusGiven: parseInt(e.target.value) || 0 } })}
                style={{ ...inputStyle, width: 70, textAlign: 'center', padding: '3px 6px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Character image + core info */}
      <div style={{ ...surface, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Token image */}
        <div data-tour="bio-portrait" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: 8,
            border: '2px solid var(--border2)',
            background: 'var(--bg2)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src={character.imageUrl || '/default-token.png'} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Upload button — available to all players */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <label style={{
              padding: '5px 12px', background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)',
              color: 'var(--gold2)', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: '.78rem', whiteSpace: 'nowrap',
            }}>
              {uploading ? 'Uploading...' : '↑ Upload Token'}
              <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 1024 * 1024) {
                    alert('Image must be under 1MB.')
                    return
                  }
                  setUploading(true)
                  try {
                    const ext = file.name.split('.').pop()
                    const path = `${character.createdBy}/${character.name}-${Date.now()}.${ext}`
                    const { error: uploadError } = await supabase.storage
                      .from('Tokens')
                      .upload(path, file, { upsert: true })
                    if (uploadError) throw uploadError
                    const { data } = supabase.storage.from('Tokens').getPublicUrl(path)
                    updateChar('imageUrl', data.publicUrl)
                  } catch (err) {
                    console.error('Upload error:', err)
                    alert('Upload failed. Please try again.')
                  } finally {
                    setUploading(false)
                  }
                }}
              />
            </label>
            {character.imageUrl && (
              <button onClick={() => updateChar('imageUrl', '')}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.7rem' }}>
                Remove image
              </button>
            )}
          </div>

          {/* GM can also paste a URL directly */}
          {gmMode && (
            <input
              placeholder="Or paste URL..."
              value={character.imageUrl || ''}
              onChange={e => updateChar('imageUrl', e.target.value)}
              style={{ ...inputStyle, fontSize: '.72rem', width: 120 }}
            />
          )}
        </div>

        {/* Core fields */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field('Name',
              <input style={inputStyle} value={character.name || ''} onChange={e => updateChar('name', e.target.value)} />
            )}
            {field('Player',
              <input style={inputStyle} value={character.player || ''} onChange={e => updateChar('player', e.target.value)} />
            )}
            {field('Profession',
              <input style={inputStyle} value={character.profession || ''} onChange={e => updateChar('profession', e.target.value)} />
            )}
            {field('Level',
              <div style={{ fontSize: '1.1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, padding: '6px 0' }}>
                {character.level || 1}
                {gmMode && (
                  <button
                    onClick={() => onUpdateCharacter({ ...character, level: Math.max(1, (character.level || 1) - 1) })}
                    style={{ marginLeft: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: '.8rem' }}
                  >−</button>
                )}
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              {field('Race',
  raceLocked && !gmMode
    ?         <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, padding: '6px 0' }}>{character.race}</div>
    :           <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                 <select value={character.race || ''} onChange={e => {
  const name = e.target.value
  onUpdateCharacter({ ...character, race: name })
}} style={selectStyle}>
                  <option value="">— Choose Race —</option>
                  {RACE_OPTIONS.map(r => <option key={r.key} value={r.name}>{r.name}</option>)}
                  </select>
                  {gmMode && raceLocked && (
                  <button
                   onClick={() => setConfirmModal({ message: 'Unlock race selection for the player?', onConfirm: () => { setRaceLocked(false); onUpdateCharacter({ ...character, raceLocked: false }); setConfirmModal(null) } })}
                    style={{ padding: '5px 10px', background: 'none', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem', whiteSpace: 'nowrap' }}
                   >Unlock</button>
                  )}
                  {!raceLocked && (
                  <button
                 onClick={() => setConfirmModal({ message: `Lock race as ${character.race}? This cannot be changed without GM mode.`, onConfirm: () => { setRaceLocked(true); onUpdateCharacter({ ...character, raceLocked: true }); setConfirmModal(null) } })}
                  style={{ padding: '5px 10px', background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem', whiteSpace: 'nowrap' }}
                 >Lock</button>
                 )}
                </div>
)}
            </div>
            <div data-tour="bio-campaign" style={{ gridColumn: '1 / -1' }}>
              {field('Campaign',
                character.campaignLocked
                  ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, padding: '6px 0' }}>
      {campaigns.find(c => c.id === character.campaignId)?.name || 'Unknown Campaign'}
    </div>
    {gmMode && (
      <button
        onClick={() => onUpdateCharacter({ ...character, campaignLocked: false })}
        style={{ padding: '5px 10px', background: 'none', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}
      >Unlock (GM)</button>
    )}
  </div>
                  : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        value={character.campaignId || ''}
                        onChange={e => {
                          onUpdateCharacter({ ...character, campaignId: e.target.value })
                        }}
                        style={selectStyle}
                      >
                        <option value="">— Choose Campaign —</option>
                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {!character.campaignLocked && character.campaignId && (
                        <button
                         onClick={() => setConfirmModal({ message: 'Lock campaign? This cannot be changed without GM mode.', onConfirm: () => {
                           const updated = { ...character, campaignLocked: true }
                          onUpdateCharacter(updated)
                          if (gmMode) {
                          import('../characterDB').then(({ saveCharacterByOwner }) => saveCharacterByOwner(updated, updated._ownerId || updated.createdBy))
                          } else {
                           import('../characterDB').then(({ saveCharacter }) => saveCharacter(updated, updated.createdBy))
                          }
                           setConfirmModal(null)
                        } })}
                          style={{ padding: '5px 10px', background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem', whiteSpace: 'nowrap' }}
                        >Lock</button>
                      )}
                      {character.campaignLocked && gmMode && (
                        <button
                          onClick={() => onUpdateCharacter({ ...character, campaignLocked: false })}
                          style={{ padding: '5px 10px', background: 'none', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}
                        >Unlock (GM)</button>
                      )}
                    </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Physical description */}
      <div style={surface}>
        <div style={sectionTitle}>Physical Description</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {field('Age', <input style={inputStyle} value={bio.age || ''} onChange={e => updateBio('age', e.target.value)} />)}
          {field('Height', <input style={inputStyle} value={bio.height || ''} onChange={e => updateBio('height', e.target.value)} />)}
          {field('Weight', <input style={inputStyle} value={bio.weight || ''} onChange={e => updateBio('weight', e.target.value)} />)}
          {field('Build', <input style={inputStyle} value={bio.build || ''} onChange={e => updateBio('build', e.target.value)} />)}
          {field('Hair', <input style={inputStyle} value={bio.hair || ''} onChange={e => updateBio('hair', e.target.value)} />)}
          {field('Eyes', <input style={inputStyle} value={bio.eyes || ''} onChange={e => updateBio('eyes', e.target.value)} />)}
        </div>
        {field('Intelligence / Demeanor',
          <textarea style={textareaStyle} value={bio.intelligence || ''} onChange={e => updateBio('intelligence', e.target.value)} placeholder="Describe the character's intelligence and general demeanor..." />
        )}
      </div>

      {/* Languages */}
      <div style={surface}>
        <div style={sectionTitle}>Languages</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {field('Spoken', <input style={inputStyle} value={bio.languagesSpoken || ''} onChange={e => updateBio('languagesSpoken', e.target.value)} placeholder="Common, Elvish..." />)}
          {field('Read / Written', <input style={inputStyle} value={bio.languagesRead || ''} onChange={e => updateBio('languagesRead', e.target.value)} placeholder="Common, Elvish..." />)}
        </div>
      </div>

      {/* Special */}
      <div style={surface}>
        <div style={sectionTitle}>Special &amp; Powers</div>
        {field('Special Traits',
          <textarea style={textareaStyle} value={bio.special || ''} onChange={e => updateBio('special', e.target.value)} placeholder="Racial abilities, unique traits..." />
        )}
        {field('Powers / Injuries',
          <textarea style={textareaStyle} value={bio.powersInjuries || ''} onChange={e => updateBio('powersInjuries', e.target.value)} placeholder="Current powers, ongoing injuries, conditions..." />
        )}
      </div>

      {/* Background */}
      <div style={surface}>
        <div style={sectionTitle}>Background</div>
        {field('Personal History',
          <textarea style={{ ...textareaStyle, minHeight: 120 }} value={bio.personalHistory || ''} onChange={e => updateBio('personalHistory', e.target.value)} placeholder="Where did this character come from?..." />
        )}
        {field('Goals',
          <textarea style={textareaStyle} value={bio.goals || ''} onChange={e => updateBio('goals', e.target.value)} placeholder="What does this character want?..." />
        )}
        {field('Fears',
          <textarea style={textareaStyle} value={bio.fears || ''} onChange={e => updateBio('fears', e.target.value)} placeholder="What does this character fear?..." />
        )}
      </div>

      {/* Connections */}
      <div style={surface}>
        <div style={sectionTitle}>Connections</div>
        {field('Important People',
          <textarea style={textareaStyle} value={bio.importantPeople || ''} onChange={e => updateBio('importantPeople', e.target.value)} placeholder="Family, friends, mentors..." />
        )}
        {field('Enemies',
          <textarea style={textareaStyle} value={bio.enemies || ''} onChange={e => updateBio('enemies', e.target.value)} placeholder="Who wants this character dead?..." />
        )}
        {field('Contacts',
          <textarea style={textareaStyle} value={bio.contacts || ''} onChange={e => updateBio('contacts', e.target.value)} placeholder="Useful allies, informants, merchants..." />
        )}
      </div>
        {confirmModal && (
          <ConfirmModal
           message={confirmModal.message}
           dangerous={confirmModal.dangerous}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
  />
)}
    </div>
  )
}

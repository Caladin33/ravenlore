// SheetTopSections.jsx
import { useState, useEffect } from 'react'
import attributeData from '../data/attributes.json'
import armorData from '../data/armor.json'
import druidFormsData from '../data/druidForms.json'

// ── MAGIC COLORS ──────────────────────────────────────────────────────────────
const MAGIC_COLORS = {
  order:     { bg: '#0d0d0d', accent: '#ffffff', border: '#444444' },
  will:      { bg: '#0d1a2e', accent: '#4a90d9', border: '#2a5a8a' },
  chaos:     { bg: '#e8e8e8', accent: '#111111', border: '#aaaaaa' },
  elemental: { bg: '#1e0a0a', accent: '#c94a4a', border: '#7a2a2a' },
  chi:       { bg: '#0a1a0a', accent: '#4a9e4a', border: '#2a6a2a' },
}
const COLOR_ORDER = ['order', 'will', 'chaos', 'elemental', 'chi']

// ── DRUID FORM HELPERS ────────────────────────────────────────────────────────
function getFormData(formName) {
  if (!formName || formName === 'None') return null
  return druidFormsData.find(f => f.name === formName) || null
}

// Resolve "Yours", "Yours+2", "Yours-1", or fixed number
function resolveAttr(formValue, charValue) {
  if (formValue === undefined || formValue === null) return { value: charValue, mode: 'yours' }
  if (typeof formValue === 'number') return { value: formValue, mode: 'fixed' }
  const str = String(formValue)
  if (str === 'Yours') return { value: charValue, mode: 'yours' }
  const plusMatch = str.match(/^Yours\+(\d+)$/)
  if (plusMatch) return { value: charValue + parseInt(plusMatch[1]), mode: 'bonus', bonus: `+${plusMatch[1]}` }
  const minusMatch = str.match(/^Yours-(\d+)$/)
  if (minusMatch) return { value: charValue - parseInt(minusMatch[1]), mode: 'bonus', bonus: `-${minusMatch[1]}` }
  return { value: charValue, mode: 'yours' }
}

// Get chosen druid form options for the dropdown
function getDruidFormOptions(character) {
  const forms = character.druidForms || {}
  const options = ['None']
  const cats = ['mammal', 'avian', 'aquatic', 'reptilian', 'exotic']
  cats.forEach(cat => {
    if (forms[cat]?.form) options.push(forms[cat].form)
  })
  return options
}

// ── ARMOR LOOKUPS ─────────────────────────────────────────────────────────────
function getBodyArmor(code) {
  if (!code || code === 'None') return armorData.bodyArmor[0]
  return armorData.bodyArmor.find(a => a.code === code) || armorData.bodyArmor[0]
}
function getHelm(code) {
  if (!code || code === 'None') return armorData.helms[0]
  return armorData.helms.find(h => h.code === code) || armorData.helms[0]
}

const SHIELD_SIZES = armorData.shieldSizes
const SHIELD_MATS  = armorData.shieldMaterials

function parseShieldCode(code) {
  if (!code || code === 'None') return null
  const sizeMap = { S: 'Small', M: 'Medium', L: 'Large', T: 'Tower' }
  const matMap  = { L: 'Leather', W: 'Wood', M: 'Metal' }
  return { size: sizeMap[code[0]], material: matMap[code[1]] }
}
function getShieldStats(code) {
  const p = parseShieldCode(code)
  if (!p) return { evasionBonus: 0, ar: 0, hp: 0, minStr: 0 }
  const sz  = SHIELD_SIZES.find(s => s.size === p.size)
  const mat = SHIELD_MATS.find(m => m.material === p.material)
  return { evasionBonus: sz?.evasionBonus??0, ar: mat?.ar??0, hp: mat?.hp??0, minStr: mat?.minStr?.[p.size]??0 }
}

function getARForLoc(code, loc, helmCode) {
  if (loc === 'head') return getHelm(helmCode)?.arHead ?? 0
  const a = getBodyArmor(code)
  return loc === 'torso' ? (a.arTorso??0) : (a.arArms??0)
}
function getEvPenForLoc(code, loc, helmCode) {
  if (loc === 'head') return getHelm(helmCode)?.evasionPenalty ?? 0
  return getBodyArmor(code)?.evasionPenaltyPerLocation ?? 0
}
function isImmuneToBreach(code) {
  return getBodyArmor(code)?.special?.includes('Immune to Breaches') ?? false
}

const BODY_ARMOR_OPTIONS = armorData.bodyArmor.map(a => ({ code: a.code, label: a.code==='None'?'None':`${a.code} — ${a.name}` }))
const HELM_OPTIONS = armorData.helms.map(h => ({ code: h.code, label: h.code==='None'?'None':`${h.code} — ${h.name}` }))
const SHIELD_OPTIONS = [
  { code: 'None', label: 'None' },
  ...['S','M','L','T'].flatMap(sz => ['L','W','M'].map(mat => {
    const sn={S:'Small',M:'Medium',L:'Large',T:'Tower'}, mn={L:'Leather',W:'Wood',M:'Metal'}
    return { code:`${sz}${mat}`, label:`${sz}${mat} — ${sn[sz]} ${mn[mat]}` }
  }))
]

// ── ATTRIBUTE LOOKUP ──────────────────────────────────────────────────────────
function lookupAttr(table, v, field) {
  return attributeData[table]?.[String(Math.max(1,Math.min(20,v)))]?.[field] ?? 0
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const lbl = { fontSize:'.55rem', letterSpacing:'.16em', color:'var(--text3)', textTransform:'uppercase', fontFamily:'Georgia, serif', display:'block', marginBottom:2 }
const hdrLbl = { ...lbl, fontSize:'.72rem', color:'var(--gold)', letterSpacing:'.18em' }
const val = { fontSize:'1.05rem', color:'var(--gold2)', fontFamily:'Georgia, serif', fontWeight:600, lineHeight:1.1 }
const dimVal = { ...val, fontSize:'.9rem', color:'var(--text2)' }
const rowDiv = { borderBottom:'1px solid var(--border)' }
const selectSt = { background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:4, padding:'3px 6px', fontFamily:'Georgia, serif', fontSize:'.82rem', cursor:'pointer' }

// ── RESPONSIVE HOOK ───────────────────────────────────────────────────────────
function useIsDesktop() {
  const [desktop, setDesktop] = useState(window.innerWidth > 768)
  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth > 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return desktop
}

// ── CLICK TO EDIT ─────────────────────────────────────────────────────────────
function ClickEdit({ value, onChange, max, color, fontSize='1rem' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const over = max !== undefined && value > max
  const displayColor = over ? '#c94a4a' : (color || 'var(--gold2)')

  if (editing) {
    return (
      <input autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { const n = parseInt(draft); if (!isNaN(n)) onChange(n); setEditing(false) }
          if (e.key === 'Escape') setEditing(false)
        }}
        onBlur={() => { const n = parseInt(draft); if (!isNaN(n)) onChange(n); setEditing(false) }}
        onFocus={e => e.target.select()}
        style={{ width:52, textAlign:'center', background:'var(--bg)', border:'1px solid var(--gold)', color:'var(--text)', borderRadius:3, padding:'2px 4px', fontFamily:'Georgia, serif', fontSize, fontWeight:700 }}
      />
    )
  }
  return (
    <span onClick={() => { setDraft(String(value)); setEditing(true) }} title="Click to edit"
      style={{ ...val, fontSize, color:displayColor, cursor:'pointer', borderBottom:'1px dotted currentColor', display:'inline-block', minWidth:24, textAlign:'center' }}>
      {value}
    </span>
  )
}

function EditableMana({ value, onChange }) {
  return <ClickEdit value={value} onChange={onChange} />
}

// ── COMPLIANCE ────────────────────────────────────────────────────────────────
function getIssues(stats, character) {
  const issues = []
  if ((stats.skillPoints?.unspent??0) < 0) issues.push(`Over budget by ${Math.abs(stats.skillPoints.unspent)} skill pts`)
  const known = character.knownSpells?.length??0
  if (known > stats.maxSpellsKnown) issues.push(`${known - stats.maxSpellsKnown} spell(s) over max`)
  const hasUnfettered = Object.entries({...character.martialSkills,...character.selfImprovementSkills}||{})
    .some(([n,d]) => n.toLowerCase().includes('unfetter') && (parseInt(d.rank)||0) > 0)
  if (hasUnfettered) {
    const carried = character.carryingWeight??0, half = (stats.weightAllowance??0)/2
    const shieldOn = character.armor?.shield?.type && character.armor.shield.type !== 'None'
    const plates = ['rArm','lArm','torso','lLeg','rLeg'].filter(loc => (getBodyArmor(character.armor?.[loc]?.type)?.name??'').toLowerCase().includes('plate')).length
    if (carried > half)  issues.push('Not Unfettered: over half carry weight')
    else if (shieldOn)   issues.push('Not Unfettered: shield equipped')
    else if (plates > 1) issues.push('Not Unfettered: too much plate armor')
  }
  return issues
}

// ── ATTR ROW ──────────────────────────────────────────────────────────────────
function AttrRow({ abbr, current, checkMod, derivedLabel, derivedValue, detailContent, transformed, transformedValue, transformMode, tourId, tourLeftId, tourRightId }) {
  const [expanded, setExpanded] = useState(false)
  const cc = checkMod >= 0 ? 'var(--text2)' : '#c94a4a'

  const displayVal = transformed ? transformedValue : current
  const transformColor = transformMode === 'fixed' ? '#4a9e4a' : transformMode === 'bonus' ? '#6abf6a' : 'var(--gold2)'

  return (
    <>
     <div data-tour={tourId||undefined} style={{ display:'flex', alignItems:'center', ...rowDiv, minHeight:44, background: transformed ? 'rgba(74,158,74,.04)' : 'transparent' }}>
        <div data-tour={tourLeftId||undefined} onClick={() => setExpanded(!expanded)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', cursor:'pointer', flex:'0 0 auto' }}>
          <span style={{ fontSize:'.85rem', color: transformed ? '#4a9e4a' : 'var(--gold)', fontFamily:'Georgia, serif', fontWeight:600, minWidth:28 }}>{abbr}</span>
          <span style={{ ...val, fontSize:'1.1rem', color: transformed ? transformColor : 'var(--gold2)' }}>{displayVal}</span>
          {transformed && transformMode === 'bonus' && (
            <span style={{ fontSize:'.65rem', color:'#4a9e4a', fontFamily:'Georgia, serif' }}>({transformedValue > current ? '+' : ''}{transformedValue - current})</span>
          )}
          {!transformed && <span style={{ fontSize:'.82rem', color:cc, fontFamily:'Georgia, serif' }}>{checkMod>=0?'+':''}{checkMod}</span>}
          <span style={{ fontSize:'.55rem', color:'var(--text3)', opacity:.5 }}>{expanded?'▲':'▼'}</span>
        </div>
       <div style={{ flex:1, padding:'8px 12px 8px 0', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
          {derivedValue!=null && (
            <div data-tour={tourRightId||undefined} style={{ textAlign:'right' }}>
              {derivedLabel && <span style={{ fontSize:'.6rem', color:'var(--text3)', letterSpacing:'.12em', textTransform:'uppercase', fontFamily:'Georgia, serif', marginRight:6 }}>{derivedLabel}</span>}
              <span style={val}>{derivedValue}</span>
            </div>
          )}
        </div>
      </div>
      {expanded && detailContent && (
        <div style={{ padding:'10px 14px 12px 14px', background:'var(--bg2)', borderBottom:'1px solid var(--border)', display:'flex', gap:20, flexWrap:'wrap' }}>
          {detailContent}
          {transformed && (
            <div style={{ fontSize:'.78rem', color:'#4a9e4a', fontFamily:'Georgia, serif', fontStyle:'italic' }}>
              🐾 Transformed: {abbr} {transformMode === 'fixed' ? `fixed at ${transformedValue}` : transformMode === 'bonus' ? `${current} ${transformedValue > current ? '+' : ''}${transformedValue - current} = ${transformedValue}` : `unchanged (${current})`}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function DI({ label, value }) {
  return <div><div style={{ ...lbl, marginBottom:2 }}>{label}</div><div style={{ ...val, fontSize:'.95rem' }}>{value}</div></div>
}

// ── MAGIC ROWS ────────────────────────────────────────────────────────────────
function MagicRows({ ranks, weavingDice }) {
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', flexWrap:'wrap', ...rowDiv, background:'var(--bg2)' }}>
        <div data-tour="sheet-magic-rows" style={{ display:'inline-flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ ...lbl, marginBottom:0, marginRight:4, whiteSpace:'nowrap' }}>Masteries:</span>
          {COLOR_ORDER.map(key => {
            const t=MAGIC_COLORS[key], r=ranks[key]??0
            return <span key={key} style={{ fontSize:'1.1rem', fontWeight:700, fontFamily:'Georgia, serif', color:r>0?t.accent:'#3a2e1e', textShadow:r>0?`0 0 8px ${t.accent}55`:'none', minWidth:18, textAlign:'center', background:key==='chaos'&&r>0?'#555':'transparent', borderRadius:3, padding:key==='chaos'?'0 3px':'0' }}>{r}</span>
          })}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', flexWrap:'wrap', ...rowDiv }}>
        <div data-tour="sheet-magic-dice" style={{ display:'inline-flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {COLOR_ORDER.map(key => {
            const t=MAGIC_COLORS[key], die=weavingDice?.[key]??null
            return <div key={key} style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:4, padding:'2px 8px', fontSize:'.8rem', fontFamily:'Georgia, serif', color:die?t.accent:t.border, fontWeight:die?600:400 }}>{die??'—'}</div>
          })}
        </div>
      </div>
    </>
  )
}

// ── SESSION ROW ───────────────────────────────────────────────────────────────
function SessionRow({ stats, character, offHand, stance, onOffHandChange, onStanceChange, activeForm, onFormChange }) {
  const druidOptions = getDruidFormOptions(character)
  const hasDruidForms = druidOptions.length > 1
  const formData = getFormData(activeForm)

  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', padding:'8px 12px', background: activeForm && activeForm !== 'None' ? 'rgba(74,158,74,.06)' : 'var(--bg2)', borderTop: activeForm && activeForm !== 'None' ? '1px solid rgba(74,158,74,.3)' : 'none' }}>
      <div data-tour="sheet-session-row" style={{ display:'inline-flex', gap:10, alignItems:'center' }}>
      {[['Off-hand', offHand, onOffHandChange, ['Empty','2-Handed','Dual Wield','Shield']],
        ['Stance', stance, onStanceChange, ['None','Wind','Wave','Stone','Flame']]
      ].map(([label, v, fn, opts]) => (
        <div key={label} style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={lbl}>{label}</span>
          <select value={v} onChange={e=>fn(e.target.value)} style={selectSt}>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
      </div>

      {/* Druid transform dropdown */}
      {hasDruidForms && (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ ...lbl, color: activeForm && activeForm !== 'None' ? '#4a9e4a' : 'var(--text3)' }}>🐾 Form</span>
          <select value={activeForm || 'None'} onChange={e => onFormChange(e.target.value === 'None' ? null : e.target.value)}
            style={{ ...selectSt, border: activeForm && activeForm !== 'None' ? '1px solid #4a9e4a' : '1px solid var(--border2)', color: activeForm && activeForm !== 'None' ? '#4a9e4a' : 'var(--text)' }}>
            {druidOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        <span style={lbl}>Vision</span>
        <span style={dimVal}>{character.darkvision??'Normal'}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        <span style={lbl}>Move</span>
        <span style={{ ...dimVal, color: formData ? '#4a9e4a' : 'var(--text2)' }}>
          {formData ? formData.movement : `${stats.movement} ft`}
        </span>
      </div>

      {/* Form attack info when transformed */}
      {formData && (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ ...lbl, color:'#4a9e4a' }}>Attack</span>
          <span style={{ ...dimVal, color:'#4a9e4a' }}>{formData.attack}</span>
        </div>
      )}
      {formData && (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ ...lbl, color:'#4a9e4a' }}>Damage</span>
          <span style={{ ...dimVal, color:'#4a9e4a', fontSize:'.78rem' }}>{formData.damage}</span>
        </div>
      )}
    </div>
  )
}

// ── ATTRIBUTE BLOCK ───────────────────────────────────────────────────────────
export function AttributeBlock({ stats, character, onUpdateCharacter, offHand, stance, onOffHandChange, onStanceChange }) {
  const attrs = stats.attributes
  const arcane = character?.arcaneSkills || {}
  const ranks = {
    order:     parseInt(arcane['Order Mastery']?.rank||0),
    will:      parseInt(arcane['Will Mastery']?.rank||0),
    chaos:     parseInt(arcane['Chaos Mastery']?.rank||0),
    elemental: parseInt(arcane['Elemental Mastery']?.rank||0),
    chi:       parseInt(arcane['Chi Mastery']?.rank||0),
  }

  const getBase = a => { const v=character.attributes?.[a]; return typeof v==='object'?(v.base??0):(v??0) }
  const currentMana = character.currentMana??0
  const setMana = v => onUpdateCharacter({...character, currentMana:v})
  const carriedLbs = Math.floor(character.carryingWeight??0)
  const maxWeight = stats.weightAllowance??0
  const issues = getIssues(stats, character)
  const ok = issues.length === 0

  // Active druid form
  const activeForm = character.activeForm || null
  const formData = getFormData(activeForm)
  const onFormChange = (formName) => onUpdateCharacter({ ...character, activeForm: formName })

  // Resolve transformed attributes
  const strResolved = formData ? resolveAttr(formData.str, attrs.str.effective) : null
  const dexResolved = formData ? resolveAttr(formData.dex, attrs.dex.effective) : null
  const conResolved = formData ? resolveAttr(formData.con, attrs.con.effective) : null
  const awResolved  = formData ? { value: attrs.aw.effective + (formData.awarenessBonus || 0), mode: formData.awarenessBonus !== 0 ? 'bonus' : 'yours' } : null

  // Transformed derived stats
  const strEff = formData ? strResolved.value : attrs.str.effective
  const dexEff = formData ? dexResolved.value : attrs.dex.effective
  const conEff = formData ? conResolved.value : attrs.con.effective
  const awEff  = formData ? awResolved.value  : attrs.aw.effective

  const dexExp = lookupAttr('dexterity', dexEff, 'expertise')
  const dexPR  = lookupAttr('dexterity', dexEff, 'precision')
  const awEv   = lookupAttr('awareness',  awEff,  'evasionBonus')

  const evasionDisplay = `${stats.evasion}(${stats.rearEvasion})`

  return (
    <div style={{ background:'var(--surface)', border: formData ? '1px solid rgba(74,158,74,.4)' : '1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>

      {/* Transformed banner */}
      {formData && (
        <div style={{ padding:'6px 12px', background:'rgba(74,158,74,.1)', borderBottom:'1px solid rgba(74,158,74,.3)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:'.82rem', color:'#4a9e4a', fontFamily:'Georgia, serif', fontWeight:600 }}>🐾 Transformed: {activeForm}</span>
          {formData.naturalArmor > 0 && <span style={{ fontSize:'.72rem', color:'#4a9e4a', fontFamily:'Georgia, serif' }}>Natural AR {formData.naturalArmor}</span>}
          {formData.specialAbilities && <span style={{ fontSize:'.68rem', color:'var(--text3)', fontFamily:'Georgia, serif', fontStyle:'italic' }}>{formData.specialAbilities}</span>}
        </div>
      )}

      <AttrRow abbr="STR" current={attrs.str.effective} checkMod={attrs.str.checkMod}
        transformed={!!formData} transformedValue={strResolved?.value} transformMode={strResolved?.mode}
        derivedLabel="Dmg Bonus" derivedValue={stats.damageBonus>=0?`+${stats.damageBonus}`:stats.damageBonus}
        detailContent={<DI label="Rolled STR" value={getBase('str')} />}
        tourLeftId="sheet-attr-left" tourRightId="sheet-attr-derived" />

      <AttrRow abbr="DEX" current={attrs.dex.effective} checkMod={attrs.dex.checkMod}
        transformed={!!formData} transformedValue={dexResolved?.value} transformMode={dexResolved?.mode}
        derivedLabel="Initiative" derivedValue={`+${stats.initiative}`}
        detailContent={<><DI label="Rolled DEX" value={getBase('dex')} /><DI label="Exp. Bonus" value={dexExp>=0?`+${dexExp}`:dexExp} /><DI label="PR Bonus" value={dexPR>=0?`+${dexPR}`:dexPR} /></>}
        tourLeftId="sheet-attr-left" tourRightId="sheet-attr-derived" />

      <AttrRow abbr="CON" current={attrs.con.effective} checkMod={attrs.con.checkMod}
        transformed={!!formData} transformedValue={conResolved?.value} transformMode={conResolved?.mode}
        derivedValue={<span style={{ fontSize:'.85rem', color:'var(--text2)', fontFamily:'Georgia, serif' }}>Carrying {carriedLbs} of {maxWeight} lbs</span>}
        detailContent={<>
          <DI label="Rolled CON" value={getBase('con')} />
          {formData && <DI label="Form Max HP" value={formData.naturalMaxHP} />}
          {formData && <DI label="Your Max HP" value={stats.hp?.torso ?? '?'} />}
          {formData && <DI label="Effective Max HP" value={Math.max(formData.naturalMaxHP, stats.hp?.torso ?? 0)} />}
        </>}
        tourLeftId="sheet-attr-left" tourRightId="sheet-attr-derived" />

      <AttrRow abbr="AW" current={attrs.aw.effective} checkMod={attrs.aw.checkMod}
        transformed={!!(formData && formData.awarenessBonus !== 0)} transformedValue={awResolved?.value} transformMode={awResolved?.mode}
        derivedLabel="Evasion" derivedValue={evasionDisplay}
        detailContent={<><DI label="Rolled AW" value={getBase('aw')} /><DI label="Skill Cap" value={stats.skillCap} /><DI label="Ev. Bonus (AW)" value={awEv>=0?`+${awEv}`:awEv} /></>}
        tourLeftId="sheet-attr-left" tourRightId="sheet-attr-derived" />

      <AttrRow abbr="CHR" current={attrs.chr.effective} checkMod={attrs.chr.checkMod}
        derivedValue={ok
          ? <span style={{ fontSize:'.78rem', color:'#4a9e4a', fontFamily:'Georgia, serif' }}>✓ All Good</span>
          : <span style={{ fontSize:'.72rem', color:'#c94a4a', fontFamily:'Georgia, serif' }}>⚠ {issues[0]}{issues.length>1?` +${issues.length-1}`:''}</span>}
        detailContent={<><DI label="Rolled CHR" value={getBase('chr')} />{!ok&&<div>{issues.map((i,idx)=><div key={idx} style={{ fontSize:'.8rem', color:'#c94a4a', fontFamily:'Georgia, serif', marginBottom:2 }}>⚠ {i}</div>)}</div>}</>}
        tourLeftId="sheet-attr-left" tourRightId="sheet-attr-chr" />

      <AttrRow abbr="WP" current={attrs.wp.effective} checkMod={attrs.wp.checkMod}
        derivedLabel="Mana" derivedValue={<EditableMana value={currentMana} onChange={setMana} />}
        detailContent={<><DI label="Rolled WP" value={getBase('wp')} /><DI label="Arc. Power" value={stats.arcanePower} /><DI label="Mana Mean" value={stats.manaMean} /></>}
        tourLeftId="sheet-attr-left" tourRightId="sheet-attr-mana" />
      <MagicRows ranks={ranks} weavingDice={stats.weavingDice} />

      <SessionRow
        stats={stats} character={character}
        offHand={offHand} stance={stance}
        onOffHandChange={onOffHandChange} onStanceChange={onStanceChange}
        activeForm={activeForm} onFormChange={onFormChange}
      />
    </div>
  )
}

// ── ARMOR / HP TABLE ─────────────────────────────────────────────────────────
const BODY_LOCS = [
  { key:'head',  label:'Head',  isHelm:true  },
  { key:'rArm',  label:'R.Arm', isHelm:false },
  { key:'lArm',  label:'L.Arm', isHelm:false },
  { key:'torso', label:'Torso', isHelm:false },
  { key:'rLeg',  label:'R.Leg', isHelm:false },
  { key:'lLeg',  label:'L.Leg', isHelm:false },
]

function getMaxHP(loc, maxHP) {
  if (loc==='head')  return maxHP.head
  if (loc==='torso') return maxHP.torso
  if (loc==='rArm'||loc==='lArm') return maxHP.arm
  if (loc==='rLeg'||loc==='lLeg') return maxHP.leg
  return 0
}

export function ArmorHPTable({ stats, character, onUpdateCharacter }) {
  const isDesktop = useIsDesktop()
  const armor  = character.armor || {}
  const hp     = character.hp || {}
  const curHP  = hp.current || {}
  const maxHP  = stats.hp
  const activeForm = character.activeForm || null
  const formData = getFormData(activeForm)

  const updateArmor = (loc, field, value) =>
    onUpdateCharacter({ ...character, armor: { ...armor, [loc]: { ...(armor[loc]||{}), [field]: value } } })
  const updateHP = (loc, value) =>
    onUpdateCharacter({ ...character, hp: { ...hp, current: { ...curHP, [loc]: value } } })
  const updateGlobal = (field, value) =>
    onUpdateCharacter({ ...character, [field]: value })
  const updateHPField = (field, value) =>
    onUpdateCharacter({ ...character, hp: { ...hp, [field]: value } })

  const shieldCode  = armor.shield?.type || 'None'
  const shieldStats = getShieldStats(shieldCode)

const DCOLS = '56px 70px 60px 50px 70px minmax(100px, 180px) 56px 1fr'
  const MCOLS = '52px 1fr 1fr 1fr'
  const grid  = isDesktop ? DCOLS : MCOLS
  const hdrBg = { background:'var(--bg2)', borderBottom:'2px solid var(--border2)' }

  const hdrCell = (content, sub) => (
    <div style={{ padding:'8px 6px', textAlign:'center', borderLeft:'1px solid var(--border2)' }}>
      <div style={hdrLbl}>{content}</div>
      {sub && <div style={{ ...lbl, marginTop:1 }}>{sub}</div>}
    </div>
  )
  const locCell = (label) => (
    <div style={{ padding:'6px 8px', background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ ...hdrLbl, color:'var(--gold2)' }}>{label}</span>
    </div>
  )
  const dataCell = (content, noBorder=false) => (
    <div style={{ padding:'5px 4px', display:'flex', alignItems:'center', justifyContent:'center', borderLeft: noBorder?'none':'1px solid var(--border2)' }}>
      {content}
    </div>
  )

  const renderRow = (loc, label, isHelm) => {
    const helmCode = armor.head?.type || 'None'
    const code     = isHelm ? helmCode : (armor[loc]?.type || 'None')
    const baseMaxHP = getMaxHP(loc, maxHP)
    // Apply form natural max HP to torso
    const effectiveMaxHP = (formData && loc === 'torso')
      ? Math.max(baseMaxHP, formData.naturalMaxHP)
      : baseMaxHP
    const curHPVal = curHP[loc] ?? effectiveMaxHP
    const arVal    = getARForLoc(code, loc, helmCode) + (formData?.naturalArmor || 0)
    const evPen    = getEvPenForLoc(code, loc, helmCode)
    const breaches = armor[loc]?.breaches ?? 0
    const immune   = !isHelm && isImmuneToBreach(code)
    const options  = isHelm ? HELM_OPTIONS : BODY_ARMOR_OPTIONS
    const evColor  = evPen > 0 ? '#c94a4a' : 'var(--text3)'
    const maxChanged = formData && loc === 'torso' && effectiveMaxHP !== baseMaxHP

    const dropdown = (
      <select data-tour="sheet-armor-type" value={code} onChange={e => updateArmor(loc, 'type', e.target.value)} style={{ ...selectSt, fontSize: isDesktop ? '.72rem' : '.65rem' }}>
        {options.map(o => <option key={o.code} value={o.code}>{isDesktop ? o.label : o.code}</option>)}
      </select>
    )

    if (isDesktop) {
      return (
        <div key={loc} style={{ display:'grid', gridTemplateColumns:grid, ...rowDiv, alignItems:'center' }}>
          {locCell(label)}
          {dataCell(<ClickEdit value={curHPVal} onChange={v=>updateHP(loc,v)} max={effectiveMaxHP} />)}
          {dataCell(<span style={{ ...dimVal, color: maxChanged ? '#4a9e4a' : 'var(--text2)' }}>{effectiveMaxHP}{maxChanged ? ' 🐾' : ''}</span>)}
          {dataCell(<span style={{ ...val, fontSize:'1rem' }}>{arVal}</span>)}
          {dataCell(immune
            ? <span style={{ fontSize:'.7rem', color:'#4a9e4a', fontFamily:'Georgia, serif' }}>Immune</span>
            : <ClickEdit value={breaches} onChange={v=>updateArmor(loc,'breaches',v)} color="var(--text2)" fontSize=".9rem" />
          )}
          {dataCell(dropdown)}
          {dataCell(<span style={{ fontSize:'.82rem', color:evColor, fontFamily:'Georgia, serif' }}>{evPen>0?`-${evPen}`:'-'}</span>)}
           {dataCell(
  <span style={{ fontSize: '.72rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
    {loc === 'head'
      ? (getHelm(helmCode)?.awPenalty > 0 ? `Awareness check penalty: ${getHelm(helmCode).awPenalty}` : '')
      : (getBodyArmor(code)?.special?.join(', ') || '')}
  </span>
)}
        </div>
      )
    } else {
      const sep = <div style={{ width:24, height:1, background:'var(--border)', margin:'2px auto' }} />
      return (
        <div key={loc} style={{ display:'grid', gridTemplateColumns:grid, ...rowDiv, alignItems:'center' }}>
          {locCell(label)}
          {dataCell(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <ClickEdit value={curHPVal} onChange={v=>updateHP(loc,v)} max={effectiveMaxHP} fontSize=".9rem" />
            {sep}
            <span style={{ fontSize:'.72rem', color: maxChanged ? '#4a9e4a' : 'var(--text3)', fontFamily:'Georgia, serif' }}>{effectiveMaxHP}{maxChanged ? '🐾' : ''}</span>
          </div>)}
          {dataCell(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
            <span style={{ ...val, fontSize:'.9rem' }}>{arVal}</span>
            {sep}
            {immune
              ? <span style={{ fontSize:'.6rem', color:'#4a9e4a', fontFamily:'Georgia, serif' }}>Immune</span>
              : <ClickEdit value={breaches} onChange={v=>updateArmor(loc,'breaches',v)} color="var(--text2)" fontSize=".85rem" />
            }
          </div>)}
          {dataCell(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, width:'100%' }}>
            {dropdown}
            <span style={{ fontSize:'.68rem', color:evColor, fontFamily:'Georgia, serif' }}>{evPen>0?`-${evPen}`:'-'}</span>
          </div>)}
        </div>
      )
    }
  }

  const shieldMaxHP = shieldStats.hp
  const shieldCurHP = hp.shieldCurrent ?? (shieldCode==='None' ? 0 : shieldMaxHP)
  const evColor = shieldStats.evasionBonus > 0 ? '#4a9e4a' : 'var(--text3)'
  const sep = <div style={{ width:24, height:1, background:'var(--border)', margin:'2px auto' }} />

  const shieldRow = isDesktop ? (
    <div style={{ display:'grid', gridTemplateColumns:grid, ...rowDiv, alignItems:'center' }}>
      {locCell('Shield')}
      {dataCell(<ClickEdit value={shieldCurHP} onChange={v=>updateHPField('shieldCurrent',v)} max={shieldMaxHP} />)}
      {dataCell(<span style={dimVal}>{shieldCode==='None'?'—':shieldMaxHP}</span>)}
      {dataCell(<span style={{ ...val, fontSize:'1rem' }}>{shieldCode==='None'?'—':shieldStats.ar}</span>)}
      {dataCell(<span style={{ fontSize:'.75rem', color:'var(--text3)', fontFamily:'Georgia, serif' }}>Min STR: {shieldCode==='None'?'—':shieldStats.minStr}</span>)}
      {dataCell(<select value={shieldCode} onChange={e=>updateArmor('shield','type',e.target.value)} style={selectSt}>{SHIELD_OPTIONS.map(o=><option key={o.code} value={o.code}>{o.label}</option>)}</select>)}
      {dataCell(<span style={{ fontSize:'.82rem', color:evColor, fontFamily:'Georgia, serif' }}>{shieldStats.evasionBonus>0?`+${shieldStats.evasionBonus}`:'-'}</span>)}
     {dataCell(
  <span style={{ fontSize: '.72rem', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: stats.shieldSTRWarning ? '#c94a4a' : 'var(--text3)' }}>
    {stats.shieldSTRWarning ? `⚠ Min STR ${stats.shieldMinSTR} required` : 'Shields give you Evasion, and nothing else'}
  </span>
, true)}
    </div>
  ) : (
    <div style={{ display:'grid', gridTemplateColumns:grid, ...rowDiv, alignItems:'center' }}>
      {locCell('Shield')}
      {dataCell(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
        <ClickEdit value={shieldCurHP} onChange={v=>updateHPField('shieldCurrent',v)} max={shieldMaxHP} fontSize=".9rem" />
        {sep}
        <span style={{ fontSize:'.72rem', color:'var(--text3)', fontFamily:'Georgia, serif' }}>{shieldCode==='None'?'—':shieldMaxHP}</span>
      </div>)}
      {dataCell(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
        <span style={{ ...val, fontSize:'.9rem' }}>{shieldCode==='None'?'—':shieldStats.ar}</span>
        {sep}
       <span style={{ fontSize: '.65rem', color: stats.shieldSTRWarning ? '#c94a4a' : 'var(--text3)', fontFamily: 'Georgia, serif' }}>
        {shieldCode==='None' ? '—' : `Min STR: ${shieldStats.minStr}${stats.shieldSTRWarning ? ' ⚠' : ''}`}
      </span>
      </div>)}
      {dataCell(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, width:'100%' }}>
        <select value={shieldCode} onChange={e=>updateArmor('shield','type',e.target.value)} style={{ ...selectSt, fontSize:'.65rem' }}>{SHIELD_OPTIONS.map(o=><option key={o.code} value={o.code}>{o.code==='None'?'None':o.code}</option>)}</select>
        <span style={{ fontSize:'.68rem', color:evColor, fontFamily:'Georgia, serif' }}>{shieldStats.evasionBonus>0?`+${shieldStats.evasionBonus}`:'-'}</span>
      </div>)}
    </div>
  )

const globalRow = isDesktop ? (
    <div data-tour="sheet-global-row" style={{ display:'grid', gridTemplateColumns:grid, background:'var(--bg2)', alignItems:'center' }}>
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Barrier HP</span><ClickEdit value={hp.barrierHP??0} onChange={v=>updateHPField('barrierHP',v)} fontSize=".9rem" /></div>, true)}
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Temp HP</span><ClickEdit value={hp.tempHP??0} onChange={v=>updateHPField('tempHP',v)} fontSize=".9rem" /></div>)}
      {dataCell(<div />)}
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Global AR+</span><ClickEdit value={character.globalARBonus??0} onChange={v=>updateGlobal('globalARBonus',v)} fontSize=".9rem" /></div>)}
      {dataCell(<div />)}
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Natural AR</span><ClickEdit value={character.naturalAR??0} onChange={v=>updateGlobal('naturalAR',v)} fontSize=".9rem" /></div>)}
      {dataCell(<div />)}
      {dataCell(<span style={{ fontSize:'.72rem', color:'var(--text3)', fontFamily:'Georgia, serif', fontStyle:'italic' }}>Barrier HP → Armor → Temp HP → Location HP</span>,)}
    </div>
  ) : (
    <div data-tour="sheet-global-row" style={{ display:'grid', gridTemplateColumns:grid, background:'var(--bg2)', alignItems:'center' }}>
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Barrier HP</span><ClickEdit value={hp.barrierHP??0} onChange={v=>updateHPField('barrierHP',v)} fontSize=".85rem" /></div>, true)}
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Temp HP</span><ClickEdit value={hp.tempHP??0} onChange={v=>updateHPField('tempHP',v)} fontSize=".85rem" /></div>)}
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Global AR+</span><ClickEdit value={character.globalARBonus??0} onChange={v=>updateGlobal('globalARBonus',v)} fontSize=".85rem" /></div>)}
      {dataCell(<div style={{ textAlign:'center' }}><span style={lbl}>Natural AR</span><ClickEdit value={character.naturalAR??0} onChange={v=>updateGlobal('naturalAR',v)} fontSize=".85rem" /></div>)}
    </div>
  )

  return (
    <div data-tour="sheet-hptable" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, overflow:'visible' }}>
      <div style={{ display:'grid', gridTemplateColumns:grid, ...hdrBg }}>
        <div style={{ padding:'8px 8px', background:'var(--bg2)' }} />
        {isDesktop ? (
          <>
            {hdrCell('Cur HP')}
            {hdrCell('Max HP')}
            {hdrCell('AR')}
            {hdrCell('Breaches')}
            {hdrCell('Type')}
            {hdrCell('Ev.Pen')}
            {hdrCell('Special')}
          </>
        ) : (
          <>
            {hdrCell('HP', 'Cur/Max')}
            {hdrCell('AR', 'AR/Br.')}
            {hdrCell('Type', 'Type/Ev.')}
          </>
        )}
      </div>
      {BODY_LOCS.map(({ key, label, isHelm }) => renderRow(key, label, isHelm))}
      {shieldRow}
      {globalRow}
    </div>
  )
}

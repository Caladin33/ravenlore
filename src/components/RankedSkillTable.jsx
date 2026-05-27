// RankedSkillTable.jsx
import { useState } from 'react'
import { FormattedSkillDescription } from '../utils/skillFormatting.jsx'
import generalSkillsData from '../data/generalSkills.json'
import racesData from '../data/races.json'
import armorData from '../data/armor.json'

export const THEMES = {
  selfImprovement: { primary: '#c9a84c', primary2: '#e8c96a', dim: 'rgba(201,168,76,.1)',  border: 'rgba(201,168,76,.25)' },
  melee:           { primary: '#8a8a9a', primary2: '#c0c0d0', dim: 'rgba(138,138,154,.1)', border: 'rgba(138,138,154,.25)' },
  unfettered:      { primary: '#9a7a5a', primary2: '#c8a07a', dim: 'rgba(154,122,90,.1)',  border: 'rgba(154,122,90,.25)'  },
  ranged:          { primary: '#5a8a5a', primary2: '#7acc7a', dim: 'rgba(90,138,90,.1)',   border: 'rgba(90,138,90,.25)'   },
  leadership:      { primary: '#3a5a8a', primary2: '#6a90cc', dim: 'rgba(58,90,138,.1)',   border: 'rgba(58,90,138,.25)'   },
  arcane:          { primary: '#7a5a9a', primary2: '#aa80dd', dim: 'rgba(122,90,154,.1)',  border: 'rgba(122,90,154,.25)'  },
  guild:           { primary: '#6a4a8a', primary2: '#9a70bb', dim: 'rgba(106,74,138,.1)',  border: 'rgba(106,74,138,.25)'  },
  divine:          { primary: '#9a8a3a', primary2: '#ccbb60', dim: 'rgba(154,138,58,.1)',  border: 'rgba(154,138,58,.25)'  },
  balance:         { primary: '#9a8a6a', primary2: '#c8b890', dim: 'rgba(154,138,106,.1)', border: 'rgba(154,138,106,.25)' },
  infernal:        { primary: '#8a2a2a', primary2: '#cc5050', dim: 'rgba(138,42,42,.1)',   border: 'rgba(138,42,42,.25)'   },
  lycanthropy:     { primary: '#5a5a6a', primary2: '#909090', dim: 'rgba(90,90,106,.1)',   border: 'rgba(90,90,106,.25)'   },
  animal:          { primary: '#9a6a2a', primary2: '#cc9a50', dim: 'rgba(154,106,42,.1)',  border: 'rgba(154,106,42,.25)'  },
}

const GRID = '1fr 72px 52px'

const FLAG_PATTERNS = [
  /^special attack/i, /^melee only/i, /^2-handed only/i, /^2-handed slashing only/i,
  /^blunt$/i, /^piercing weapon$/i, /^passive$/i, /^active$/i,
  /^no awkward weapons/i, /^can not be a quick or light weapon/i, /^quick and light weapons only/i,
]

const IGNORE_PATTERNS = [
  /^trainer/i, /^exposure/i, /^opportunity/i, /^access/i, /^ranged only/i, /^self$/i,
]

const MARTIAL_MARKS = ['Fox Mark', 'Serpent Mark', 'Tiger Mark', 'Heron Mark']


function getEffectiveAttrs(char) {
  const raceKey = char.race ? char.race.charAt(0).toLowerCase() + char.race.slice(1).replace(/\s+/g, '') : 'human'
  const race = racesData[raceKey] || {}
  const attrs = char.attributes || {}
  const ms = char.martialSkills || {}
  const si = char.selfImprovementSkills || {}
  function base(key) { return attrs[key]?.base || attrs[key] || 0 }
  function mrank(name) { return parseInt(si[name]?.pointsInvested ? Math.floor(parseInt(si[name].pointsInvested) / (si[name].costPerRank || 1)) : 0) || parseInt(ms[name]?.rank) || 0 }
  return {
    STR: base('str') + (race.strModifier || 0) + Math.floor(mrank('Bodybuilding') / 3),
    DEX: base('dex') + Math.floor(mrank('Reflex Training') / 3),
    CON: base('con') + (race.conModifier || 0) + Math.floor(mrank('Conditioning') / 3),
    AW:  base('aw')  + Math.floor(mrank('Observation Training') / 3),
    CHR: base('chr') + (race.chrModifier || 0) + Math.floor(mrank('Persuasion') / 3),
    WP:  base('wp')  + Math.floor(mrank('Hardened Resolve') / 3),
  }
}

function getAttrValue(char, attrName) {
  const attrs = getEffectiveAttrs(char)
  const map = { str: 'STR', dex: 'DEX', con: 'CON', aw: 'AW', awareness: 'AW', chr: 'CHR', wp: 'WP', willpower: 'WP' }
  return attrs[map[attrName.toLowerCase()]] || 0
}

function calcGeneralScore(skillName, char, attrs) {
  const skill = generalSkillsData.find(s => s.name === skillName)
  if (!skill) return 0
  const formula = (skill.freeBase || '').toUpperCase().replace(/\s+/g, '')
  const pts = parseInt(char.generalSkills?.[skillName]?.pointsInvested) || 0
  const mult = parseInt(skill.costMultiplier) || 1
  const raceKey = char.race ? char.race.charAt(0).toLowerCase() + char.race.slice(1).replace(/\s+/g, '') : 'human'
  const race = racesData[raceKey] || {}
  const racialBonus = race.generalSkillBonus || 0
  let freeBase = 0
  if (formula && formula !== 'NONE' && formula !== '') {
    let expr = formula
      .replace(/(\d)(STR|DEX|CON|AW|CHR|WP)/g, '$1*$2')
      .replace(/STR/g, attrs.STR).replace(/DEX/g, attrs.DEX)
      .replace(/CON/g, attrs.CON).replace(/AW/g, attrs.AW)
      .replace(/CHR/g, attrs.CHR).replace(/WP/g, attrs.WP)
    try { freeBase = Math.floor(Function('"use strict"; return (' + expr + ')')()) } catch { freeBase = 0 }
  }
  return (pts * mult) + freeBase + racialBonus
}

function checkUnfettered(uc) {
  // uc = stats.unfetteredConditions — already computed by the calculator
  if (!uc) return { met: true }  // stats not available, don't block
  return { met: true }
}

function getRankAcrossAllSkills(char, skillName) {
  return parseInt(char.martialSkills?.[skillName]?.rank)
    || parseInt(char.arcaneSkills?.[skillName]?.rank)
    || parseInt(char.selfImprovementSkills?.[skillName]?.rank)
    || 0
}

function charHasPatronMark(char, markName) {
  return (char.patronMark?.mark || '').toLowerCase() === markName.toLowerCase()
}

function charHasShamanSymbol(char, symbolName) {
  return (char.shamanSymbols || []).some(s => (s.symbol || '').toLowerCase() === symbolName.toLowerCase())
}

function charHasMarkOrShaman(char, markName) {
  return charHasPatronMark(char, markName) || charHasShamanSymbol(char, markName)
}

function parseMarkList(str) {
  const cleaned = str
    .replace(/mark\s+or\s+shaman\s+symbol\s+of\s*/i, '')
    .replace(/\bmark\s+of\s*/i, '')
    .replace(/shaman\s+symbol\s+of\s*/i, '')
  return cleaned.split(/,|\bor\b/i).map(s => s.trim()).filter(Boolean)
}

function checkSinglePrereq(token, char, stats) {
  const str = token.trim()
  if (!str || str.toLowerCase() === 'none') return { met: true }
  if (IGNORE_PATTERNS.some(p => p.test(str))) return { met: true, ignore: true }
 // Cap prereq: "< SkillName" means this skill's rank must be less than that skill's rank
  if (str.startsWith('<')) {
    const capSkillName = str.slice(1).trim()
    const capRank = getRankAcrossAllSkills(char, capSkillName)
    if (capRank === 0) return { met: false, reason: `${capSkillName} rank 1+ required first` }
    return { met: true, capSkill: capSkillName, capRank }
  }
  if (FLAG_PATTERNS.some(p => p.test(str))) return { met: true, tag: str }

  if (/^unfettered/i.test(str)) {
    const result = checkUnfettered(stats?.unfetteredConditions)
    if (!result.met) return result
    const rest = str.replace(/^unfettered[,\s]*(and\s*)?/i, '').trim()
    if (rest) return checkSinglePrereq(rest, char, stats)
    return { met: true }
  }

  // "Any Mark" — met if character has any Patron's Mark
  if (/^any\s+mark$/i.test(str)) {
    const hasMark = !!(char.patronMark?.mark)
    return hasMark ? { met: true } : { met: false, reason: "Patron's Mark required" }
  }

  // Martial marks — exact match, enforce rank >= 1, no chip
  const martialMark = MARTIAL_MARKS.find(m => str.toLowerCase() === m.toLowerCase())
  if (martialMark) {
    const rank = getRankAcrossAllSkills(char, martialMark)
    if (rank < 1) return { met: false, reason: `${martialMark} rank 1 required` }
    return { met: true }
  }

  // "Mark or Shaman Symbol of X, Y or Z"
  if (/mark\s+or\s+shaman\s+symbol\s+of/i.test(str)) {
    const marks = parseMarkList(str)
    const anyMet = marks.some(m => charHasMarkOrShaman(char, m))
    return { met: anyMet, reason: anyMet ? undefined : `Mark or Shaman Symbol of ${marks.join(', ')} required`, markList: marks, markType: 'markOrShaman' }
  }

  // "Mark of X, Y or Z" (patron mark only)
  if (/\bmark\s+of\b/i.test(str) && !/shaman/i.test(str)) {
    const marks = parseMarkList(str)
    const anyMet = marks.some(m => charHasPatronMark(char, m))
    return { met: anyMet, reason: anyMet ? undefined : `Patron's Mark of ${marks.join(', ')} required`, markList: marks, markType: 'patronOnly' }
  }

  // "Shaman Symbol of X"
  if (/shaman\s+symbol\s+of/i.test(str)) {
    const marks = parseMarkList(str)
    const anyMet = marks.some(m => charHasShamanSymbol(char, m))
    return { met: anyMet, reason: anyMet ? undefined : `Shaman Symbol of ${marks.join(', ')} required`, markList: marks, markType: 'shamanOnly' }
  }

  // Attribute check
  const attrMatch = str.match(/^(\w+)\s+(\d+)\+$/) || str.match(/^(\d+)\+\s*(\w+)$/)
  if (attrMatch) {
    const attrNames = ['str','dex','con','aw','awareness','chr','wp','willpower','strength','dexterity','constitution','charisma']
    const [, a, b] = attrMatch
    const attrName = attrNames.includes(a.toLowerCase()) ? a : b
    const threshold = attrNames.includes(a.toLowerCase()) ? parseInt(b) : parseInt(a)
    if (attrNames.includes(attrName.toLowerCase())) {
      const val = getAttrValue(char, attrName)
      if (val < threshold) return { met: false, reason: `${attrName} ${threshold}+ required (currently ${val})` }
      return { met: true }
    }
  }
// Cap prereq: "<SkillName" means rank must be less than that skill's rank
  if (str.startsWith('<')) {
    const capSkillName = str.slice(1).trim()
    const capRank = getRankAcrossAllSkills(char, capSkillName)
    const myRank = 0 // will be checked at commit time, just return met:true here
    // We can't check "my rank" here without knowing the current skill
    // so just check if the cap skill has any rank at all (rank > 0 means allowed to start)
    if (capRank === 0) return { met: false, reason: `${capSkillName} rank 1+ required first` }
    return { met: true, capSkill: capSkillName, capRank }
  }
  // Skill threshold
  const skillThresholdMatch = str.match(/^(.+?)\s+(\d+)\+?$/)
  if (skillThresholdMatch) {
    const skillName = skillThresholdMatch[1].trim()
    const threshold = parseInt(skillThresholdMatch[2])
    const isGeneral = generalSkillsData.some(s => s.name === skillName)
    if (isGeneral) {
      const attrs = getEffectiveAttrs(char)
      const score = calcGeneralScore(skillName, char, attrs)
      if (score < threshold) return { met: false, reason: `${skillName} ${threshold}+ required (currently ${score})` }
      return { met: true }
    }
    const rank = getRankAcrossAllSkills(char, skillName)
    if (rank < threshold) return { met: false, reason: `${skillName} rank ${threshold} required (currently ${rank})` }
    return { met: true }
  }

  // Plain skill name
  const skipPatterns = [/sword/i, /axe/i, /spear/i, /unarmed/i, /dagger/i, /staff/i, /^long$/i, /^short$/i, /^quick$/i]
  if (skipPatterns.some(p => p.test(str))) return { met: true, tag: str }

  const rank = getRankAcrossAllSkills(char, str)
  if (rank === 0) {
    const genPts = parseInt(char.generalSkills?.[str]?.pointsInvested) || 0
    if (genPts === 0) return { met: false, reason: `${str} required` }
  }
  return { met: true }
}

function checkPrereq(prereqStr, char, stats) {
  if (!prereqStr || prereqStr.toLowerCase() === 'none') return { met: true, tags: [], markRequirements: [], capRequirements: [] }
  const tokens = prereqStr.split(/\n/).map(s => s.trim()).filter(Boolean)
  const tags = [], failures = [], markRequirements = [], capRequirements = []

  for (const token of tokens) {
    // Plain "or" conditions that are not mark lists
    if (
      / or /i.test(token) &&
      !/mark\s+or\s+shaman/i.test(token) &&
      !/\bmark\s+of\b/i.test(token) &&
      !/shaman\s+symbol\s+of/i.test(token)
    ) {
      const orParts = token.split(/ or /i).map(s => s.trim())
      const orResults = orParts.map(p => checkSinglePrereq(p, char, stats))
      if (!orResults.some(r => r.met)) {
        failures.push(orParts.map((p, i) => orResults[i].reason || p).join(' or '))
      }
      orResults.forEach(r => { if (r.tag) tags.push(r.tag) })
      continue
    }

    const result = checkSinglePrereq(token, char, stats)
    if (result.ignore) continue
    if (result.tag) tags.push(result.tag)
    if (result.markList) markRequirements.push({ list: result.markList, type: result.markType, met: result.met })
    if (result.capSkill) capRequirements.push({ capSkill: result.capSkill, capRank: result.capRank })
    if (!result.met) failures.push(result.reason || token)
  }

  if (failures.length > 0) return { met: false, reason: failures.join(' · '), tags, markRequirements, capRequirements }
 return { met: true, tags, markRequirements, capRequirements }
}

function EditablePoints({ value, onCommit, theme, isActive, locked }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const T = theme

  if (locked) {
    return <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: 'var(--text3)', textAlign: 'center', opacity: 0.35, cursor: 'not-allowed' }}>{value}</div>
  }

  const startEdit = () => { setDraft(String(value)); setError(null); setEditing(true) }
  const commit = () => {
    const num = parseInt(draft)
    if (isNaN(num) || num < 0) { setError('Must be ≥ 0'); return }
    const result = onCommit(num)
    if (result?.error) { setError(result.error) }
    else { setError(null); setEditing(false) }
  }
  const cancel = () => { setEditing(false); setError(null) }

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <input autoFocus value={draft}
          onChange={e => { setDraft(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
          onBlur={commit} onFocus={e => e.target.select()}
          style={{ width: 48, textAlign: 'center', background: 'var(--bg)', border: `1px solid ${error ? '#c94a4a' : T.primary}`, color: 'var(--text)', borderRadius: 3, padding: '2px 4px', fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700 }}
        />
        {error && <div style={{ fontSize: '.55rem', color: '#c94a4a', textAlign: 'center', maxWidth: 72, lineHeight: 1.3 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div onClick={startEdit} title="Click to edit" style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: isActive ? T.primary2 : 'var(--text2)', cursor: 'pointer', textAlign: 'center', borderBottom: `1px dotted ${isActive ? T.primary : 'var(--border2)'}`, minWidth: 24, display: 'inline-block' }}>
      {value}
    </div>
  )
}

export { checkPrereq }

export function SkillTableRow({ skill, rank, pointsInvested, lockedPoints, onUpdate, skillSource, theme, level, char, stats, gmMode, unspentPoints, tourLeftId, tourRightId, tourPtsId, forcePtsReadOnly }) {
  const [expanded, setExpanded] = useState(false)
  const T = theme || THEMES.selfImprovement
  const costPerRank = parseInt(skill.costPerRank) || 1
  const maxRankRaw = skill.maxRank
  const maxRankNum = (maxRankRaw === 'any' || !maxRankRaw || isNaN(parseInt(maxRankRaw))) ? Infinity : parseInt(maxRankRaw)
  const mclRaw = (!skill.mcl || skill.mcl === 'any' || skill.mcl === 'Any' || skill.mcl === 'Self') ? null : parseInt(skill.mcl)
  const maint = parseFloat(skill.maintenancePerRank) || 0
  const isActive = rank > 0
  const actualMaint = Math.floor(maint * rank)
  const mclLimit = mclRaw ? mclRaw * (parseInt(level) || 1) : null
  const prereqResult = checkPrereq(skill.prereq, char, stats)
  const locked = lockedPoints?.[skill.name] || 0
  const editLocked = !gmMode && !prereqResult.met && pointsInvested === 0
  const maxDisplay = (maxRankRaw === 'any' || !maxRankRaw || maxRankRaw === 'Passive') ? '∞' : maxRankRaw

const handleCommit = (newPoints) => {
  if (!gmMode && newPoints < locked) return { error: `Cannot go below ${locked} (locked from last save)` }
  if (!gmMode && !prereqResult.met && newPoints > 0) return { error: prereqResult.reason }
  if (!gmMode && mclLimit !== null && newPoints > mclLimit) return { error: `MC/L limit: max ${mclLimit} pts at level ${level}` }
  const newRank = Math.min(Math.floor(newPoints / costPerRank), isFinite(maxRankNum) ? maxRankNum : 999)
  if (!gmMode && isFinite(maxRankNum) && newRank > maxRankNum) return { error: `Max rank is ${maxRankRaw}` }
  if (!gmMode && prereqResult.capRequirements?.length > 0) {
    for (const cap of prereqResult.capRequirements) {
      if (newRank >= cap.capRank) return { error: `Rank must stay below ${cap.capSkill} rank (${cap.capRank})` }
    }
  }
  const pointCost = newPoints - pointsInvested
  if (!gmMode && pointCost > 0 && pointCost > (unspentPoints ?? 999)) {
    return { error: `Not enough points (${unspentPoints} available)` }
  }
  onUpdate && onUpdate(skill.name, newPoints, skillSource || 'martial')
  return {}
}

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', borderBottom: '1px solid var(--border)', background: isActive ? T.dim : 'transparent', minHeight: 52, opacity: editLocked ? 0.55 : 1 }}>
        <div data-tour={tourLeftId || undefined} style={{ padding: '8px 12px', cursor: 'pointer', minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', fontSize: '.92rem', fontFamily: 'Georgia, serif', color: isActive ? T.primary2 : (editLocked ? 'var(--text3)' : 'var(--text)'), fontWeight: isActive ? 600 : 400 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skill.name}</span>
            {prereqResult.tags?.map(tag => (
              <span key={tag} style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.08)', borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{tag}</span>
            ))}
            <span style={{ fontSize: '.58rem', color: 'var(--text3)', opacity: .5, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
          </div>
          {!prereqResult.met && (
            <div style={{ fontSize: '.65rem', color: '#c94a4a', marginTop: 2, fontStyle: 'italic' }}>
              {`⚠ ${prereqResult.reason || 'Prereq no longer met'}`}
            </div>
          )}
          {prereqResult.met && skill.prereq && skill.prereq.toLowerCase() !== 'none'
            && !prereqResult.tags?.length
            && !prereqResult.markRequirements?.length && (
            <div style={{ fontSize: '.62rem', color: 'var(--text3)', marginTop: 1, fontStyle: 'italic' }}>
              {skill.prereq.replace(/\n/g, ' · ')}
            </div>
          )}

        </div>

        <div data-tour={tourPtsId || undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: 2 }}>
          <EditablePoints value={pointsInvested} onCommit={handleCommit} theme={T} isActive={isActive} locked={editLocked || !!forcePtsReadOnly} />
          <div style={{ width: 36, height: 1, background: isActive ? T.border : 'var(--border)' }} />
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>{costPerRank}</div>
        </div>

        <div data-tour={tourRightId || undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: 2 }}>
          <div style={{ fontSize: isActive ? '1.2rem' : '.9rem', fontWeight: isActive ? 700 : 400, fontFamily: 'Georgia, serif', color: isActive ? T.primary2 : 'var(--text3)', lineHeight: 1, textAlign: 'center' }}>
            {isActive ? rank : '—'}
          </div>
          <div style={{ width: 28, height: 1, background: isActive ? T.border : 'var(--border)' }} />
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>{maxDisplay}</div>
          {isActive && actualMaint > 0 && <div style={{ fontSize: '.52rem', color: '#c94a4a', marginTop: 1 }}>{actualMaint}/lvl</div>}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '10px 12px 14px 12px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          {prereqResult.markRequirements?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {prereqResult.markRequirements.map((req, i) => (
                <div key={i} style={{ fontSize: '.75rem', color: req.met ? 'var(--text3)' : '#c94a4a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 2 }}>
                  {req.type === 'markOrShaman' ? 'Mark or Shaman Symbol of: ' : req.type === 'patronOnly' ? "Patron's Mark of: " : 'Shaman Symbol of: '}
                  {req.list.join(', ')} {req.met ? '✓' : '✗'}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, marginBottom: skill.description ? 10 : 0, flexWrap: 'wrap' }}>
            {[
              ['Maint / Rank', maint > 0 ? maint : '—'],
              ...(mclRaw ? [['MC/L', `${mclLimit} pts at Lv${level}`]] : []),
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: '.55rem', letterSpacing: '.12em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: '.9rem', color: T.primary2, fontFamily: 'Georgia, serif', fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {skill.description && (
  <FormattedSkillDescription skillName={skill.name} fallback={skill.description} />
)}
        </div>
      )}
    </>
  )
}

// specialRows: { [skillName]: ReactNode } — rendered below that skill's row
export function RankedSkillTable({ skills, char, stats, onUpdate, theme, sectionLabel, level, skillSource, gmMode, lockedPoints, specialRows, unspentPoints, sectionHeaderTourId, firstSkillTourId, fourthSkillRightTourId, fourthSkillPtsTourId }) {
  const T = theme || THEMES.selfImprovement

  const getSkillData = (skillName) => {
    let data = {}
    if (skillSource === 'selfImprovement') data = char.selfImprovementSkills?.[skillName] || {}
    else if (skillSource === 'arcane') data = char.arcaneSkills?.[skillName] || {}
    else data = char.martialSkills?.[skillName] || {}
    return { rank: parseInt(data.rank) || 0, pointsInvested: parseInt(data.pointsInvested) || 0 }
  }

  return (
    <div>
      {sectionLabel ? (
        <div data-tour={sectionHeaderTourId || undefined} style={{ padding: '10px 12px', background: 'var(--bg)', borderBottom: `2px solid ${T.primary}`, fontSize: '1rem', letterSpacing: '.25em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 600, textAlign: 'center' }}>
          {sectionLabel}
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: GRID, background: 'var(--bg2)', borderBottom: `1px solid ${T.border}`, minHeight: 44, alignItems: 'center' }}>
        <div style={{ padding: '0 12px', fontSize: '.85rem', letterSpacing: '.12em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Skill</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Pts</div>
          <div style={{ width: 36, height: 1, background: T.border }} />
          <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Cost</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Rnk</div>
          <div style={{ width: 28, height: 1, background: T.border }} />
          <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Max</div>
        </div>
      </div>
      {skills.map((skill, idx) => {
        const { rank, pointsInvested } = getSkillData(skill.name)
        return (
          <div key={skill.name}>
            <SkillTableRow
              skill={skill} rank={rank} pointsInvested={pointsInvested}
              lockedPoints={lockedPoints} theme={T} level={level || 1}
              char={char} stats={stats} gmMode={gmMode} onUpdate={onUpdate}
              skillSource={skillSource || 'martial'} unspentPoints={unspentPoints}
              tourLeftId={idx === 0 ? firstSkillTourId : undefined}
              tourRightId={idx === 3 ? fourthSkillRightTourId : undefined}
              tourPtsId={idx === 3 ? fourthSkillPtsTourId : undefined}
            />
            {specialRows?.[skill.name] || null}
          </div>
        )
      })}
    </div>
  )
}

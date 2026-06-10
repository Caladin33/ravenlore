import { useState } from 'react'
import RaceStatBlock from './RaceStatBlock'
import RaceImage from './RaceImage'
import SkillTable from './SkillTable'
import RuleLink from './RuleLink'
import RuleModal from './RuleModal'
import racesData from '../../data/races.json'
import glossaryData from '../../data/glossary.json'
import selfImprovementData from '../../data/selfImprovementSkills.json'
import attributeData from '../../data/attributes.json'

// Skill table data sources — add new ones here as chapters are built
const SKILL_TABLES = {
  selfImprovement: selfImprovementData,
}

// Attribute reference tables — driven from attributes.json (single source of truth).
// `signed` adds a leading + to positive values (bonuses); leave it off for raw counts.
// NOTE: willpower's field key is a best guess ("arcanePower"). If the Arcane Power
// column comes out all zeros, open attributes.json, check the key under "willpower",
// and change `field` below to match. Charisma intentionally has no table.
const ATTR_TABLES = {
  strength:     { label: 'Strength',     columns: [{ field: 'damageBonus',     label: 'Damage Bonus',     signed: true }] },
  dexterity:    { label: 'Dexterity',    columns: [{ field: 'expertise',       label: 'Expertise Bonus',  signed: true },
                                                    { field: 'initiative',      label: 'Initiative Bonus', signed: true },
                                                    { field: 'precision',       label: 'Precision Bonus',  signed: true }] },
  constitution: { label: 'Constitution', columns: [{ field: 'torsoHP',         label: 'Torso HP' },
                                                    { field: 'weightAllowance', label: 'Weight Allowance' }] },
  awareness:    { label: 'Awareness',    columns: [{ field: 'skillCap',        label: 'Skill Cap' },
                                                    { field: 'evasionBonus',    label: 'Evasion Bonus',    signed: true }] },
  willpower:    { label: 'Willpower',    columns: [{ field: 'arcanePower',     label: 'Arcane Power' }] },
}

const RACE_STATS_RE   = /^\{\{raceStats:(\w+)\}\}$/
const RACE_IMAGE_RE   = /^\{\{raceImage:(\w+)(?:\s+(left|right))?\}\}$/
const RACE_START_RE   = /^\{\{raceStart:(\w+)(?:\s+(left|right))?\}\}$/
const RACE_END_RE     = /^\{\{raceEnd\}\}$/
const SKILL_TABLE_RE  = /^\{\{skillTable:(\w+)\}\}$/
const ATTR_TABLE_RE   = /^\{\{attrTable:(\w+)\}\}$/
const POV_START_RE    = /^\{\{pov\}\}$/
const POV_END_RE      = /^\{\{povEnd\}\}$/
const PLAY_START_RE   = /^\{\{play\}\}$/
const PLAY_END_RE     = /^\{\{playEnd\}\}$/
const GAP_RE          = /^\{\{gap\}\}$/
const IMG_RE          = /^\{\{img:(\S+?)(?:\s+(left|right|center))?\}\}$/
const COLS_START_RE   = /^\{\{cols\}\}$/
const COL_BREAK_RE    = /^\{\{col\}\}$/
const COLS_END_RE     = /^\{\{colsEnd\}\}$/

const DIRECTIVE_SPLIT = /({{raceStats:\w+}}|{{raceImage:\w+(?:\s+(?:left|right))?}}|{{raceStart:\w+(?:\s+(?:left|right))?}}|{{raceEnd}}|{{skillTable:\w+}}|{{attrTable:\w+}}|{{pov}}|{{povEnd}}|{{play}}|{{playEnd}}|{{gap}}|{{img:[^}]+}}|{{cols}}|{{col}}|{{colsEnd}})/

// Format an attribute cell value; positive bonuses get a leading +
function formatAttrVal(v, signed) {
  const n = (v === undefined || v === null) ? 0 : v
  return signed && n > 0 ? `+${n}` : String(n)
}

// Data-driven attribute table. Merges consecutive attribute values whose column
// values are all identical into a single range row (e.g. "8-13").
function AttrTable({ attribute }) {
  const config = ATTR_TABLES[attribute]
  if (!config) { console.warn(`MarkdownRenderer: no attribute table "${attribute}"`); return null }
  const data = attributeData[attribute]
  if (!data) { console.warn(`MarkdownRenderer: no attribute data "${attribute}"`); return null }

  const cols = config.columns
  const keys = Object.keys(data).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b)

  const rows = []
  for (const k of keys) {
    const vals = cols.map(c => data[String(k)]?.[c.field] ?? 0)
    const prev = rows[rows.length - 1]
    if (prev && prev.end === k - 1 && prev.vals.length === vals.length && prev.vals.every((v, idx) => v === vals[idx])) {
      prev.end = k
    } else {
      rows.push({ start: k, end: k, vals })
    }
  }

  return (
    <table className="attr-table">
      <thead>
        <tr>
          <th>{config.label}</th>
          {cols.map(c => <th key={c.field}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.start === r.end ? r.start : `${r.start}-${r.end}`}</td>
            {r.vals.map((v, j) => <td key={j}>{formatAttrVal(v, cols[j].signed)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function parseInline(text, glossary, onOpen) {
  // Inline tokens: [[glossary]], **bold**, ++big++
  const parts = text.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\+\+.*?\+\+)/g)
  return parts.map((part, i) => {
    let m
    if ((m = part.match(/^\[\[(.*?)\]\]$/))) {
      return <RuleLink key={i} term={m[1]} glossary={glossary} onOpen={onOpen} />
    }
    if ((m = part.match(/^\*\*(.*?)\*\*$/))) {
      return <strong key={i}>{m[1]}</strong>
    }
    if ((m = part.match(/^\+\+(.*?)\+\+$/))) {
      return <span key={i} className="hb-big">{m[1]}</span>
    }
    return part
  })
}

function parseMarkdown(text, keyPrefix, glossary, onOpen) {
  const elements = []
  let paraLines = []
  let counter = 0

  const flushPara = () => {
    const t = paraLines.join(' ').trim()
    if (t) {
      elements.push(
        <p key={`${keyPrefix}-p-${counter++}`}>
          {parseInline(t, glossary, onOpen)}
        </p>
      )
    }
    paraLines = []
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      flushPara()
    } else if (line.startsWith('### ')) {
      flushPara()
      elements.push(<h3 key={`${keyPrefix}-h3-${counter++}`}>{parseInline(line.slice(4), glossary, onOpen)}</h3>)
    } else if (line.startsWith('## ')) {
      flushPara()
      elements.push(<h2 key={`${keyPrefix}-h2-${counter++}`}>{parseInline(line.slice(3), glossary, onOpen)}</h2>)
    } else if (line.startsWith('# ')) {
      flushPara()
      elements.push(<h1 key={`${keyPrefix}-h1-${counter++}`}>{parseInline(line.slice(2), glossary, onOpen)}</h1>)
    } else {
      paraLines.push(line)
    }
  }
  flushPara()

  return elements
}

export default function MarkdownRenderer({ content }) {
  const [openEntry, setOpenEntry] = useState(null)
  if (!content) return null

  const segments = content.split(DIRECTIVE_SPLIT)
  const elements = []

  let inRaceSection = false
  let raceSectionKey = null
  let raceSectionSide = 'right'
  let raceSectionContent = []

  let styleBlock = null        // 'pov' | 'play' | null
  let styleContent = []

  let inCols = false           // two-column layout state
  let columns = []             // array of column element-arrays
  let curCol = null            // the column currently being filled

  const flushRaceSection = (i) => {
    const imgCol = (
      <div key={`race-img-col-${raceSectionKey}`} className="race-section__image">
        <RaceImage raceKey={raceSectionKey} />
      </div>
    )
    const textCol = (
      <div key={`race-text-col-${raceSectionKey}`} className="race-section__text">
        {raceSectionContent}
      </div>
    )
    elements.push(
      <div
        key={`race-section-${raceSectionKey}-${i}`}
        className={`race-section race-section--img-${raceSectionSide}`}
      >
        {raceSectionSide === 'left' ? [imgCol, textCol] : [textCol, imgCol]}
      </div>
    )
    inRaceSection = false
    raceSectionKey = null
    raceSectionContent = []
  }

  const flushStyleBlock = (i) => {
    elements.push(
      <div key={`style-${styleBlock}-${i}`} className={styleBlock === 'pov' ? 'hb-pov' : 'hb-play'}>
        {styleContent}
      </div>
    )
    styleBlock = null
    styleContent = []
  }

  const flushCols = (i) => {
    elements.push(
      <div key={`cols-${i}`} className="hb-cols">
        {columns.map((colEls, ci) => (
          <div key={ci} className="hb-col">{colEls}</div>
        ))}
      </div>
    )
    inCols = false
    columns = []
    curCol = null
  }

  // Helper: route a rendered element into whichever container is currently open
  const pushEl = (el) => {
    if (styleBlock) styleContent.push(el)
    else if (inCols && curCol) curCol.push(el)
    else if (inRaceSection) raceSectionContent.push(el)
    else elements.push(el)
  }

  segments.forEach((seg, i) => {
    const trimmed = seg.trim()

    // {{cols}} / {{col}} / {{colsEnd}} — two-column layout
    if (COLS_START_RE.test(trimmed)) {
      inCols = true
      columns = []
      curCol = []
      columns.push(curCol)
      return
    }
    if (COL_BREAK_RE.test(trimmed)) {
      if (inCols) { curCol = []; columns.push(curCol) }
      return
    }
    if (COLS_END_RE.test(trimmed)) {
      if (inCols) flushCols(i)
      return
    }

    // {{pov}} / {{play}} — open a styled prose block
    if (POV_START_RE.test(trimmed))  { styleBlock = 'pov';  styleContent = []; return }
    if (PLAY_START_RE.test(trimmed)) { styleBlock = 'play'; styleContent = []; return }

    // {{povEnd}} / {{playEnd}} — close it
    if (POV_END_RE.test(trimmed) || PLAY_END_RE.test(trimmed)) {
      if (styleBlock) flushStyleBlock(i)
      return
    }

    // {{gap}} — vertical spacer
    if (GAP_RE.test(trimmed)) {
      pushEl(<div key={`gap-${i}`} className="hb-gap" />)
      return
    }

    // {{img:path side}} — general image (path is root-relative, e.g. /layout/scene.jpg)
    const imgMatch = trimmed.match(IMG_RE)
    if (imgMatch) {
      const src = imgMatch[1]
      const align = imgMatch[2] || 'center'
      pushEl(<img key={`img-${i}`} src={src} alt="" className={`hb-img hb-img--${align}`} />)
      return
    }

    // {{attrTable:key}} — data-driven attribute table
    const attrMatch = trimmed.match(ATTR_TABLE_RE)
    if (attrMatch) {
      pushEl(<AttrTable key={`attr-${attrMatch[1]}-${i}`} attribute={attrMatch[1]} />)
      return
    }

    // {{raceStart:key side}}
    const startMatch = trimmed.match(RACE_START_RE)
    if (startMatch) {
      inRaceSection = true
      raceSectionKey = startMatch[1]
      raceSectionSide = startMatch[2] || 'right'
      raceSectionContent = []
      return
    }

    // {{raceEnd}}
    if (RACE_END_RE.test(trimmed)) {
      if (inRaceSection) flushRaceSection(i)
      return
    }

    // {{raceStats:key}}
    const statsMatch = trimmed.match(RACE_STATS_RE)
    if (statsMatch) {
      const key = statsMatch[1]
      const race = racesData[key]
      if (!race) { console.warn(`MarkdownRenderer: no race "${key}"`); return }
      pushEl(<RaceStatBlock key={`stats-${key}-${i}`} race={race} />)
      return
    }

    // {{raceImage:key side}}
    const imageMatch = trimmed.match(RACE_IMAGE_RE)
    if (imageMatch) {
      pushEl(<RaceImage key={`raceimg-${imageMatch[1]}-${i}`} raceKey={imageMatch[1]} />)
      return
    }

    // {{skillTable:key}}
    const tableMatch = trimmed.match(SKILL_TABLE_RE)
    if (tableMatch) {
      const key = tableMatch[1]
      const skills = SKILL_TABLES[key]
      if (!skills) { console.warn(`MarkdownRenderer: no skill table "${key}"`); return }
      pushEl(<SkillTable key={`table-${key}-${i}`} skills={skills} />)
      return
    }

    // Plain markdown
    const parsed = parseMarkdown(seg, `seg-${i}`, glossaryData, setOpenEntry)
    if (styleBlock) styleContent.push(...parsed)
    else if (inCols && curCol) curCol.push(...parsed)
    else if (inRaceSection) raceSectionContent.push(...parsed)
    else elements.push(...parsed)
  })

  return (
    <div className="handbook-content">
      {elements}
      {openEntry && <RuleModal entry={openEntry} onClose={() => setOpenEntry(null)} />}
    </div>
  )
}
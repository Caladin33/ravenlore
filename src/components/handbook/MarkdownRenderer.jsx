import { useState } from 'react'
import RaceStatBlock from './RaceStatBlock'
import RaceImage from './RaceImage'
import SkillTable from './SkillTable'
import RuleLink from './RuleLink'
import RuleModal from './RuleModal'
import racesData from '../../data/races.json'
import glossaryData from '../../data/glossary.json'
import selfImprovementData from '../../data/selfImprovementSkills.json'

// Skill table data sources — add new ones here as chapters are built
const SKILL_TABLES = {
  selfImprovement: selfImprovementData,
}

const RACE_STATS_RE   = /^\{\{raceStats:(\w+)\}\}$/
const RACE_IMAGE_RE   = /^\{\{raceImage:(\w+)(?:\s+(left|right))?\}\}$/
const RACE_START_RE   = /^\{\{raceStart:(\w+)(?:\s+(left|right))?\}\}$/
const RACE_END_RE     = /^\{\{raceEnd\}\}$/
const SKILL_TABLE_RE  = /^\{\{skillTable:(\w+)\}\}$/
const POV_START_RE    = /^\{\{pov\}\}$/
const POV_END_RE      = /^\{\{povEnd\}\}$/
const PLAY_START_RE   = /^\{\{play\}\}$/
const PLAY_END_RE     = /^\{\{playEnd\}\}$/
const GAP_RE          = /^\{\{gap\}\}$/
const IMG_RE          = /^\{\{img:(\S+?)(?:\s+(left|right|center))?\}\}$/

const DIRECTIVE_SPLIT = /({{raceStats:\w+}}|{{raceImage:\w+(?:\s+(?:left|right))?}}|{{raceStart:\w+(?:\s+(?:left|right))?}}|{{raceEnd}}|{{skillTable:\w+}}|{{pov}}|{{povEnd}}|{{play}}|{{playEnd}}|{{gap}}|{{img:[^}]+}})/

function parseInline(text, glossary, onOpen) {
  const parts = text.split(/(\[\[.*?\]\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[\[(.*?)\]\]$/)
    if (match) {
      return <RuleLink key={i} term={match[1]} glossary={glossary} onOpen={onOpen} />
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

  // Helper: route a rendered element into whichever container is currently open
  const pushEl = (el) => {
    if (styleBlock) styleContent.push(el)
    else if (inRaceSection) raceSectionContent.push(el)
    else elements.push(el)
  }

  segments.forEach((seg, i) => {
    const trimmed = seg.trim()

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
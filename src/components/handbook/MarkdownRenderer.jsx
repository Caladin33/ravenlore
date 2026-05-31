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

const DIRECTIVE_SPLIT = /({{raceStats:\w+}}|{{raceImage:\w+(?:\s+(?:left|right))?}}|{{raceStart:\w+(?:\s+(?:left|right))?}}|{{raceEnd}}|{{skillTable:\w+}})/

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

  segments.forEach((seg, i) => {
    const trimmed = seg.trim()

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
      const el = <RaceStatBlock key={`stats-${key}-${i}`} race={race} />
      if (inRaceSection) raceSectionContent.push(el)
      else elements.push(el)
      return
    }

    // {{raceImage:key side}}
    const imageMatch = trimmed.match(RACE_IMAGE_RE)
    if (imageMatch) {
      const el = <RaceImage key={`img-${imageMatch[1]}-${i}`} raceKey={imageMatch[1]} />
      if (inRaceSection) raceSectionContent.push(el)
      else elements.push(el)
      return
    }

    // {{skillTable:key}}
    const tableMatch = trimmed.match(SKILL_TABLE_RE)
    if (tableMatch) {
      const key = tableMatch[1]
      const skills = SKILL_TABLES[key]
      if (!skills) { console.warn(`MarkdownRenderer: no skill table "${key}"`); return }
      const el = <SkillTable key={`table-${key}-${i}`} skills={skills} />
      if (inRaceSection) raceSectionContent.push(el)
      else elements.push(el)
      return
    }

    // Plain markdown
    const parsed = parseMarkdown(seg, `seg-${i}`, glossaryData, setOpenEntry)
    if (inRaceSection) raceSectionContent.push(...parsed)
    else elements.push(...parsed)
  })

  return (
    <div className="handbook-content">
      {elements}
      {openEntry && <RuleModal entry={openEntry} onClose={() => setOpenEntry(null)} />}
    </div>
  )
}

import RaceStatBlock from './RaceStatBlock'
import racesData from '../../data/races.json'

// Matches {{raceStats:halfOrc}} etc. — key must match the races.json key exactly.
const RACE_DIRECTIVE = /^\{\{raceStats:(\w+)\}\}$/

// Parse a block of plain markdown text into React elements.
// Handles: # h1, ## h2, ### h3, blank-line-separated paragraphs.
// Lines within the same paragraph are joined with a space.
function parseMarkdown(text, keyPrefix) {
  const elements = []
  let paraLines = []
  let counter = 0

  const flushPara = () => {
    const t = paraLines.join(' ').trim()
    if (t) elements.push(<p key={`${keyPrefix}-p-${counter++}`}>{t}</p>)
    paraLines = []
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()

    if (!line) {
      flushPara()
    } else if (line.startsWith('### ')) {
      flushPara()
      elements.push(<h3 key={`${keyPrefix}-h3-${counter++}`}>{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      flushPara()
      elements.push(<h2 key={`${keyPrefix}-h2-${counter++}`}>{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      flushPara()
      elements.push(<h1 key={`${keyPrefix}-h1-${counter++}`}>{line.slice(2)}</h1>)
    } else {
      paraLines.push(line)
    }
  }
  flushPara()

  return elements
}

// Split content on directives (capturing them so they appear in the array),
// then render each segment as either markdown prose or a component.
export default function MarkdownRenderer({ content }) {
  if (!content) return null

  const segments = content.split(/({{raceStats:\w+}})/)
  const elements = []

  segments.forEach((seg, i) => {
    const match = seg.trim().match(RACE_DIRECTIVE)
    if (match) {
      const key = match[1]
      const race = racesData[key]
      if (!race) {
        console.warn(`MarkdownRenderer: no race found for key "${key}"`)
        return
      }
      elements.push(<RaceStatBlock key={`stats-${key}`} race={race} />)
    } else {
      elements.push(...parseMarkdown(seg, `seg-${i}`))
    }
  })

  return <div className="handbook-content">{elements}</div>
}

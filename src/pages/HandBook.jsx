import MarkdownRenderer from '../components/handbook/MarkdownRenderer'
import introContent from '../content/handbook/introduction.md?raw'
import racesContent from '../content/handbook/races.md?raw'
import { useState } from 'react'
import '../styles/handbook.css'

const SECTIONS = [
  { key: 'intro', title: 'Introduction', content: introContent },
  { key: 'races', title: 'Races', content: racesContent },
]

export default function HandBook({ onBack }) {
  const [active, setActive] = useState('intro')
  const section = SECTIONS.find(s => s.key === active)

  return (
    <div className="handbook">
      <button className="handbook-back" onClick={onBack}>← Back</button>
      <nav className="handbook-nav">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={s.key === active ? 'active' : ''}
            onClick={() => setActive(s.key)}
          >
            {s.title}
          </button>
        ))}
      </nav>
      <MarkdownRenderer content={section.content} />
    </div>
  )
}
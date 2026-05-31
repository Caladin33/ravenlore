import MarkdownRenderer from '../components/handbook/MarkdownRenderer'
import racesContent from '../content/handbook/races.md?raw'
import '../styles/handbook.css'

export default function HandBook({ onBack }) {
  return (
    <div className="handbook">
      <button className="handbook-back" onClick={onBack}>← Back</button>
      <MarkdownRenderer content={racesContent} />
    </div>
  )
}
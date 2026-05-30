import MarkdownRenderer from '../components/handbook/MarkdownRenderer'
import racesContent from '../content/handbook/races.md?raw'
import '../styles/handbook.css'

export default function HandBook() {
  return (
    <div className="handbook">
      <MarkdownRenderer content={racesContent} />
    </div>
  )
}
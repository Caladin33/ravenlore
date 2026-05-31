import { useEffect } from 'react'

export default function RuleModal({ entry, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="rule-modal-overlay" onClick={onClose}>
      <div className="rule-modal" onClick={e => e.stopPropagation()}>
        <div className="rule-modal-header">
          <h3>{entry.term}</h3>
          <button className="rule-modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="rule-modal-body">{entry.body}</p>
      </div>
    </div>
  )
}

// Renders a clickable inline term that opens the rules modal.
// Usage in .md: [[Advantage]], [[MoV]], [[Armor Rating]]
// The term text is matched case-insensitively against glossary term and aliases.

export default function RuleLink({ term, glossary, onOpen }) {
  const entry = glossary.find(e =>
    e.term.toLowerCase() === term.toLowerCase() ||
    (e.aliases || []).some(a => a.toLowerCase() === term.toLowerCase())
  )

  if (!entry) {
    // Renders visibly different so missing entries are easy to spot during authoring.
    console.warn(`RuleLink: no glossary entry for "${term}"`)
    return <span className="rule-link-missing">{term}</span>
  }

  return (
    <span
      className="rule-link"
      onClick={() => onOpen(entry)}
      title={`${entry.term} — click for definition`}
    >
      {term}
    </span>
  )
}

import { useState } from 'react'

export default function CharacterImport({ onImport }) {
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const handleParse = () => {
    setError('')
    setPreview(null)
    try {
      const data = JSON.parse(json)
      if (!data.name || !data.race) {
        setError('This does not look like a valid RavenLore character export.')
        return
      }
      setPreview(data)
    } catch (e) {
      setError('Invalid JSON — make sure you copied the full contents of the Export tab.')
    }
  }

  const handleImport = () => {
    if (!preview) return
    const characters = JSON.parse(localStorage.getItem('ravenlore_characters') || '[]')
    const existing = characters.findIndex(c => c.name === preview.name)
    if (existing >= 0) {
      characters[existing] = preview
    } else {
      characters.push(preview)
    }
    localStorage.setItem('ravenlore_characters', JSON.stringify(characters))
    onImport(preview)
  }

  const box = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '20px 24px',
  }

  const label = {
    fontSize: '.65rem', letterSpacing: '.15em', color: 'var(--text3)',
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
    fontFamily: 'Georgia, serif',
  }

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ color: 'var(--gold2)', marginBottom: 4 }}>Import Character</h2>
        <p style={{ color: 'var(--text3)', fontSize: '.9rem', lineHeight: 1.6 }}>
          Export your character from Google Sheets using the RavenLore Exporter script,
          then paste the JSON below.
        </p>
      </div>

      <div style={box}>
        <label style={label}>Paste Character JSON</label>
        <textarea
          value={json}
          onChange={e => { setJson(e.target.value); setError(''); setPreview(null) }}
          placeholder='Paste the contents of the "RavenLore Export" tab here...'
          style={{
            width: '100%', height: 200, resize: 'vertical',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 4, padding: '10px 12px',
            fontFamily: 'monospace', fontSize: '.8rem', lineHeight: 1.5,
          }}
        />
        {error && (
          <div style={{ marginTop: 8, color: '#c94a4a', fontSize: '.85rem' }}>
            ⚠ {error}
          </div>
        )}
        <button
          onClick={handleParse}
          disabled={!json.trim()}
          style={{
            marginTop: 12, padding: '9px 24px',
            background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)',
            color: 'var(--gold2)', borderRadius: 5, fontSize: '.9rem',
            fontFamily: 'Georgia, serif', cursor: json.trim() ? 'pointer' : 'not-allowed',
            opacity: json.trim() ? 1 : 0.5,
          }}
        >
          Validate JSON
        </button>
      </div>

      {preview && (
        <div style={{ ...box, borderColor: '#4a9e4a' }}>
          <div style={{ fontSize: '.65rem', color: '#4a9e4a', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            ✓ Valid Character Data
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['Name', preview.name],
              ['Player', preview.player],
              ['Race', preview.race],
              ['Level', preview.level],
              ['Profession', preview.profession],
              ['Age', preview.age],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px' }}>
                <div style={{ fontSize: '.6rem', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                <div style={{ color: 'var(--text)', fontSize: '.95rem' }}>{val || '—'}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
            {preview.attributes && Object.entries(preview.attributes).map(([attr, val]) => (
              <div key={attr} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '.6rem', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>{attr}</div>
                <div style={{ color: 'var(--gold2)', fontSize: '1.1rem', fontWeight: 600 }}>{val?.base || val || 0}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '.85rem', color: 'var(--text2)' }}>
            <span>⚔ {preview.weapons?.melee?.length || 0} melee weapons</span>
            <span>✦ {preview.knownSpells?.length || 0} spells known</span>
            <span>🔗 {preview.hangingSpells?.filter(s => s.spell)?.length || 0} hanging</span>
            <span>📋 {Object.keys(preview.generalSkills || {}).length} general skills</span>
          </div>

          <button
            onClick={handleImport}
            style={{
              width: '100%', padding: '10px 0',
              background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a',
              color: '#4a9e4a', borderRadius: 5, fontSize: '1rem',
              fontFamily: 'Georgia, serif', cursor: 'pointer', letterSpacing: '.04em',
            }}
          >
            ✓ Import {preview.name} into RavenLore
          </button>
        </div>
      )}

      <div style={{ ...box, background: 'var(--bg2)' }}>
        <div style={{ ...label, marginBottom: 10 }}>How to export from Google Sheets</div>
        <ol style={{ color: 'var(--text2)', fontSize: '.85rem', lineHeight: 2, paddingLeft: 20 }}>
          <li>Open your character sheet in Google Sheets</li>
          <li>Click <strong style={{ color: 'var(--text)' }}>Extensions → Apps Script</strong></li>
          <li>Paste the RavenLore Exporter script and save it</li>
          <li>Click inside the <strong style={{ color: 'var(--text)' }}>exportCharacter</strong> function</li>
          <li>Click <strong style={{ color: 'var(--text)' }}>Run</strong></li>
          <li>Find the new <strong style={{ color: 'var(--text)' }}>"RavenLore Export"</strong> tab in your sheet</li>
          <li>Copy the entire contents of cell A1</li>
          <li>Paste it above and click <strong style={{ color: 'var(--text)' }}>Validate JSON</strong></li>
        </ol>
      </div>
    </div>
  )
}

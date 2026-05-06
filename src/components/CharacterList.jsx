import { useState } from 'react'
import CharacterImport from './CharacterImport'

export default function CharacterList({ onSelectCharacter, characters = [], user, onImport, onDelete }) {
  const [showImport, setShowImport] = useState(false)

const handleImport = (character) => {
  onImport && onImport(character)
  setShowImport(false)
}

const handleDelete = (name) => {
  if (!confirm(`Remove ${name} from your account?`)) return
  onDelete && onDelete(name)
}

  if (showImport) {
    return (
      <div>
        <button
          onClick={() => setShowImport(false)}
          style={{
            marginBottom: 20, background: 'none',
            border: '1px solid var(--border)', color: 'var(--text3)',
            borderRadius: 4, padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: '.85rem',
          }}
        >
          ← Back to Characters
        </button>
        <CharacterImport onImport={handleImport} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: 'var(--gold2)', margin: 0 }}>Characters</h2>
          <div style={{ fontSize: '.65rem', color: 'var(--text3)', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>
            {characters.length} saved on this device
          </div>
        </div>
        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: '8px 20px',
            background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)',
            color: 'var(--gold2)', borderRadius: 5, cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: '.9rem',
          }}
        >
          + Import Character
        </button>
      </div>

      {characters.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', color: 'var(--text3)', marginBottom: 16 }}>⚔</div>
          <div style={{ color: 'var(--text2)', marginBottom: 8 }}>No characters saved yet.</div>
          <div style={{ color: 'var(--text3)', fontSize: '.85rem', marginBottom: 24 }}>
            Import a character from Google Sheets to get started.
          </div>
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: '9px 24px',
              background: 'rgba(201,168,76,.12)', border: '1px solid var(--gold)',
              color: 'var(--gold2)', borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: '.9rem',
            }}
          >
            Import Character
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {characters.map(char => (
            <div
              key={char.name}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', transition: 'border-color .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onClick={() => onSelectCharacter(char)}
            >
              {/* Avatar letter */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', color: 'var(--gold2)', fontWeight: 600,
                flexShrink: 0, fontFamily: 'Georgia, serif',
              }}>
                {char.name.charAt(0)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', marginBottom: 2 }}>
                  {char.name}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>
                  Level {char.level} {char.race} {char.profession && `· ${char.profession}`}
                </div>
                {char.player && (
                  <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 2 }}>
                    Player: {char.player}
                  </div>
                )}
              </div>

              {/* Attribute summary */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {char.attributes && Object.entries(char.attributes).map(([attr, val]) => (
                  <div key={attr} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.55rem', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{attr}</div>
                    <div style={{ fontSize: '.95rem', color: 'var(--text)', fontWeight: 600 }}>{val?.base || val || 0}</div>
                  </div>
                ))}
              </div>

              {/* HP summary */}
              {char.hp?.current && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '.55rem', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2 }}>Torso HP</div>
                  <div style={{ fontSize: '1rem', color: char.hp.current.torso < char.hp.max?.torso ? '#c94a4a' : '#4a9e4a', fontWeight: 600 }}>
                    {char.hp.current.torso}/{char.hp.max?.torso || '?'}
                  </div>
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(char.name) }}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text3)', borderRadius: 4, padding: '5px 10px',
                  cursor: 'pointer', fontSize: '.75rem', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c94a4a'; e.currentTarget.style.color = '#c94a4a' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import ArcaneCompendium from './components/ArcaneCompendium'
import CharacterSheet from './components/CharacterSheet'
import SkillEditor from './components/SkillEditor'
import StuffPage from './components/StuffPage'
import { calculate } from './utils/calculator'
import { loadCharacters, saveCharacter, deleteCharacter } from './characterDB'
import './App.css'

// ── RAVEN LOGO ────────────────────────────────────────────────────────────────
function RavenLogo({ size = 48 }) {
  return (
    <img src="/raven.png" alt="RavenLore" style={{ width: size, height: size, borderRadius: '50%', display: 'block' }} />
  )
}

// ── CHARACTER HEADER (scrolls with page) ──────────────────────────────────────
function CharacterHeader({ character, currentTab, onNavigate, onHome }) {
  const tabBtn = (key, label) => (
    <button
      key={key}
      onClick={() => onNavigate(key)}
      style={{
        background: currentTab === key ? 'rgba(201,168,76,.12)' : 'none',
        border: `1px solid ${currentTab === key ? 'var(--gold2)' : 'var(--border)'}`,
        color: currentTab === key ? 'var(--gold2)' : 'var(--text2)',
        padding: '6px 14px',
        borderRadius: 4,
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: '.85rem',
        letterSpacing: '.05em',
        transition: 'all .2s',
        whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0 18px 0',
      borderBottom: '1px solid var(--border)',
      marginBottom: 20,
      gap: 12,
      flexWrap: 'wrap',
    }}>
      {/* Left: home button + Sheet + Skills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onHome}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 8px 0 0', borderRight: '1px solid var(--border)',
            marginRight: 4, display: 'flex', alignItems: 'center', gap: 6,
          }}
          title="Home"
        >
          <RavenLogo size={28} />
          <span style={{ color: 'var(--gold)', fontSize: '.8rem', fontFamily: 'Georgia, serif', letterSpacing: '.12em' }}>
            RavenLore
          </span>
        </button>
        {tabBtn('sheet', 'Sheet')}
        {tabBtn('skillEditor', 'Skills')}
      </div>

      {/* Center: character info */}
      <div style={{ textAlign: 'center', flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: '1.3rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '.04em' }}>
          {character.name}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 2 }}>
          Level {character.level} {character.race}{character.profession ? ` · ${character.profession}` : ''}
          {character.player ? ` · ${character.player}` : ''}
        </div>
      </div>

      {/* Right: Spells + Stuff */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {tabBtn('spells', 'Spells')}
        {tabBtn('stuff', 'Stuff')}
      </div>
    </div>
  )
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ characters, onSelectCharacter, onDelete, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '40px 0' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <RavenLogo size={100} />
        <h1 style={{
          fontSize: '2.8rem', color: 'var(--gold2)', letterSpacing: '.14em',
          textShadow: '0 0 40px rgba(201,168,76,.4)', fontFamily: 'Georgia, serif',
        }}>RavenLore</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text3)', letterSpacing: '.22em', textTransform: 'uppercase' }}>
          Character Management System
        </p>
      </div>

      {/* Character list */}
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Your Characters
          </h2>
          <button style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', borderRadius: 4, padding: '5px 12px',
            fontFamily: 'Georgia, serif', fontSize: '.8rem', cursor: 'pointer',
          }}>
            + New Character
          </button>
        </div>

        {characters.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: '.9rem' }}>
            No characters yet. Import one or create new.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {characters.map(char => (
              <div
                key={char.id || char.name}
                onClick={() => onSelectCharacter(char)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '14px 18px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
              >
                <div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif' }}>{char.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 3, letterSpacing: '.08em' }}>
                    Level {char.level} {char.race}{char.profession ? ` · ${char.profession}` : ''}
                    {char.player ? ` · ${char.player}` : ''}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(char.name) }}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--text3)', borderRadius: 4, padding: '4px 10px',
                    fontSize: '.75rem', fontFamily: 'Georgia, serif', cursor: 'pointer',
                  }}
                >Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log out */}
      <button
        onClick={onLogout}
        style={{
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--text3)', borderRadius: 4, padding: '7px 20px',
          fontFamily: 'Georgia, serif', fontSize: '.85rem', cursor: 'pointer',
          marginTop: 20, letterSpacing: '.06em',
        }}
      >Log Out</button>
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [characters, setCharacters] = useState([])
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCharacter, setSelectedCharacter] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    loadCharacters(user.id).then(({ characters }) => {
      setCharacters(characters || [])
    })
  }, [user])

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />
  if (!user) return <Auth onAuth={setUser} />

  const navigate = (page) => setCurrentPage(page)

  const handleSelectCharacter = (char) => {
    setSelectedCharacter(char)
    setCurrentPage('sheet')
  }

  const handleUpdateCharacter = (updated) => {
    setSelectedCharacter(updated)
    saveCharacter(updated, user.id).then(() => {
      loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
    })
  }

  const handleDelete = (name) => {
    deleteCharacter(name, user.id).then(() => {
      loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
    })
  }

  const handleLogout = () => {
    supabase.auth.signOut()
    setSelectedCharacter(null)
    setCurrentPage('home')
  }

  // Calculate stats for selected character (needed by StuffPage for weight allowance)
  const selectedCharacterStats = selectedCharacter
    ? (() => {
        try {
          return calculate(selectedCharacter, {
            offHand: selectedCharacter.offHand || 'Empty',
            stance: selectedCharacter.stance || 'None',
            unfettered: false,
          })
        } catch (e) { return null }
      })()
    : null

  const isCharacterPage = selectedCharacter && ['sheet', 'skillEditor', 'spells', 'stuff'].includes(currentPage)

  return (
    <div className="app">
      <main className="app-main">

        {/* Character header — only when a character is open */}
        {isCharacterPage && (
          <CharacterHeader
            character={selectedCharacter}
            currentTab={currentPage}
            onNavigate={navigate}
            onHome={() => { setSelectedCharacter(null); navigate('home') }}
          />
        )}

        {currentPage === 'home' && (
          <HomePage
            characters={characters}
            onSelectCharacter={handleSelectCharacter}
            onDelete={handleDelete}
            onLogout={handleLogout}
          />
        )}

        {currentPage === 'sheet' && selectedCharacter && (
          <CharacterSheet
            character={selectedCharacter}
            onBack={() => { setSelectedCharacter(null); navigate('home') }}
            onEditSkills={() => navigate('skillEditor')}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {currentPage === 'skillEditor' && selectedCharacter && (
          <SkillEditor
            character={selectedCharacter}
            onBack={() => navigate('sheet')}
            onSave={(updated) => {
              handleUpdateCharacter(updated)
              navigate('sheet')
            }}
          />
        )}

        {currentPage === 'spells' && selectedCharacter && (
          <ArcaneCompendium character={selectedCharacter} onUpdateCharacter={handleUpdateCharacter} />
        )}

        {currentPage === 'stuff' && selectedCharacter && (
          <StuffPage
            character={selectedCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            stats={selectedCharacterStats}
          />
        )}

      </main>
    </div>
  )
}

export default App

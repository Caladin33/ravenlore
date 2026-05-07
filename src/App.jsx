import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import ArcaneCompendium from './components/ArcaneCompendium'
import CharacterList from './components/CharacterList'
import CharacterSheet from './components/CharacterSheet'
import SkillEditor from './components/SkillEditor'
import { loadCharacters, saveCharacter, deleteCharacter } from './characterDB'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [characters, setCharacters] = useState([])
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

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

  const navigate = (page) => {
    setCurrentPage(page)
    setMenuOpen(false)
  }

  const navItems = [
    { key: 'home', label: 'Home' },
    { key: 'compendium', label: 'Arcane Compendium' },
    { key: 'characters', label: 'Characters' },
  ]

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">⚔ RavenLore</div>

        {/* Desktop nav links */}
        <div className="nav-links nav-desktop">
          {navItems.map(item => (
            <button
              key={item.key}
              className={currentPage === item.key ? 'active' : ''}
              onClick={() => navigate(item.key)}
            >{item.label}</button>
          ))}
          <button onClick={() => supabase.auth.signOut()}>Log Out</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          {navItems.map(item => (
            <button
              key={item.key}
              className={currentPage === item.key ? 'active' : ''}
              onClick={() => navigate(item.key)}
            >{item.label}</button>
          ))}
          <button onClick={() => { supabase.auth.signOut(); setMenuOpen(false) }}>Log Out</button>
        </div>
      )}

      <main className="app-main">
        {currentPage === 'home' && <HomePage setCurrentPage={navigate} />}
        {currentPage === 'compendium' && <ArcaneCompendium />}
        {currentPage === 'create' && <ComingSoon title="Character Creation" />}
        {currentPage === 'characters' && (
          <CharacterList
            characters={characters}
            user={user}
            onSelectCharacter={(char) => { setSelectedCharacter(char); setCurrentPage('sheet') }}
            onImport={(char) => {
              saveCharacter(char, user.id).then(() => {
                loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
              })
            }}
            onDelete={(name) => {
              deleteCharacter(name, user.id).then(() => {
                loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
              })
            }}
          />
        )}
        {currentPage === 'sheet' && selectedCharacter && (
          <CharacterSheet
            character={selectedCharacter}
            onBack={() => setCurrentPage('characters')}
            onEditSkills={() => setCurrentPage('skillEditor')}
            onUpdateCharacter={(updated) => {
              setSelectedCharacter(updated)
              saveCharacter(updated, user.id).then(() => {
                loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
              })
            }}
          />
        )}
        {currentPage === 'skillEditor' && selectedCharacter && (
          <SkillEditor
            character={selectedCharacter}
            onBack={() => setCurrentPage('sheet')}
            onSave={(updated) => {
              setSelectedCharacter(updated)
              saveCharacter(updated, user.id).then(() => {
                loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
              })
              setCurrentPage('sheet')
            }}
          />
        )}
      </main>
    </div>
  )
}

function HomePage({ setCurrentPage }) {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>RavenLore</h1>
        <p className="home-subtitle">Character Management System</p>
      </div>
      <div className="home-cards">
        <div className="home-card" onClick={() => setCurrentPage('characters')}>
          <div className="card-icon">⚔</div>
          <h2>Characters</h2>
          <p>Import or view your characters</p>
        </div>
        <div className="home-card" onClick={() => setCurrentPage('compendium')}>
          <div className="card-icon">✦</div>
          <h2>Arcane Compendium</h2>
          <p>Browse and search all 518 spells</p>
        </div>
      </div>
    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="coming-soon">
      <h2>{title}</h2>
      <p>Coming soon...</p>
    </div>
  )
}

export default App

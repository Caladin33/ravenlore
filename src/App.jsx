import ArcaneCompendium from './components/ArcaneCompendium'
import CharacterList from './components/CharacterList'
import CharacterSheet from './components/CharacterSheet'
import SkillEditor from './components/SkillEditor'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import { loadCharacters, saveCharacter, deleteCharacter } from './characterDB'
import './App.css'

function App() {
 const [user, setUser] = useState(null)
const [authLoading, setAuthLoading] = useState(true)

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
const [characters, setCharacters] = useState([])

useEffect(() => {
  if (!user) return
  loadCharacters(user.id).then(({ characters }) => {
    setCharacters(characters || [])
  })
}, [user])
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />
  if (!user) return <Auth onAuth={setUser} />
  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">⚔ RavenLore</div>
        <div className="nav-links">
          <button
            className={currentPage === 'home' ? 'active' : ''}
            onClick={() => setCurrentPage('home')}
          >Home</button>
          <button
            className={currentPage === 'compendium' ? 'active' : ''}
            onClick={() => setCurrentPage('compendium')}
          >Arcane Compendium</button>
          <button
            className={currentPage === 'create' ? 'active' : ''}
            onClick={() => setCurrentPage('create')}
          >New Character</button>
          <button
            className={currentPage === 'characters' ? 'active' : ''}
            onClick={() => setCurrentPage('characters')}
          >Characters</button>
        </div>
      </nav>

      <main className="app-main">
        {currentPage === 'home' && <HomePage setCurrentPage={setCurrentPage} />}
        {currentPage === 'compendium' && <ArcaneCompendium />}
        {currentPage === 'create' && <ComingSoon title="Character Creation" />}
        {currentPage === 'characters' && <CharacterList 
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
/>}
        {currentPage === 'sheet' && selectedCharacter && (
 <CharacterSheet
  character={selectedCharacter}
  onBack={() => setCurrentPage('characters')}
  onEditSkills={() => setCurrentPage('skillEditor')}
  onUpdateCharacter={(updated) => {
  setSelectedCharacter(updated)
  const chars = JSON.parse(localStorage.getItem('ravenlore_characters') || '[]')
  const idx = chars.findIndex(c => c.name === updated.name)
  if (idx >= 0) chars[idx] = updated
  localStorage.setItem('ravenlore_characters', JSON.stringify(chars))
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
        <div className="home-card" onClick={() => setCurrentPage('create')}>
          <div className="card-icon">✦</div>
          <h2>New Character</h2>
          <p>Create a new character from scratch</p>
        </div>
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

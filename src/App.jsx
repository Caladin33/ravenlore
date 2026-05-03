import { useState } from 'react'
import ArcaneCompendium from './components/ArcaneCompendium'
import CharacterList from './components/CharacterList'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

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
        {currentPage === 'characters' && <CharacterList onSelectCharacter={(char) => setCurrentPage('sheet')} />}
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

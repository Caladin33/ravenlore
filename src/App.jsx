import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import ArcaneCompendium from './components/ArcaneCompendium'
import CharacterSheet from './components/CharacterSheet'
import SkillEditor from './components/SkillEditor'
import StuffPage from './components/StuffPage'
import BioPage from './components/BioPage'
import CharacterWizard from './components/CharacterWizard'
import GMView from './components/GMView'
import { calculate } from './utils/calculator'
import { loadCharacters, saveCharacter, deleteCharacter, getUserRole } from './characterDB'
import ConfirmModal from './components/ConfirmModal'
import NewPlayerTour from './components/NewPlayerTour'
import './App.css'

function RavenLogo({ size = 48 }) {
  return (
    <img src="/raven.png" alt="RavenLore" style={{ width: size, height: size, borderRadius: '50%', display: 'block' }} />
  )
}

// ── CHARACTER TOKEN ───────────────────────────────────────────────────────────
function CharacterToken({ imageUrl, name, size = 36, onClick, isActive, 'data-tour': dataTour }) {
  return (
    <button
      data-tour={dataTour}
      onClick={onClick}
      title="Bio"
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${isActive ? 'var(--gold2)' : 'var(--border2)'}`,
        background: 'var(--bg2)', overflow: 'hidden',
        cursor: 'pointer', padding: 0, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color .2s',
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <svg viewBox="0 0 36 36" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="13" r="7" fill="var(--text3)" opacity="0.5" />
          <ellipse cx="18" cy="32" rx="11" ry="8" fill="var(--text3)" opacity="0.5" />
        </svg>
      )}
    </button>
  )
}

// ── CHARACTER HEADER ──────────────────────────────────────────────────────────
function CharacterHeader({ character, currentTab, onNavigate, onHome, gmModeActive }) {
  const tabBtn = (key, label) => (
    <button
      key={key}
      data-tour="nav-tab-btn"
      onClick={() => onNavigate(key)}
      style={{
        background: currentTab === key ? 'rgba(201,168,76,.12)' : 'none',
        border: `1px solid ${currentTab === key ? 'var(--gold2)' : 'var(--border)'}`,
        color: currentTab === key ? 'var(--gold2)' : 'var(--text2)',
        padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
        fontFamily: 'Georgia, serif', fontSize: '.85rem',
        letterSpacing: '.05em', transition: 'all .2s',
        whiteSpace: 'nowrap', flex: '1 1 auto', textAlign: 'center',
      }}
    >{label}</button>
  )

  const homeBtn = (
    <button
      data-tour="nav-logo"
      onClick={onHome}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 8px 0 0', borderRight: '1px solid var(--border)',
        marginRight: 4, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
      }}
      title="Home"
    >
      <RavenLogo size={28} />
      <span style={{ color: 'var(--gold)', fontSize: '.8rem', fontFamily: 'Georgia, serif', letterSpacing: '.12em' }}>
        RavenLore
      </span>
    </button>
  )

  const charInfo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
      <CharacterToken
        data-tour="nav-token"
        imageUrl={character.imageUrl}
        name={character.name}
        size={36}
        onClick={() => onNavigate('bio')}
        isActive={currentTab === 'bio'}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.3rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '.04em', lineHeight: 1.1 }}>
          {character.name}
          {character.hardcore && <span title="Hardcore character" style={{ marginLeft: 6, fontSize: '.7rem', color: '#c94a4a', verticalAlign: 'middle' }}>⚔</span>}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--text3)', letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 2 }}>
          Level {character.level} {character.race}
          {gmModeActive && <span style={{ marginLeft: 8, color: '#c94a4a', letterSpacing: '.08em' }}>· GM</span>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 20, paddingBottom: 14, paddingTop: 14 }}>
      {/* Desktop */}
      <div className="header-desktop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {homeBtn}
          {tabBtn('sheet', 'Stats')}
          {tabBtn('skillEditor', 'Skills')}
        </div>
        {charInfo}
        <div style={{ display: 'flex', gap: 8 }}>
          {tabBtn('spells', 'Spells')}
          {tabBtn('stuff', 'Stuff')}
        </div>
      </div>

      {/* Mobile */}
      <div className="header-mobile" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {homeBtn}
          <CharacterToken
            data-tour="nav-token"
            imageUrl={character.imageUrl}
            name={character.name}
            size={32}
            onClick={() => onNavigate('bio')}
            isActive={currentTab === 'bio'}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '.04em', lineHeight: 1.1 }}>
              {character.name}
              {character.hardcore && <span title="Hardcore character" style={{ marginLeft: 6, fontSize: '.7rem', color: '#c94a4a', verticalAlign: 'middle' }}>⚔</span>}
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Level {character.level} {character.race}
              {gmModeActive && <span style={{ marginLeft: 6, color: '#c94a4a' }}>· GM</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabBtn('sheet', 'Stats')}
          {tabBtn('skillEditor', 'Skills')}
          {tabBtn('spells', 'Spells')}
          {tabBtn('stuff', 'Stuff')}
        </div>
      </div>
    </div>
  )
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ characters, onSelectCharacter, onDelete, onLogout, onNewCharacter, isGM, onGMView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '40px 0' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <RavenLogo size={100} />
        <h1 style={{ fontSize: '2.8rem', color: 'var(--gold2)', letterSpacing: '.14em', textShadow: '0 0 40px rgba(201,168,76,.4)', fontFamily: 'Georgia, serif' }}>RavenLore</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text3)', letterSpacing: '.22em', textTransform: 'uppercase' }}>Character Management System</p>
      </div>

      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Your Characters</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {isGM && (
              <button onClick={onGMView} style={{ background: 'rgba(201,42,42,.15)', border: '1px solid #c94a4a', color: '#c94a4a', borderRadius: 4, padding: '5px 12px', fontFamily: 'Georgia, serif', fontSize: '.8rem', cursor: 'pointer' }}>
                GM View
              </button>
            )}
            <button onClick={onNewCharacter} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, padding: '5px 12px', fontFamily: 'Georgia, serif', fontSize: '.8rem', cursor: 'pointer' }}>
              + New Character
            </button>
          </div>
        </div>

        {characters.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'Georgia, serif', padding: '40px 0' }}>
            No characters yet. Create your first one above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {characters.map(char => (
              <div key={char.name} onClick={() => onSelectCharacter(char)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', transition: 'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <CharacterToken imageUrl={char.imageUrl} name={char.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.05rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif' }}>{char.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 3, letterSpacing: '.08em' }}>
                    Level {char.level} {char.race}{char.profession ? ` · ${char.profession}` : ''}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(char.name) }}
                  style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, padding: '4px 10px', fontSize: '.75rem', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onLogout} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, padding: '7px 20px', fontFamily: 'Georgia, serif', fontSize: '.85rem', cursor: 'pointer', marginTop: 20, letterSpacing: '.06em' }}>
        Log Out
      </button>
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
  const [userRole, setUserRole] = useState('player') // 'player' | 'gm' | 'superuser'
  const [gmModeActive, setGmModeActive] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [tourStep, setTourStep] = useState(null)

  const isGM = userRole === 'gm' || userRole === 'superuser'
  const isSuperuser = userRole === 'superuser'

  useEffect(() => {
    const saved = localStorage.getItem('rl_tour_step')
    if (saved !== null) setTourStep(parseInt(saved))
  }, [])

  const advanceTour = (stepOrFn) => {
    setTourStep(prev => {
      const next = typeof stepOrFn === 'function' ? stepOrFn(prev) : stepOrFn
      if (next === null) localStorage.removeItem('rl_tour_step')
      else localStorage.setItem('rl_tour_step', String(next))
      return next
    })
  }

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
    loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
    getUserRole(user.id).then(role => setUserRole(role))
  }, [user])

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />
  if (!user) return <Auth onAuth={setUser} />

  const navigate = (page) => setCurrentPage(page)

  const handleSelectCharacter = (char) => {
    setSelectedCharacter(char)
    setGmModeActive(false)
    setCurrentPage('sheet')
  }

  // Called from GMView — opens a character with GM mode forced on
  const handleOpenAsGM = (char) => {
    setSelectedCharacter(char)
    setGmModeActive(true)
    navigate('bio')
  }

  // When leaving a GM-opened character back to home or GM view
  const handleGoHome = () => {
    setSelectedCharacter(null)
    setGmModeActive(false)
    navigate('home')
  }

  const handleGoBackToGM = () => {
    setSelectedCharacter(null)
    setGmModeActive(false)
    navigate('gm')
  }

  const handleNewCharacter = () => setCurrentPage('wizard')

  const handleWizardComplete = async (newChar) => {
    await saveCharacter({ ...newChar, status: 'active' }, user.id)
    loadCharacters(user.id).then(({ characters }) => {
      setCharacters(characters || [])
      const created = characters?.find(c => c.name === newChar.name) || newChar
      setSelectedCharacter(created)
      setGmModeActive(false)
      setCurrentPage('bio')
      advanceTour(0)
    })
  }

  const handleUpdateCharacter = (updated) => {
    setSelectedCharacter(updated)
    // If GM is editing someone else's character, save by owner
    if (gmModeActive && updated._ownerId && updated._ownerId !== user.id) {
      import('./characterDB').then(({ saveCharacterByOwner }) => {
        saveCharacterByOwner(updated, updated._ownerId).then(() => {
          // Don't reload own character list — we're editing someone else's
        })
      })
    } else {
      saveCharacter(updated, user.id).then(() => {
        loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
      })
    }
  }

  const refreshSelectedCharacter = () => {
    loadCharacters(user.id).then(({ characters }) => {
      setCharacters(characters || [])
      if (selectedCharacter) {
        const fresh = characters?.find(c => c.name === selectedCharacter.name)
        if (fresh) setSelectedCharacter(fresh)
      }
    })
  }

  const handleDelete = (name) => {
    setConfirmModal({
      message: `Permanently delete ${name}? This cannot be undone.`,
      dangerous: true,
      onConfirm: () => {
        deleteCharacter(name, user.id).then(() => {
          loadCharacters(user.id).then(({ characters }) => setCharacters(characters || []))
        })
        setConfirmModal(null)
      }
    })
  }

  const handleLogout = () => {
    supabase.auth.signOut()
    setSelectedCharacter(null)
    setGmModeActive(false)
    setCurrentPage('home')
  }

  const selectedCharacterStats = selectedCharacter
    ? (() => { try { return calculate(selectedCharacter, { unfettered: false }) } catch (e) { return null } })()
    : null

  const isCharacterPage = selectedCharacter && ['sheet', 'skillEditor', 'spells', 'stuff', 'bio'].includes(currentPage)

  return (
    <div className="app">
      <main className="app-main">
        {isCharacterPage && (
          <CharacterHeader
            character={selectedCharacter}
            currentTab={currentPage}
            onNavigate={navigate}
            gmModeActive={gmModeActive}
            onHome={gmModeActive ? handleGoBackToGM : handleGoHome}
          />
        )}

        {currentPage === 'home' && (
          <HomePage
            characters={characters}
            onSelectCharacter={handleSelectCharacter}
            onDelete={handleDelete}
            onLogout={handleLogout}
            onNewCharacter={handleNewCharacter}
            isGM={isGM}
            onGMView={() => navigate('gm')}
          />
        )}
        {currentPage === 'gm' && (
          <GMView
            userId={user.id}
            isSuperuser={isSuperuser}
            onBack={() => navigate('home')}
            onOpenAsGM={handleOpenAsGM}
          />
        )}
        {currentPage === 'wizard' && (
          <CharacterWizard userId={user.id} onComplete={handleWizardComplete} onCancel={() => setCurrentPage('home')} />
        )}
        {currentPage === 'sheet' && selectedCharacter && (
          <CharacterSheet
            character={selectedCharacter}
            onBack={gmModeActive ? handleGoBackToGM : handleGoHome}
            onEditSkills={() => navigate('skillEditor')}
            onUpdateCharacter={handleUpdateCharacter}
            onRefresh={refreshSelectedCharacter}
          />
        )}
        {currentPage === 'skillEditor' && selectedCharacter && (
          <SkillEditor
            character={selectedCharacter}
            onBack={() => navigate('sheet')}
            onSave={(updated) => { handleUpdateCharacter(updated); navigate('sheet') }}
            gmModeActive={gmModeActive}
            stats={selectedCharacterStats}
          />
        )}
        {currentPage === 'spells' && selectedCharacter && (
          <ArcaneCompendium character={selectedCharacter} onUpdateCharacter={handleUpdateCharacter} stats={selectedCharacterStats} />
        )}
        {currentPage === 'stuff' && selectedCharacter && (
          <StuffPage character={selectedCharacter} onUpdateCharacter={handleUpdateCharacter} stats={selectedCharacterStats} />
        )}
        {currentPage === 'bio' && selectedCharacter && (
          <BioPage
            character={selectedCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            stats={selectedCharacterStats}
            gmModeActive={gmModeActive}
            onRestartTour={() => advanceTour(0)}
          />
        )}
      </main>

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          dangerous={confirmModal.dangerous}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {tourStep !== null && selectedCharacter && (
        <NewPlayerTour
          step={tourStep}
          character={selectedCharacter}
          currentPage={currentPage}
          onNavigate={navigate}
          onNext={() => advanceTour(s => s + 1)}
          onPrev={() => advanceTour(s => s - 1)}
          onSkip={() => advanceTour(null)}
        />
      )}
    </div>
  )
}

export default App

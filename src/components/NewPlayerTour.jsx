// NewPlayerTour.jsx
// Floating centered tour card. Page stays fully visible and interactive.
// Card sits horizontally centered, shifting vertically to avoid the highlighted element.
// Highlighted elements get a pulsing blue ring via data-tour attributes.
// Tour step is persisted in localStorage to survive browser back/refresh.

import { useEffect, useState } from 'react'

// ── STEP DEFINITIONS ──────────────────────────────────────────────────────────
// target:      data-tour value(s) to highlight. String = single, Array = multi.
// navigateTo:  page to navigate to when Continue is pressed (null = stay)

function buildSteps(character) {
  const availablePts = character?.skillPoints?.totalEarned ?? 0

  return [
    // ── BIO ──────────────────────────────────────────────────────────────────
    {
      page: 'bio',
      navigateTo: null,
      target: 'bio-restart-tour',
      title: 'Welcome to RavenLore!',
      body: "Let me show you around. You can skip at any time — and if you want to come back to this tour later, just click that ❓ Tour button.",
      cta: "Let's go →",
    },
    {
      page: 'bio',
      navigateTo: null,
      target: 'bio-skillpoints',
      title: 'Skill Points',
      body: `This tracks your available, earned, spent, and maintenance points. Right now you have ${availablePts} points ready to spend.`,
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: null,
      target: 'bio-portrait',
      title: 'Character Portrait',
      body: "Upload your character portrait here.",
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: null,
      target: 'bio-campaign',
      title: 'Campaign',
      body: "This shows what campaign the character belongs to, and so which GM can see it.",
      cta: 'Next →',
    },

    // ── HEADER ───────────────────────────────────────────────────────────────
    {
      page: 'bio',
      navigateTo: null,
      target: 'nav-token',
      title: 'Your Token',
      body: "Your token will show here when you add one. Clicking this will always bring you back here.",
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: null,
      target: 'nav-logo',
      title: 'Home Button',
      body: "The raven logo takes you to the home screen where you can switch characters.",
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: 'stuff',
      target: 'nav-tab-btn',   // matches ALL four tab buttons
      title: 'Page Tabs',
      body: "These four tabs are your other pages. Let's visit them.",
      cta: "Go to Stuff →",
    },

    // ── STUFF ────────────────────────────────────────────────────────────────
    {
      page: 'stuff',
      navigateTo: null,
      target: null,
      title: 'The Stuff Page',
      body: "This is the Stuff Page. It's where you put your stuff.",
      cta: 'Next →',
    },
    {
      page: 'stuff',
      navigateTo: null,
      target: 'stuff-encumbrance',
      title: 'Carrying Weight',
      body: "This shows your carrying weight vs your maximum. It updates live as you add items.",
      cta: 'Next →',
    },
    {
      page: 'stuff',
      navigateTo: null,
      target: 'stuff-carried',
      title: 'Carried',
      body: "Most of your stuff goes here. Click or tap the boxes to change them. The weight is per item, and it multiplies for you.",
      cta: 'Next →',
    },
    {
      page: 'stuff',
      navigateTo: null,
      target: 'stuff-notcarried',
      title: 'Not Carried',
      body: "Items here don't count towards your limit. If you talked some poor critter into carrying something for you, put it here.",
      cta: 'Next →',
    },
    {
      page: 'stuff',
      navigateTo: null,
      target: 'stuff-special',
      title: 'Special Items',
      body: "These also count as carried. You can add or remove rows as you need in all of these sections.",
      cta: 'Next →',
    },
    {
      page: 'stuff',
      navigateTo: null,
      target: 'stuff-magic',
      title: 'Magic Item Bonuses',
      body: "Enter bonuses from magical equipment here — they feed directly into your Sheet stats.",
      cta: 'Next →',
    },
    // ── SHEET ────────────────────────────────────────────────────────────────
    {
      page: 'sheet',
      navigateTo: 'sheet',
      target: null,
      title: 'Character Sheet',
      body: "This is the Main Character Sheet. It shows your stats including all penalties and bonuses.",
      cta: 'Next →',
    },
   {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-attr-left',
      title: 'Attributes',
      body: "These are your Attributes. Tap or click for the bonuses they're giving you. The smaller number next to each is the bonus you get on attribute checks.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-attr-derived',
      title: 'Derived Stats',
      body: "These stats reflect your current state. The number inside the brackets on Evasion is your rear Evasion.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-attr-chr',
      title: 'Compliance',
      body: "This shows you're in compliance with the rules.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-attr-mana',
      title: 'Mana',
      body: "This is your current mana. You update this yourself.",
      cta: 'Next →',
    },
  ]
}

// ── HIGHLIGHT ─────────────────────────────────────────────────────────────────

const STYLE_ID = 'tour-highlight-style'

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes tourPulse {
      0%   { box-shadow: 0 0 0 2px rgba(74,144,217,0.85); outline-color: rgba(74,144,217,0.9); }
      60%  { box-shadow: 0 0 0 7px rgba(74,144,217,0.12), 0 0 20px 4px rgba(74,144,217,0.2); outline-color: rgba(74,144,217,0.35); }
      100% { box-shadow: 0 0 0 2px rgba(74,144,217,0.85); outline-color: rgba(74,144,217,0.9); }
    }
    [data-tour].tour-active {
      outline: 2px solid rgba(74,144,217,0.9) !important;
      outline-offset: 4px;
      border-radius: 6px;
      animation: tourPulse 2.2s ease-in-out infinite;
      position: relative;
      z-index: 1;
    }
  `
  document.head.appendChild(s)
}

// Returns true if element is actually visible (not hidden by display:none ancestor)
function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
}

// Returns the bounding rect covering all VISIBLE highlighted elements.
// Skips elements inside display:none containers (e.g. desktop token on mobile).
function getTargetRect(targetId) {
  if (!targetId) return null
  const els = [...document.querySelectorAll(`[data-tour="${targetId}"]`)].filter(isVisible)
  if (!els.length) return null
  let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity
  els.forEach(el => {
    const r = el.getBoundingClientRect()
    if (r.top < top) top = r.top
    if (r.bottom > bottom) bottom = r.bottom
    if (r.left < left) left = r.left
    if (r.right > right) right = r.right
  })
  return { top, bottom, left, right, width: right - left, height: bottom - top }
}

function setHighlight(targetId) {
  document.querySelectorAll('[data-tour].tour-active').forEach(el => {
    el.classList.remove('tour-active')
  })
  if (!targetId) return
  // Only highlight visible elements
  const els = [...document.querySelectorAll(`[data-tour="${targetId}"]`)].filter(isVisible)
  els.forEach(el => el.classList.add('tour-active'))
}

// Scroll the first visible target element into view, then wait for scroll to settle.
function scrollToTarget(targetId) {
  if (!targetId) return Promise.resolve()
  const el = [...document.querySelectorAll(`[data-tour="${targetId}"]`)].find(isVisible)
  if (!el) return Promise.resolve()
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return new Promise(resolve => setTimeout(resolve, 420))
}

// ── CARD POSITIONING ──────────────────────────────────────────────────────────

const CARD_W = 320
const CARD_H_EST = 200
const GAP = 20
const MARGIN = 16

function computeCardPosition(targetId) {
  const vh = window.innerHeight
  const rect = getTargetRect(targetId)

  if (!rect) {
    return { top: Math.round(vh / 2 - CARD_H_EST / 2), bottom: null }
  }

  const centerY = vh / 2
  const cardTop_centered = centerY - CARD_H_EST / 2
  const cardBottom_centered = cardTop_centered + CARD_H_EST
  const overlaps = cardBottom_centered > rect.top - GAP && cardTop_centered < rect.bottom + GAP

  if (!overlaps) {
    return { top: Math.round(cardTop_centered), bottom: null }
  }

  // Try below
  const belowTop = rect.bottom + GAP
  if (belowTop + CARD_H_EST + MARGIN < vh) {
    return { top: Math.round(belowTop), bottom: null }
  }

  // Try above
  if (rect.top - GAP - CARD_H_EST > MARGIN) {
    return { top: null, bottom: Math.round(vh - rect.top + GAP) }
  }

  // Fallback: center
  return { top: Math.round(cardTop_centered), bottom: null }
}

function useCardPosition(targetId, ready) {
  const [pos, setPos] = useState({ top: null, bottom: null })

  useEffect(() => {
    if (!ready) return
    function compute() { setPos(computeCardPosition(targetId)) }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [targetId, ready])

  return pos
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function NewPlayerTour({ step, character, currentPage, onNavigate, onNext, onSkip }) {
  const steps = buildSteps(character)
  const def = steps[step]
  const [posReady, setPosReady] = useState(false)

  useEffect(() => { ensureStyle() }, [])

  useEffect(() => {
    if (!def) return
    setPosReady(false)
    if (def.page && currentPage !== def.page) onNavigate(def.page)
    const t = setTimeout(async () => {
      await scrollToTarget(def.target)
      setHighlight(def.target)
      setPosReady(true)
    }, 160)
    return () => clearTimeout(t)
  }, [step]) // eslint-disable-line

  useEffect(() => () => setHighlight(null), [])

  const pos = useCardPosition(def?.target ?? null, posReady)

  if (!def) return null

  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (def.navigateTo) onNavigate(def.navigateTo)
    if (isLast) { setHighlight(null); onSkip() }
    else onNext()
  }

  const handleSkip = () => { setHighlight(null); onSkip() }

  const cardStyle = {
    position: 'fixed',
    zIndex: 8000,
    width: CARD_W,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderTop: '2px solid #4a90d9',
    borderRadius: 10,
    padding: '20px 20px 16px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    fontFamily: 'Georgia, serif',
    transition: 'top .25s ease, bottom .25s ease, opacity .15s ease',
    opacity: posReady ? 1 : 0,
    ...(pos.bottom !== null
      ? { bottom: pos.bottom }
      : { top: pos.top ?? '40%' }),
  }

  return (
    <div style={cardStyle}>

      {/* Skip */}
      <button onClick={handleSkip} style={{
        position: 'absolute', top: 10, right: 12,
        background: 'none', border: 'none', color: 'var(--text3)',
        fontFamily: 'Georgia, serif', fontSize: '.72rem',
        cursor: 'pointer', textDecoration: 'underline',
        textUnderlineOffset: 2, letterSpacing: '.04em',
      }}>
        Skip tour
      </button>

      {/* Title */}
      <div style={{
        fontSize: '.95rem', color: '#4a90d9',
        fontWeight: 600, letterSpacing: '.03em',
        marginBottom: 10, lineHeight: 1.3,
      }}>
        {def.title}
      </div>

      {/* Body */}
      <p style={{ margin: '0 0 18px', fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.7 }}>
        {def.body}
      </p>

      {/* Footer: progress dots + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', maxWidth: 160 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 14 : 6, height: 6, borderRadius: 3,
              background: i < step ? '#4a90d9' : i === step ? '#6aafef' : 'var(--border2)',
              transition: 'all .2s ease', flexShrink: 0,
            }} />
          ))}
        </div>

        <button onClick={handleNext} style={{
          padding: '8px 16px',
          background: isLast ? 'rgba(74,158,74,.15)' : 'rgba(74,144,217,.12)',
          border: `1px solid ${isLast ? '#4a9e4a' : '#4a90d9'}`,
          color: isLast ? '#4a9e4a' : '#6aafef',
          borderRadius: 5, cursor: 'pointer',
          fontFamily: 'Georgia, serif', fontSize: '.85rem',
          fontWeight: 600, letterSpacing: '.03em', whiteSpace: 'nowrap',
        }}>
          {def.cta}
        </button>
      </div>
    </div>
  )
}

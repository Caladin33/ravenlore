// NewPlayerTour.jsx
// Floating centered tour card. Page stays fully visible and interactive.
// Card sits horizontally centered, shifting vertically to avoid the highlighted element.
// Highlighted elements get a pulsing blue ring via data-tour attributes.
// Tour step is persisted in localStorage to survive browser back/refresh.

import { useEffect, useState } from 'react'

// ── FAKE SPELL COMPONENTS ─────────────────────────────────────────────────────

const MAGIC_COLORS_TOUR = [
  { key: 'chaos',     label: 'Chaos',     color: '#ffffff', shadow: '#ffffff66', bg: 'rgba(255,255,255,.08)', border: '#555' },
  { key: 'chi',       label: 'Chi',       color: '#4a9e4a', shadow: '#4a9e4a66', bg: 'rgba(74,158,74,.08)',   border: '#4a9e4a' },
  { key: 'elemental', label: 'Elemental', color: '#c94a4a', shadow: '#c94a4a66', bg: 'rgba(201,74,74,.08)',   border: '#c94a4a' },
  { key: 'order',     label: 'Order',     color: '#888888', shadow: '#88888866', bg: 'rgba(136,136,136,.08)', border: '#555' },
  { key: 'will',      label: 'Will',      color: '#4a7ec9', shadow: '#4a7ec966', bg: 'rgba(74,126,201,.08)',  border: '#4a7ec9' },
]

function FakeMasteryRanks() {
  return (
    <div style={{ border: '1px solid var(--border2)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg)', marginTop: 4 }}>
      <div style={{ fontSize: '.58rem', letterSpacing: '.15em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 10 }}>Example</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        {MAGIC_COLORS_TOUR.map(({ key, label, color, shadow, bg, border }, i) => (
          <div key={key} style={{ flex: 1, textAlign: 'center', background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: '8px 4px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Georgia, serif', color, textShadow: `0 0 8px ${shadow}`, lineHeight: 1, marginBottom: 4 }}>{i + 1}</div>
            <div style={{ fontSize: '.55rem', color, letterSpacing: '.08em', fontFamily: 'Georgia, serif', opacity: .8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FakeSpellHooks() {
  const hookStyle = (filled) => ({
    background: filled ? 'rgba(201,168,76,.08)' : '#1f1a12',
    border: `1px solid ${filled ? '#c9a84c' : '#3a2e1e'}`,
    color: filled ? '#e8c96a' : '#7a6a50',
    borderRadius: 4, padding: '5px 8px',
    fontFamily: 'Georgia, serif', fontSize: '.82rem', width: '100%',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxSizing: 'border-box',
  })
  const lbl = { fontSize: '.55rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 4 }
  return (
    <div style={{ border: '1px solid #3a2e1e', borderRadius: 8, padding: '12px 14px', background: '#13100a', marginTop: 4 }}>
      <div style={{ fontSize: '.58rem', letterSpacing: '.2em', color: '#7a6a50', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Georgia, serif' }}>Spell Hooks — example</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px', minWidth: 120 }}>
          <div style={lbl}>Hook 1</div>
          <div style={{ background: '#1f1a12', border: '1px solid #3a2e1e', borderRadius: 4, marginBottom: 2 }}>
            {['Levitate', 'Shock', 'Steam Jet'].map((name, i) => (
              <div key={name} style={{ padding: '5px 8px', fontFamily: 'Georgia, serif', fontSize: '.82rem', color: i === 0 ? '#e8c96a' : '#b8a888', borderBottom: i < 2 ? '1px solid #2a2318' : 'none', background: i === 0 ? 'rgba(201,168,76,.08)' : 'transparent' }}>{name}</div>
            ))}
          </div>
          <div style={hookStyle(false)}><span>— Empty —</span><span style={{ fontSize: '.7rem' }}>▾</span></div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: 120 }}>
          <div style={lbl}>Hook 2</div>
          <div style={hookStyle(true)}><span>Levitate</span></div>
        </div>
      </div>
    </div>
  )
}

function WPBadgeTour() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(74,126,201,.15)', border: '1px solid #4a7ec9', borderRadius: 3, padding: '1px 5px', fontSize: '.58rem', fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '.08em', color: '#4a7ec9', marginLeft: 6, flexShrink: 0 }}>WP</span>
  )
}

function FakeSpellDetail() {
  const requireColors = [
    { label: 'Chaos', dot: '#ffffff' },
    { label: 'Order', dot: '#888888' },
  ]
  return (
    <div style={{ border: '1px solid #4a3c28', borderRadius: 8, padding: '14px 16px', background: '#1f1a12', marginTop: 4 }}>
      <div style={{ fontSize: '.58rem', color: '#7a6a50', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Georgia, serif' }}>Alteration · Level 1</div>
      <div style={{ fontSize: '1.05rem', color: '#e8c96a', marginBottom: 4, fontWeight: 600, fontFamily: 'Georgia, serif', display: 'flex', alignItems: 'center' }}>Feather Fall <WPBadgeTour /></div>
      <div style={{ fontSize: '.72rem', color: '#4a7ec9', fontStyle: 'italic', marginBottom: 10, fontFamily: 'Georgia, serif' }}>1 action to cast, no roll required</div>
      <div style={{ fontSize: '.82rem', color: '#b8a888', lineHeight: 1.6, marginBottom: 12, fontFamily: 'Georgia, serif' }}>Target Creature reduces any and all falling damage by 90%. Word of Power.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {[['Range', '100'], ['Duration', '1 minute'], ['Area', 'Target Creature']].map(([label, val]) => (
          <div key={label} style={{ background: '#13100a', border: '1px solid #3a2e1e', borderRadius: 4, padding: '6px 8px', gridColumn: label === 'Area' ? '1 / -1' : 'auto' }}>
            <div style={{ fontSize: '.52rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Georgia, serif' }}>{label}</div>
            <div style={{ fontSize: '.82rem', color: '#e8dcc8', fontFamily: 'Georgia, serif' }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '.52rem', color: '#7a6a50', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7, fontFamily: 'Georgia, serif' }}>Requires</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {requireColors.map(({ label, dot }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#261f15', border: '1px solid #3a2e1e', borderRadius: 4, padding: '4px 9px', fontSize: '.75rem', fontFamily: 'Georgia, serif' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
              <span style={{ color: '#b8a888' }}>{label} 1+</span>
              <span style={{ color: '#4a9e4a' }}>✓</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', padding: '8px 0', background: 'rgba(201,168,76,.12)', border: '1px solid #c9a84c', color: '#e8c96a', borderRadius: 5, fontSize: '.88rem', fontFamily: 'Georgia, serif', textAlign: 'center' }}>✦ Add to Known</div>
    </div>
  )
}

// ── FAKE DEMO COMPONENTS ──────────────────────────────────────────────────────

function FakeBodybuildingRow() {
  const T = { primary: '#c9a84c', primary2: '#e8c96a', border: 'rgba(201,168,76,.25)' }
  return (
    <div style={{ border: '1px solid var(--border2)', borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 52px', alignItems: 'center', background: 'rgba(201,168,76,.1)', minHeight: 52 }}>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontSize: '.92rem', fontFamily: 'Georgia, serif', color: T.primary2, fontWeight: 600 }}>Bodybuilding</div>
          <div style={{ fontSize: '.62rem', color: 'var(--text3)', fontStyle: 'italic', marginTop: 2 }}>none</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: 2 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: T.primary2, borderBottom: `1px dotted ${T.primary}`, minWidth: 24, textAlign: 'center' }}>40</div>
          <div style={{ width: 36, height: 1, background: T.border }} />
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif' }}>20</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: 2 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: T.primary2, lineHeight: 1, textAlign: 'center' }}>2</div>
          <div style={{ width: 28, height: 1, background: T.border }} />
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>6</div>
        </div>
      </div>
    </div>
  )
}

function FakeWeaponModal() {
  const row = (label, content) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: '.58rem', letterSpacing: '.15em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 3 }}>{label}</div>
      {content}
    </div>
  )
  const fakeInput = (val) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontFamily: 'Georgia, serif', fontSize: '.85rem', color: 'var(--text)' }}>{val}</div>
  )
  const fakeSelect = (val) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontFamily: 'Georgia, serif', fontSize: '.85rem', color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
      <span>{val}</span><span style={{ color: 'var(--text3)' }}>▾</span>
    </div>
  )
  const fakeNum = (val) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontFamily: 'Georgia, serif', fontSize: '.85rem', color: 'var(--text)', textAlign: 'center', width: 48 }}>{val}</div>
  )
  return (
    <div style={{ border: '1px solid var(--border2)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg)', marginTop: 4 }}>
      <div style={{ fontSize: '.78rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600, letterSpacing: '.06em', marginBottom: 10 }}>Melee Weapon Slot <span style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 400 }}>(example)</span></div>
      {row('Slot Name', fakeInput('Sleeve Blade'))}
      {row('Weapon', fakeSelect('Dagger'))}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 10px', marginBottom: 10, fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>
        Die: d4 &nbsp;·&nbsp; Dmg: +1 &nbsp;·&nbsp; Class: Light &nbsp;·&nbsp; Breaches: 1
      </div>
      {row('Weapon Mark', fakeSelect('Serpent'))}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '.58rem', letterSpacing: '.15em', color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 6 }}>Item / Magic Bonuses</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['Expertise', '2'], ['Damage', '0'], ['Precision', '0'], ['Arm. Bypass', '0']].map(([lbl, val]) => (
            <div key={lbl} style={{ flex: 1 }}>
              <div style={{ fontSize: '.55rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginBottom: 3, textAlign: 'center' }}>{lbl}</div>
              {fakeNum(val)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <div style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>Cancel</div>
        <div style={{ padding: '5px 14px', border: '1px solid #4a9e4a', borderRadius: 4, color: '#4a9e4a', fontFamily: 'Georgia, serif', fontSize: '.78rem' }}>Save</div>
      </div>
    </div>
  )
}

function FakeWeaponSlot() {
  const stats = [['Exp.', '7'], ['Dmg', '1d4+1'], ['PR', '2'], ['AB', '—']]
  return (
    <>
      <div style={{ border: '1px solid var(--border2)', borderRadius: 6, padding: '10px 12px', background: 'var(--bg)', marginTop: 4, marginBottom: 10 }}>
        <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Example slot</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: '1 1 80px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '.88rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Sleeve Blade</span>
              <span style={{ fontSize: '.55rem', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', borderRadius: 3, padding: '1px 4px' }}>Serpent</span>
            </div>
          </div>
          {stats.map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
              <div style={{ fontSize: '.5rem', letterSpacing: '.1em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>
        This slot now shows the correct stats for that weapon, and will update as you improve your skills. Ranged slots work the same way.
      </p>
    </>
  )
}

// ── STEP DEFINITIONS ──────────────────────────────────────────────────────────
// target:      data-tour value(s) to highlight. String = single, Array = multi.
// navigateTo:  page to navigate to when Continue is pressed (null = stay)
// tab:         data-skills-tab value to click when arriving at this step
// position:    'below-nav' pins card just below the header bar
// wideCard:    true = 420px wide instead of 320px

function buildSteps(character) {
  const availablePts = character?.skillPoints?.available ?? 0

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
      position: 'below-nav',
      title: 'Your Token',
      body: "Your token will show up here when you add one. This is also the button to get back to this page.",
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: null,
      target: 'nav-logo',
      position: 'below-nav',
      title: 'Home Button',
      body: "The raven logo takes you to the home screen where you can switch characters.",
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: 'stuff',
      target: 'nav-tab-btn',
      position: 'below-nav',
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
      title: 'Stats Page',
      body: "This is the Stats Page. It is also where you set your armor and weapons.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-attr-left',
      title: 'Attributes',
      body: "These are your Attributes. Tap or click for more info. The smaller number next to each is the bonus you get on attribute checks.",
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
    {
      page: 'sheet',
      navigateTo: null,
      target: ['sheet-magic-rows', 'sheet-magic-dice'],
      title: 'Magic Ranks',
      body: "These are your ranks in the five types of magic, and the size of your weaving dice.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-session-row',
      title: 'Off-hand & Stance',
      body: "Set your off-hand weapon and stance here. Other options, such as Druid Form, will appear when you unlock them.",
      cta: 'Next →',
    },

    // ── HP / ARMOR TABLE ─────────────────────────────────────────────────────
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-hptable',
      title: 'HP & Armor',
      body: "This is your HP and Armor table. Each row is a body location. Damage is tracked per location. Click or tap Current HP and Breaches to change them.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-armor-type',
      title: 'Equipping Armor',
      body: "Use these dropdowns to equip your armor. Stats update automatically. The Evasion Penalties are cumulative but the total is always rounded down.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-global-row',
      title: 'Bonus HP & AR',
      body: "Barrier HP, Temp HP, and bonus AR go here. The note shows the order damage is applied.",
      cta: 'Next →',
    },

    // ── WEAPON SLOTS ─────────────────────────────────────────────────────────
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-weapon-slot-0',
      title: 'Weapon Slots',
      body: "This is a Melee weapon slot. Use the Assign button to set it up.",
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: null,
      title: 'Assigning a Weapon',
      body: <FakeWeaponModal />,
      cta: 'Next →',
    },
    {
      page: 'sheet',
      navigateTo: null,
      target: 'sheet-weapon-slot-0',
      wideCard: true,
      title: 'Weapon Slot — Filled',
      body: <FakeWeaponSlot />,
      cta: 'Next →',
    },

    // ── SPELLS ───────────────────────────────────────────────────────────────
    {
      page: 'spells',
      navigateTo: 'spells',
      target: null,
      title: 'Spells Page',
      body: "This is the Spells page. It's a searchable compendium of all the spells in the game.",
      cta: 'Next →',
    },
    {
      page: 'spells',
      navigateTo: null,
      target: 'spells-mastery-ranks',
      title: 'Mastery Ranks',
      body: <><p style={{margin:'0 0 8px',fontSize:'.84rem',color:'var(--text2)',lineHeight:1.7,fontFamily:'Georgia,serif'}}>This shows your rank with each of the five types of magic, which determines what spells you can learn.</p><FakeMasteryRanks /></>,
      cta: 'Next →',
    },
    {
      page: 'spells',
      navigateTo: null,
      target: null,
      title: 'Spell Hooks',
      body: <><p style={{margin:'0 0 8px',fontSize:'.84rem',color:'var(--text2)',lineHeight:1.7,fontFamily:'Georgia,serif'}}>Only the number of spell hooks available to you are shown.</p><FakeSpellHooks /></>,
      cta: 'Next →',
    },
    {
      page: 'spells',
      navigateTo: null,
      target: 'spells-school-filters',
      title: 'Filters',
      body: "Filter by School, what you have unlocked, or what you have chosen. Preview mode unlocks everything.",
      cta: 'Next →',
    },
    {
      page: 'spells',
      navigateTo: null,
      target: 'spells-first-spell',
      position: 'below-nav',
      title: 'Spell List',
      body: <><p style={{margin:'0 0 8px',fontSize:'.84rem',color:'var(--text2)',lineHeight:1.7,fontFamily:'Georgia,serif'}}>Click any spell to see its full description, requirements, and stats. Check the box to add it to your Known spells.</p><FakeSpellDetail /></>,
      cta: 'Next →',
    },

    // ── SKILLS ───────────────────────────────────────────────────────────────
    {
      page: 'skillEditor',
      navigateTo: 'skillEditor',
      tab: 'General',
      target: 'skills-points-bar',
      title: 'Skills Page',
      body: "This is the Skills page. This is where you spend your skill points. This bar shows how many points you have available to spend, and how many you have invested on each tab.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-save-btn',
      title: 'Save Changes',
      body: "When you're done spending points, Save the Changes here. Unsaved changes will be forgotten when you leave the skills page. Once saved, they go for GM approval.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-tabs',
      title: 'Skill Tabs',
      body: "Skills are organized into four tabs — General, Martial, Spiritual, and Obscure. We are on the General Tab. There is no maintenance cost for any skills on this Tab.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-self-improvement-header',
      title: 'Self Improvement',
      body: "The Self Improvement section is mostly permanent passive effects. Click or Tap on a skill for a detailed description.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-first-skill',
      title: 'Prerequisites',
      body: "This skill requires you already have rank two in another skill, which is why it's dimmed. Note the red text explaining what's lacking.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-bodybuilding-right',
      title: 'Rank & Maximum',
      body: "This shows your current rank over the maximum rank for this skill.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-bodybuilding-pts',
      wideCard: true,
      title: 'Investing Points',
      body: <><p style={{margin:'0 0 8px',fontSize:'.84rem',color:'var(--text2)',lineHeight:1.7,fontFamily:'Georgia,serif'}}>This shows points invested over the cost per rank. Click or tap the points and type a new number. If it's not an allowed amount it will turn red and tell you why.</p><FakeBodybuildingRow /></>,
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'General',
      target: 'skills-acting',
      title: 'Trades & Talents',
      body: "Trades & Talents work differently. Each skill shows your current score over the maximum, based on your attributes, and your points invested over the multiple. Each point you spend in Acting raises your score by 4, the skill's multiple.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'Martial',
      target: 'skills-tabs',
      title: 'Martial Tab',
      body: "The Martial Tab holds the Melee, Unfettered, Ranged and Leadership sections. Skills here are ranked and work like the Self Improvement skills.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'Spiritual',
      target: 'skills-tabs',
      title: 'Spiritual Tab',
      body: "The Spiritual Tab contains the Arcane section, which allows access to the five types of magic combining into the ten schools you saw on the Spells page, and",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'Spiritual',
      target: 'skills-divine-header',
      title: 'Divine',
      body: "The Divine section holds powers granted by great powers in exchange for sacrifices, and",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'Spiritual',
      target: 'skills-balance-header',
      title: 'Balance',
      body: "The way of Balance requires forsaking all armor and weapons.",
      cta: 'Next →',
    },
    {
      page: 'skillEditor',
      navigateTo: null,
      tab: 'Obscure',
      target: 'skills-tabs',
      title: 'Obscure Tab',
      body: "The Obscure tab is for those unfortunate enough to have been tainted by a demon or worse, and some special skills animals can acquire through the Animal Bond Talent.",
      cta: 'Next →',
    },

    // ── END ──────────────────────────────────────────────────────────────────
    {
      page: 'bio',
      navigateTo: 'bio',
      target: 'bio-levelup-btn',
      title: "You're All Set!",
      body: "Fill in your background, and spend your starting points. Remember to Save Changes! Your GM will approve them and authorize your first level up, which will unlock this button.",
      cta: 'Next →',
    },
    {
      page: 'bio',
      navigateTo: null,
      target: 'bio-handbook-btn',
      title: 'Player Handbook',
      body: "The Player's Handbook can be found here. Happy Hunting!",
      cta: 'Done →',
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

function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
}

// Normalize target to array of ids
function toIds(target) {
  if (!target) return []
  return Array.isArray(target) ? target : [target]
}

function getTargetRect(target) {
  const ids = toIds(target)
  if (!ids.length) return null
  let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity
  let found = false
  ids.forEach(id => {
    const els = [...document.querySelectorAll(`[data-tour="${id}"]`)].filter(isVisible)
    els.forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < top) top = r.top
      if (r.bottom > bottom) bottom = r.bottom
      if (r.left < left) left = r.left
      if (r.right > right) right = r.right
      found = true
    })
  })
  if (!found) return null
  return { top, bottom, left, right, width: right - left, height: bottom - top }
}

function setHighlight(target) {
  document.querySelectorAll('[data-tour].tour-active').forEach(el => {
    el.classList.remove('tour-active')
  })
  const ids = toIds(target)
  ids.forEach(id => {
    const els = [...document.querySelectorAll(`[data-tour="${id}"]`)].filter(isVisible)
    els.forEach(el => el.classList.add('tour-active'))
  })
}

function scrollToTarget(target) {
  const ids = toIds(target)
  if (!ids.length) return Promise.resolve()
  let el = null
  for (const id of ids) {
    el = [...document.querySelectorAll(`[data-tour="${id}"]`)].find(isVisible)
    if (el) break
  }
  if (!el) return Promise.resolve()
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return new Promise(resolve => setTimeout(resolve, 420))
}

// ── CARD POSITIONING ──────────────────────────────────────────────────────────

const CARD_W = 320
const CARD_H_EST = 200
const GAP = 20
const MARGIN = 16

function computeCardPosition(target, positionHint) {
  const vh = window.innerHeight

  if (positionHint === 'below-nav') {
    return { top: 100, bottom: null }
  }

  const rect = getTargetRect(target)

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

  const belowTop = rect.bottom + GAP
  if (belowTop + CARD_H_EST + MARGIN < vh) {
    return { top: Math.round(belowTop), bottom: null }
  }

  if (rect.top - GAP - CARD_H_EST > MARGIN) {
    return { top: null, bottom: Math.round(vh - rect.top + GAP) }
  }

  return { top: Math.round(cardTop_centered), bottom: null }
}

function useCardPosition(target, ready, positionHint) {
  const [pos, setPos] = useState({ top: null, bottom: null })

  useEffect(() => {
    if (!ready) return
    function compute() { setPos(computeCardPosition(target, positionHint)) }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [target, ready, positionHint])

  return pos
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function NewPlayerTour({ step, character, currentPage, onNavigate, onNext, onPrev, onSkip }) {
  const steps = buildSteps(character)
  const def = steps[step]
  const [posReady, setPosReady] = useState(false)

  useEffect(() => { ensureStyle() }, [])

  useEffect(() => {
    if (!def) return
    setPosReady(false)
    if (def.page && currentPage !== def.page) onNavigate(def.page)
    const t = setTimeout(async () => {
      if (def.tab) {
        const tabEl = document.querySelector(`[data-skills-tab="${def.tab}"]`)
        if (tabEl) { tabEl.click(); await new Promise(r => setTimeout(r, 250)) }
      }
      await scrollToTarget(def.target)
      setHighlight(def.target)
      setPosReady(true)
    }, 160)
    return () => clearTimeout(t)
  }, [step]) // eslint-disable-line

  useEffect(() => () => setHighlight(null), [])

  const pos = useCardPosition(def?.target ?? null, posReady, def?.position ?? null)

  if (!def) return null

  const isLast = step === steps.length - 1
  const cardWidth = def.wideCard ? 420 : CARD_W

  const handlePrev = () => { onPrev() }
  const handleNext = () => {
    if (def.navigateTo) onNavigate(def.navigateTo)
    if (isLast) { setHighlight(null); onSkip() }
    else onNext()
  }
  const handleSkip = () => { setHighlight(null); onSkip() }

  const cardStyle = {
    position: 'fixed',
    zIndex: 8000,
    width: cardWidth,
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

      <button onClick={handleSkip} style={{
        position: 'absolute', top: 10, right: 12,
        background: 'none', border: 'none', color: 'var(--text3)',
        fontFamily: 'Georgia, serif', fontSize: '.72rem',
        cursor: 'pointer', textDecoration: 'underline',
        textUnderlineOffset: 2, letterSpacing: '.04em',
      }}>
        Skip tour
      </button>

      <div style={{
        fontSize: '.95rem', color: '#4a90d9',
        fontWeight: 600, letterSpacing: '.03em',
        marginBottom: 10, lineHeight: 1.3,
      }}>
        {def.title}
      </div>

      {typeof def.body === 'string'
        ? <p style={{ margin: '0 0 18px', fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.7 }}>{def.body}</p>
        : <div style={{ marginBottom: 18 }}>{def.body}</div>
      }

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {step > 0 && (
            <button onClick={handlePrev} style={{
              padding: '8px 10px', background: 'none',
              border: '1px solid var(--border2)', color: 'var(--text3)',
              borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Georgia, serif', fontSize: '.85rem',
            }}>←</button>
          )}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', maxWidth: 130 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 14 : 6, height: 6, borderRadius: 3,
                background: i < step ? '#4a90d9' : i === step ? '#6aafef' : 'var(--border2)',
                transition: 'all .2s ease', flexShrink: 0,
              }} />
            ))}
          </div>
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

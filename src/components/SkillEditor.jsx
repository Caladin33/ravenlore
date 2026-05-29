import { useState, useMemo } from 'react'
import { Shield, Sun, Flame, HeartPlus, Sword, Star } from 'lucide-react'
import martialSkillsData from '../data/martialSkills.json'
import generalSkillsData from '../data/generalSkills.json'
import arcaneSkillsData from '../data/arcaneSkills.json'
import racesData from '../data/races.json'
import { GeneralSkillCard } from './GeneralSkillCard'
import { RankedSkillTable, SkillTableRow, THEMES, checkPrereq } from './RankedSkillTable'
import SaveConfirmModal from './SaveConfirmModal'
import ConfirmModal from './ConfirmModal'
import selfImprovementData from '../data/selfImprovementSkills.json'
import rulesData from '../data/rules.json'

// ── RULE MODAL ────────────────────────────────────────────────────────────────
function RuleModal({ rule, color, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: `1px solid ${color.primary}`, borderRadius: 10, padding: '22px 24px', maxWidth: 520, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,.7)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: '1rem', fontFamily: 'Georgia, serif', fontWeight: 600, color: color.primary2, letterSpacing: '.04em' }}>
            {rule.title}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ fontSize: '.88rem', fontFamily: 'Georgia, serif', color: 'var(--text2)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
          {rule.text}
        </div>
      </div>
    </div>
  )
}

// ── RULES BAR ─────────────────────────────────────────────────────────────────
function RulesBar({ activeSubTab }) {
  const [activeRule, setActiveRule] = useState(null)
  const rules = rulesData[activeSubTab]
  if (!rules || rules.length === 0) return null
  const color = SUB_TAB_COLORS[activeSubTab] || { primary: 'var(--gold)', primary2: 'var(--gold2)' }
  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 2px' }}>
        <span style={{ fontSize: '.6rem', letterSpacing: '.14em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', alignSelf: 'center', marginRight: 4 }}>Rules</span>
        {rules.map(rule => (
          <button
            key={rule.title}
            onClick={() => setActiveRule(rule)}
            style={{
              padding: '4px 12px',
              background: `${color.primary}12`,
              border: `1px solid ${color.primary}66`,
              color: color.primary2,
              borderRadius: 20,
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontSize: '.78rem',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color.primary}28`; e.currentTarget.style.borderColor = color.primary }}
            onMouseLeave={e => { e.currentTarget.style.background = `${color.primary}12`; e.currentTarget.style.borderColor = `${color.primary}66` }}
          >
            {rule.title}
          </button>
        ))}
      </div>
      {activeRule && <RuleModal rule={activeRule} color={color} onClose={() => setActiveRule(null)} />}
    </>
  )
}

const OBSCURE_CATEGORIES = ['infernal', 'lycanthropy', 'animal']
const SPIRITUAL_CATEGORIES = ['spellcaster', 'guild', 'divine', 'balance']
const SPIRITUAL_LABELS = { spellcaster: 'Arcane', guild: 'Guild', divine: 'Divine', balance: 'Balance' }
const OBSCURE_LABELS = { infernal: 'Infernal', lycanthropy: 'Lycanthropy', animal: 'Animal' }

const DIVINE_MARKS = ['Blood','Death','Iron','Life','Light','Mischief','Passion','Storms','War','Wisdom']

const DIVINE_VOWS = [
  { name: 'Bloodless',  detail: 'No Edged Weapons',                       refusedBy: 'Blood'    },
  { name: 'Restraint',  detail: 'Quick and Light Weapons only',            refusedBy: 'Storms'   },
  { name: 'Humility',   detail: 'No Jewelry',                              refusedBy: 'Wisdom'   },
  { name: 'Barefoot',   detail: 'No Footwear',                             refusedBy: 'Light'    },
  { name: 'Poverty',    detail: 'No money, no gold or bejeweled anything', refusedBy: 'Iron'     },
  { name: 'Silence',    detail: 'Vocabulary of 1 word, or none.',          refusedBy: 'Passion'  },
  { name: 'Vengeance',  detail: 'Overriding priority',                     refusedBy: 'Death'    },
  { name: 'Charity',    detail: 'Must help when needed',                   refusedBy: 'Blood'    },
  { name: 'Decency',    detail: 'Must confront impropriety',               refusedBy: 'Wisdom'   },
  { name: 'Pain',       detail: 'Accept no healing',                       refusedBy: 'Life'     },
  { name: 'Service',    detail: 'To a church or order related to the God', refusedBy: 'Mischief' },
  { name: 'Peace',      detail: 'Kill Nothing',                            refusedBy: 'War'      },
]

const SHAMAN_VOWS = [
  { name: 'Bloodless Vow',      detail: 'No Edged Weapons',                    refusedBy: 'Blood'    },
  { name: 'Vow of Biting',      detail: 'Awkward Weapons only',                refusedBy: 'Storms'   },
  { name: 'Simple Vow',         detail: 'No Jewelry',                          refusedBy: 'Wisdom'   },
  { name: 'Barefoot Vow',       detail: 'No Footwear',                         refusedBy: 'Light'    },
  { name: 'Vow of Symbols',     detail: 'Fettered, other gods may be jealous', refusedBy: 'Iron'     },
  { name: 'Vow of "Your Word"', detail: 'Vocabulary of 1 word only.',          refusedBy: 'Passion'  },
  { name: 'Vow of Vengeance',   detail: 'Overriding priority',                 refusedBy: 'Death'    },
  { name: 'Vow of Caring',      detail: 'Must help when needed',               refusedBy: 'Blood'    },
  { name: 'Vow of Tradition',   detail: 'Must confront impropriety',           refusedBy: 'Wisdom'   },
  { name: 'Vow of Pain',        detail: 'Accept no healing',                   refusedBy: 'Life'     },
  { name: 'Vow of Loyalty',     detail: 'To the Chief',                        refusedBy: 'Mischief' },
  { name: 'Vow of Peace',       detail: 'Kill Nothing',                        refusedBy: 'War'      },
]

const MARK_BONUSES = {
  Blood:   'Auto-pass all Constitution checks.',
  Death:   'Immune to poison and disease. (Not shared by Auras)',
  Iron:    '+2 skill points every level, spent on the General page beyond the 5pt minimum.',
  Life:    '+3 maximum Torso Hit Points (affects other locations proportionally).',
  Light:   'Sense nearby Demons, Devils and Undead. Range depends on strength and number.',
  Mischief:'Your God may play tricks on your enemies. Mostly on you.',
  Passion: 'Advantage on all skill checks.',
  Storms:  'Immune to Lightning. (Not shared by Auras)',
  War:     '+1 Awareness.',
  Wisdom:  'May know one extra Aura (5 instead of 4 below level 15).',
}

const SHAMAN_BONUS_OVERRIDES = {
  Mischief: '+3 Precision instead of tricks.',
  Wisdom:   '+4 Evasion instead of the extra Aura.',
}

const selectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  color: 'var(--text)', borderRadius: 4, padding: '5px 8px',
  fontFamily: 'Georgia, serif', fontSize: '.85rem', cursor: 'pointer', width: '100%',
}

const lbl = {
  fontSize: '.6rem', letterSpacing: '.14em', color: 'var(--text3)',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif', display: 'block', marginBottom: 4,
}

// ── PATRON'S MARK PANEL ───────────────────────────────────────────────────────
function PatronMarkPanel({ char, onUpdate, gmMode }) {
  const pm = char.patronMark || {}
  const [mark, setMark] = useState(pm.mark || '')
  const [confirmModal, setConfirmModal] = useState(null)
  const [vow, setVow] = useState(pm.vow || '')
  const availableVows = DIVINE_VOWS.filter(v => v.refusedBy !== mark)
  const isLocked = pm.locked && !gmMode

  const handleSave = () => {
  if (!mark || !vow) return
  setConfirmModal({
    message: `Lock Mark of ${mark} with vow: "${vow}"? This cannot be changed without GM mode.`,
    onConfirm: () => { onUpdate({ ...pm, mark, vow, locked: true }); setConfirmModal(null) }
  })
}

 return (
    <div style={{ padding: '12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
      {isLocked ? (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '.55rem', letterSpacing: '.16em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 4 }}>Divine Mark</div>
            <div style={{ fontSize: '1rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Mark of {pm.mark}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>{MARK_BONUSES[pm.mark]}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', marginTop: 4 }}>Vow: {pm.vow} — {DIVINE_VOWS.find(v => v.name === pm.vow)?.detail}</div>
          </div>
          {gmMode && (
            <button onClick={() => onUpdate({ ...pm, locked: false })}
              style={{ padding: '7px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem' }}>
              Unlock (GM)
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: '.55rem', letterSpacing: '.16em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 6 }}>Choose Divine Mark</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DIVINE_MARKS.map(m => (
                <div key={m} onClick={() => { setMark(mark === m ? '' : m); setVow('') }} style={{
                  padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
                  border: `2px solid ${mark === m ? 'var(--gold)' : 'var(--border)'}`,
                  background: mark === m ? 'rgba(201,168,76,.08)' : 'var(--bg)',
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '.95rem', color: mark === m ? 'var(--gold2)' : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: mark === m ? 600 : 400 }}>
                      Mark of {m}
                    </span>
                    {mark === m && <span style={{ fontSize: '.7rem', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>✓ Selected</span>}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {MARK_BONUSES[m]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {mark && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px' }}>
                <div style={{ fontSize: '.55rem', letterSpacing: '.16em', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 4 }}>Vow</div>
                <select value={vow} onChange={e => setVow(e.target.value)} style={selectStyle}>
                  <option value="">— Choose Vow —</option>
                  {availableVows.map(v => <option key={v.name} value={v.name}>{v.name} — {v.detail}</option>)}
                </select>
              </div>
              <button onClick={handleSave} disabled={!mark || !vow}
                style={{ padding: '7px 16px', background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: mark && vow ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontSize: '.85rem', opacity: mark && vow ? 1 : 0.4 }}>
                Confirm &amp; Lock
              </button>
            </div>
          )}
        </div>
      )}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  )
}

// ── SHAMAN SYMBOLS PANEL ──────────────────────────────────────────────────────
function ShamanSymbolsPanel({ char, onUpdate, gmMode }) {
  const symbols = char.shamanSymbols || []
  const [newSymbol, setNewSymbol] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [newVow, setNewVow] = useState('')
  const usedSymbols = new Set(symbols.map(s => s.symbol))
  const availableMarks = DIVINE_MARKS.filter(m => !usedSymbols.has(m))
  const availableVows = SHAMAN_VOWS.filter(v => v.refusedBy !== newSymbol)

const addSymbol = () => {
  console.log('addSymbol called', newSymbol, newVow)
  if (!newSymbol || !newVow) return
  if (!newSymbol || !newVow) return
  setConfirmModal({
    message: `Add Symbol of ${newSymbol} with vow: "${newVow}"? This cannot be undone without GM mode.`,
    onConfirm: () => {
      onUpdate([...symbols, { symbol: newSymbol, vow: newVow, locked: true }])
      setNewSymbol(''); setNewVow('')
      setConfirmModal(null)
    }
  })
}

  const removeSymbol = (i) => {
    const next = [...symbols]; next.splice(i, 1); onUpdate(next)
  }

  return (
    <div style={{ padding: '12px 14px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
      {symbols.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '.9rem', color: 'var(--gold2)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>Symbol of {s.symbol}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {s.vow} — {SHAMAN_VOWS.find(v => v.name === s.vow)?.detail}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>
              {SHAMAN_BONUS_OVERRIDES[s.symbol] || MARK_BONUSES[s.symbol]}
            </div>
          </div>
          {gmMode && (
            <button onClick={() => removeSymbol(i)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.75rem' }}>
              Remove
            </button>
          )}
        </div>
      ))}
      {availableMarks.length > 0 && (
        <div style={{ marginTop: symbols.length > 0 ? 10 : 0 }}>
          <span style={lbl}>Add Symbol</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {availableMarks.map(m => (
              <div key={m} onClick={() => setNewSymbol(newSymbol === m ? '' : m)} style={{
                padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
                border: `2px solid ${newSymbol === m ? 'var(--gold)' : 'var(--border)'}`,
                background: newSymbol === m ? 'rgba(201,168,76,.08)' : 'var(--bg)',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '.95rem', color: newSymbol === m ? 'var(--gold2)' : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: newSymbol === m ? 600 : 400 }}>
                    Symbol of {m}
                  </span>
                  {newSymbol === m && <span style={{ fontSize: '.7rem', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>✓ Selected</span>}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {SHAMAN_BONUS_OVERRIDES[m] || MARK_BONUSES[m]}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <span style={lbl}>Vow</span>
              <select value={newVow} onChange={e => setNewVow(e.target.value)} style={selectStyle} disabled={!newSymbol}>
                <option value="">— Choose Vow —</option>
                {availableVows.map(v => <option key={v.name} value={v.name}>{v.name} — {v.detail}</option>)}
              </select>
            </div>
            <button onClick={addSymbol} disabled={!newSymbol || !newVow}
              style={{ padding: '7px 16px', background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)', color: 'var(--gold2)', borderRadius: 4, cursor: newSymbol && newVow ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontSize: '.85rem', opacity: newSymbol && newVow ? 1 : 0.4 }}>
              Add Symbol
            </button>
          </div>
        </div>
      )}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  )
}

// ── PICK-1 GROUP MODAL ────────────────────────────────────────────────────────
function Pick1GroupModal({ group, char, stats, arcaneSkillDefs, unspentPoints, onConfirm, onClose }) {
  const T = THEMES.divine
  const [selected, setSelected] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const skillDef = (name) => arcaneSkillDefs.find(s => s.name === name) || { name, prereq: 'none', costPerRank: 10, description: '' }

  const handleConfirm = () => {
    if (!selected) return
    const def = skillDef(selected)
    const cost = parseInt(def.costPerRank) || 10
    if (cost > unspentPoints) {
      setConfirmModal({ message: `Not enough points. Need ${cost}, have ${unspentPoints}.`, onConfirm: () => setConfirmModal(null), cancelLabel: null })
      return
    }
    setConfirmModal({
      message: `Purchase ${selected} for ${cost} points? This cannot be undone without GM mode.`,
      onConfirm: () => { onConfirm(selected, cost); setConfirmModal(null) },
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: `1px solid ${T.primary}`, borderRadius: 10, padding: 22, maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ color: T.primary2, fontFamily: 'Georgia, serif', margin: 0, fontSize: '1.1rem' }}>{group.label} — Choose One</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>✕</button>
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 14 }}>
          You may only ever learn one skill from this group. Choose carefully.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {group.skills.map(name => {
            const def = skillDef(name)
            const prereq = checkPrereq(def.prereq, char, stats)
            const cost = parseInt(def.costPerRank) || 10
            const canAfford = cost <= unspentPoints
            const isSelected = selected === name
            const dimmed = !prereq.met
            return (
              <div key={name}
                onClick={() => setSelected(isSelected ? null : name)}
                style={{
                  padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
                  border: `2px solid ${isSelected ? T.primary : dimmed ? 'var(--border)' : 'var(--border2)'}`,
                  background: isSelected ? T.dim : dimmed ? 'rgba(0,0,0,.15)' : 'var(--bg)',
                  opacity: dimmed ? 0.6 : 1,
                  transition: 'all .15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '.95rem', color: isSelected ? T.primary2 : dimmed ? 'var(--text3)' : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: isSelected ? 600 : 400 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: '.75rem', color: canAfford ? T.primary : '#c94a4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                    {cost} pts
                  </span>
                </div>
                {!prereq.met && (
                  <div style={{ fontSize: '.68rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 3 }}>
                    {prereq.reason}
                  </div>
                )}
                {def.description && (
                  <div style={{ fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.45 }}>
                    {def.description.length > 180 ? def.description.slice(0, 180) + '…' : def.description}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selected}
            style={{ padding: '8px 20px', background: selected ? T.dim : 'var(--bg2)', border: `1px solid ${selected ? T.primary : 'var(--border)'}`, color: selected ? T.primary2 : 'var(--text3)', borderRadius: 5, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Confirm Purchase
          </button>
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.cancelLabel === null ? undefined : () => setConfirmModal(null)}
        />
      )}
    </div>
  )
}

function ChampionChoiceModal({ onConfirm, onClose }) {
  const T = THEMES.divine
  const [selected, setSelected] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const options = [
    { key: 'offence',      label: 'Divine Offence',   desc: 'Learn a second Divine Offence skill.' },
    { key: 'benedictions', label: 'Benedictions',      desc: 'Learn a second Benediction.' },
    { key: 'defence',      label: 'Divine Defence',    desc: 'Learn a second Divine Defence skill.' },
  ]

  const handleConfirm = () => {
    if (!selected) return
    const label = options.find(o => o.key === selected).label
    setConfirmModal({
      message: `Lock in ${label} as your Champion's Choice? This cannot be changed without GM mode.`,
      onConfirm: () => { onConfirm(selected); setConfirmModal(null) },
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: `1px solid ${T.primary}`, borderRadius: 10, padding: 22, maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,.7)' }}>
        <h3 style={{ color: T.primary2, fontFamily: 'Georgia, serif', margin: '0 0 8px', fontSize: '1.1rem' }}>Champion's Choice</h3>
        <div style={{ fontSize: '.8rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', marginBottom: 16, lineHeight: 1.5 }}>
          Your divine favour allows you to learn a second skill from one group. Choose which group now — this choice is permanent.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {options.map(opt => (
            <div key={opt.key} onClick={() => setSelected(opt.key)} style={{
              padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
              border: `2px solid ${selected === opt.key ? T.primary : 'var(--border)'}`,
              background: selected === opt.key ? T.dim : 'var(--bg)',
              transition: 'all .15s',
            }}>
              <div style={{ fontSize: '.95rem', color: selected === opt.key ? T.primary2 : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: selected === opt.key ? 600 : 400, marginBottom: 3 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'Georgia, serif' }}>{opt.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Decide Later
          </button>
          <button onClick={handleConfirm} disabled={!selected}
            style={{ padding: '8px 20px', background: selected ? T.dim : 'var(--bg2)', border: `1px solid ${selected ? T.primary : 'var(--border)'}`, color: selected ? T.primary2 : 'var(--text3)', borderRadius: 5, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Confirm &amp; Lock
          </button>
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  )
}

// ── BUY AURA MODAL ────────────────────────────────────────────────────────────
function BuyAuraModal({ char, stats, arcaneSkillDefs, ownedAuras, auraCap, unspentPoints, onConfirm, onClose }) {
  const T = THEMES.divine
  const [selected, setSelected] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const atCap = ownedAuras.length >= auraCap

  const skillDef = (name) => arcaneSkillDefs.find(s => s.name === name) || { name, prereq: 'none', costPerRank: 10, description: '' }

  const handleConfirm = () => {
    if (!selected || atCap) return
    const def = skillDef(selected)
    const cost = parseInt(def.costPerRank) || 10
    if (cost > unspentPoints) {
      setConfirmModal({ message: `Not enough points. Need ${cost}, have ${unspentPoints}.`, onConfirm: () => setConfirmModal(null), noCancel: true })
      return
    }
    setConfirmModal({
      message: `Learn ${selected} for ${cost} points?`,
      onConfirm: () => { onConfirm(selected, cost); setConfirmModal(null) },
    })
  }

  // Slot boxes
  const slots = Array.from({ length: auraCap }, (_, i) => ownedAuras[i] || null)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: `1px solid ${T.primary}`, borderRadius: 10, padding: 22, maxWidth: 540, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.7)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ color: T.primary2, fontFamily: 'Georgia, serif', margin: 0, fontSize: '1.1rem' }}>
            Learn an Aura — {ownedAuras.length} / {auraCap}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>✕</button>
        </div>

        {/* Slot boxes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {slots.map((aura, i) => (
            <div key={i} style={{
              padding: '5px 10px', borderRadius: 5, fontSize: '.72rem', fontFamily: 'Georgia, serif',
              border: `1px solid ${aura ? T.primary : 'var(--border)'}`,
              background: aura ? T.dim : 'var(--bg)',
              color: aura ? T.primary2 : 'var(--text3)',
              minWidth: 80, textAlign: 'center',
            }}>
              {aura ? aura.replace('Aura of ', '') : '— empty —'}
            </div>
          ))}
        </div>

        {atCap && (
          <div style={{ fontSize: '.8rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 12 }}>
            You have reached your aura cap ({auraCap}). No more auras can be learned.
          </div>
        )}

        {/* Aura list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
          {AURA_SKILLS.map(name => {
            const def = skillDef(name)
            const prereq = checkPrereq(def.prereq, char, stats)
            const cost = parseInt(def.costPerRank) || 10
            const canAfford = cost <= unspentPoints
            const alreadyOwned = ownedAuras.includes(name)
            const isSelected = selected === name
            const unavailable = !prereq.met || alreadyOwned || atCap
            let reason = ''
            if (alreadyOwned) reason = 'Already known'
            else if (!prereq.met) reason = prereq.reason
            else if (atCap) reason = 'At aura cap'

            return (
              <div key={name}
                onClick={() => { if (!unavailable) setSelected(isSelected ? null : name) }}
                style={{
                  padding: '9px 13px', borderRadius: 7,
                  cursor: unavailable ? 'default' : 'pointer',
                  border: `2px solid ${isSelected ? T.primary : unavailable ? 'var(--border)' : 'var(--border2)'}`,
                  background: isSelected ? T.dim : unavailable ? 'rgba(0,0,0,.1)' : 'var(--bg)',
                  opacity: unavailable ? 0.5 : 1,
                  transition: 'all .15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: reason ? 3 : (def.description ? 3 : 0) }}>
                  <span style={{ fontSize: '.92rem', color: isSelected ? T.primary2 : unavailable ? 'var(--text3)' : 'var(--text)', fontFamily: 'Georgia, serif', fontWeight: isSelected ? 600 : 400 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: '.75rem', color: alreadyOwned ? T.primary : canAfford ? 'var(--text3)' : '#c94a4a', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                    {alreadyOwned ? '✓' : `${cost} pts`}
                  </span>
                </div>
                {reason && !alreadyOwned && (
                  <div style={{ fontSize: '.68rem', color: '#c94a4a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: def.description ? 3 : 0 }}>
                    {reason}
                  </div>
                )}
                {def.description && !alreadyOwned && (
                  <div style={{ fontSize: '.73rem', color: 'var(--text2)', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
                    {def.description.length > 160 ? def.description.slice(0, 160) + '…' : def.description}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selected || atCap}
            style={{ padding: '8px 20px', background: selected && !atCap ? T.dim : 'var(--bg2)', border: `1px solid ${selected && !atCap ? T.primary : 'var(--border)'}`, color: selected && !atCap ? T.primary2 : 'var(--text3)', borderRadius: 5, cursor: selected && !atCap ? 'pointer' : 'not-allowed', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Learn Aura
          </button>
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.noCancel ? undefined : () => setConfirmModal(null)}
        />
      )}
    </div>
  )
}


// ── HELPERS ───────────────────────────────────────────────────────────────────
function getEffectiveAttributes(char) {
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const attrs = char.attributes || {}
  const ms = char.martialSkills || {}
  const si = char.selfImprovementSkills || {}
  function base(key) { return attrs[key]?.base || attrs[key] || 0 }
  function skillRank(name) { return parseInt(si[name]?.rank) || parseInt(ms[name]?.rank) || 0 }
  return {
    STR: base('str') + (race.strModifier || 0) + Math.floor(skillRank('Bodybuilding') / 3),
    DEX: base('dex') + Math.floor(skillRank('Reflex Training') / 3),
    CON: base('con') + (race.conModifier || 0) + Math.floor(skillRank('Conditioning') / 3),
    AW:  base('aw')  + Math.floor(skillRank('Observation Training') / 3),
    CHR: base('chr') + (race.chrModifier || 0) + Math.floor(skillRank('Persuasion') / 3),
    WP:  base('wp')  + Math.floor(skillRank('Hardened Resolve') / 3),
  }
}

function calcSkillScore(skill, char, attrs) {
  const formula = (skill.freeBase || '').toUpperCase().replace(/\s+/g, '')
  const pts = parseInt(char.generalSkills?.[skill.name]?.pointsInvested) || 0
  const mult = parseInt(skill.costMultiplier) || 1
  const race = racesData[char.race?.charAt(0).toLowerCase() + char.race?.slice(1).replace(/\s+/g, '') || 'human'] || {}
  const racialBonus = race.generalSkillBonus || 0
  let freeBase = 0
  if (formula && formula !== 'NONE' && formula !== '') {
    let expr = formula
      .replace(/(\d)(STR|DEX|CON|AW|CHR|WP)/g, '$1*$2')
      .replace(/STR/g, attrs.STR).replace(/DEX/g, attrs.DEX)
      .replace(/CON/g, attrs.CON).replace(/AW/g, attrs.AW)
      .replace(/CHR/g, attrs.CHR).replace(/WP/g, attrs.WP)
    try { freeBase = Math.floor(Function('"use strict"; return (' + expr + ')')()) } catch { freeBase = 0 }
  }
  return (pts * mult) + freeBase + racialBonus
}

function getAllArcaneSkills(data) {
  const skills = []
  for (const category of [...SPIRITUAL_CATEGORIES, ...OBSCURE_CATEGORIES]) {
    const list = data[category.toLowerCase()] || data[category] || []
    list.forEach(skill => skills.push({ ...skill, category }))
  }
  return skills
}

function getPointsInvested(char, skillName) {
  const sources = [char.martialSkills, char.arcaneSkills, char.selfImprovementSkills]
  for (const src of sources) {
    if (src?.[skillName]) return parseInt(src[skillName].pointsInvested) || 0
  }
  return parseInt(char.generalSkills?.[skillName]?.pointsInvested) || 0
}

const TABS = ['General', 'Martial', 'Spiritual', 'Obscure']

// Sub-tab definitions per main tab
const SUB_TABS = {
  General:   ['Self-Improvement', 'Trades & Talents'],
  Martial:   ['Melee', 'Unfettered', 'Ranged', 'Leadership'],
  Spiritual: ['Arcane', 'Divine', 'Balance'],
  Obscure:   ['Infernal', 'Lycanthropy'], // Animal added when ready
}

// Colors per sub-tab — matches the section's THEMES primary/primary2
const SUB_TAB_COLORS = {
  'Self-Improvement': { primary: '#c9a84c', primary2: '#e8c96a' },
  'Trades & Talents': { primary: '#4a9e4a', primary2: '#6acc6a' },
  'Melee':            { primary: '#8a8a9a', primary2: '#c0c0d0' },
  'Unfettered':       { primary: '#9a7a5a', primary2: '#c8a07a' },
  'Ranged':           { primary: '#5a8a5a', primary2: '#7acc7a' },
  'Leadership':       { primary: '#3a5a8a', primary2: '#6a90cc' },
  'Arcane':           { primary: '#7a5a9a', primary2: '#aa80dd' },
  'Divine':           { primary: '#9a8a3a', primary2: '#ccbb60' },
  'Balance':          { primary: '#9a8a6a', primary2: '#c8b890' },
  'Infernal':         { primary: '#8a2a2a', primary2: '#cc5050' },
  'Lycanthropy':      { primary: '#5a5a6a', primary2: '#909090' },
}

// Map sub-tab label → data category/key
const SUB_TAB_CATEGORY = {
  'Self-Improvement': 'selfImprovement',
  'Trades & Talents': 'general',
  'Melee':            'Melee',
  'Unfettered':       'Unfettered',
  'Ranged':           'Ranged',
  'Leadership':       'Leadership',
  'Arcane':           'spellcaster',   // includes guild sub-section
  'Divine':           'divine',
  'Balance':          'balance',
  'Infernal':         'infernal',
  'Lycanthropy':      'lycanthropy',
}

// ── DIVINE PICK-1 GROUPS ──────────────────────────────────────────────────────
const DIVINE_GROUPS = [
  {
    key: 'defence',
    label: 'Divine Defence',
    accent: '#4f9ed8',
    icon: Shield,
    collapsesWith: [],
    skills: [
      'Divine Affinity', 'Divine Armor', 'Divine Guard', 'Divine Protection',
      'Divine resilience', 'Divine Transfer', 'Divine Repose', 'Divine Appeal',
    ],
  },
  {
    key: 'benedictions',
    label: 'Benedictions',
    accent: '#b15bb3',
    icon: Flame,
    collapsesWith: ['Exalted Benedictions', 'Prayer', 'Exalted Prayer', 'Amplify curse'],
    skills: ['Bless', 'Curse', 'Exhort', 'Hallow', 'Becalm'],
  },
  {
    key: 'healing',
    label: 'Divine Healing',
    accent: '#5aa84f',
    icon: HeartPlus,
    collapsesWith: [],
    skills: ['Blood Rune', 'Grafting Glyph', 'Rain of Renewal'],
  },
  {
    key: 'offence',
    label: 'Divine Offence',
    accent: '#d45a3a',
    icon: Sword,
    collapsesWith: ['Exalted Offence', 'Enhanced Projection'],
    skills: [
      'Blade of shadow', 'Blight/Smite', 'Project', 'Glyph of Union',
      'Kettle Vine', 'Spiritual Hammer', 'Flash', 'Consuming Kiss', 'Highlight',
    ],
  },
]

// Mark of Favour skill group — contiguous block, Mark of Favour skill is the visual header
const MARK_OF_FAVOUR_ACCENT = '#4f7fc8'
const MARK_OF_FAVOUR_SKILLS = [
  "Mark of Favour", 'Aura of Purity.', 'Ordination', 'Favoured Aura',
  'Glorious Hammer', 'Glorious Blessings', "Champion's Choice", "Champion's Charge",
]

// Groups that Champion's Choice can grant a second pick for
const CHAMPIONS_CHOICE_GROUPS = ['offence', 'benedictions', 'defence']

function getDivineGroupKey(skillName) {
  for (const g of DIVINE_GROUPS) {
    if (g.skills.includes(skillName)) return g.key
  }
  return null
}

function groupPickLimit(groupKey, char) {
  const hasChampion = parseInt(char.arcaneSkills?.["Champion's Choice"]?.rank) || 0
  if (hasChampion >= 1 && CHAMPIONS_CHOICE_GROUPS.includes(groupKey)) {
    return char.championChoiceGroup === groupKey ? 2 : 1
  }
  return 1
}

function groupPickCount(groupKey, char) {
  const group = DIVINE_GROUPS.find(g => g.key === groupKey)
  if (!group) return 0
  return group.skills.filter(name => (parseInt(char.arcaneSkills?.[name]?.rank) || 0) > 0).length
}

// Lighten a hex color toward white by a given amount (0–255)
function lightenHex(hex, amount = 80) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

// Build a subsection theme from an accent color:
// primary = accent (borders, backgrounds), primary2 = lightly lightened (text)
function makeAccentTheme(base, accent) {
  const light = lightenHex(accent, 50)
  return { ...base, primary: accent, primary2: light, dim: `${accent}38`, border: `${accent}55` }
}

// For very dark accents where even lightened text may be hard to read,
// use a flat lighter version
function makeDarkAccentTheme(base, accent) {
  const light = lightenHex(accent, 120)
  return { ...base, primary: accent, primary2: light, dim: `${accent}38`, border: `${accent}55` }
}

// Skills that collapse with the aura block
const AURA_COLLAPSES_WITH = ['Exalted Auras', 'Extended Auras', 'Exalted Focus']
const AURA_ACCENT = '#43b7a8'
// All individual aura skills (excludes Divine Auras unlock skill itself,
// and excludes Exalted Auras / Extended Auras / Favoured Aura / Exalted Focus
// which are normal skills that don't fill aura slots)
const AURA_SKILLS = [
  'Aura of Alacrity', 'Aura of Ardour', 'Aura of Blood', 'Aura of Crafting',
  'Aura of Damping', 'Aura of Death', 'Aura of Despair', 'Aura of Empathy',
  'Aura of Scattering', 'Aura of Focus', 'Aura of Fortune', 'Aura of Fury',
  'Aura of Glory', 'Aura of Growth', 'Aura of Health', 'Aura of Holy Wrath',
  'Aura of Light', 'Aura of Pride', 'Aura of Rest', 'Aura of Shadows',
  'Aura of Silence', 'Aura of Spirit', 'Aura of Truth', 'Aura of Vigilance',
  'Aura of Winds', 'Aura of Purity.',
]

function calcAuraCap(char) {
  const hasAnyMark = !!(char.patronMark?.mark)
  const hasMarkOfWisdom = (char.patronMark?.mark || '').toLowerCase() === 'wisdom'
  const hasMarkOfFavour = parseInt(char.arcaneSkills?.["Mark of Favour"]?.rank) || 0
  const shamanCount = (char.shamanSymbols || []).length

  const markCap = hasAnyMark
    ? 4 + (hasMarkOfWisdom ? 1 : 0) + (hasMarkOfFavour >= 1 ? 1 : 0)
    : 0
  const shamanCap = shamanCount * 2
  return markCap + shamanCap
}

function getOwnedAuras(char) {
  return AURA_SKILLS.filter(name => (parseInt(char.arcaneSkills?.[name]?.rank) || 0) > 0)
}
export default function SkillEditor({ character, onSave, onBack, gmModeActive, stats }) {
  const lsKey = `skillEditor_tabs_${character?.id || 'default'}`

  const [activeTab, setActiveTab] = useState(() => {
    try { return JSON.parse(localStorage.getItem(lsKey))?.tab || 'General' } catch { return 'General' }
  })
  const [activeSubTab, setActiveSubTab] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(lsKey))
      const tab = saved?.tab || 'General'
      return saved?.subTab || SUB_TABS[tab][0]
    } catch { return 'Self-Improvement' }
  })
  const [char, setChar] = useState(() => JSON.parse(JSON.stringify(character)))
  const gmMode = !!gmModeActive
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [lockedPoints, setLockedPoints] = useState(() => {
    const locked = {}
    const allSkills = { ...character.martialSkills, ...character.arcaneSkills, ...character.selfImprovementSkills }
    Object.entries(allSkills).forEach(([name, data]) => { locked[name] = parseInt(data.pointsInvested) || 0 })
    return locked
  })
  const [search, setSearch] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [activeBuyGroup, setActiveBuyGroup] = useState(null)       // group object for Pick1GroupModal
  const [championChoiceModalOpen, setChampionChoiceModalOpen] = useState(false)
  const [buyAuraOpen, setBuyAuraOpen] = useState(false)            // BuyAuraModal
  const [collapsedGroups, setCollapsedGroups] = useState({
    defence: true, benedictions: true, healing: true, offence: true, auras: true, mof: true,
  })
  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))

  const arcaneSkills = useMemo(() => getAllArcaneSkills(arcaneSkillsData), [])
  const effectiveAttrs = useMemo(() => getEffectiveAttributes(char), [char])

  const pointTotals = useMemo(() => {
    let selfImprovementSpent = 0
    Object.values(char.selfImprovementSkills || {}).forEach(s => { selfImprovementSpent += parseInt(s.pointsInvested) || 0 })
    let tradesSpent = 0
    Object.values(char.generalSkills || {}).forEach(s => { tradesSpent += parseInt(s.pointsInvested) || 0 })
    const generalSpent = selfImprovementSpent + tradesSpent
    let martialSpent = 0
    Object.values(char.martialSkills || {}).forEach(s => { martialSpent += parseInt(s.pointsInvested) || 0 })
    const obscureNames = new Set(OBSCURE_CATEGORIES.flatMap(cat => (arcaneSkillsData[cat] || []).map(s => s.name)))
    let spiritualSpent = 0, obscureSpent = 0
    Object.entries(char.arcaneSkills || {}).forEach(([name, s]) => {
      const pts = parseInt(s.pointsInvested) || 0
      if (obscureNames.has(name)) obscureSpent += pts
      else spiritualSpent += pts
    })

   const totalSpent = generalSpent + martialSpent + spiritualSpent + obscureSpent
    const totalEarned = stats?.skillPoints?.totalEarned || 0
    const maintenancePaid = char.skillPoints?.maintenancePaid || 0
   return { generalSpent, martialSpent, spiritualSpent, obscureSpent, totalSpent, totalEarned, unspent: stats?.skillPoints?.unspent ?? (totalEarned - totalSpent - maintenancePaid) }
  }, [char])
  const handleUpdate = (skillName, newPoints, source) => {
    setChar(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      if (source === 'general') {
        if (!next.generalSkills) next.generalSkills = {}
        if (newPoints === 0) delete next.generalSkills[skillName]
        else next.generalSkills[skillName] = { pointsInvested: newPoints }
        return next
      }
      if (source === 'selfImprovement') {
        if (!next.selfImprovementSkills) next.selfImprovementSkills = {}
        const skillDef = selfImprovementData.find(s => s.name === skillName)
        const costPerRank = skillDef?.costPerRank || 1
        const maxRank = parseInt(skillDef?.maxRank) || 1
        const rank = Math.min(Math.floor(newPoints / costPerRank), isNaN(maxRank) ? 999 : maxRank)
        const maint = skillDef?.maintenancePerRank || 0
        if (newPoints === 0) delete next.selfImprovementSkills[skillName]
        else next.selfImprovementSkills[skillName] = { pointsInvested: newPoints, rank, maintenanceCost: maint * rank }
        return next
      }
      const isMartial = martialSkillsData.some(s => s.name === skillName)
      const targetList = isMartial ? 'martialSkills' : 'arcaneSkills'
      if (!next[targetList]) next[targetList] = {}
      const skillDef = isMartial ? martialSkillsData.find(s => s.name === skillName) : arcaneSkills.find(s => s.name === skillName)
      const costPerRank = skillDef?.costPerRank || 1
      const maxRankRaw = skillDef?.maxRank
      const maxRank = (maxRankRaw === 'any' || !maxRankRaw || isNaN(parseInt(maxRankRaw))) ? 999 : parseInt(maxRankRaw)
      const rank = Math.min(Math.floor(newPoints / costPerRank), maxRank)
      const maint = skillDef?.maintenancePerRank || 0
      if (newPoints === 0) delete next[targetList][skillName]
      else next[targetList][skillName] = { pointsInvested: newPoints, rank, maintenanceCost: maint * rank }
      return next
    })
  }

 const handlePatronMarkUpdate = (markData) => {
  setChar(prev => {
    const updated = { ...prev, patronMark: markData }
    onSave(updated)
    return updated
  })
}
const handleShamanSymbolsUpdate = (symbols) => {
  setChar(prev => {
    const updated = { ...prev, shamanSymbols: symbols }
    onSave(updated)
    return updated
  })
}

  const filterSkills = (skills) => {
    return skills.filter(skill => {
      const name = skill.name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase()) && !(skill.description || '').toLowerCase().includes(search.toLowerCase())) return false
      if (showActiveOnly) {
        const pts = getPointsInvested(char, name)
        if (pts === 0) return false
      }
      if (showUnlockedOnly) {
        const prereq = checkPrereq(skill.prereq, char, stats)
        if (!prereq.met) return false
      }
      return true
    })
  }
const handleSave = () => {
    const newLocked = {}
    Object.entries({ ...char.martialSkills, ...char.arcaneSkills, ...char.selfImprovementSkills }).forEach(([name, data]) => {
      newLocked[name] = parseInt(data.pointsInvested) || 0
    })
    setLockedPoints(newLocked)

    // Build pending changes — only skills that actually changed
    const pending = {}
    const sources = [
      ['martial', char.martialSkills, character.martialSkills],
      ['arcane', char.arcaneSkills, character.arcaneSkills],
      ['selfImprovement', char.selfImprovementSkills, character.selfImprovementSkills],
      ['general', char.generalSkills, character.generalSkills],
    ]
    sources.forEach(([category, newSkills, oldSkills]) => {
      // Skills with changed points
      Object.entries(newSkills || {}).forEach(([name, data]) => {
        const oldPts = parseInt(oldSkills?.[name]?.pointsInvested) || 0
        const newPts = parseInt(data.pointsInvested) || 0
        if (oldPts !== newPts) pending[name] = { category, oldPts, newPts, skillData: data }
      })
      // Skills removed entirely
      Object.keys(oldSkills || {}).forEach(name => {
        if (!newSkills?.[name] && !pending[name]) {
          pending[name] = { category, oldPts: parseInt(oldSkills[name].pointsInvested) || 0, newPts: 0 }
        }
      })
    })

    const withPending = {
      ...character,        // approved base state untouched
      patronMark: char.patronMark,
      shamanSymbols: char.shamanSymbols,
      pendingSkillChanges: pending,
    }
    onSave(withPending)
    setShowConfirm(false)
  }

  const handleTabChange = (tab) => {
    const subTab = SUB_TABS[tab][0]
    setActiveTab(tab)
    setActiveSubTab(subTab)
    try { localStorage.setItem(lsKey, JSON.stringify({ tab, subTab })) } catch {}
  }

  const handleSubTabChange = (subTab) => {
    setActiveSubTab(subTab)
    try { localStorage.setItem(lsKey, JSON.stringify({ tab: activeTab, subTab })) } catch {}
  }

  const tabBtn = (tab) => ({
    padding: '7px 18px',
    background: activeTab === tab ? '#1f160d' : '#12100c',
    border: `1px solid ${activeTab === tab ? '#c99a36' : '#3a2c18'}`,
    color: activeTab === tab ? '#ffd36a' : '#b89b68',
    borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.85rem',
    boxShadow: activeTab === tab ? '0 0 10px rgba(201,154,54,.25)' : 'none',
  })

  // Build specialRows for Divine — Patron's Mark panel appears below that skill row
  const buildDivineSpecialRows = () => {
    const patronRank = parseInt(char.arcaneSkills?.["Patron's Mark"]?.rank) || 0
    if (patronRank < 1) return {}
    return {
      "Patron's Mark": <PatronMarkPanel char={char} onUpdate={handlePatronMarkUpdate} gmMode={gmMode} />
    }
  }

  // Champion's Choice handler — fires when Champion's Choice skill is purchased
  const handleChampionChoiceGroupSelect = (groupKey) => {
    setChar(prev => {
      const updated = { ...prev, championChoiceGroup: groupKey }
      return updated
    })
    setChampionChoiceModalOpen(false)
  }

  // Handle buying a pick-1 group skill from the modal
  const handleGroupSkillBuy = (skillName, cost) => {
    setChar(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      if (!next.arcaneSkills) next.arcaneSkills = {}
      const skillDef = arcaneSkills.find(s => s.name === skillName)
      const costPerRank = parseInt(skillDef?.costPerRank) || cost
      const maint = skillDef?.maintenancePerRank || 0
      next.arcaneSkills[skillName] = { pointsInvested: costPerRank, rank: 1, maintenanceCost: maint }
      return next
    })
    setActiveBuyGroup(null)
  }

  const handleAuraBuy = (skillName, cost) => {
    setChar(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      if (!next.arcaneSkills) next.arcaneSkills = {}
      const skillDef = arcaneSkills.find(s => s.name === skillName)
      const costPerRank = parseInt(skillDef?.costPerRank) || cost
      const maint = skillDef?.maintenancePerRank || 0
      next.arcaneSkills[skillName] = { pointsInvested: costPerRank, rank: 1, maintenanceCost: maint }
      return next
    })
    setBuyAuraOpen(false)
  }
const divineAccordionHeader = (accentColor) => ({
  background: 'linear-gradient(180deg, #18130d 0%, #100d09 100%)',
  border: `1px solid rgba(201,154,54,.35)`,
  borderRadius: 6,
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: 'inset 0 0 18px rgba(0,0,0,.45)',
  gap: 8,
  cursor: 'pointer',
  userSelect: 'none',
  marginBottom: 2,
})

const divineBuyBtn = (disabled = false) => ({
  padding: '4px 14px',
  background: '#16110c',
  border: `1px solid ${disabled ? 'var(--border)' : 'rgba(216,191,122,.55)'}`,
  color: disabled ? 'var(--text3)' : '#e6cf91',
  borderRadius: 4,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'Georgia, serif',
  fontSize: '.8rem',
  fontWeight: 600,
  opacity: disabled ? 0.45 : 1,
})
  // Render the full divine section with pick-1 group headers
  const renderDivineSection = (categorySkills) => {
    const T = THEMES.divine
    const allDivineGroupSkillNames = new Set(DIVINE_GROUPS.flatMap(g => g.skills))

    // Build set of skill names hidden due to their group being collapsed
    const collapsedSkills = new Set()
    for (const g of DIVINE_GROUPS) {
      if (collapsedGroups[g.key]) {
        g.collapsesWith.forEach(name => collapsedSkills.add(name))
      }
    }
    if (collapsedGroups.auras) {
      AURA_COLLAPSES_WITH.forEach(name => collapsedSkills.add(name))
    }

    // Collect skills NOT in any group (rendered normally via RankedSkillTable-style rows)
    // Group skills are rendered inside their group blocks
    const rows = []
    let i = 0

    while (i < categorySkills.length) {
      const skill = categorySkills[i]
      const groupKey = getDivineGroupKey(skill.name)

      if (groupKey) {
        const group = DIVINE_GROUPS.find(g => g.key === groupKey)
        const groupSkillsInList = categorySkills.filter(s => group.skills.includes(s.name))
        const pickLimit = groupPickLimit(groupKey, char)
        const pickCount = groupPickCount(groupKey, char)
        const atLimit = pickCount >= pickLimit
        const pickedNames = group.skills.filter(n => (parseInt(char.arcaneSkills?.[n]?.rank) || 0) > 0)
        const isChampionGroup = char.championChoiceGroup === groupKey
        const showSecondSlot = isChampionGroup && pickLimit === 2

        // Theme for this group — subsection color overrides section color where they'd clash
        const GT = group.accent ? makeAccentTheme(T, group.accent) : T

        rows.push(
          <div key={`group-header-${groupKey}`} style={{ marginTop: 8, margin: '8px 8px 0' }}>
            {/* Accordion header — click to collapse/expand */}
            <div onClick={() => toggleGroup(groupKey)} style={{
  background: 'linear-gradient(180deg, #18130d 0%, #100d09 100%)',
  border: `1px solid ${GT.primary}55`,
  borderLeft: `4px solid ${GT.primary}`,
  borderRadius: collapsedGroups[groupKey] ? 6 : '6px 6px 0 0',
  padding: '12px 14px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  boxShadow: 'inset 0 0 18px rgba(0,0,0,.45)',
  gap: 8, cursor: 'pointer', userSelect: 'none',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
    <span style={{ fontSize: '.65rem', color: '#a99362', opacity: .7 }}>{collapsedGroups[groupKey] ? '▶' : '▼'}</span>
    {group.icon && <group.icon size={15} color={GT.primary} style={{ flexShrink: 0 }} />}
    <span style={{ fontSize: '.8rem', letterSpacing: '.14em', color: '#d8bf7a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
      {group.label}
    </span>
    {pickedNames.length > 0 ? (
      <span style={{ fontSize: '.72rem', color: '#a99362', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        — {pickedNames.join(', ')}{showSecondSlot && pickCount < 2 && ' (1st choice)'}
      </span>
    ) : (
      <span style={{ fontSize: '.72rem', color: '#a99362', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        Pick one
      </span>
    )}
  </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                {!atLimit && (
                  <button
                    onClick={() => setActiveBuyGroup(group)}
                    style={{
                      padding: '4px 14px', background: '#16110c',
                      border: `1px solid ${GT.primary}88`, color: GT.primary2,
                      borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.8rem', fontWeight: 600,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = GT.primary; e.currentTarget.style.boxShadow = `0 0 8px ${GT.primary}44` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = GT.primary + '88'; e.currentTarget.style.boxShadow = 'none' }}>
                    Buy
                  </button>
                )}
               </div>
            </div>

            {/* Group skill rows — hidden when collapsed */}
            {!collapsedGroups[groupKey] && (
              <div>
              {groupSkillsInList.map(s => {
                const pts = parseInt(char.arcaneSkills?.[s.name]?.pointsInvested) || 0
                const rank = parseInt(char.arcaneSkills?.[s.name]?.rank) || 0
                const isOwned = rank > 0
                return (
                  <div key={s.name} style={{ opacity: (!isOwned && atLimit) ? 0.45 : 1 }}>
                    <SkillTableRow
                      skill={s}
                      rank={rank}
                      pointsInvested={pts}
                      lockedPoints={lockedPoints}
                      theme={GT}
                      level={char.level || 1}
                      char={char}
                      stats={stats}
                      gmMode={gmMode}
                      onUpdate={gmMode ? (name, newPts) => handleUpdate(name, newPts, 'arcane') : undefined}
                      skillSource="arcane"
                      unspentPoints={pointTotals.unspent}
                      forcePtsReadOnly={!gmMode}
                    />
                  </div>
                )
              })}
              </div>
            )}
            {/* Group closing border */}
            {!collapsedGroups[groupKey] && (
              <div style={{ height: 3, background: `linear-gradient(to right, ${GT.primary}55, transparent)`, borderBottom: `1px solid ${GT.primary}` }} />
            )}
          </div>
        )

        // Skip past all group members in the loop
        while (i < categorySkills.length && group.skills.includes(categorySkills[i].name)) {
          i++
        }
        continue
      }

      // Non-group skill — check type and handle as a contiguous block where appropriate
      const pts = parseInt(char.arcaneSkills?.[skill.name]?.pointsInvested) || 0
      const rank = parseInt(char.arcaneSkills?.[skill.name]?.rank) || 0
      const isAuraSkill = AURA_SKILLS.includes(skill.name)
      const isDivineAurasUnlock = skill.name === 'Divine Auras'
      const isMoFHeader = skill.name === 'Mark of Favour'
      const MoFT = { ...T, primary: MARK_OF_FAVOUR_ACCENT, primary2: MARK_OF_FAVOUR_ACCENT, dim: `${MARK_OF_FAVOUR_ACCENT}38`, border: `${MARK_OF_FAVOUR_ACCENT}55` }
      const AT = makeAccentTheme(T, AURA_ACCENT)

      // Skip skills that are hidden because their group is collapsed
      if (collapsedSkills.has(skill.name)) { i++; continue }

      // ── AURA BLOCK: Divine Auras unlock triggers the whole contiguous aura block ──
     if (isDivineAurasUnlock) {
        rows.push(
          <div key={skill.name}>
            <SkillTableRow
              skill={skill}
              rank={rank}
              pointsInvested={pts}
              lockedPoints={lockedPoints}
              theme={AT}
              level={char.level || 1}
              char={char}
              stats={stats}
              gmMode={gmMode}
              onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
              skillSource="arcane"
              unspentPoints={pointTotals.unspent}
            />
          </div>
        )
        i++
        continue
      }

      if (isAuraSkill && !rows.find(r => r.key === 'aura-block')) {
        const auraCap = calcAuraCap(char)
        const ownedAuras = getOwnedAuras(char)
        // Collect all consecutive aura skills from this point
        const auraSkillsInBlock = []
        let j = i
        while (j < categorySkills.length && AURA_SKILLS.includes(categorySkills[j].name)) {
          auraSkillsInBlock.push(categorySkills[j])
          j++
        }

        rows.push(
          <div key="aura-block" style={{ margin: '8px 8px 0' }}>
            {/* Auras Known header bar — click to collapse/expand */}
            {auraCap > 0 && (
              <div onClick={() => toggleGroup('auras')} style={{
                background: 'linear-gradient(180deg, #18130d 0%, #100d09 100%)',
                border: `1px solid ${AT.primary}55`,
                borderLeft: `4px solid ${AT.primary}`,
                borderRadius: collapsedGroups.auras ? 6 : '6px 6px 0 0',
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: 'inset 0 0 18px rgba(0,0,0,.45)',
                gap: 8, cursor: 'pointer', userSelect: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: '.65rem', color: '#a99362', opacity: .7 }}>{collapsedGroups.auras ? '▶' : '▼'}</span>
                  <Sun size={15} color={AT.primary} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '.8rem', letterSpacing: '.14em', color: '#d8bf7a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
                    Auras Known
                  </span>
                  <span style={{ fontSize: '.8rem', color: ownedAuras.length >= auraCap ? '#c94a4a' : AT.primary, fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                    {ownedAuras.length} / {auraCap}
                  </span>
                  {ownedAuras.length > 0 && (
                    <span style={{ fontSize: '.7rem', color: '#a99362', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      — {ownedAuras.map(n => n.replace('Aura of ', '')).join(', ')}
                    </span>
                  )}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <button onClick={() => setBuyAuraOpen(true)} disabled={ownedAuras.length >= auraCap}
                    style={{
                      padding: '4px 14px', background: '#16110c',
                      border: `1px solid ${ownedAuras.length >= auraCap ? 'var(--border)' : AT.primary + '88'}`,
                      color: ownedAuras.length >= auraCap ? 'var(--text3)' : AT.primary2,
                      borderRadius: 4, cursor: ownedAuras.length >= auraCap ? 'not-allowed' : 'pointer',
                      fontFamily: 'Georgia, serif', fontSize: '.8rem', fontWeight: 600,
                      opacity: ownedAuras.length >= auraCap ? 0.45 : 1,
                    }}
                    onMouseEnter={e => { if (ownedAuras.length < auraCap) { e.currentTarget.style.borderColor = AT.primary; e.currentTarget.style.boxShadow = `0 0 8px ${AT.primary}44` }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = AT.primary + '88'; e.currentTarget.style.boxShadow = 'none' }}>
                    Buy Aura
                  </button>
                </div>
              </div>
            )}
            {/* Individual aura skill rows — hidden when collapsed */}
            {!collapsedGroups.auras && auraSkillsInBlock.map(s => {
              const aPts = parseInt(char.arcaneSkills?.[s.name]?.pointsInvested) || 0
              const aRank = parseInt(char.arcaneSkills?.[s.name]?.rank) || 0
              const atCap = ownedAuras.length >= auraCap
              return (
                <div key={s.name} style={{ opacity: (!aRank && atCap && auraCap > 0) ? 0.4 : 1 }}>
                  <SkillTableRow
                    skill={s}
                    rank={aRank}
                    pointsInvested={aPts}
                    lockedPoints={lockedPoints}
                    theme={AT}
                    level={char.level || 1}
                    char={char}
                    stats={stats}
                    gmMode={gmMode}
                    onUpdate={gmMode ? (name, newPts) => handleUpdate(name, newPts, 'arcane') : undefined}
                    skillSource="arcane"
                    unspentPoints={pointTotals.unspent}
                    forcePtsReadOnly={!gmMode}
                  />
                </div>
              )
            })}
          </div>
        )
        i = j
        continue
      }

      // Skip individual aura skills — already consumed above
      if (isAuraSkill) { i++; continue }

      // ── MARK OF FAVOUR BLOCK: contiguous wrapper, MoF skill is the visual header ──
      if (isMoFHeader) {
        const mofSkillsInBlock = []
        let j = i + 1
        while (j < categorySkills.length && MARK_OF_FAVOUR_SKILLS.includes(categorySkills[j].name)) {
          mofSkillsInBlock.push(categorySkills[j])
          j++
        }
        const mofHeaderPts = parseInt(char.arcaneSkills?.["Mark of Favour"]?.pointsInvested) || 0
        const mofHeaderRank = parseInt(char.arcaneSkills?.["Mark of Favour"]?.rank) || 0

        rows.push(
         <div key="mof-block" style={{ margin: '8px 8px 0' }}>
            {/* Mark of Favour header — click to collapse/expand */}
            <div onClick={() => toggleGroup('mof')} style={{
              background: 'linear-gradient(180deg, #18130d 0%, #100d09 100%)',
              border: `1px solid ${MoFT.primary}55`,
              borderLeft: `4px solid ${MoFT.primary}`,
              borderRadius: collapsedGroups.mof ? 6 : '6px 6px 0 0',
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: 'inset 0 0 18px rgba(0,0,0,.45)',
              gap: 8, cursor: 'pointer', userSelect: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <span style={{ fontSize: '.65rem', color: '#a99362', opacity: .7 }}>{collapsedGroups.mof ? '▶' : '▼'}</span>
                <Star size={15} color={MoFT.primary} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '.8rem', letterSpacing: '.14em', color: '#d8bf7a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
                  Mark of Favour
                </span>
                {mofHeaderRank > 0 && (
                  <span style={{ fontSize: '.72rem', color: '#a99362', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    — Rank {mofHeaderRank}
                  </span>
                )}
              </div>
            </div>
            {/* Mark of Favour content — hidden when collapsed */}
            {!collapsedGroups.mof && (
              <div>
            {/* Mark of Favour skill row itself */}
            <SkillTableRow
              skill={skill}
              rank={mofHeaderRank}
              pointsInvested={mofHeaderPts}
              lockedPoints={lockedPoints}
              theme={MoFT}
              level={char.level || 1}
              char={char}
              stats={stats}
              gmMode={gmMode}
              onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
              skillSource="arcane"
              unspentPoints={pointTotals.unspent}
            />
            {/* Remaining MoF group skills */}
            {mofSkillsInBlock.map(s => {
              const mPts = parseInt(char.arcaneSkills?.[s.name]?.pointsInvested) || 0
              const mRank = parseInt(char.arcaneSkills?.[s.name]?.rank) || 0
              return (
                <div key={s.name}>
                  <SkillTableRow
                    skill={s}
                    rank={mRank}
                    pointsInvested={mPts}
                    lockedPoints={lockedPoints}
                    theme={MoFT}
                    level={char.level || 1}
                    char={char}
                    stats={stats}
                    gmMode={gmMode}
                    onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
                    skillSource="arcane"
                    unspentPoints={pointTotals.unspent}
                  />
                  {s.name === "Champion's Choice" && mRank >= 1 && !char.championChoiceGroup && (
                    <div style={{ padding: '8px 12px', background: MoFT.dim, borderBottom: `1px solid ${MoFT.border}` }}>
                      <button
                        onClick={() => setChampionChoiceModalOpen(true)}
                        style={{ padding: '5px 14px', background: `${MoFT.primary}20`, border: `1px solid ${MoFT.primary}`, color: MoFT.primary2, borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.82rem' }}>
                        Choose Group (Champion's Choice)
                      </button>
                    </div>
                  )}
                  {s.name === "Champion's Choice" && char.championChoiceGroup && (
                    <div style={{ padding: '6px 12px', background: MoFT.dim, borderBottom: `1px solid ${MoFT.border}`, fontSize: '.75rem', color: MoFT.primary, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      Champion's Choice: {DIVINE_GROUPS.find(g => g.key === char.championChoiceGroup)?.label}
                      {gmMode && (
                        <button onClick={() => setChar(prev => ({ ...prev, championChoiceGroup: null }))}
                          style={{ marginLeft: 10, padding: '2px 8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.7rem' }}>
                          Reset (GM)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
              </div>
            )}
          </div>
        )
        i = j
        continue
      }

      // Skip MoF skills already consumed
      if (MARK_OF_FAVOUR_SKILLS.includes(skill.name)) { i++; continue }

     // All other divine skills — normal rendering
      const isPatronMark = skill.name === "Patron's Mark"
      const pm = char.patronMark || {}
      rows.push(
        <div key={skill.name}>
          <SkillTableRow
            skill={skill}
            rank={rank}
            pointsInvested={pts}
            lockedPoints={lockedPoints}
            theme={T}
            level={char.level || 1}
            char={char}
            stats={stats}
            gmMode={gmMode}
            onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
            skillSource="arcane"
            unspentPoints={pointTotals.unspent}
            inlineExtra={isPatronMark && rank >= 1 && pm.mark ? (
              <span style={{ fontSize: '.72rem', color: '#a99362', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginLeft: 6 }}>
                — Mark of {pm.mark}
              </span>
            ) : null}
            detailExtra={isPatronMark && rank >= 1 ? (
              <PatronMarkPanel char={char} onUpdate={handlePatronMarkUpdate} gmMode={gmMode} />
            ) : null}
          />
        </div>
      )
      i++
    }

    return (
      <div style={{ border: `3px solid ${T.primary}` }}>
        <div data-tour="skills-divine-header" style={{ padding: '10px 12px', background: 'var(--bg)', borderBottom: `2px solid ${T.primary}`, fontSize: '1rem', letterSpacing: '.25em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 600, textAlign: 'center' }}>
          Divine
        </div>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 52px', background: 'var(--bg2)', borderBottom: `1px solid ${T.border}`, minHeight: 44, alignItems: 'center' }}>
          <div style={{ padding: '0 12px', fontSize: '.85rem', letterSpacing: '.12em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Skill</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Pts</div>
            <div style={{ width: 36, height: 1, background: T.border }} />
            <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Cost</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Rnk</div>
            <div style={{ width: 28, height: 1, background: T.border }} />
            <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: T.primary, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Max</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
          {rows}
        </div>
      </div>
    )
  }


  // Build detailRows and inlineRows for Guild — Shaman's Symbol panel in detail view
  const buildGuildRows = () => {
    const shamanRank = parseInt(char.arcaneSkills?.["Shaman's Symbol"]?.rank) || 0
    const symbols = char.shamanSymbols || []
    if (shamanRank < 1) return { detailRows: {}, inlineRows: {} }

    const inlineSummary = symbols.length > 0
      ? (
        <div style={{ fontSize: '.7rem', color: 'var(--text3)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
          {symbols.map(s => s.symbol).join(' · ')}
        </div>
      )
      : null

    return {
      detailRows: {
        "Shaman's Symbol": <ShamanSymbolsPanel char={char} onUpdate={handleShamanSymbolsUpdate} gmMode={gmMode} />
      },
      inlineRows: {
        "Shaman's Symbol": inlineSummary
      },
    }
  }

 return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>

      {/* Points bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
        <div data-tour="skills-points-bar" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4,
        }}>
          {[
            ['Available', pointTotals.unspent],
            ['General',   pointTotals.generalSpent],
            ['Martial',   pointTotals.martialSpent],
            ['Spiritual', pointTotals.spiritualSpent],
            ['Obscure',   pointTotals.obscureSpent],
          ].map(([l, val]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div className="skills-pts-label">{l}</div>
              <div className="skills-pts-value" style={{ color: l === 'Available' && val < 0 ? '#c94a4a' : 'var(--gold2)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div data-tour="skills-tabs" className="skills-tabs-row">
        {TABS.map(tab => (
          <button key={tab} data-skills-tab={tab} className="skills-tab-btn" style={tabBtn(tab)} onClick={() => handleTabChange(tab)}>{tab}</button>
        ))}
      </div>

      {/* Sub-tab bar */}
      <div className="skills-subtabs-row" style={{ borderBottom: '1px solid var(--border)' }}>
        {SUB_TABS[activeTab].map(sub => {
          const c = SUB_TAB_COLORS[sub] || { primary: 'var(--gold)', primary2: 'var(--gold2)' }
          const isActive = activeSubTab === sub
          return (
            <button key={sub} onClick={() => handleSubTabChange(sub)} style={{
              padding: '6px 4px',
              background: isActive ? `${c.primary}22` : `${c.primary}0a`,
              border: `1px solid ${isActive ? c.primary : `${c.primary}55`}`,
              color: isActive ? c.primary2 : `${c.primary}99`,
              borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.82rem',
              transition: 'all .15s', width: '100%',
            }}>{sub}</button>
          )
        })}
      </div>

      {/* Rules bar — hidden on mobile */}
      <div className="skills-rules-bar">
        <RulesBar activeSubTab={activeSubTab} />
      </div>

      {/* Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, fontFamily: 'Georgia, serif', fontSize: '.9rem' }}
        />
        {/* Save + filters row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <button data-tour="skills-save-btn" onClick={() => setShowConfirm(true)} style={{ padding: '7px 4px', background: 'rgba(74,158,74,.15)', border: '1px solid #4a9e4a', color: '#4a9e4a', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.82rem', width: '100%' }}>
            Save Changes
          </button>
          <button onClick={() => setShowActiveOnly(!showActiveOnly)} style={{ padding: '7px 4px', background: showActiveOnly ? 'rgba(201,168,76,.15)' : 'var(--surface)', border: `1px solid ${showActiveOnly ? 'var(--gold)' : 'var(--border)'}`, color: showActiveOnly ? 'var(--gold2)' : 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.82rem', width: '100%' }}>
            Active Only
          </button>
          <button onClick={() => setShowUnlockedOnly(!showUnlockedOnly)} style={{ padding: '7px 4px', background: showUnlockedOnly ? 'rgba(201,168,76,.15)' : 'var(--surface)', border: `1px solid ${showUnlockedOnly ? 'var(--gold)' : 'var(--border)'}`, color: showUnlockedOnly ? 'var(--gold2)' : 'var(--text3)', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.82rem', width: '100%' }}>
            Unlocked Only
          </button>
        </div>
      </div>

      {/* Skill list */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'visible' }}>

        {/* ── GENERAL ── */}
        {activeTab === 'General' && activeSubTab === 'Self-Improvement' && (
          <RankedSkillTable skills={filterSkills(selfImprovementData)} char={char} stats={stats} sectionLabel="Self Improvement" theme={THEMES.selfImprovement} level={char.level || 1} skillSource="selfImprovement" gmMode={gmMode} lockedPoints={lockedPoints} onUpdate={(name, newPts) => handleUpdate(name, newPts, 'selfImprovement')} unspentPoints={pointTotals.unspent}
            sectionHeaderTourId="skills-self-improvement-header"
            firstSkillTourId="skills-first-skill"
            fourthSkillRightTourId="skills-bodybuilding-right"
            fourthSkillPtsTourId="skills-bodybuilding-pts"
          />
        )}

        {activeTab === 'General' && activeSubTab === 'Trades & Talents' && (
          <div>
            <div style={{ padding: '10px 12px', background: 'var(--bg)', borderBottom: '2px solid #4a9e4a', fontSize: '1rem', letterSpacing: '.25em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', fontWeight: 600, textAlign: 'center' }}>Trades &amp; Talents</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 72px', background: 'var(--bg2)', borderBottom: '1px solid rgba(74,158,74,.25)', minHeight: 44, alignItems: 'center' }}>
              <div style={{ padding: '0 12px', fontSize: '.85rem', letterSpacing: '.12em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Skill</div>
              <div style={{ textAlign: 'center', fontSize: '.7rem', letterSpacing: '.08em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Score</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px' }}>
                <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Pts</div>
                <div style={{ width: 36, height: 1, background: 'rgba(74,158,74,.25)' }} />
                <div style={{ fontSize: '.7rem', letterSpacing: '.08em', color: '#4a9e4a', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Mult</div>
              </div>
            </div>
            <div>
              {filterSkills(generalSkillsData).map((skill, idx) => {
                const pts = parseInt(char.generalSkills?.[skill.name]?.pointsInvested) || 0
                const score = effectiveAttrs ? calcSkillScore(skill, char, effectiveAttrs) : 0
                const getSkillScore = (name) => { const s = generalSkillsData.find(x => x.name === name); return s ? calcSkillScore(s, char, effectiveAttrs || {}) : 0 }
                return <GeneralSkillCard key={skill.name} skill={skill} score={score} stats={undefined} character={char} pointsInvested={pts} getSkillScore={getSkillScore} gmMode={gmMode} lockedPoints={lockedPoints} onUpdate={(newPts) => handleUpdate(skill.name, newPts, 'general')} tourId={idx === 0 ? 'skills-acting' : undefined} />
              })}
            </div>
          </div>
        )}

        {/* ── MARTIAL ── */}
        {activeTab === 'Martial' && (() => {
          const martialSections = [
            { key: 'Melee',      label: 'Melee',      theme: THEMES.melee      },
            { key: 'Unfettered', label: 'Unfettered', theme: THEMES.unfettered },
            { key: 'Ranged',     label: 'Ranged',     theme: THEMES.ranged     },
            { key: 'Leadership', label: 'Leadership', theme: THEMES.leadership },
          ]
          const section = martialSections.find(s => s.label === activeSubTab)
          if (!section) return null
          const sectionSkills = filterSkills(martialSkillsData.filter(s => s.category === section.key))
          if (sectionSkills.length === 0) return <div style={{ padding: 24, color: 'var(--text3)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>No skills match current filters.</div>
          return (
            <RankedSkillTable
              skills={sectionSkills} char={char} stats={stats}
              sectionLabel={section.label} theme={section.theme}
              level={char.level || 1} skillSource="martial" gmMode={gmMode}
              lockedPoints={lockedPoints}
              onUpdate={(name, newPts) => handleUpdate(name, newPts, 'martial')}
              unspentPoints={pointTotals.unspent}
            />
          )
        })()}

        {/* ── SPIRITUAL ── */}
        {activeTab === 'Spiritual' && (() => {
          const themeMap = { spellcaster: THEMES.arcane, guild: THEMES.guild, divine: THEMES.divine, balance: THEMES.balance }
          if (activeSubTab === 'Arcane') {
            const { detailRows: guildDetailRows, inlineRows: guildInlineRows } = buildGuildRows()
            return ['spellcaster', 'guild'].map(category => {
              const categorySkills = filterSkills((arcaneSkillsData[category] || []).map(s => ({ ...s, category })))
              if (categorySkills.length === 0) return null
              return (
                <RankedSkillTable key={category} skills={categorySkills} char={char} stats={stats}
                  sectionLabel={category === 'spellcaster' ? 'Arcane' : 'Guild'}
                  theme={category === 'spellcaster' ? THEMES.arcane : THEMES.guild} level={char.level || 1} skillSource="arcane"
                  gmMode={gmMode} lockedPoints={lockedPoints}
                  onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
                  detailRows={category === 'guild' ? guildDetailRows : undefined}
                  inlineRows={category === 'guild' ? guildInlineRows : undefined}
                  unspentPoints={pointTotals.unspent}
                  sectionHeaderTourId={category === 'spellcaster' ? 'skills-arcane-header' : undefined}
                />
              )
            })
          }
          if (activeSubTab === 'Divine') {
            const divineSkills = filterSkills((arcaneSkillsData['divine'] || []).map(s => ({ ...s, category: 'divine' })))
            return <div key="divine">{renderDivineSection(divineSkills)}</div>
          }
          if (activeSubTab === 'Balance') {
            const balanceSkills = filterSkills((arcaneSkillsData['balance'] || []).map(s => ({ ...s, category: 'balance' })))
            if (balanceSkills.length === 0) return null
            return (
              <RankedSkillTable skills={balanceSkills} char={char} stats={stats}
                sectionLabel="Balance" theme={THEMES.balance} level={char.level || 1}
                skillSource="arcane" gmMode={gmMode} lockedPoints={lockedPoints}
                onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
                unspentPoints={pointTotals.unspent}
                sectionHeaderTourId="skills-balance-header"
              />
            )
          }
          return null
        })()}

        {/* ── OBSCURE ── */}
        {activeTab === 'Obscure' && (() => {
          const obscureMap = { 'Infernal': 'infernal', 'Lycanthropy': 'lycanthropy' }
          const category = obscureMap[activeSubTab]
          if (!category) return null
          const themeMap = { infernal: THEMES.infernal, lycanthropy: THEMES.lycanthropy }
          const categorySkills = filterSkills((arcaneSkillsData[category] || []).map(s => ({ ...s, category })))
          if (categorySkills.length === 0) return <div style={{ padding: 24, color: 'var(--text3)', fontFamily: 'Georgia, serif', textAlign: 'center' }}>No skills match current filters.</div>
          return (
            <RankedSkillTable skills={categorySkills} char={char} stats={stats}
              sectionLabel={activeSubTab} theme={themeMap[category]}
              level={char.level || 1} skillSource="arcane" gmMode={gmMode}
              lockedPoints={lockedPoints}
              onUpdate={(name, newPts) => handleUpdate(name, newPts, 'arcane')}
              unspentPoints={pointTotals.unspent}
            />
          )
        })()}

      {showConfirm && (
          <SaveConfirmModal
            original={character}
            updated={char}
            onConfirm={handleSave}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
      {confirmModal && (
  <ConfirmModal
    message={confirmModal.message}
    dangerous={confirmModal.dangerous}
    onConfirm={confirmModal.onConfirm}
    onCancel={() => setConfirmModal(null)}
  />
)}
      {activeBuyGroup && (
        <Pick1GroupModal
          group={activeBuyGroup}
          char={char}
          stats={stats}
          arcaneSkillDefs={arcaneSkills}
          unspentPoints={pointTotals.unspent}
          onConfirm={handleGroupSkillBuy}
          onClose={() => setActiveBuyGroup(null)}
        />
      )}
      {championChoiceModalOpen && (
        <ChampionChoiceModal
          onConfirm={handleChampionChoiceGroupSelect}
          onClose={() => setChampionChoiceModalOpen(false)}
        />
      )}
      {buyAuraOpen && (
        <BuyAuraModal
          char={char}
          stats={stats}
          arcaneSkillDefs={arcaneSkills}
          ownedAuras={getOwnedAuras(char)}
          auraCap={calcAuraCap(char)}
          unspentPoints={pointTotals.unspent}
          onConfirm={handleAuraBuy}
          onClose={() => setBuyAuraOpen(false)}
        />
      )}
    </div>
  )
}

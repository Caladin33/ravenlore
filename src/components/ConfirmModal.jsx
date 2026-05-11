// ConfirmModal.jsx
// Drop-in replacement for window.confirm() that works on iOS Safari

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', dangerous = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '22px 24px', maxWidth: 360, width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,.7)',
      }}>
        <div style={{
          fontSize: '.95rem', color: 'var(--text)', fontFamily: 'Georgia, serif',
          lineHeight: 1.6, marginBottom: 20,
        }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', background: 'none',
            border: '1px solid var(--border)', color: 'var(--text3)',
            borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '.9rem',
          }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{
            padding: '8px 20px',
            background: dangerous ? 'rgba(201,74,74,.15)' : 'rgba(201,168,76,.15)',
            border: `1px solid ${dangerous ? '#c94a4a' : 'var(--gold)'}`,
            color: dangerous ? '#c94a4a' : 'var(--gold2)',
            borderRadius: 5, cursor: 'pointer', fontFamily: 'Georgia, serif',
            fontSize: '.9rem', fontWeight: 600,
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

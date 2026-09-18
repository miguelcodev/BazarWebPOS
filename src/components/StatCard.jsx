export function StatCard({ label, value, tone = 'primary' }) {
  const palette = {
    primary: '#2f6fed',
    success: '#1ea97c',
    warning: '#f4b740',
    danger: '#e14d5b',
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5eaf3',
        borderRadius: 18,
        padding: '18px 20px',
        boxShadow: '0 12px 28px rgba(23, 32, 51, 0.06)',
      }}
    >
      <div style={{ color: '#5f6b7a', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: palette[tone] || palette.primary, marginTop: 8 }}>
        {value}
      </div>
    </div>
  )
}

export function Thumb({ url, name, width = 40, height = width, radius = 10, fontSize }) {
  const initials = (name || '?').trim().slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #eef3ff, #f5f7fb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span style={{ fontWeight: 800, color: '#2f6fed', fontSize: fontSize || Math.max(11, Math.min(width, height) * 0.32) }}>
          {initials}
        </span>
      )}
    </div>
  )
}

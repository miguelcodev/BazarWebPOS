export function Shell({ title, children }) {
  return (
    <main style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '16px' }}>{title}</h1>
      {children}
    </main>
  )
}

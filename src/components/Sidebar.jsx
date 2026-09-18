import { LogOut, Store } from 'lucide-react'

export function Sidebar({ items, activeId, onSelect, userName, profileName, onLogout }) {
  return (
    <>
      <nav className="app-sidebar">
        <div className="app-sidebar-brand">
          <Store size={20} />
          Bazar Central
        </div>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`app-nav-item${activeId === item.id ? ' active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {(userName || onLogout) && (
          <div className="app-sidebar-footer">
            {userName && (
              <div className="app-sidebar-user">
                <div className="app-sidebar-user-name">{userName}</div>
                {profileName && <div className="app-sidebar-user-profile">{profileName}</div>}
              </div>
            )}
            {onLogout && (
              <button type="button" className="app-nav-item" onClick={onLogout}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="app-bottom-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeId === item.id ? 'active' : ''}
            onClick={() => onSelect(item.id)}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

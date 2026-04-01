import React from 'react';
import { ELLogo, Ico, IC } from './Shared';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type PageKey = 'dashboard' | 'users' | 'rooms' | 'packages' | 'sessions' | 'bookings';

interface SidebarProps {
  active:    PageKey;
  setActive: (p: PageKey) => void;
}

export function Sidebar({ active, setActive }: SidebarProps) {
  const { user, logout } = useAuth();
  const { mode, toggle, t }  = useTheme();
  const isAdmin = user?.role === 'ADMIN';

  const sections: { key: PageKey; label: string; icon: string | string[] }[] = [
    { key: 'dashboard', label: 'Dashboard',        icon: IC.dashboard },
    ...(isAdmin ? [{ key: 'users' as PageKey, label: 'User Management', icon: IC.users }] : []),
    { key: 'rooms',     label: 'Rooms',             icon: IC.rooms },
    { key: 'packages',  label: 'Packages',          icon: IC.packages },
    { key: 'sessions',  label: 'Chat Sessions',     icon: IC.chat },
    { key: 'bookings',  label: 'Bookings',          icon: IC.bookings },
  ];

  return (
    <aside className="anim-slide-left" style={{
      width: 228,
      minHeight: '100vh',
      background: t.sidebar,
      borderRight: `1px solid ${t.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 11px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      boxShadow: mode === 'light' ? '2px 0 16px rgba(0,0,0,0.06)' : 'none',
    }}>
      {/* Logo */}
      <div style={{ padding: '6px 5px 20px' }}>
        <ELLogo size={30} textSize={13} />
      </div>

      <hr className="divider" style={{ marginBottom: 14 }} />

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {sections.map((s) => (
          <div
            key={s.key}
            className={`nav-item ${active === s.key ? 'active' : ''}`}
            onClick={() => setActive(s.key)}
          >
            <Ico d={s.icon} size={15} />
            {s.label}
          </div>
        ))}
      </nav>

      <hr className="divider" style={{ margin: '12px 0' }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 13px', borderRadius: 10, border: `1px solid ${t.border}`,
          background: 'transparent', cursor: 'pointer',
          color: t.muted, fontSize: 13, fontFamily: "'Syne', sans-serif",
          transition: 'all 0.2s', marginBottom: 6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = t.navHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Ico d={mode === 'dark' ? IC.sun : IC.moon} size={14} stroke={t.muted} />
        {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      {/* User profile */}
      <div style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <div style={{
          width: 33, height: 33, borderRadius: '50%',
          background: `${t.gold}1A`, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: t.gold, flexShrink: 0,
        }}>
          {user?.firstName?.[0] ?? '?'}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: t.text }}>
            {user?.firstName}
          </div>
          <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ fontSize: 10 }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Logout */}
      <div
        className="nav-item"
        onClick={logout}
        style={{ color: 'rgba(248,113,113,0.65)', marginTop: 2 }}
      >
        <Ico d={IC.logout} size={14} stroke="rgba(248,113,113,0.65)" />
        Sign Out
      </div>
    </aside>
  );
}

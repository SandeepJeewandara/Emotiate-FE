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
  const profileName = user?.username?.trim() || user?.firstName?.trim() || 'User';

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
      width: 260,
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${t.sidebar}, ${t.bgAlt})`,
      borderRight: `1px solid ${t.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 14px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      boxShadow: mode === 'light' ? '2px 0 20px rgba(0,0,0,0.06)' : '24px 0 60px rgba(0,0,0,0.22)',
      zIndex: 2,
    }}>
      <div style={{
        padding: '10px',
        borderRadius: 18,
        border: `1px solid ${t.border}`,
        background: mode === 'light'
          ? 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(154,114,48,0.06))'
          : 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(196,162,99,0.08))',
        marginBottom: 14,
      }}>
        <ELLogo size={30} textSize={13} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ padding: '0 10px 4px', fontSize: 11, color: t.muted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
          Navigation
        </div>
        {sections.map((s) => (
          <div
            key={s.key}
            className={`nav-item ${active === s.key ? 'active' : ''}`}
            onClick={() => setActive(s.key)}
            style={active === s.key ? { boxShadow: `0 10px 24px ${t.gold}18` } : undefined}
          >
            <Ico d={s.icon} size={15} />
            {s.label}
          </div>
        ))}
      </nav>

      <button
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '10px 13px', borderRadius: 14, border: `1px solid ${t.border}`,
          background: mode === 'light' ? 'rgba(154,114,48,0.05)' : 'rgba(255,255,255,0.03)', cursor: 'pointer',
          color: t.muted, fontSize: 13, fontFamily: "'Syne', sans-serif",
          transition: 'all 0.2s', marginBottom: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = t.navHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = mode === 'light' ? 'rgba(154,114,48,0.05)' : 'rgba(255,255,255,0.03)')}
      >
        <Ico d={mode === 'dark' ? IC.sun : IC.moon} size={14} stroke={t.muted} />
        {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div style={{
        padding: '12px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
        borderRadius: 16,
        border: `1px solid ${t.border}`,
        background: mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.035)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: `${t.gold}1A`, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: t.gold, flexShrink: 0,
        }}>
          {profileName[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: t.text }}>
            {profileName}
          </div>
          <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ fontSize: 10 }}>
            {user?.role}
          </span>
        </div>
      </div>

      <div
        className="nav-item"
        onClick={logout}
        style={{ color: 'rgba(248,113,113,0.72)', marginTop: 2, borderRadius: 14 }}
      >
        <Ico d={IC.logout} size={14} stroke="rgba(248,113,113,0.65)" />
        Sign Out
      </div>
    </aside>
  );
}

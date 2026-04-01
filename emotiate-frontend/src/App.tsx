import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth }   from './context/AuthContext';
import { Sidebar, type PageKey }   from './components/Sidebar';
import Home from './pages/Home';
import { LoginPage }               from './pages/Login';
import { Dashboard }               from './pages/Dashboard';
import { UserManagement }          from './pages/UserManagement';
import { RoomManagement }          from './pages/RoomManagement';
import { PackageManagement }       from './pages/PackageManagement';
import { SessionManagement }       from './pages/SessionManagement';
import { BookingManagement }       from './pages/BookingManagement';

// ─── Inner layout (needs auth + theme context) ────────────────────────────────
function AppLayout() {
  const { user }    = useAuth();
  const { t, mode } = useTheme();
  const [tab, setTab] = useState<PageKey>('dashboard');
  const rootRef = useRef<HTMLDivElement>(null);

  // Sync data-theme on .admin-root so scoped CSS variables respond to toggle
  useEffect(() => {
    if (rootRef.current) rootRef.current.setAttribute('data-theme', mode);
  }, [mode]);

  // Guard: redirect non-admins away from user management
  useEffect(() => {
    if (tab === 'users' && user?.role !== 'ADMIN') setTab('dashboard');
  }, [tab, user?.role]);

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard />;
      case 'users':     return user.role === 'ADMIN' ? <UserManagement /> : null;
      case 'rooms':     return <RoomManagement />;
      case 'packages':  return <PackageManagement />;
      case 'sessions':  return <SessionManagement />;
      case 'bookings':  return <BookingManagement />;
      default:          return <Dashboard />;
    }
  };

  return (
    // admin-root scopes all admin CSS classes — does not affect Home page
    <div ref={rootRef} className="admin-root" style={{ display: 'flex', minHeight: '100vh', background: t.bg }}>
      <Sidebar active={tab} setActive={setTab} />

      <main
        key={tab}
        className="anim-fade-in"
        style={{ flex: 1, padding: '30px 34px', overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}
      >
        {renderPage()}
      </main>

      {/* Dot-grid texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(${mode === 'dark' ? 'rgba(196,162,99,0.025)' : 'rgba(154,114,48,0.04)'} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
    </div>
  );
}

function AdminApp() {
  useEffect(() => {
    const styleId = 'admin-stylesheet';
    let linkEl = document.getElementById(styleId) as HTMLLinkElement | null;
    let created = false;

    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = styleId;
      linkEl.rel = 'stylesheet';
      linkEl.href = new URL('./styles.css', import.meta.url).href;
      document.head.appendChild(linkEl);
      created = true;
    }

    return () => {
      if (created && linkEl?.parentNode) {
        linkEl.parentNode.removeChild(linkEl);
      }
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
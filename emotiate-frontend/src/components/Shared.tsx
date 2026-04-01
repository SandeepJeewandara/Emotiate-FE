import React, { ReactNode } from 'react';
import type { NotifItem, NotifType } from '../hooks';
import { useTheme } from '../context/ThemeContext';

// ─── SVG Icon ─────────────────────────────────────────────────────────────────
interface IcoProps {
  d: string | string[];
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  className?: string;
}
export function Ico({ d, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 1.8, className }: IcoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0 }}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

// ─── Icon paths ───────────────────────────────────────────────────────────────
export const IC = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75','M9 7a4 4 0 100 8 4 4 0 000-8z'],
  rooms:     ['M3 10.5V19a2 2 0 002 2h14a2 2 0 002-2v-8.5','M3 10.5L12 3l9 7.5','M9 22V12h6v10'],
  packages:  'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  chat:      'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  bookings:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  logout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  plus:      'M12 5v14M5 12h14',
  edit:      'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:     'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  x:         'M6 18L18 6M6 6l12 12',
  check:     'M5 13l4 4L19 7',
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  eyeOff:    ['M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24','M1 1l22 22'],
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  alert:     ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
  ban:       'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun:       ['M12 2v2','M12 20v2','M4.93 4.93l1.41 1.41','M17.66 17.66l1.41 1.41','M2 12h2','M20 12h2','M6.34 17.66l-1.41 1.41','M19.07 4.93l-1.41 1.41','M12 8a4 4 0 100 8 4 4 0 000-8z'],
  img:       'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  refresh:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  arrowRight:'M5 12h14M12 5l7 7-7 7',
  tag:       'M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z',
  revenue:   ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M12 6v6l4 2'],
  clock:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
export function ELLogo({ size = 34, textSize = 14 }: { size?: number; textSize?: number }) {
  const { t } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="16.5" stroke={t.gold} strokeWidth="1.1" />
        <path d="M9.5 25.5 L18 9.5 L26.5 25.5" stroke={t.gold} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 20 L23 20" stroke={t.gold} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="18" cy="9.5" r="1.4" fill={t.gold} />
      </svg>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: textSize, fontWeight: 600, color: t.goldLight, letterSpacing: '0.04em', lineHeight: 1.1 }}>
          Emerald Lagoon
        </div>
        <div style={{ fontSize: 9.5, color: t.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}>
          Admin Portal
        </div>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid rgba(196,162,99,0.2)',
      borderTopColor: 'rgba(196,162,99,0.8)',
      borderRadius: '50%',
      animation: 'spinSlow 0.65s linear infinite',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

// ─── Notification stack ───────────────────────────────────────────────────────
interface NotifProps { items: NotifItem[]; remove: (id: number) => void; }
export function NotifStack({ items, remove }: NotifProps) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((n) => (
        <div key={n.id} className={`el-notif el-notif-${n.type}`} onClick={() => remove(n.id)}>
          <Ico d={n.type === 'success' ? IC.check : n.type === 'error' ? IC.x : IC.alert} size={14} />
          {n.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  wide?:    boolean;
  maxWidth?:number;
}
export function Modal({ title, onClose, children, wide, maxWidth }: ModalProps) {
  const { t } = useTheme();
  return (
    <div className="el-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="el-modal" style={{ width: maxWidth ?? (wide ? 680 : 480) }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 26px', borderBottom: `1px solid ${t.border}`,
        }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: t.goldLight }}>
            {title}
          </span>
          <button className="btn-ghost" style={{ padding: '5px 8px', borderRadius: 8 }} onClick={onClose}>
            <Ico d={IC.x} size={15} />
          </button>
        </div>
        <div style={{ padding: '22px 26px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
interface ConfirmProps {
  msg:       string;
  onConfirm: () => void;
  onCancel:  () => void;
  danger?:   boolean;
}
export function Confirm({ msg, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className="el-overlay">
      <div className="el-modal anim-scale-in" style={{ width: 380, padding: 28, textAlign: 'center' }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
        }}>
          <Ico d={IC.alert} size={22} stroke="#f87171" />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
          Confirm Action
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 22, lineHeight: 1.5 }}>{msg}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-ghost" style={{ padding: '9px 22px' }} onClick={onCancel}>Cancel</button>
          <button className="btn-danger" style={{ padding: '9px 22px' }} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
interface FieldProps {
  label:    string;
  error?:   string;
  children: ReactNode;
  half?:    boolean;
  required?:boolean;
}
export function Field({ label, error, children, half, required }: FieldProps) {
  return (
    <div style={{ flex: half ? '1 1 45%' : '1 1 100%', minWidth: half ? 170 : 'auto' }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <div className="err-msg">
          <Ico d={IC.alert} size={11} stroke="#f87171" />{error}
        </div>
      )}
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  action?:   ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 600, color: 'var(--gold-light)', lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label:   string;
  value:   string | number;
  icon:    string | string[];
  sub?:    string;
  color?:  string;
  delay?:  string;
  onClick?:() => void;
}
export function StatCard({ label, value, icon, sub, color, delay = '', onClick }: StatCardProps) {
  const c = color || 'var(--gold)';
  return (
    <div
      className={`stat-card anim-fade-up ${delay}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{
          width: 31, height: 31, borderRadius: 9,
          background: `${c}18`, border: `1px solid ${c}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ico d={icon} size={14} stroke={c} />
        </div>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ msg = 'No records found' }: { msg?: string }) {
  return (
    <tr>
      <td colSpan={99} style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>◇</div>
        <div style={{ fontSize: 14 }}>{msg}</div>
      </td>
    </tr>
  );
}

// ─── Status badge helper ─────────────────────────────────────────────────────
export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-active', COMPLETED: 'badge-completed', ABORTED: 'badge-aborted',
    PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', CANCELLED: 'badge-cancelled',
    NO_SHOW: 'badge-no-show', ADMIN: 'badge-admin', STAFF: 'badge-staff', GUEST: 'badge-guest',
    true: 'badge-active', false: 'badge-inactive',
  };
  return (
    <span className={`badge ${map[String(value)] ?? 'badge-inactive'}`}>
      {String(value).replace('_', ' ')}
    </span>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
interface ChartTipProps { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string; }
export function ChartTip({ active, payload, label }: ChartTipProps) {
  const { t } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.modalBg, border: `1px solid ${t.border}`,
      borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: t.shadow,
    }}>
      <div style={{ color: t.muted, marginBottom: 6, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export function LoadingRows({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '12px 14px' }}>
              <div style={{
                height: 14, borderRadius: 6,
                background: 'linear-gradient(90deg, var(--border) 0%, var(--card-hover) 50%, var(--border) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                width: j === 0 ? '60%' : j === cols - 1 ? '40%' : '75%',
              }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export const fmt    = (n: number)  => new Intl.NumberFormat('en-LK').format(n);
export const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtTime = (s?: string) => s ? new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

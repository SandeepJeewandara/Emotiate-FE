import { useEffect, useState, useCallback } from 'react';
import { chatApi, bookingApi, roomApi, packageApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, StatCard, Spinner, fmt, fmtDate, fmtTime,
  Ico, IC, StatusBadge,
} from '../components/Shared';
import type {
  NegotiationSessionResponseDto,
  BookingResponseDto,
  RoomResponseDto,
  PackageResponseDto,
  ResponseTimeStatsDto,
} from '../types';

function formatResponseTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';

  const roundedSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function BookingCalendar({ bookings }: { bookings: BookingResponseDto[] }) {
  const { t } = useTheme();
  const year = 2026, month = 2;
  const days = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const booked = new Set<number>();
  bookings.forEach((b) => {
    if (!b.checkInDate) return;
    let d = new Date(b.checkInDate);
    const end = new Date(b.checkOutDate);
    while (d <= end) {
      if (d.getMonth() === month && d.getFullYear() === year) booked.add(d.getDate());
      d.setDate(d.getDate() + 1);
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: t.goldLight }}>March 2026</span>
        <span style={{ fontSize: 11, color: t.muted, letterSpacing: '0.04em' }}>BOOKING CALENDAR</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10.5, color: t.muted, padding: '3px 0', fontWeight: 700, letterSpacing: '0.04em' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const isToday = d === 19;
          const hasB = booked.has(d);
          return (
            <div key={d} style={{
              width: '100%', aspectRatio: '1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 7, fontSize: 12, cursor: 'default', transition: 'all 0.15s',
              background: isToday
                ? `${t.gold}3A`
                : hasB ? `${t.gold}18` : 'transparent',
              border: isToday
                ? `1px solid ${t.gold}66`
                : hasB ? `1px solid ${t.gold}28` : '1px solid transparent',
              color: isToday ? t.goldLight : hasB ? t.gold : t.text,
              fontWeight: isToday ? 700 : hasB ? 600 : 400,
            }}>
              {d}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: t.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: `${t.gold}36`, border: `1px solid ${t.gold}38`, display: 'inline-block' }} />Booked
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: `${t.gold}6A`, display: 'inline-block' }} />Today
        </span>
      </div>
    </div>
  );
}

type HeroCard = {
  id: string;
  label: string;
  value: string;
  sub: string;
  accent: 'gold' | 'blue' | 'emerald';
  chips?: { label: string; value: string | number }[];
};

export function Dashboard() {
  const { t } = useTheme();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<NegotiationSessionResponseDto[]>([]);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [rooms, setRooms] = useState<RoomResponseDto[]>([]);
  const [packages, setPackages] = useState<PackageResponseDto[]>([]);
  const [responseTimeStats, setResponseTimeStats] = useState<ResponseTimeStatsDto>({
    averageResponseTimeMs: 0,
    totalReplies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sess, book, room, pkg, responseTime] = await Promise.all([
        chatApi.getAllSessions().catch(() => [] as NegotiationSessionResponseDto[]),
        bookingApi.getAll().catch(() => [] as BookingResponseDto[]),
        roomApi.getAll().catch(() => [] as RoomResponseDto[]),
        packageApi.getAll().catch(() => [] as PackageResponseDto[]),
        chatApi.getResponseTimeStats().catch(() => ({ averageResponseTimeMs: 0, totalReplies: 0 })),
      ]);
      setSessions(sess);
      setBookings(book);
      setRooms(room);
      setPackages(pkg);
      setResponseTimeStats(responseTime);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = sessions.filter((s) => s.status === 'ACTIVE').length;
  const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
  const aborted = sessions.filter((s) => s.status === 'ABORTED').length;
  const totalBook = bookings.length;
  const availRoom = rooms.filter((r) => r.isActive).length;
  const activePkg = packages.filter((p) => p.isActive).length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const confirmedBookingCount = confirmedBookings.length;
  const revenue = confirmedBookings.reduce((a, b) => a + b.totalPrice, 0);
  const convRate = sessions.length ? Math.round((completed / sessions.length) * 100) : 0;
  const hasTrackedReplies = responseTimeStats.totalReplies > 0;
  const avgResponseTimeLabel = '3';

  const stats = [
    { label: 'Guest Sessions', value: sessions.length, icon: IC.users, delay: 'delay-1' },
    { label: 'Conversion Rate', value: `${convRate}%`, icon: IC.check, color: '#4ade80', sub: `${completed} of ${sessions.length} sessions`, delay: 'delay-2' },
    { label: 'Active Sessions', value: active, icon: IC.chat, color: '#60a5fa', delay: 'delay-3' },
    { label: 'Completed Sessions', value: completed, icon: IC.check, color: '#4ade80', delay: 'delay-4' },
    { label: 'Aborted Sessions', value: aborted, icon: IC.ban, color: '#f87171', delay: 'delay-5' },
    { label: 'Total Bookings', value: totalBook, icon: IC.bookings, delay: 'delay-6' },
    { label: 'Available Rooms', value: availRoom, icon: IC.rooms, sub: `of ${rooms.length} total`, delay: 'delay-7' },
    { label: 'Active Packages', value: activePkg, icon: IC.packages, sub: `of ${packages.length} total`, delay: 'delay-8' },
  ];

  const heroCards: HeroCard[] = [
    {
      id: 'revenue',
      label: 'Revenue (Confirmed)',
      value: `LKR ${fmt(revenue)}`,
      sub: confirmedBookingCount
        ? `${confirmedBookingCount} confirmed booking${confirmedBookingCount === 1 ? '' : 's'}`
        : 'Awaiting your next confirmed booking',
      accent: 'gold',
    },
    {
      id: 'response-time',
      label: 'Avg. Response Time',
      value: avgResponseTimeLabel,
      sub: hasTrackedReplies
        ? `Across ${responseTimeStats.totalReplies} agent repl${responseTimeStats.totalReplies === 1 ? 'y' : 'ies'}`
        : 'No tracked agent replies yet',
      accent: 'blue',
      chips: hasTrackedReplies ? [{ label: 'Replies tracked', value: responseTimeStats.totalReplies }] : undefined,
    },
    {
      id: 'session-pulse',
      label: 'Session Pulse',
      value: `${active} active`,
      sub: `Completed ${completed} Â· Aborted ${aborted}`,
      accent: 'emerald',
      chips: [
        { label: 'Completed', value: completed },
        { label: 'Aborted', value: aborted },
      ],
    },
  ];

  const sessionStats = stats.slice(0, 5);
  const opsStats = stats.slice(5);
  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12, color: t.muted }}>
        <Spinner size={20} /> Loading dashboard...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
        <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>
        <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={load}>
          <Ico d={IC.refresh} size={13} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <PageHeader
        title="Welcome to Emerald Lagoon"
        subtitle="Here's everything happening at Emerald Lagoon."
        action={
          <button className="btn-ghost" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={load}>
            <Ico d={IC.refresh} size={13} /> Refresh
          </button>
        }
      />

      <section className="dashboard-hero">
        {heroCards.map((card) => (
          <article key={card.id} className={`dashboard-hero__card dashboard-hero__card--${card.accent}`}>
            <span className="dashboard-hero__label">{card.label}</span>
            <div className="dashboard-hero__value">{card.value}</div>
            <p className="dashboard-hero__sub">{card.sub}</p>
            {card.chips && (
              <div className="dashboard-hero__chips">
                {card.chips.map((chip) => (
                  <span className="hero-chip" key={`${card.id}-${chip.label}`}>
                    {chip.label}
                    <strong>{chip.value}</strong>
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="dashboard-section el-card">
        <div className="dashboard-section__head">
          <div>
            <h3>Session Metrics</h3>
            <p>Live overview of guest negotiation health.</p>
          </div>
          <span className="dashboard-section__pill">Sessions</span>
        </div>
        <div className="stat-grid">
          {sessionStats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section className="dashboard-section el-card">
        <div className="dashboard-section__head">
          <div>
            <h3>Operations Snapshot</h3>
            <p>Inventory health across rooms, packages, and bookings.</p>
          </div>
          <span className="dashboard-section__pill">Inventory</span>
        </div>
        <div className="stat-grid stat-grid--compact">
          {opsStats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      <div className="dashboard-split">
        <div className="el-card dashboard-split__primary">
          <div className="dashboard-section__head">
            <div>
              <h3>Active Negotiations</h3>
              <p>Sessions currently underway with guests.</p>
            </div>
          </div>
          {activeSessions.length === 0 ? (
            <div className="dashboard-empty">No active sessions right now</div>
          ) : (
            <div className="dashboard-table">
              <table className="el-table">
                <thead>
                  <tr>
                    {['Session ID', 'Guest', 'Round', 'Offered Price', 'Started', 'Status'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.slice(0, 5).map((s) => (
                    <tr key={s.id}>
                      <td style={{ color: t.gold, fontFamily: 'monospace', fontSize: 12 }}>{s.sessionId}</td>
                      <td style={{ fontWeight: 500 }}>{s.guestName}</td>
                      <td style={{ color: t.muted }}>#{s.currentRound}</td>
                      <td style={{ color: '#4ade80', fontWeight: 600 }}>
                        {s.offeredPrice ? `LKR ${fmt(s.offeredPrice)}` : '-'}
                      </td>
                      <td style={{ color: t.muted, fontSize: 12 }}>
                        {fmtDate(s.startedAt)} {fmtTime(s.startedAt)}
                      </td>
                      <td><StatusBadge value={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="el-card dashboard-split__side">
          <BookingCalendar bookings={bookings} />
        </div>
      </div>
    </div>
  );
}

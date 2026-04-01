import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { chatApi, bookingApi, roomApi, packageApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, StatCard, ChartTip, Spinner, fmt, fmtDate, fmtTime,
  Ico, IC, StatusBadge,
} from '../components/Shared';
import type {
  NegotiationSessionResponseDto,
  BookingResponseDto,
  RoomResponseDto,
  PackageResponseDto,
  ResponseTimeStatsDto,
} from '../types';

// Generate day-wise mock data (last 30 days)
function buildDayData(bookings: BookingResponseDto[], sessions: NegotiationSessionResponseDto[]) {
  const today = new Date(2026, 2, 19);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const ds = d.toISOString().slice(0, 10);
    const sess = sessions.filter((s) => s.startedAt?.startsWith(ds)).length;
    const book = bookings.filter((b) => b.createdAt?.startsWith(ds)).length;
    const seed = (d.getDate() * 7 + d.getMonth() * 3) % 8;
    return {
      day: label,
      sessions: sess + seed,
      bookings: book + Math.max(0, seed - 3),
    };
  });
}

function formatResponseTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';

  const roundedSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// Booking calendar (March 2026)
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
  const revenue = bookings.filter((b) => b.status === 'CONFIRMED').reduce((a, b) => a + b.totalPrice, 0);
  const convRate = sessions.length ? Math.round((completed / sessions.length) * 100) : 0;
  const dayData = buildDayData(bookings, sessions);
  const hasTrackedReplies = responseTimeStats.totalReplies > 0;
  const avgResponseTimeLabel = formatResponseTime(responseTimeStats.averageResponseTimeMs);

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
    <div>
      <PageHeader
        title={`Good day, ${user?.firstName ?? 'there'} `}
        subtitle="Here's everything happening at Emerald Lagoon."
        action={
          <button className="btn-ghost" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={load}>
            <Ico d={IC.refresh} size={13} /> Refresh
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="anim-fade-up delay-1" style={{
          background: `linear-gradient(135deg, ${t.gold}1A 0%, ${t.gold}08 100%)`,
          border: `1px solid ${t.gold}30`, borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
            Revenue from Confirmed Bookings
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, color: t.goldLight }}>
            LKR {fmt(revenue)}
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 5 }}>
            {bookings.filter((b) => b.status === 'CONFIRMED').length} confirmed bookings
          </div>
        </div>
        <div className="anim-fade-up delay-2" style={{
          background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
            Avg. Response Time
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>
            {avgResponseTimeLabel}
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 5 }}>
            {hasTrackedReplies
              ? `Across ${responseTimeStats.totalReplies} agent repl${responseTimeStats.totalReplies === 1 ? 'y' : 'ies'}`
              : 'No tracked agent replies yet'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 288px', gap: 14, marginBottom: 14 }}>
        <div className="el-card anim-fade-up delay-3" style={{ padding: '20px 22px' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: t.goldLight, marginBottom: 4 }}>
            Customer Growth
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>
            Daily sessions vs bookings - last 30 days
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={dayData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.gold} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={t.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${t.border}`} />
              <XAxis
                dataKey="day"
                tick={{ fill: t.muted, fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval={4}
              />
              <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend
                formatter={(v) => (
                  <span style={{ fontSize: 11.5, color: t.muted, fontFamily: "'Syne', sans-serif" }}>{v}</span>
                )}
              />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke={t.gold} strokeWidth={2} fill="url(#gs)" dot={false} />
              <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#60a5fa" strokeWidth={2} fill="url(#gb)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="el-card anim-fade-up delay-4" style={{ padding: '20px 18px' }}>
          <BookingCalendar bookings={bookings} />
        </div>
      </div>

      <div className="el-card anim-fade-up delay-5" style={{ padding: '18px 22px' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: t.goldLight, marginBottom: 14 }}>
          Active Negotiations
        </div>
        {sessions.filter((s) => s.status === 'ACTIVE').length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: t.muted, fontSize: 13 }}>
            No active sessions right now
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="el-table">
              <thead>
                <tr>
                  {['Session ID', 'Guest', 'Round', 'Offered Price', 'Started', 'Status'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.filter((s) => s.status === 'ACTIVE').slice(0, 5).map((s) => (
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
    </div>
  );
}

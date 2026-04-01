import React, { useState, useEffect, useCallback } from 'react';
import { bookingApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useNotif } from '../hooks';
import {
  PageHeader, Modal, Confirm, StatusBadge, EmptyState,
  LoadingRows, NotifStack, Ico, IC, Spinner, fmt, fmtDate, StatCard,
} from '../components/Shared';
import type { BookingResponseDto, BookingStatus } from '../types';

const STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'];
const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING:   '#fbbf24',
  CONFIRMED: '#4ade80',
  CANCELLED: '#f87171',
  NO_SHOW:   '#fb923c',
};

export function BookingManagement() {
  const { t } = useTheme();
  const notif = useNotif();

  const [bookings,  setBookings]  = useState<BookingResponseDto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'ALL' | BookingStatus>('ALL');
  const [detail,    setDetail]    = useState<BookingResponseDto | null>(null);
  const [confirm,   setConfirm]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setBookings(await bookingApi.getAll()); }
    catch (e: unknown) { notif.push(e instanceof Error ? e.message : 'Failed to load bookings', 'error'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const ms = b.reference.toLowerCase().includes(q)
      || (b.packageName ?? '').toLowerCase().includes(q)
      || (b.roomNumber ?? '').toLowerCase().includes(q);
    const mf = filter === 'ALL' || b.status === filter;
    return ms && mf;
  });

  // Note: The API does not expose a status-update endpoint in the reference,
  // so status changes are local until a PUT endpoint is available.
  const updateStatus = (id: number, status: BookingStatus) => {
    setBookings((p) => p.map((b) => b.id === id ? { ...b, status } : b));
    notif.push(`Booking ${status.toLowerCase().replace('_', ' ')}`);
    setDetail(null);
  };

  const remove = async (id: number) => {
    try {
      await bookingApi.remove(id);
      setBookings((p) => p.filter((b) => b.id !== id));
      notif.push('Booking deleted', 'info');
    } catch (e: unknown) {
      notif.push(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
    setConfirm(null);
  };

  const revenue = bookings.filter((b) => b.status === 'CONFIRMED').reduce((a, b) => a + b.totalPrice, 0);

  return (
    <>
      <NotifStack items={notif.items} remove={notif.remove} />

      <PageHeader
        title="Booking Management"
        subtitle="View and manage all hotel reservations."
        action={
          <button className="btn-ghost" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={load}>
            <Ico d={IC.refresh} size={13} /> Refresh
          </button>
        }
      />

      {/* Stat cards (click to filter) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {STATUSES.map((s, i) => (
          <StatCard
            key={s}
            label={s.replace('_', ' ')}
            value={bookings.filter((b) => b.status === s).length}
            icon={IC.bookings}
            color={STATUS_COLORS[s]}
            delay={`delay-${i + 1}` as 'delay-1'}
            onClick={() => setFilter(filter === s ? 'ALL' : s)}
          />
        ))}
        <StatCard
          label="Total Revenue"
          value={`LKR ${fmt(revenue)}`}
          icon={IC.revenue}
          color="var(--gold)"
          delay="delay-5"
        />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }}>
            <Ico d={IC.search} size={14} />
          </div>
          <input className="el-search" placeholder="Search reference, room, package…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
        </div>
        <button className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>ALL</button>
        {STATUSES.map((s) => (
          <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(filter === s ? 'ALL' : s)}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="el-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="el-table">
            <thead>
              <tr>
                {['Reference','Room','Package','Check-in','Check-out','Nights','Guests','Total','Status','Actions'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRows cols={10} /> : filtered.length === 0 ? <EmptyState msg="No bookings found" /> : (
                filtered.map((b, i) => (
                  <tr key={b.id} className={`anim-fade-up delay-${Math.min(i + 1, 8) as 1}`}>
                    <td>
                      <span style={{ color: t.gold, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{b.reference}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>#{b.roomNumber}</td>
                    <td style={{ color: t.muted, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.packageName || '—'}
                    </td>
                    <td style={{ color: t.muted, whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(b.checkInDate)}</td>
                    <td style={{ color: t.muted, whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(b.checkOutDate)}</td>
                    <td style={{ color: t.muted }}>{b.totalNights}n</td>
                    <td style={{ color: t.muted }}>{b.guestCount ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: '#4ade80', whiteSpace: 'nowrap' }}>LKR {fmt(b.totalPrice)}</td>
                    <td><StatusBadge value={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12 }} onClick={() => setDetail(b)}>
                          Details
                        </button>
                        <button className="btn-danger" style={{ padding: '4px 7px' }} onClick={() => setConfirm(b.id)}>
                          <Ico d={IC.trash} size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <Modal title={`Booking — ${detail.reference}`} onClose={() => setDetail(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {([
              ['Reference',       detail.reference,                           true],
              ['Room',            `#${detail.roomNumber}`,                    false],
              ['Package',         detail.packageName || '—',                  false],
              ['Check-in',        fmtDate(detail.checkInDate),                false],
              ['Check-out',       fmtDate(detail.checkOutDate),               false],
              ['Nights',          String(detail.totalNights),                 false],
              ['Guests',          String(detail.guestCount ?? '—'),           false],
              ['Price / Night',   `LKR ${fmt(detail.offeredPricePerNight)}`,  false],
              ['Total Price',     `LKR ${fmt(detail.totalPrice)}`,            false],
              ['Session ID',      detail.sessionId || '—',                   true],
              ['Created',         fmtDate(detail.createdAt),                  false],
            ] as [string, string, boolean][]).map(([k, v, mono]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 12.5, color: t.muted }}>{k}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  fontFamily: mono ? 'monospace' : 'inherit',
                  color: k === 'Total Price' ? '#4ade80' : t.text,
                }}>
                  {v}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0' }}>
              <span style={{ fontSize: 12.5, color: t.muted }}>Status</span>
              <StatusBadge value={detail.status} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            {detail.status === 'PENDING' && (
              <button className="btn-gold" style={{ padding: '8px 16px' }} onClick={() => updateStatus(detail.id, 'CONFIRMED')}>
                Confirm Booking
              </button>
            )}
            {detail.status !== 'CANCELLED' && detail.status !== 'NO_SHOW' && (
              <button className="btn-danger" style={{ padding: '8px 16px' }} onClick={() => updateStatus(detail.id, 'CANCELLED')}>
                Cancel Booking
              </button>
            )}
            {detail.status === 'CONFIRMED' && (
              <button className="btn-ghost" style={{ padding: '8px 16px' }} onClick={() => updateStatus(detail.id, 'NO_SHOW')}>
                Mark No-Show
              </button>
            )}
          </div>
        </Modal>
      )}

      {confirm !== null && (
        <Confirm
          msg="Permanently delete this booking? This action cannot be undone."
          onConfirm={() => remove(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

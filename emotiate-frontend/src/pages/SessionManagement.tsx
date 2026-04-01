import React, { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useNotif } from '../hooks';
import {
  PageHeader, Confirm, StatusBadge, EmptyState,
  LoadingRows, NotifStack, Ico, IC, Spinner, fmt, fmtDate, fmtTime, StatCard,
} from '../components/Shared';
import type { NegotiationSessionResponseDto } from '../types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'ABORTED';

export function SessionManagement() {
  const { t } = useTheme();
  const notif = useNotif();

  const [sessions,  setSessions]  = useState<NegotiationSessionResponseDto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<StatusFilter>('ALL');
  const [confirm,   setConfirm]   = useState<{ type: 'abort' | 'delete'; id: number; sessionId: string } | null>(null);
  const [acting,    setActing]    = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSessions(await chatApi.getAllSessions()); }
    catch (e: unknown) { notif.push(e instanceof Error ? e.message : 'Failed to load sessions', 'error'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const ms = s.guestName.toLowerCase().includes(q) || s.sessionId.toLowerCase().includes(q);
    const mf = filter === 'ALL' || s.status === filter;
    return ms && mf;
  });

  const abort = async (id: number, sessionId: string) => {
    setActing(id);
    try {
      const upd = await chatApi.abortSession(sessionId);
      setSessions((p) => p.map((s) => s.id === id ? upd : s));
      notif.push('Session aborted', 'info');
    } catch (e: unknown) {
      notif.push(e instanceof Error ? e.message : 'Abort failed', 'error');
    } finally { setActing(null); setConfirm(null); }
  };

  const complete = async (id: number, sessionId: string) => {
    setActing(id);
    try {
      const upd = await chatApi.completeSession(sessionId);
      setSessions((p) => p.map((s) => s.id === id ? upd : s));
      notif.push('Session completed');
    } catch (e: unknown) {
      notif.push(e instanceof Error ? e.message : 'Complete failed', 'error');
    } finally { setActing(null); }
  };

  const deleteSession = async (id: number) => {
    try {
      await chatApi.deleteSession(id);
      setSessions((p) => p.filter((s) => s.id !== id));
      notif.push('Session deleted', 'info');
    } catch (e: unknown) {
      notif.push(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
    setConfirm(null);
  };

  const counts = {
    ACTIVE:    sessions.filter((s) => s.status === 'ACTIVE').length,
    COMPLETED: sessions.filter((s) => s.status === 'COMPLETED').length,
    ABORTED:   sessions.filter((s) => s.status === 'ABORTED').length,
  };
  const convRate = sessions.length
    ? Math.round((counts.COMPLETED / sessions.length) * 100)
    : 0;

  return (
    <>
      <NotifStack items={notif.items} remove={notif.remove} />

      <PageHeader
        title="Chat Sessions"
        subtitle="Monitor and manage guest negotiation sessions."
        action={
          <button className="btn-ghost" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={load}>
            <Ico d={IC.refresh} size={13} /> Refresh
          </button>
        }
      />

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Active"    value={counts.ACTIVE}    icon={IC.chat}     color="#60a5fa" delay="delay-1" onClick={() => setFilter('ACTIVE')} />
        <StatCard label="Completed" value={counts.COMPLETED} icon={IC.check}    color="#4ade80" delay="delay-2" onClick={() => setFilter('COMPLETED')} />
        <StatCard label="Aborted"   value={counts.ABORTED}   icon={IC.ban}      color="#f87171" delay="delay-3" onClick={() => setFilter('ABORTED')} />
        <StatCard label="Conv. Rate" value={`${convRate}%`}  icon={IC.arrowRight} color="var(--gold)" delay="delay-4" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }}>
            <Ico d={IC.search} size={14} />
          </div>
          <input className="el-search" placeholder="Search guest name, session ID…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
        </div>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'ABORTED'] as StatusFilter[]).map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="el-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="el-table">
            <thead>
              <tr>
                {['Session ID', 'Guest', 'Round', 'Offered Price', 'Started', 'Last Update', 'Status', 'Actions'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRows cols={8} /> : filtered.length === 0 ? <EmptyState msg="No sessions found" /> : (
                filtered.map((s, i) => (
                  <tr key={s.id} className={`anim-fade-up delay-${Math.min(i + 1, 8) as 1}`}>
                    <td>
                      <span style={{ color: t.gold, fontFamily: 'monospace', fontSize: 12 }}>{s.sessionId}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{s.guestName}</td>
                    <td style={{ color: t.muted }}>#{s.currentRound}</td>
                    <td style={{ color: '#4ade80', fontWeight: 600 }}>
                      {s.offeredPrice ? `LKR ${fmt(s.offeredPrice)}` : '—'}
                    </td>
                    <td style={{ color: t.muted, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fmtDate(s.startedAt)}<br />{fmtTime(s.startedAt)}
                    </td>
                    <td style={{ color: t.muted, fontSize: 12 }}>{fmtTime(s.updatedAt)}</td>
                    <td><StatusBadge value={s.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                        {s.status === 'ACTIVE' && (
                          <>
                            <button
                              className="btn-blue"
                              style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => complete(s.id, s.sessionId)}
                              disabled={acting === s.id}
                            >
                              {acting === s.id ? <Spinner size={11} /> : null}
                              Complete
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => setConfirm({ type: 'abort', id: s.id, sessionId: s.sessionId })}
                            >
                              Abort
                            </button>
                          </>
                        )}
                        <button
                          className="btn-danger"
                          style={{ padding: '4px 8px' }}
                          onClick={() => setConfirm({ type: 'delete', id: s.id, sessionId: s.sessionId })}
                        >
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

      {/* Confirm dialogs */}
      {confirm?.type === 'abort' && (
        <Confirm
          msg={`Abort session ${confirm.sessionId}? The guest will be notified.`}
          onConfirm={() => abort(confirm.id, confirm.sessionId)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'delete' && (
        <Confirm
          msg="Permanently delete this session and all its chat history? This cannot be undone."
          onConfirm={() => deleteSession(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

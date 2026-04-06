import { useState, useEffect, useCallback } from 'react';
import { ApiError, userApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotif } from '../hooks';
import {
  PageHeader, Modal, Confirm, Field, StatusBadge, EmptyState,
  LoadingRows, NotifStack, Ico, IC, Spinner,
} from '../components/Shared';
import type { UserResponseDto, UserAddRequestDto, UserUpdateRequestDto } from '../types';

type UserRole = 'ADMIN' | 'STAFF' | 'GUEST';

interface LocalUser extends UserResponseDto {
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  isActive: boolean;
}

interface Errors { [k: string]: string | undefined; }

const ROLES: UserRole[] = ['ADMIN', 'STAFF', 'GUEST'];

function isUnauthorizedError(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return true;
    if (err.status === 404 && /unauthor|forbidden|access denied/i.test(err.message)) return true;
  }

  return err instanceof Error && /unauthor|forbidden|access denied/i.test(err.message);
}

function normalizeRole(value: unknown): UserRole {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'ADMIN' || raw === 'ROLE_ADMIN') return 'ADMIN';
  if (raw === 'STAFF' || raw === 'ROLE_STAFF') return 'STAFF';
  if (raw === 'GUEST' || raw === 'ROLE_GUEST') return 'GUEST';
  return 'GUEST';
}

function toLocalUser(rawUser: unknown): LocalUser {
  const u = (rawUser ?? {}) as Record<string, unknown>;
  const firstName = String(u.firstName ?? u.name ?? u.username ?? 'User');
  const lastName = u.lastName == null ? undefined : String(u.lastName);
  const username = String(u.username ?? 'unknown');
  const email = String(u.email ?? '-');
  const phoneNumber = u.phoneNumber == null ? undefined : String(u.phoneNumber);
  const roleSource = u.role ?? u.userRole ?? u.roleName;
  const isActive = u.isActive == null ? true : Boolean(u.isActive);

  return {
    id: Number(u.id ?? 0),
    firstName,
    lastName,
    username,
    email,
    phoneNumber,
    role: normalizeRole(roleSource),
    isActive,
  };
}

const blank = (): FormState => ({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 'GUEST',
  isActive: true,
});

export function UserManagement() {
  const { t } = useTheme();
  const { logout } = useAuth();
  const notif = useNotif();

  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | UserRole>('ALL');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(blank());
  const [errs, setErrs] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getAll({ isActive: true });
      setUsers((data as unknown[]).map(toLocalUser));
    } catch (e: unknown) {
      if (isUnauthorizedError(e)) {
        logout();
        return;
      }
      notif.push(e instanceof Error ? e.message : 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [logout, notif.push]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    if (!u.isActive) return false;
    const q = search.toLowerCase();
    const matchesSearch = u.firstName.toLowerCase().includes(q)
      || u.username.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q);
    const matchesFilter = filter === 'ALL' || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  const activeUsers = users.filter((u) => u.isActive).length;
  const adminUsers = users.filter((u) => u.isActive && u.role === 'ADMIN').length;
  const staffUsers = users.filter((u) => u.isActive && u.role === 'STAFF').length;
  const guestUsers = users.filter((u) => u.isActive && u.role === 'GUEST').length;

  const sf = (k: keyof FormState, v: string | boolean) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrs((p) => ({ ...p, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.username.trim()) e.username = 'Required';
    else if (!/^[a-z0-9._]+$/.test(form.username)) e.username = 'Lowercase, digits, . _ only';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (modal === 'add' && !form.password) e.password = 'Required';
    if (modal === 'add' && form.password && form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.role) e.role = 'Required';
    return e;
  };

  const openAdd = () => {
    setForm(blank());
    setErrs({});
    setModal('add');
  };

  const openEdit = (u: LocalUser) => {
    setForm({
      firstName: u.firstName,
      lastName: u.lastName ?? '',
      username: u.username,
      email: u.email,
      phoneNumber: u.phoneNumber ?? '',
      password: '',
      role: normalizeRole(u.role),
      isActive: u.isActive ?? true,
    });
    setEditId(u.id);
    setErrs({});
    setModal('edit');
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrs(e);
      return;
    }

    setSaving(true);
    try {
      if (modal === 'add') {
        const dto: UserAddRequestDto = { ...form };
        const created = await userApi.add(dto);
        setUsers((p) => [...p, toLocalUser(created)]);
        notif.push('User created successfully');
      } else if (editId !== null) {
        const dto: UserUpdateRequestDto = {
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          username: form.username || undefined,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          password: form.password || undefined,
          role: form.role || undefined,
          isActive: form.isActive,
        };
        const updated = await userApi.edit(editId, dto);
        setUsers((p) => p.map((u) => (u.id === editId ? toLocalUser({ ...u, ...updated }) : u)));
        notif.push('User updated');
      }
      setModal(null);
    } catch (err: unknown) {
      if (isUnauthorizedError(err)) {
        logout();
        return;
      }
      notif.push(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await userApi.remove(id);
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, isActive: false } : u)));
      notif.push('User deactivated', 'info');
    } catch (err: unknown) {
      if (isUnauthorizedError(err)) {
        logout();
        return;
      }
      notif.push(err instanceof Error ? err.message : 'Remove failed', 'error');
    }
    setConfirm(null);
  };

  return (
    <>
      <NotifStack items={notif.items} remove={notif.remove} />

      <PageHeader
        title="User Management"
        subtitle="Manage system accounts, role distribution, and access status for the admin workspace."
        eyebrow="Admin Access"
        action={
          <button className="btn-gold" style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 7 }} onClick={openAdd}>
            <Ico d={IC.plus} size={14} /> Add User
          </button>
        }
      />

      <section className="metric-strip">
        <article className="metric-strip__item">
          <div className="metric-strip__label">Admins</div>
          <div className="metric-strip__value">{adminUsers}</div>
          <div className="metric-strip__sub">Highest-permission accounts</div>
        </article>
        <article className="metric-strip__item">
          <div className="metric-strip__label">Staff</div>
          <div className="metric-strip__value">{staffUsers}</div>
          <div className="metric-strip__sub">Operational team members</div>
        </article>
        <article className="metric-strip__item">
          <div className="metric-strip__label">Guests</div>
          <div className="metric-strip__value">{guestUsers}</div>
          <div className="metric-strip__sub">Guest-facing accounts</div>
        </article>
      </section>

      <div className="page-toolbar">
        <div className="page-toolbar__search">
          <div className="page-toolbar__search-icon">
            <Ico d={IC.search} size={14} />
          </div>
          <input
            className="el-search"
            placeholder="Search name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="page-toolbar__filters">
          {(['ALL', ...ROLES] as const).map((r) => (
            <button key={r} className={`tab-btn ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>{r}</button>
          ))}
        </div>
      </div>

      <section className="el-card content-card">
        <div className="content-card__head">
          <div>
            <h3>Account Directory</h3>
            <p>Review active accounts, contact details, and permission levels at a glance.</p>
          </div>
          <span className="content-card__pill">{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="el-table">
            <thead>
              <tr>
                {['Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRows cols={7} />
              ) : filtered.length === 0 ? (
                <EmptyState msg="No users match your search" />
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id} className={`anim-fade-up delay-${Math.min(i + 1, 8) as 1}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: `${t.gold}18`,
                          border: `1px solid ${t.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: t.gold,
                          flexShrink: 0,
                        }}>
                          {u.firstName[0]}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td style={{ color: t.gold, fontFamily: 'monospace', fontSize: 12.5 }}>@{u.username}</td>
                    <td style={{ color: t.muted }}>{u.email}</td>
                    <td style={{ color: t.muted }}>{u.phoneNumber || '-'}</td>
                    <td><StatusBadge value={u.role ?? 'GUEST'} /></td>
                    <td><StatusBadge value={String(u.isActive ?? true)} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost" style={{ padding: '5px 9px' }} onClick={() => openEdit(u)}>
                          <Ico d={IC.edit} size={13} />
                        </button>
                        <button className="btn-danger" style={{ padding: '5px 9px' }} onClick={() => setConfirm(u.id)}>
                          <Ico d={IC.trash} size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <Modal title={modal === 'add' ? 'Add New User' : 'Edit User'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Field label="First Name" half required error={errs.firstName}>
              <input className="el-input" value={form.firstName} onChange={(e) => sf('firstName', e.target.value)} />
            </Field>
            <Field label="Last Name" half>
              <input className="el-input" value={form.lastName} onChange={(e) => sf('lastName', e.target.value)} />
            </Field>
            <Field label="Username" half required error={errs.username}>
              <input className="el-input" value={form.username} onChange={(e) => sf('username', e.target.value.toLowerCase())} />
            </Field>
            <Field label="Email" half required error={errs.email}>
              <input className="el-input" type="email" value={form.email} onChange={(e) => sf('email', e.target.value)} />
            </Field>
            <Field label="Phone Number" half>
              <input className="el-input" value={form.phoneNumber} onChange={(e) => sf('phoneNumber', e.target.value)} />
            </Field>
            <Field label={modal === 'add' ? 'Password' : 'New Password (blank = keep)'} half required={modal === 'add'} error={errs.password}>
              <input className="el-input" type="password" value={form.password} onChange={(e) => sf('password', e.target.value)} />
            </Field>
            <Field label="Role" half required error={errs.role}>
              <select className="el-input" value={form.role} onChange={(e) => sf('role', e.target.value)}>
                <option value="">Select role</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status" half>
              <select className="el-input" value={form.isActive ? 'true' : 'false'} onChange={(e) => sf('isActive', e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
            <button className="btn-ghost" style={{ padding: '9px 20px' }} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-gold" style={{ padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 7 }} onClick={save} disabled={saving}>
              {saving ? <><Spinner size={13} /> Saving...</> : modal === 'add' ? 'Add User' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {confirm !== null && (
        <Confirm
          msg="Deactivate this user? They will no longer be able to log in."
          onConfirm={() => remove(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

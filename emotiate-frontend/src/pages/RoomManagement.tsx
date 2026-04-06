import { useState, useEffect, useCallback } from 'react';
import { roomApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useNotif } from '../hooks';
import {
  PageHeader, Modal, Confirm, Field, StatusBadge, EmptyState,
  LoadingRows, NotifStack, Ico, IC, Spinner,
} from '../components/Shared';
import type { RoomResponseDto, RoomAddRequestDto, RoomUpdateRequestDto } from '../types';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'DELUXE', 'SUITE', 'FAMILY'] as const;

interface FormState {
  roomNumber: string;
  floor: string;
  roomType: string;
  description: string;
  maxOccupancy: string;
  isActive: boolean;
}

interface Errors { [k: string]: string | undefined; }

const blank = (): FormState => ({
  roomNumber: '',
  floor: '',
  roomType: '',
  description: '',
  maxOccupancy: '',
  isActive: true,
});

export function RoomManagement() {
  const { t } = useTheme();
  const notif = useNotif();

  const [rooms, setRooms] = useState<RoomResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | typeof ROOM_TYPES[number]>('ALL');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(blank());
  const [errs, setErrs] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRooms(await roomApi.getAll());
    } catch (e: unknown) {
      notif.push(e instanceof Error ? e.message : 'Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  }, [notif.push]);

  useEffect(() => { load(); }, [load]);

  const filtered = rooms.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = r.roomNumber.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    const matchesFilter = filter === 'ALL'
      ? true
      : filter === 'ACTIVE'
        ? r.isActive
        : r.roomType === filter;
    return matchesSearch && matchesFilter;
  });

  const activeRooms = rooms.filter((r) => r.isActive).length;
  const inactiveRooms = rooms.length - activeRooms;
  const averageOccupancy = rooms.length
    ? (rooms.reduce((sum, room) => sum + room.maxOccupancy, 0) / rooms.length).toFixed(1)
    : '0.0';

  const sf = (k: keyof FormState, v: string | boolean) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrs((p) => ({ ...p, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.roomNumber.trim()) e.roomNumber = 'Required';
    if (!form.floor || +form.floor < 1) e.floor = 'Must be >= 1';
    if (!form.roomType) e.roomType = 'Required';
    if (!form.maxOccupancy || +form.maxOccupancy < 1) e.maxOccupancy = 'Must be >= 1';
    return e;
  };

  const openAdd = () => {
    setForm(blank());
    setErrs({});
    setModal('add');
  };

  const openEdit = (r: RoomResponseDto) => {
    setForm({
      roomNumber: r.roomNumber,
      floor: String(r.floor),
      roomType: r.roomType,
      description: r.description ?? '',
      maxOccupancy: String(r.maxOccupancy),
      isActive: r.isActive,
    });
    setEditId(r.id);
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
        const dto: RoomAddRequestDto = {
          roomNumber: form.roomNumber,
          floor: +form.floor,
          roomType: form.roomType,
          description: form.description,
          maxOccupancy: +form.maxOccupancy,
        };
        const created = await roomApi.add(dto);
        setRooms((p) => [...p, created]);
        notif.push('Room added');
      } else if (editId !== null) {
        const dto: RoomUpdateRequestDto = {
          roomNumber: form.roomNumber || undefined,
          floor: +form.floor || undefined,
          roomType: form.roomType || undefined,
          description: form.description || undefined,
          maxOccupancy: +form.maxOccupancy || undefined,
          isActive: form.isActive,
        };
        const upd = await roomApi.edit(editId, dto);
        setRooms((p) => p.map((r) => (r.id === editId ? upd : r)));
        notif.push('Room updated');
      }
      setModal(null);
    } catch (err: unknown) {
      notif.push(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await roomApi.remove(id);
      setRooms((p) => p.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
      notif.push('Room deactivated', 'info');
    } catch (err: unknown) {
      notif.push(err instanceof Error ? err.message : 'Remove failed', 'error');
    }
    setConfirm(null);
  };

  return (
    <>
      <NotifStack items={notif.items} remove={notif.remove} />

      <PageHeader
        title="Room Management"
        subtitle="Manage room inventory, availability, and guest capacity across the property."
        eyebrow="Inventory"
        action={
          <button className="btn-gold" style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 7 }} onClick={openAdd}>
            <Ico d={IC.plus} size={14} /> Add Room
          </button>
        }
      />

      <section className="metric-strip">
        <article className="metric-strip__item">
          <div className="metric-strip__label">Active Rooms</div>
          <div className="metric-strip__value">{activeRooms}</div>
          <div className="metric-strip__sub">Currently bookable inventory</div>
        </article>
        <article className="metric-strip__item">
          <div className="metric-strip__label">Inactive</div>
          <div className="metric-strip__value">{inactiveRooms}</div>
          <div className="metric-strip__sub">Hidden from booking selection</div>
        </article>
        <article className="metric-strip__item">
          <div className="metric-strip__label">Avg. Capacity</div>
          <div className="metric-strip__value">{averageOccupancy}</div>
          <div className="metric-strip__sub">Guests per room on average</div>
        </article>
      </section>

      <div className="page-toolbar">
        <div className="page-toolbar__search">
          <div className="page-toolbar__search-icon">
            <Ico d={IC.search} size={14} />
          </div>
          <input className="el-search" placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div className="page-toolbar__filters">
          {(['ALL', 'ACTIVE', ...ROOM_TYPES] as const).map((f) => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <section className="el-card content-card">
        <div className="content-card__head">
          <div>
            <h3>Room Directory</h3>
            <p>Track floor placement, room type, and occupancy capacity in one clean table.</p>
          </div>
          <span className="content-card__pill">{filtered.length} rooms</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="el-table">
            <thead>
              <tr>
                {['Room No.', 'Floor', 'Type', 'Description', 'Max Occ.', 'Status', 'Actions'].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRows cols={7} /> : filtered.length === 0 ? <EmptyState msg="No rooms found" /> : (
                filtered.map((r, i) => (
                  <tr key={r.id} className={`anim-fade-up delay-${Math.min(i + 1, 8) as 1}`}>
                    <td>
                      <span style={{ fontWeight: 700, color: t.gold, fontFamily: "'Fraunces', serif", fontSize: 15 }}>
                        #{r.roomNumber}
                      </span>
                    </td>
                    <td style={{ color: t.muted }}>Floor {r.floor}</td>
                    <td><StatusBadge value={r.roomType} /></td>
                    <td style={{ color: t.muted, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description || '-'}
                    </td>
                    <td style={{ color: t.muted }}>{r.maxOccupancy} guests</td>
                    <td><StatusBadge value={String(r.isActive)} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost" style={{ padding: '5px 9px' }} onClick={() => openEdit(r)}>
                          <Ico d={IC.edit} size={13} />
                        </button>
                        <button className="btn-danger" style={{ padding: '5px 9px' }} onClick={() => setConfirm(r.id)}>
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
        <Modal title={modal === 'add' ? 'Add New Room' : 'Edit Room'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Field label="Room Number" half required error={errs.roomNumber}>
              <input className="el-input" value={form.roomNumber} onChange={(e) => sf('roomNumber', e.target.value)} />
            </Field>
            <Field label="Floor" half required error={errs.floor}>
              <input className="el-input" type="number" min="1" value={form.floor} onChange={(e) => sf('floor', e.target.value)} />
            </Field>
            <Field label="Room Type" half required error={errs.roomType}>
              <select className="el-input" value={form.roomType} onChange={(e) => sf('roomType', e.target.value)}>
                <option value="">Select type</option>
                {ROOM_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </Field>
            <Field label="Max Occupancy" half required error={errs.maxOccupancy}>
              <input className="el-input" type="number" min="1" value={form.maxOccupancy} onChange={(e) => sf('maxOccupancy', e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea className="el-input" rows={2} value={form.description} onChange={(e) => sf('description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
            {modal === 'edit' && (
              <Field label="Status" half>
                <select className="el-input" value={form.isActive ? 'true' : 'false'} onChange={(e) => sf('isActive', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
            <button className="btn-ghost" style={{ padding: '9px 20px' }} onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-gold" style={{ padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 7 }} onClick={save} disabled={saving}>
              {saving ? <><Spinner size={13} /> Saving...</> : modal === 'add' ? 'Add Room' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {confirm !== null && (
        <Confirm
          msg="Deactivate this room? It will be hidden from booking options."
          onConfirm={() => remove(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

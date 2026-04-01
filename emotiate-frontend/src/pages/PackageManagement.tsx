import { useState, useEffect, useCallback } from 'react';
import { packageApi, roomApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useNotif } from '../hooks';
import {
  PageHeader, Modal, Confirm, Field, StatusBadge, NotifStack,
  Ico, IC, Spinner, fmt,
} from '../components/Shared';
import type { PackageResponseDto, PackageAddRequestDto, PackageUpdateRequestDto, RoomResponseDto } from '../types';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'DELUXE', 'SUITE', 'FAMILY'] as const;
const ADDONS = [
  'BREAKFAST','LUNCH','DINNER','FULL_BOARD',
  'SPA','POOL_ACCESS','AIRPORT_TRANSFER','LATE_CHECKOUT','EARLY_CHECKIN',
] as const;

interface FormState {
  name:            string;
  description:     string;
  roomId:          string;
  lowerBoundPrice: string;
  upperBoundPrice: string;
  maxOccupancy:    string;
  addOns:          string[];
  imageUrl:        string;
  isActive:        boolean;
}
interface Errors { [k: string]: string | undefined; }
const blank = (): FormState => ({
  name: '', description: '', roomId: '', lowerBoundPrice: '',
  upperBoundPrice: '', maxOccupancy: '', addOns: [], imageUrl: '', isActive: true,
});

export function PackageManagement() {
  const { t } = useTheme();
  const notif = useNotif();

  const [packages, setPackages] = useState<PackageResponseDto[]>([]);
  const [rooms,    setRooms]    = useState<RoomResponseDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<'ALL' | 'ACTIVE' | typeof ROOM_TYPES[number]>('ALL');
  const [modal,    setModal]    = useState<'add' | 'edit' | 'view' | null>(null);
  const [confirm,  setConfirm]  = useState<number | null>(null);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [viewPkg,  setViewPkg]  = useState<PackageResponseDto | null>(null);
  const [form,     setForm]     = useState<FormState>(blank());
  const [errs,     setErrs]     = useState<Errors>({});
  const [saving,   setSaving]   = useState(false);
  const [imgErr,   setImgErr]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgs, rms] = await Promise.all([packageApi.getAll(), roomApi.getAll({ isActive: true })]);
      setPackages(pkgs); setRooms(rms);
    } catch (e: unknown) {
      notif.push(e instanceof Error ? e.message : 'Failed to load', 'error');
    } finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const filtered = packages.filter((p) => {
    const q = search.toLowerCase();
    const ms = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const mf = filter === 'ALL' ? true : filter === 'ACTIVE' ? p.isActive : p.roomType === filter;
    return ms && mf;
  });

  const sf = (k: keyof FormState, v: string | boolean | string[]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrs((p) => ({ ...p, [k]: undefined }));
  };
  const toggleAddon = (a: string) =>
    sf('addOns', form.addOns.includes(a) ? form.addOns.filter((x) => x !== a) : [...form.addOns, a]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.roomId)      e.roomId = 'Select a room';
    if (!form.lowerBoundPrice || +form.lowerBoundPrice < 1) e.lowerBoundPrice = 'Required';
    if (!form.upperBoundPrice || +form.upperBoundPrice < 1) e.upperBoundPrice = 'Required';
    if (+form.upperBoundPrice < +form.lowerBoundPrice) e.upperBoundPrice = 'Must be ≥ lower bound';
    if (!form.maxOccupancy || +form.maxOccupancy < 1) e.maxOccupancy = 'Required';
    return e;
  };

  const openAdd = () => { setForm(blank()); setErrs({}); setImgErr(false); setModal('add'); };
  const openEdit = (p: PackageResponseDto) => {
    setForm({
      name: p.name, description: p.description ?? '',
      roomId: String(p.roomId), lowerBoundPrice: String(p.lowerBoundPrice),
      upperBoundPrice: String(p.upperBoundPrice), maxOccupancy: String(p.maxOccupancy),
      addOns: [...p.addOns], imageUrl: p.imageUrl ?? '', isActive: p.isActive,
    });
    setEditId(p.id); setErrs({}); setImgErr(false); setModal('edit');
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrs(e);
    setSaving(true);
    try {
      if (modal === 'add') {
        const dto: PackageAddRequestDto = {
          name: form.name, description: form.description,
          roomId: +form.roomId, lowerBoundPrice: +form.lowerBoundPrice,
          upperBoundPrice: +form.upperBoundPrice, maxOccupancy: +form.maxOccupancy,
          addOns: form.addOns, imageUrl: form.imageUrl,
        };
        const created = await packageApi.add(dto);
        setPackages((p) => [...p, created]);
        notif.push('Package created');
      } else if (editId !== null) {
        const dto: PackageUpdateRequestDto = {
          name: form.name || undefined, description: form.description || undefined,
          roomId: +form.roomId || undefined, lowerBoundPrice: +form.lowerBoundPrice || undefined,
          upperBoundPrice: +form.upperBoundPrice || undefined, maxOccupancy: +form.maxOccupancy || undefined,
          addOns: form.addOns, imageUrl: form.imageUrl || undefined, isActive: form.isActive,
        };
        const upd = await packageApi.edit(editId, dto);
        setPackages((p) => p.map((pk) => pk.id === editId ? upd : pk));
        notif.push('Package updated');
      }
      setModal(null);
    } catch (err: unknown) {
      notif.push(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    try {
      await packageApi.remove(id);
      setPackages((p) => p.map((pk) => pk.id === id ? { ...pk, isActive: false } : pk));
      notif.push('Package deactivated', 'info');
    } catch (err: unknown) {
      notif.push(err instanceof Error ? err.message : 'Remove failed', 'error');
    }
    setConfirm(null);
  };

  const ADDON_FORM = (
    <Field label="Add-ons">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
        {ADDONS.map((a) => {
          const sel = form.addOns.includes(a);
          return (
            <button key={a} type="button" onClick={() => toggleAddon(a)} style={{
              padding: '4px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              transition: 'all 0.15s',
              background: sel ? `${t.gold}28` : 'transparent',
              border: `1px solid ${sel ? t.gold : t.border}`,
              color: sel ? t.gold : t.muted,
              fontFamily: "'Syne', sans-serif",
            }}>
              {a.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>
    </Field>
  );

  return (
    <>
      <NotifStack items={notif.items} remove={notif.remove} />

      <PageHeader
        title="Package Management"
        subtitle="Create and manage hotel packages with rooms and add-ons."
        action={
          <button className="btn-gold" style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 7 }} onClick={openAdd}>
            <Ico d={IC.plus} size={14} /> Add Package
          </button>
        }
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }}>
            <Ico d={IC.search} size={14} />
          </div>
          <input className="el-search" placeholder="Search packages…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%' }} />
        </div>
        {(['ALL', 'ACTIVE', ...ROOM_TYPES] as const).map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Card grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: t.muted, gap: 10 }}>
          <Spinner size={18} /> Loading packages…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: t.muted }}>No packages found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((p, i) => (
            <div key={p.id} className={`el-card anim-fade-up delay-${Math.min(i + 1, 8) as 1}`} style={{ overflow: 'hidden' }}>
              {/* Image */}
              <div style={{ position: 'relative', height: 155 }}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="pkg-img-placeholder">
                    <Ico d={IC.img} size={34} stroke={t.faint} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <StatusBadge value={String(p.isActive)} />
                </div>
              </div>

              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: t.goldLight, marginBottom: 4 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 10, lineHeight: 1.45 }}>
                  {p.description}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <StatusBadge value={p.roomType} />
                  <span style={{ fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    Room #{p.roomNumber}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: t.text, fontSize: 13 }}>
                    LKR {fmt(p.lowerBoundPrice)} – {fmt(p.upperBoundPrice)}
                  </span>
                  <span style={{ fontSize: 12, color: t.muted }}>Max {p.maxOccupancy}</span>
                </div>

                {p.addOns.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {p.addOns.slice(0, 4).map((a) => (
                      <span key={a} style={{
                        fontSize: 10.5, padding: '2px 8px', borderRadius: 20,
                        background: `${t.gold}10`, border: `1px solid ${t.border}`, color: t.muted,
                      }}>
                        {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {p.addOns.length > 4 && <span style={{ fontSize: 11, color: t.muted }}>+{p.addOns.length - 4}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 7 }}>
                  <button className="btn-ghost" style={{ flex: 1, padding: '6px 10px', fontSize: 12.5 }} onClick={() => { setViewPkg(p); setModal('view'); }}>
                    Details
                  </button>
                  <button className="btn-ghost" style={{ padding: '6px 9px' }} onClick={() => openEdit(p)}>
                    <Ico d={IC.edit} size={13} />
                  </button>
                  <button className="btn-danger" style={{ padding: '6px 9px' }} onClick={() => setConfirm(p.id)}>
                    <Ico d={IC.trash} size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {modal === 'view' && viewPkg && (
        <Modal title={viewPkg.name} onClose={() => setModal(null)} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              {viewPkg.imageUrl ? (
                <img src={viewPkg.imageUrl} alt={viewPkg.name} style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
              ) : (
                <div className="pkg-img-placeholder" style={{ marginBottom: 12, height: 180 }}>
                  <Ico d={IC.img} size={36} stroke={t.faint} />
                </div>
              )}
              <p style={{ fontSize: 13.5, color: t.muted, lineHeight: 1.6 }}>{viewPkg.description}</p>
            </div>
            <div>
              {[
                ['Room', `#${viewPkg.roomNumber} — ${viewPkg.roomType}`],
                ['Price Range', `LKR ${fmt(viewPkg.lowerBoundPrice)} – ${fmt(viewPkg.upperBoundPrice)}`],
                ['Max Occupancy', `${viewPkg.maxOccupancy} guests`],
                ['Status', viewPkg.isActive ? 'Active' : 'Inactive'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${t.border}` }}>
                  <span style={{ fontSize: 12.5, color: t.muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: t.muted, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Add-ons</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewPkg.addOns.length > 0
                    ? viewPkg.addOns.map((a) => (
                        <span key={a} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `${t.gold}14`, border: `1px solid ${t.border}`, color: t.gold }}>
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))
                    : <span style={{ color: t.muted, fontSize: 13 }}>No add-ons</span>}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add New Package' : 'Edit Package'} onClose={() => setModal(null)} wide>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Field label="Package Name" required error={errs.name}>
              <input className="el-input" value={form.name} onChange={(e) => sf('name', e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea className="el-input" rows={2} value={form.description} onChange={(e) => sf('description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
            <Field label="Room" half required error={errs.roomId}>
              <select className="el-input" value={form.roomId} onChange={(e) => sf('roomId', e.target.value)}>
                <option value="">Select room</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>#{r.roomNumber} — {r.roomType}</option>)}
              </select>
            </Field>
            <Field label="Max Occupancy" half required error={errs.maxOccupancy}>
              <input className="el-input" type="number" min="1" value={form.maxOccupancy} onChange={(e) => sf('maxOccupancy', e.target.value)} />
            </Field>
            <Field label="Lower Bound Price (LKR)" half required error={errs.lowerBoundPrice}>
              <input className="el-input" type="number" min="0" value={form.lowerBoundPrice} onChange={(e) => sf('lowerBoundPrice', e.target.value)} />
            </Field>
            <Field label="Upper Bound Price (LKR)" half required error={errs.upperBoundPrice}>
              <input className="el-input" type="number" min="0" value={form.upperBoundPrice} onChange={(e) => sf('upperBoundPrice', e.target.value)} />
            </Field>
            <Field label="Package Image URL">
              <input
                className="el-input"
                placeholder="https://…"
                value={form.imageUrl}
                onChange={(e) => {
                  setImgErr(false);
                  sf('imageUrl', e.target.value);
                }}
              />
              {form.imageUrl && !imgErr && (
                <img src={form.imageUrl} alt="" style={{ marginTop: 8, height: 80, width: '100%', borderRadius: 8, objectFit: 'cover', border: `1px solid ${t.border}` }}
                  onError={() => setImgErr(true)} />
              )}
            </Field>
            {ADDON_FORM}
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
              {saving ? <><Spinner size={13} /> Saving…</> : modal === 'add' ? 'Add Package' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {confirm !== null && (
        <Confirm
          msg="Deactivate this package? Guests will no longer see it."
          onConfirm={() => remove(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

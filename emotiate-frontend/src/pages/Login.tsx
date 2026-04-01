import React, { useState } from 'react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ico, IC, Spinner } from '../components/Shared';
import logo from '../assets/logos/logo-icon.png';
import type { AuthUser } from '../types';

interface FormState { username: string; password: string; }
interface Errors    { username?: string; password?: string; general?: string; }

export function LoginPage() {
  const { login }  = useAuth();
  const { t, mode, toggle } = useTheme();
  const [form,    setForm]    = useState<FormState>({ username: '', password: '' });
  const [errors,  setErrors]  = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const sf = (k: keyof FormState, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined, general: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.username.trim())    e.username = 'Username is required';
    if (!form.password)           e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true);
    try {
      const res: { token: string; userId: number; username: string; role: 'ADMIN' | 'STAFF' | 'GUEST' } =
        await authApi.login({ username: form.username.trim(), password: form.password });
      const user: AuthUser = {
        ...res,
        firstName: form.username.trim().charAt(0).toUpperCase() + form.username.trim().slice(1),
      };
      login(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  const isLight = mode === 'light';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: t.bg,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background geometry */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(${isLight ? 'rgba(154,114,48,0.06)' : 'rgba(196,162,99,0.04)'} 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${isLight ? 'rgba(154,114,48,0.08)' : 'rgba(196,162,99,0.07)'} 0%, transparent 70%)`,
        top: '5%', left: '10%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${isLight ? 'rgba(154,114,48,0.06)' : 'rgba(167,139,250,0.04)'} 0%, transparent 70%)`,
        bottom: '10%', right: '8%', pointerEvents: 'none',
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
          color: t.muted, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontFamily: "'Manrope', sans-serif", transition: 'all 0.2s',
        }}
      >
        <Ico d={mode === 'dark' ? IC.sun : IC.moon} size={14} stroke={t.muted} />
        {mode === 'dark' ? 'Light' : 'Dark'}
      </button>

      {/* Card */}
      <div className="anim-scale-in" style={{
        background:    t.modalBg,
        border:        `1px solid ${t.border}`,
        borderRadius:  22,
        padding:       '42px 38px',
        width:         420,
        boxShadow:     `0 40px 90px ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.7)'}`,
        backdropFilter:'blur(20px)',
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img
            src={logo}
            alt="Emerald Lagoon"
            style={{
              height: 76,
              width: 'auto',
              margin: '0 auto 14px',
              display: 'block',
              objectFit: 'contain',
            }}
          />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 600, color: t.goldLight, letterSpacing: '0.03em' }}>
            Emerald Lagoon
          </div>
          <div style={{ fontSize: 11.5, color: t.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
            User Portal
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: t.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Username
            </label>
            <input
              className="el-input"
              placeholder="Enter username"
              value={form.username}
              onChange={(e) => sf('username', e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
            />
            {errors.username && (
              <div className="err-msg">
                <Ico d={IC.alert} size={11} stroke="#f87171" />{errors.username}
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: t.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="el-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => sf('password', e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: 11, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: t.muted, padding: 2, display: 'flex', alignItems: 'center',
                }}
              >
                <Ico d={showPw ? IC.eyeOff : IC.eye} size={15} stroke={t.muted} />
              </button>
            </div>
            {errors.password && (
              <div className="err-msg">
                <Ico d={IC.alert} size={11} stroke="#f87171" />{errors.password}
              </div>
            )}
          </div>

          {/* General error */}
          {errors.general && (
            <div style={{
              padding: '10px 14px', borderRadius: 9,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.22)',
              color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Ico d={IC.alert} size={13} stroke="#f87171" />
              {errors.general}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-gold"
            onClick={submit}
            disabled={loading}
            style={{
              padding: '12px', marginTop: 4, borderRadius: 11, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><Spinner size={15} /> Signing in…</> : 'Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
}

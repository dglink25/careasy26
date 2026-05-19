import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import Logo from '../components/Logo';
import theme from '../config/theme';
import SEOHead from '../components/SEOHead';
import api from '../api/axios';
import {
  FaEye, FaEyeSlash, FaGoogle, FaTimes,
  FaEnvelope, FaPhone, FaLock, FaCheckCircle, FaArrowLeft
} from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';

// ─── Constantes ───────────────────────────────────────────────────────────────
const STEP_CONTACT = 'contact';   // Saisie email ou téléphone
const STEP_OTP     = 'otp';       // Vérification OTP
const STEP_PROFILE = 'profile';   // Nom + mot de passe

// ─── Composant OTP 6 cases ────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);

  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) {
        inputs.current[i - 1]?.focus();
      }
      const arr = value.split('');
      arr[i] = '';
      onChange(arr.join(''));
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) { inputs.current[i - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return; }
  };

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    if (!val) return;
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = val;
    const next = arr.join('').replace(/ /g, '');
    onChange(next);
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, ' ').trim());
      const idx = Math.min(pasted.length, 5);
      inputs.current[idx]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }} onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          style={{
            width: 48,
            height: 58,
            textAlign: 'center',
            fontSize: '1.6rem',
            fontWeight: 800,
            border: `2px solid ${value[i] ? theme.colors.primary : theme.colors.primaryLight}`,
            borderRadius: 10,
            outline: 'none',
            backgroundColor: value[i] ? '#fff5f5' : '#fff',
            color: theme.colors.primary,
            transition: 'all 0.2s',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
            fontFamily: 'monospace',
          }}
          onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`; }}
          onBlur={e =>  { e.target.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Register({ isModal = false, onClose }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { register } = useAuth();
  const { openModal } = useModal();

  // ── État global ──────────────────────────────────────────────────────────
  const [step,         setStep]         = useState(STEP_CONTACT);
  const [regMethod,    setRegMethod]    = useState('email'); // 'email' | 'phone'
  const [identifier,   setIdentifier]   = useState('');      // email ou téléphone saisi
  const [verifyToken,  setVerifyToken]  = useState('');      // token après OTP validé
  const [maskedContact,setMaskedContact]= useState('');      // ex: jea***@gmail.com

  // ── Étape Contact ────────────────────────────────────────────────────────
  const [contError,   setContError]   = useState('');
  const [contLoading, setContLoading] = useState(false);

  // ── Étape OTP ────────────────────────────────────────────────────────────
  const [otp,          setOtp]          = useState('');
  const [otpError,     setOtpError]     = useState('');
  const [otpLoading,   setOtpLoading]   = useState(false);
  const [resendTimer,  setResendTimer]  = useState(0);
  const [resendLoading,setResendLoading]= useState(false);

  // ── Étape Profil ─────────────────────────────────────────────────────────
  const [name,              setName]              = useState('');
  const [password,          setPassword]          = useState('');
  const [passwordConfirm,   setPasswordConfirm]   = useState('');
  const [showPwd,           setShowPwd]           = useState(false);
  const [showPwdC,          setShowPwdC]          = useState(false);
  const [profError,         setProfError]         = useState('');
  const [profLoading,       setProfLoading]        = useState(false);
  const [fieldErrors,       setFieldErrors]       = useState({});
  const [success,           setSuccess]           = useState('');

  // ── Timer renvoi ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1 : envoyer l'OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setContError('');

    // Validation rapide côté client
    const clean = identifier.trim();
    if (!clean) {
      setContError(regMethod === 'email' ? 'Entrez votre adresse email.' : 'Entrez votre numéro de téléphone.');
      return;
    }
    if (regMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setContError('Format d\'email invalide.');
      return;
    }
    if (regMethod === 'phone') {
      const digits = clean.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        setContError('Numéro invalide (8–15 chiffres).');
        return;
      }
    }

    setContLoading(true);
    try {
      const res = await api.post('/verify-contact/send', {
        identifier: clean,
        type: regMethod,
      });

      setMaskedContact(res.data.masked || clean);
      setResendTimer(res.data.resend_after || 60);
      setStep(STEP_OTP);
    } catch (err) {
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.message;

      if (code === 'ALREADY_USED') {
        setContError(msg || 'Ce contact est déjà utilisé.');
      } else if (code === 'INVALID_FORMAT') {
        setContError(msg || 'Format invalide.');
      } else if (code === 'SEND_FAILED') {
        setContError(msg || 'Impossible d\'envoyer le code. Vérifiez votre ' + (regMethod === 'email' ? 'email.' : 'numéro.'));
      } else if (code === 'RESEND_TOO_SOON') {
        setContError(msg || 'Attendez avant de renvoyer.');
        setResendTimer(err.response?.data?.wait_seconds || 60);
        setStep(STEP_OTP); // Aller quand même à l'étape OTP
      } else {
        setContError(msg || 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setContLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2 : vérifier l'OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.replace(/\s/g, '').length < 6) {
      setOtpError('Entrez les 6 chiffres du code.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);

    try {
      const res = await api.post('/verify-contact/check', {
        identifier: identifier.trim(),
        type: regMethod,
        code: otp,
      });

      setVerifyToken(res.data.verify_token);
      setOtp('');
      setStep(STEP_PROFILE);
    } catch (err) {
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.message;

      if (code === 'OTP_EXPIRED') {
        setOtpError('Code expiré. Cliquez sur « Renvoyer le code ».');
      } else if (code === 'WRONG_CODE') {
        const rem = err.response?.data?.attempts_remaining ?? '';
        setOtpError(msg || `Code incorrect${rem ? ` (${rem} essai(s) restant(s))` : ''}.`);
      } else if (code === 'MAX_ATTEMPTS') {
        setOtpError('Trop de tentatives. Demandez un nouveau code.');
      } else {
        setOtpError(msg || 'Vérification échouée. Réessayez.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Renvoi du code
  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    setOtpError('');
    setOtp('');

    try {
      const res = await api.post('/verify-contact/send', {
        identifier: identifier.trim(),
        type: regMethod,
      });
      setResendTimer(res.data.resend_after || 60);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setResendLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 3 : créer le compte
  // ─────────────────────────────────────────────────────────────────────────
  const validateProfile = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2) errs.name = 'Minimum 2 caractères.';
    if (!password) errs.password = 'Mot de passe requis.';
    else if (password.length < 8) errs.password = 'Minimum 8 caractères.';
    if (password !== passwordConfirm) errs.passwordConfirm = 'Les mots de passe ne correspondent pas.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setProfLoading(true);
    setProfError('');

    const payload = {
      name: name.trim(),
      password,
      password_confirmation: passwordConfirm,
      verify_token: verifyToken,
    };
    if (regMethod === 'email') payload.email = identifier.trim();
    else                       payload.phone = identifier.trim();

    const result = await register(payload);

    if (result.success) {
      setSuccess('Compte créé avec succès ! Redirection…');
      setTimeout(() => {
        if (isModal && onClose) onClose();
        const from = location.state?.from || '/dashboard';
        navigate(from, { state: { openContactModal: location.state?.openContactModal, selectedService: location.state?.selectedService } });
      }, 800);
    } else {
      const code = result.code;
      if (code === 'CONTACT_NOT_VERIFIED' || code === 'VERIFY_TOKEN_EXPIRED') {
        setProfError('La vérification a expiré. Recommencez.');
        setTimeout(() => { setStep(STEP_CONTACT); setOtp(''); setVerifyToken(''); }, 2000);
      } else {
        setProfError(result.message || 'Une erreur est survenue.');
      }
    }
    setProfLoading(false);
  };

  // ── Helpers Google ────────────────────────────────────────────────────────
  const handleGoogle = () => {
    const apiUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8000';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleLoginClick = () => {
    if (isModal && onClose) { setTimeout(() => openModal('login'), 50); }
    else navigate('/login', { state: location.state });
  };

  // ── Force mot de passe ────────────────────────────────────────────────────
  const pwdStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const pwdColors = ['', '#ef4444', '#f59e0b', theme.colors.primary, '#10b981'];
  const pwdLabels = ['', 'Très faible', 'Moyen', 'Fort', 'Très fort'];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...s.container, ...(isModal ? s.modalContainer : {}) }}>
      <SEOHead title="Inscription" noindex={true} />

      <div style={{ ...s.card, ...(isModal ? s.modalCard : {}) }}>
        {isModal && (
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer">
            <FaTimes />
          </button>
        )}

        {/* Logo + titre */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Logo size={isModal ? 'md' : 'lg'} showText />
        </div>

        {/* ── Indicateur d'étapes ── */}
        <div style={s.steps}>
          {['Contact', 'Vérification', 'Profil'].map((label, i) => {
            const stepKeys  = [STEP_CONTACT, STEP_OTP, STEP_PROFILE];
            const current   = stepKeys.indexOf(step);
            const isDone    = i < current;
            const isActive  = i === current;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    backgroundColor: isDone ? '#10b981' : isActive ? theme.colors.primary : theme.colors.primaryLight,
                    color: (isDone || isActive) ? '#fff' : theme.colors.text.secondary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.85rem',
                    transition: 'all 0.3s',
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: isActive ? theme.colors.primary : theme.colors.text.secondary, fontWeight: isActive ? 700 : 400 }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ flex: 1, height: 2, margin: '0 4px 20px', backgroundColor: isDone ? '#10b981' : theme.colors.primaryLight, transition: 'all 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ÉTAPE 1 — Contact
        ════════════════════════════════════════════════════════════════ */}
        {step === STEP_CONTACT && (
          <>
            <h2 style={s.title}>Créer un compte</h2>
            <p style={s.subtitle}>Commencez par vérifier votre contact</p>

            {/* Sélecteur Email / Téléphone */}
            <div style={s.methodSelector}>
              {[
                { key: 'email', icon: MdEmail, label: 'Email' },
                { key: 'phone', icon: MdPhone, label: 'Téléphone' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setRegMethod(key); setIdentifier(''); setContError(''); }}
                  style={{
                    ...s.methodBtn,
                    ...(regMethod === key ? s.methodBtnActive : {}),
                    borderRadius: key === 'email' ? '8px 0 0 8px' : '0 8px 8px 0',
                  }}
                >
                  <Icon style={{ fontSize: '1.2rem' }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {contError && <div style={s.errorBox}>{contError}</div>}

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={s.formGroup}>
                <label style={s.label}>
                  {regMethod === 'email' ? <FaEnvelope style={s.labelIcon} /> : <FaPhone style={s.labelIcon} />}
                  {regMethod === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
                </label>
                <input
                  type={regMethod === 'email' ? 'email' : 'tel'}
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setContError(''); }}
                  style={s.input}
                  placeholder={regMethod === 'email' ? 'votre@email.com' : '+229 01 23 45 67 89'}
                  autoFocus
                />
                {regMethod === 'phone' && (
                  <small style={{ color: theme.colors.text.secondary, fontSize: '0.78rem' }}>
                    Un code SMS / WhatsApp vous sera envoyé
                  </small>
                )}
              </div>

              <button type="submit" disabled={contLoading} style={{ ...s.btn, opacity: contLoading ? 0.7 : 1 }}>
                {contLoading ? 'Envoi du code…' : `Envoyer le code de vérification`}
              </button>
            </form>

            <div style={s.divider}><span style={s.dividerTxt}>ou</span></div>

            <button onClick={handleGoogle} style={s.googleBtn} type="button">
              <FaGoogle style={{ color: '#EA4335', fontSize: '1.2rem' }} />
              Continuer avec Google
            </button>

            <div style={s.footer}>
              <span style={{ color: theme.colors.text.secondary }}>Déjà un compte ?</span>
              <button onClick={handleLoginClick} style={s.linkBtn}>Se connecter</button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ÉTAPE 2 — OTP
        ════════════════════════════════════════════════════════════════ */}
        {step === STEP_OTP && (
          <>
            <button
              onClick={() => { setStep(STEP_CONTACT); setOtp(''); setOtpError(''); }}
              style={s.backBtn}
            >
              <FaArrowLeft style={{ marginRight: 6 }} /> Modifier
            </button>

            <h2 style={s.title}>Vérification</h2>
            <p style={s.subtitle}>
              Code envoyé à <strong style={{ color: theme.colors.primary }}>{maskedContact}</strong>
            </p>

            {/* Icône animée */}
            <div style={{ textAlign: 'center', fontSize: '3.5rem', margin: '0.5rem 0 1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
              {regMethod === 'email' ? '' : ''}
            </div>

            {otpError && <div style={s.errorBox}>{otpError}</div>}

            <OtpInput value={otp} onChange={setOtp} disabled={otpLoading} />

            <button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otp.replace(/\s/g, '').length < 6}
              style={{ ...s.btn, marginTop: '1.5rem', opacity: (otpLoading || otp.length < 6) ? 0.6 : 1 }}
            >
              {otpLoading ? 'Vérification…' : 'Confirmer le code'}
            </button>

            {/* Renvoi */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {resendTimer > 0 ? (
                <p style={{ color: theme.colors.text.secondary, fontSize: '0.875rem' }}>
                  Renvoyer dans <strong style={{ color: theme.colors.primary }}>{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.primary, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'underline' }}
                >
                  {resendLoading ? 'Envoi…' : 'Renvoyer le code'}
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: theme.colors.text.secondary, textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
              {regMethod === 'email'
                ? 'Vérifiez aussi vos spams / courriers indésirables.'
                : 'Vérifiez vos messages SMS et WhatsApp.'}
            </p>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ÉTAPE 3 — Profil
        ════════════════════════════════════════════════════════════════ */}
        {step === STEP_PROFILE && (
          <>
            <h2 style={s.title}>Finalisez votre compte</h2>
            <p style={s.subtitle}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>{' '}
              {maskedContact} vérifié
            </p>

            {success && (
              <div style={{ ...s.successBox }}>
                <FaCheckCircle style={{ color: '#10b981', marginRight: 8 }} />{success}
              </div>
            )}
            {profError && <div style={s.errorBox}>{profError}</div>}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nom */}
              <div style={s.formGroup}>
                <label style={s.label}>Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                  style={{ ...s.input, ...(fieldErrors.name ? s.inputErr : {}) }}
                  placeholder="Jean Dupont"
                  autoFocus
                />
                {fieldErrors.name && <span style={s.fieldErr}>{fieldErrors.name}</span>}
              </div>

              {/* Mot de passe */}
              <div style={s.formGroup}>
                <label style={s.label}><FaLock style={s.labelIcon} /> Mot de passe</label>
                <div style={s.pwdWrap}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                    style={{ ...s.pwdInput, ...(fieldErrors.password ? s.inputErr : {}) }}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={s.eyeBtn} tabIndex="-1">
                    {showPwd ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {password && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: theme.colors.primaryLight, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pwdStrength * 25}%`, backgroundColor: pwdColors[pwdStrength], transition: 'all 0.3s', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: pwdColors[pwdStrength], fontWeight: 600, minWidth: 70 }}>{pwdLabels[pwdStrength]}</span>
                  </div>
                )}
                {fieldErrors.password && <span style={s.fieldErr}>{fieldErrors.password}</span>}
              </div>

              {/* Confirmation */}
              <div style={s.formGroup}>
                <label style={s.label}><FaLock style={s.labelIcon} /> Confirmer le mot de passe</label>
                <div style={s.pwdWrap}>
                  <input
                    type={showPwdC ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={e => { setPasswordConfirm(e.target.value); setFieldErrors(p => ({ ...p, passwordConfirm: '' })); }}
                    style={{ ...s.pwdInput, ...(fieldErrors.passwordConfirm ? s.inputErr : {}) }}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwdC(v => !v)} style={s.eyeBtn} tabIndex="-1">
                    {showPwdC ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {fieldErrors.passwordConfirm && <span style={s.fieldErr}>{fieldErrors.passwordConfirm}</span>}
              </div>

              <button
                type="submit"
                disabled={profLoading}
                style={{ ...s.btn, opacity: profLoading ? 0.7 : 1, marginTop: '0.5rem' }}
              >
                {profLoading ? 'Création du compte…' : 'Créer mon compte '}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', backgroundColor: theme.colors.background, padding: '2rem 1rem',
  },
  modalContainer: { minHeight: 'auto', backgroundColor: 'transparent', padding: 0 },
  card: {
    backgroundColor: theme.colors.secondary, padding: '2.5rem',
    borderRadius: '1.5rem', boxShadow: theme.shadows.xl,
    width: '100%', maxWidth: 500, border: `2px solid ${theme.colors.primaryLight}`,
    position: 'relative', animation: 'fadeIn 0.4s ease',
  },
  modalCard: { maxWidth: 440, padding: '2rem' },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'none', border: 'none', cursor: 'pointer',
    color: theme.colors.text.secondary, fontSize: '1.2rem', padding: '0.4rem',
  },
  steps: { display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: theme.colors.text.primary, textAlign: 'center', marginBottom: '0.4rem' },
  subtitle: { fontSize: '0.9rem', color: theme.colors.text.secondary, textAlign: 'center', marginBottom: '1.25rem' },
  methodSelector: {
    display: 'flex', marginBottom: '1.25rem',
    border: `2px solid ${theme.colors.primaryLight}`, borderRadius: 8, overflow: 'hidden',
  },
  methodBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '0.85rem', backgroundColor: '#fff', border: 'none', cursor: 'pointer',
    fontWeight: 500, color: theme.colors.text.secondary, transition: 'all 0.2s', fontSize: '0.95rem',
  },
  methodBtnActive: { backgroundColor: theme.colors.primary, color: '#fff' },
  errorBox: {
    backgroundColor: '#fef2f2', color: theme.colors.error, padding: '0.85rem',
    borderRadius: 8, marginBottom: '1rem', border: `1px solid ${theme.colors.error}`,
    fontSize: '0.9rem', lineHeight: 1.5,
  },
  successBox: {
    backgroundColor: '#d1fae5', color: '#065f46', padding: '0.85rem',
    borderRadius: 8, marginBottom: '1rem', border: '1px solid #6ee7b7',
    fontSize: '0.9rem', display: 'flex', alignItems: 'center',
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: 600, color: theme.colors.text.primary, fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  labelIcon: { marginRight: 6, color: theme.colors.primary },
  input: {
    padding: '0.875rem', border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: 8, fontSize: '1rem', outline: 'none', width: '100%',
    transition: 'border-color 0.2s',
  },
  inputErr: { borderColor: theme.colors.error },
  fieldErr: { color: theme.colors.error, fontSize: '0.8rem' },
  pwdWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  pwdInput: {
    padding: '0.875rem', paddingRight: '3rem', border: `2px solid ${theme.colors.primaryLight}`,
    borderRadius: 8, fontSize: '1rem', outline: 'none', flex: 1, width: '100%',
  },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', background: 'none', border: 'none',
    cursor: 'pointer', color: theme.colors.text.secondary, padding: '0.3rem',
  },
  btn: {
    backgroundColor: theme.colors.primary, color: '#fff', padding: '1rem',
    border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s', boxShadow: theme.shadows.md,
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', padding: '0.9rem', backgroundColor: '#fff', color: '#4285F4',
    border: '2px solid #EA4335', borderRadius: 8, fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer',
  },
  divider: { display: 'flex', alignItems: 'center', margin: '1.25rem 0' },
  dividerTxt: {
    padding: '0 1rem', color: theme.colors.text.secondary, fontSize: '0.85rem',
    backgroundColor: theme.colors.secondary, margin: '0 auto',
  },
  footer: { marginTop: '1.25rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' },
  linkBtn: { color: theme.colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', textDecoration: 'underline' },
  backBtn: {
    display: 'flex', alignItems: 'center', background: 'none', border: 'none',
    cursor: 'pointer', color: theme.colors.text.secondary, fontSize: '0.875rem',
    marginBottom: '0.75rem', padding: 0, fontWeight: 500,
  },
};
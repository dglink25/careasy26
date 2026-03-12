// src/pages/Settings.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { userSettingsApi } from '../api/userSettingsApi';
import NotificationSettingsPanel from '../components/Settings/NotificationSettingsPanel'; // ← AJOUTÉ
import {
  FiUser, FiMail, FiLock, FiBell, FiEye, FiMoon, FiSun, FiMonitor,
  FiCamera, FiSave, FiAlertCircle, FiCheckCircle, FiX, FiSettings,
  FiShield, FiGlobe, FiPhone,
} from 'react-icons/fi';

/* ─── helper : couleurs selon le thème actuel ─── */
function useColors() {
  const { theme } = useTheme();
  return {
    bg:       'var(--bg-primary)',
    bgCard:   'var(--bg-card)',
    bgSec:    'var(--bg-secondary)',
    bgTer:    'var(--bg-tertiary)',
    text:     'var(--text-primary)',
    textSec:  'var(--text-secondary)',
    textMut:  'var(--text-muted)',
    border:   'var(--border-color)',
    brand:    'var(--brand-primary)',
    brandLt:  'var(--brand-light)',
  };
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, changeTheme } = useTheme();
  const { privacy, updatePrivacy, syncFromBackend } = usePrivacy();
  const c = useColors();
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '', email: '', phone: '', profile_photo: null, profile_photo_url: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '', new_password: '', new_password_confirmation: '',
  });
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false });
  // Plus d'état local pour privacy — on lit directement le contexte global

  useEffect(() => { loadUserData(); }, []);
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, settingsRes, notificationRes] = await Promise.all([
        userSettingsApi.getProfile(),
        userSettingsApi.getSettings(),
        userSettingsApi.getNotificationSettings(),
      ]);
      setProfileData({
        name: profileRes.user.name,
        email: profileRes.user.email,
        phone: profileRes.user.phone || '',
        profile_photo: null,
        profile_photo_url: profileRes.user.profile_photo_url,
      });
      // Synchroniser le contexte global avec les données backend
      syncFromBackend(settingsRes.settings?.privacy);
      setNotifications(notificationRes.notifications);
    } catch (e) {
      showMessage('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMessage('Photo max 5MB', 'error'); return; }
    setProfileData({ ...profileData, profile_photo: file, profile_photo_url: URL.createObjectURL(file) });
  };

  const handleDeletePhoto = async () => {
    try {
      setSaving(true);
      await userSettingsApi.deleteProfilePhoto();
      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}`;
      setProfileData({ ...profileData, profile_photo: null, profile_photo_url: fallback });
      updateUser({ ...user, profile_photo_url: fallback });
      showMessage('Photo supprimée');
    } catch { showMessage('Erreur suppression', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      if (profileData.profile_photo) await userSettingsApi.updateProfilePhoto(profileData.profile_photo);
      const res = await userSettingsApi.updateProfile({ 
        name: profileData.name, 
        phone: profileData.phone 
      });
      updateUser(res.user);
      showMessage('Profil mis à jour');
    } catch (e) {
      showMessage(e.response?.data?.message || 'Erreur', 'error');
    } finally { setSaving(false); }
  };

  const handleChangeEmail = async () => {
    const password = prompt("Entrez votre mot de passe pour confirmer :");
    if (!password) return;
    try {
      setSaving(true);
      await userSettingsApi.updateEmail(profileData.email, password);
      showMessage('Email mis à jour. Vérifiez votre boîte.');
    } catch (e) {
      showMessage(e.response?.data?.message || 'Erreur', 'error');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) { showMessage('Mot de passe actuel requis', 'error'); return; }
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showMessage('Les mots de passe ne correspondent pas', 'error'); return;
    }
    if (passwordData.new_password.length < 8) { showMessage('Minimum 8 caractères', 'error'); return; }
    try {
      setSaving(true);
      await userSettingsApi.updatePassword(
        passwordData.current_password, passwordData.new_password, passwordData.new_password_confirmation
      );
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
      showMessage('Mot de passe mis à jour ! Reconnexion...');
      setTimeout(logout, 2000);
    } catch (e) {
      const errors = e.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0];
        showMessage(Array.isArray(first) ? first[0] : first, 'error');
      } else {
        showMessage(e.response?.data?.message || 'Erreur', 'error');
      }
    } finally { setSaving(false); }
  };

  const handleThemeChange = async (newTheme) => {
    changeTheme(newTheme);
    try {
      await userSettingsApi.updateTheme(newTheme === 'system' ? 'light' : newTheme);
      showMessage('Thème mis à jour');
    } catch { /* silencieux */ }
  };

  const handleNotificationChange = async (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try {
      await userSettingsApi.updateNotificationSettings(updated);
      showMessage('Notifications mises à jour');
    } catch { showMessage('Erreur', 'error'); }
  };

  // Met à jour le contexte global EN PREMIER → Navbar et useOnlineStatus réagissent instantanément
  const handlePrivacyChange = async (key, value) => {
    const updated = { ...privacy, [key]: value };
    updatePrivacy(updated); // ← contexte global, effet immédiat partout
    try {
      await userSettingsApi.updateSettings({ privacy: updated });
      showMessage('Confidentialité mise à jour');
    } catch {
      // En cas d'erreur API, rollback
      updatePrivacy(privacy);
      showMessage('Erreur de sauvegarde', 'error');
    }
  };

  /* ── déterminer le thème "effectif" affiché ── */
  const savedRaw = localStorage.getItem('careasy-theme');
  const displayTheme = savedRaw === 'system' ? 'system' : theme;

  /* ────────────────────── styles inline ────────────────────── */
  const s = {
    page:        { minHeight: '100vh', backgroundColor: c.bg, padding: '2rem 0 4rem', color: c.text },
    wrap:        { maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' },
    header:      { marginBottom: '2rem' },
    title:       { display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '2rem', fontWeight: 800, color: c.text, marginBottom: '.5rem' },
    titleIcon:   { fontSize: '2rem', color: c.brand },
    subtitle:    { color: c.textSec, fontSize: '1rem' },

    msgBox:      (t) => ({
      display: 'flex', alignItems: 'center', gap: '.75rem',
      padding: '1rem', borderRadius: '.75rem', marginBottom: '1.5rem',
      backgroundColor: t === 'error' ? '#fee2e2' : '#d1fae5',
      color: t === 'error' ? '#dc2626' : '#059669',
      border: `1px solid ${t === 'error' ? '#fca5a5' : '#6ee7b7'}`,
    }),

    tabs:        { display: 'flex', gap: '.5rem', borderBottom: `2px solid ${c.border}`, marginBottom: '2rem', overflowX: 'auto' },
    tab:         (active) => ({
      display: 'flex', alignItems: 'center', gap: '.5rem',
      padding: '1rem 1.5rem', background: 'transparent', border: 'none',
      borderBottom: active ? `3px solid ${c.brand}` : '3px solid transparent',
      color: active ? c.brand : c.textSec,
      cursor: 'pointer', fontWeight: 600, fontSize: '.95rem',
      whiteSpace: 'nowrap', transition: 'all .2s',
    }),
    tabIcon:     { fontSize: '1.125rem' },

    panel:       { backgroundColor: c.bgCard, borderRadius: '1rem', padding: '2rem', boxShadow: 'var(--shadow-md)', border: `1px solid ${c.border}` },
    section:     { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    sectionTitle:{ fontSize: '1.5rem', fontWeight: 700, color: c.text, marginBottom: '.5rem' },

    photoWrap:   { display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem', backgroundColor: c.bgSec, borderRadius: '.75rem', border: `1px solid ${c.border}` },
    photoRel:    { position: 'relative' },
    photoImg:    { width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${c.bgCard}`, boxShadow: 'var(--shadow-md)' },
    photoCam:    { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: '50%', backgroundColor: c.brand, color: '#fff', border: `3px solid ${c.bgCard}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.125rem' },

    formGroup:   { display: 'flex', flexDirection: 'column', gap: '.5rem' },
    label:       { fontSize: '.875rem', fontWeight: 600, color: c.textSec },
    input:       { padding: '.75rem 1rem', borderRadius: '.5rem', border: `2px solid ${c.border}`, fontSize: '1rem', backgroundColor: c.bgSec, color: c.text, outline: 'none', transition: 'all .2s' },
    select:      { padding: '.75rem 1rem', borderRadius: '.5rem', border: `2px solid ${c.border}`, fontSize: '1rem', backgroundColor: c.bgSec, color: c.text, cursor: 'pointer', outline: 'none' },
    hint:        { fontSize: '.75rem', color: c.textMut },
    inputRow:    { display: 'flex', gap: '.75rem', alignItems: 'center' },

    btnPrimary:  (disabled) => ({
      backgroundColor: disabled ? '#94a3b8' : c.brand, color: '#fff', border: 'none',
      padding: '.875rem 1.5rem', borderRadius: '.75rem', cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600, fontSize: '.95rem', display: 'flex', alignItems: 'center',
      gap: '.5rem', boxShadow: 'var(--shadow-md)', transition: 'all .2s', opacity: disabled ? .7 : 1,
    }),
    btnSec:      { backgroundColor: 'transparent', color: c.brand, border: `2px solid ${c.brand}`, padding: '.625rem 1.25rem', borderRadius: '.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem' },
    btnDanger:   { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '.625rem 1.25rem', borderRadius: '.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem' },

    settingRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: c.bgSec, borderRadius: '.75rem', border: `1px solid ${c.border}` },
    settingName: { fontSize: '1rem', fontWeight: 600, color: c.text, marginBottom: '.25rem' },
    settingDesc: { fontSize: '.875rem', color: c.textSec },

    themeGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
    themeCard:   (active) => ({
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '.75rem', padding: '1.5rem', borderRadius: '.75rem', cursor: 'pointer',
      backgroundColor: active ? c.brandLt : c.bgSec,
      border: `2px solid ${active ? c.brand : c.border}`,
      color: c.text, transition: 'all .25s',
    }),
    themeIcon:   (active) => ({ fontSize: '2.5rem', color: active ? c.brand : c.textSec }),
    themeLabel:  (active) => ({ fontSize: '.95rem', fontWeight: active ? 700 : 500, color: active ? c.brand : c.text }),
    themeCheck:  { position: 'absolute', top: '.5rem', right: '.5rem', fontSize: '1.25rem', color: c.brand },
  };

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 50, height: 50, border: `4px solid ${c.border}`, borderTop: `4px solid ${c.brand}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: c.textSec }}>Chargement...</p>
      </div>
    </div>
  );

  const TABS = [
    { id: 'profile',       label: 'Profil',           Icon: FiUser },
    { id: 'security',      label: 'Sécurité',          Icon: FiLock },
    { id: 'notifications', label: 'Notifications',     Icon: FiBell },
    { id: 'appearance',    label: 'Apparence',         Icon: FiMoon },
    { id: 'privacy',       label: 'Confidentialité',   Icon: FiShield },
  ];

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.header}>
          <h1 style={s.title}><FiSettings style={s.titleIcon} /> Paramètres</h1>
          <p style={s.subtitle}>Gérez vos préférences et votre compte</p>
        </div>

        {message && (
          <div style={s.msgBox(message.type)}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            <span style={{ flex: 1, fontWeight: 600 }}>{message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.25rem' }}><FiX /></button>
          </div>
        )}

        <div style={s.tabs}>
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={s.tab(activeTab === id)}>
              <Icon style={s.tabIcon} />{label}
            </button>
          ))}
        </div>

        <div style={s.panel}>

          {/* ── PROFIL ── */}
          {activeTab === 'profile' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Informations du profil</h2>
              <div style={s.photoWrap}>
                <div style={s.photoRel}>
                  <img src={profileData.profile_photo_url} alt="profil" style={s.photoImg} />
                  <button onClick={() => fileInputRef.current?.click()} style={s.photoCam} disabled={saving}>
                    <FiCamera />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </div>
                <div>
                  <h3 style={s.settingName}>Photo de profil</h3>
                  <p style={{ ...s.settingDesc, marginBottom: '1rem' }}>JPG, PNG ou GIF. Maximum 5 MB.</p>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button onClick={() => fileInputRef.current?.click()} style={s.btnSec} disabled={saving}>Changer</button>
                    {profileData.profile_photo_url && !profileData.profile_photo_url.includes('ui-avatars') && (
                      <button onClick={handleDeletePhoto} style={s.btnDanger} disabled={saving}>Supprimer</button>
                    )}
                  </div>
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Nom complet</label>
                <input style={s.input} value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} placeholder="Votre nom" />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Adresse email</label>
                <div style={s.inputRow}>
                  <input style={{ ...s.input, flex: 1 }} type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
                  {profileData.email !== user?.email && (
                    <button onClick={handleChangeEmail} style={s.btnSec} disabled={saving}>Valider</button>
                  )}
                </div>
                <p style={s.hint}>Un email de vérification sera envoyé</p>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Téléphone</label>
                <input
                  style={s.input}
                  type="tel"
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Ex : +229 97 00 00 00"
                />
                <p style={s.hint}>Utilisé pour les confirmations de rendez-vous par SMS</p>
              </div>
              <button onClick={handleSaveProfile} style={s.btnPrimary(saving)} disabled={saving}>
                <FiSave />{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          )}

          {/* ── SÉCURITÉ ── */}
          {activeTab === 'security' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Changer le mot de passe</h2>
              {[
                { field: 'current_password', label: 'Mot de passe actuel' },
                { field: 'new_password', label: 'Nouveau mot de passe', hint: 'Minimum 8 caractères' },
                { field: 'new_password_confirmation', label: 'Confirmer le nouveau mot de passe' },
              ].map(({ field, label, hint }) => (
                <div key={field} style={s.formGroup}>
                  <label style={s.label}>{label}</label>
                  <input type="password" style={s.input} placeholder="••••••••"
                    value={passwordData[field]}
                    onChange={e => setPasswordData({ ...passwordData, [field]: e.target.value })} />
                  {hint && <p style={s.hint}>{hint}</p>}
                </div>
              ))}
              <button onClick={handleChangePassword}
                style={s.btnPrimary(saving || !passwordData.current_password || !passwordData.new_password)}
                disabled={saving || !passwordData.current_password || !passwordData.new_password}>
                <FiLock />{saving ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── MODIFIÉ AVEC NotificationSettingsPanel */}
          {activeTab === 'notifications' && (
            <NotificationSettingsPanel
              colors={c}
              notifications={notifications}
              onNotificationChange={handleNotificationChange}
            />
          )}

          {/* ── APPARENCE ── */}
          {activeTab === 'appearance' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Thème de l'interface</h2>
              <p style={{ color: c.textSec }}>Choisissez l'apparence qui vous convient. Le changement est immédiat.</p>
              <div style={s.themeGrid}>
                {[
                  { id: 'light',  label: 'Clair',   Icon: FiSun },
                  { id: 'dark',   label: 'Sombre',  Icon: FiMoon },
                  { id: 'system', label: 'Système', Icon: FiMonitor },
                ].map(({ id, label, Icon }) => {
                  const active = displayTheme === id;
                  return (
                    <button key={id} onClick={() => handleThemeChange(id)} style={s.themeCard(active)}>
                      <Icon style={s.themeIcon(active)} />
                      <span style={s.themeLabel(active)}>{label}</span>
                      {active && <FiCheckCircle style={s.themeCheck} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: '1.5rem', borderRadius: '.75rem', border: `1px solid ${c.border}`, backgroundColor: c.bgSec }}>
                <p style={{ fontWeight: 600, color: c.text, marginBottom: '.5rem' }}>Aperçu du thème actuel</p>
                <p style={{ color: c.textSec, fontSize: '.9rem' }}>
                  Thème <strong style={{ color: c.brand }}>{displayTheme === 'light' ? 'Clair' : displayTheme === 'dark' ? 'Sombre' : 'Système'}</strong> — les couleurs s'appliquent immédiatement sur toute la plateforme.
                </p>
              </div>
            </div>
          )}

          {/* ── CONFIDENTIALITÉ ── */}
          {activeTab === 'privacy' && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Paramètres de confidentialité</h2>
              <div style={s.formGroup}>
                <label style={s.label}>Visibilité du profil</label>
                <select
                  style={s.select}
                  value={privacy.profile_visibility}
                  onChange={e => handlePrivacyChange('profile_visibility', e.target.value)}
                >
                  <option value="public">Public — visible par tous</option>
                  <option value="private">Privé — visible uniquement par vous</option>
                  <option value="friends_only">Contacts uniquement</option>
                </select>
              </div>
              <div style={s.settingRow}>
                <div>
                  <div style={s.settingName}>Afficher le statut en ligne</div>
                  <div style={s.settingDesc}>
                    {privacy.show_online_status
                      ? 'Votre point vert est visible. Le serveur est pingé toutes les 2 min.'
                      : 'Statut masqué. Le point vert disparaît et aucun ping n\'est envoyé.'
                    }
                  </div>
                </div>
                <Toggle
                  checked={privacy.show_online_status}
                  onChange={v => handlePrivacyChange('show_online_status', v)}
                  brand={c.brand}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover:not(:disabled) { filter: brightness(0.92); }
        button:disabled { cursor: not-allowed; opacity: .65; }
        @media (max-width: 600px) {
          .theme-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Toggle({ checked, onChange, brand }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
        backgroundColor: checked ? brand : 'var(--switch-off)',
        transition: 'background-color .3s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        left: checked ? 26 : 4,
        width: 20, height: 20, borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        transition: 'left .3s',
      }} />
    </button>
  );
}
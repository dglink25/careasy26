// src/pages/Settings.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userSettingsApi } from '../api/userSettingsApi';
import theme from '../config/theme';
import {
  FiUser,
  FiMail,
  FiLock,
  FiBell,
  FiEye,
  FiMoon,
  FiSun,
  FiMonitor,
  FiCamera,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiSettings,
  FiShield,
  FiGlobe,
} from 'react-icons/fi';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  // États principaux
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // États pour le profil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profile_photo: null,
    profile_photo_url: '',
  });

  // États pour le mot de passe
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // États pour les notifications
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  // États pour le thème
  const [selectedTheme, setSelectedTheme] = useState('light');

  // États pour la confidentialité
  const [privacy, setPrivacy] = useState({
    profile_visibility: 'public',
    show_online_status: true,
  });

  // ✅ Charger les données AU MONTAGE
  useEffect(() => {
    loadUserData();
  }, []);

  // ✅ Réagir aux changements de l'URL (?tab=...)
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
        profile_photo: null,
        profile_photo_url: profileRes.user.profile_photo_url,
      });

      setSelectedTheme(settingsRes.theme);
      setPrivacy(settingsRes.settings.privacy || privacy);
      setNotifications(notificationRes.notifications);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showMessage('Erreur lors du chargement des données', 'error');
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
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('La photo ne doit pas dépasser 5MB', 'error');
        return;
      }
      setProfileData({
        ...profileData,
        profile_photo: file,
        profile_photo_url: URL.createObjectURL(file),
      });
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setSaving(true);
      await userSettingsApi.deleteProfilePhoto();
      setProfileData({
        ...profileData,
        profile_photo: null,
        profile_photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}`,
      });
      updateUser({ ...user, profile_photo_url: profileData.profile_photo_url });
      showMessage('Photo supprimée avec succès', 'success');
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      showMessage('Erreur lors de la suppression', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      if (profileData.profile_photo) {
        await userSettingsApi.updateProfilePhoto(profileData.profile_photo);
      }
      const response = await userSettingsApi.updateProfile({ name: profileData.name });
      updateUser(response.user);
      showMessage('Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      showMessage(error.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    const password = prompt('Entrez votre mot de passe pour confirmer le changement d\'email:');
    if (!password) return;
    try {
      setSaving(true);
      await userSettingsApi.updateEmail(profileData.email, password);
      showMessage('Email mis à jour. Vérifiez votre boîte de réception.', 'success');
    } catch (error) {
      console.error('Erreur changement email:', error);
      showMessage(error.response?.data?.message || 'Erreur lors du changement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) {
      showMessage('Le mot de passe actuel est requis', 'error');
      return;
    }
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showMessage('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (passwordData.new_password.length < 8) {
      showMessage('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }
    try {
      setSaving(true);
      await userSettingsApi.updatePassword(
        passwordData.current_password,
        passwordData.new_password,
        passwordData.new_password_confirmation
      );
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
      showMessage('Mot de passe mis à jour avec succès !', 'success');
      setTimeout(() => { logout(); }, 2000);
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        showMessage(Array.isArray(firstError) ? firstError[0] : firstError, 'error');
      } else {
        showMessage(error.response?.data?.message || 'Erreur lors du changement', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    try {
      setSelectedTheme(newTheme);
      await userSettingsApi.updateTheme(newTheme);
      showMessage('Thème mis à jour avec succès', 'success');
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Erreur changement thème:', error);
      showMessage('Erreur lors du changement de thème', 'error');
    }
  };

  const handleNotificationChange = async (key, value) => {
    try {
      const newNotifications = { ...notifications, [key]: value };
      setNotifications(newNotifications);
      await userSettingsApi.updateNotificationSettings(newNotifications);
      showMessage('Paramètres de notifications mis à jour', 'success');
    } catch (error) {
      console.error('Erreur notifications:', error);
      showMessage('Erreur lors de la mise à jour', 'error');
    }
  };

  const handlePrivacyChange = async (key, value) => {
    try {
      const newPrivacy = { ...privacy, [key]: value };
      setPrivacy(newPrivacy);
      await userSettingsApi.updateSettings({ privacy: newPrivacy });
      showMessage('Paramètres de confidentialité mis à jour', 'success');
    } catch (error) {
      console.error('Erreur confidentialité:', error);
      showMessage('Erreur lors de la mise à jour', 'error');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <FiSettings style={styles.titleIcon} />
              Paramètres
            </h1>
            <p style={styles.subtitle}>Gérez vos préférences et votre compte</p>
          </div>
        </div>

        {/* Message de notification */}
        {message && (
          <div style={{
            ...styles.messageContainer,
            ...(message.type === 'error' ? styles.messageError : styles.messageSuccess),
          }}>
            {message.type === 'success' ? (
              <FiCheckCircle style={styles.messageIcon} />
            ) : (
              <FiAlertCircle style={styles.messageIcon} />
            )}
            <span style={styles.messageText}>{message.text}</span>
            <button onClick={() => setMessage(null)} style={styles.messageClose}>
              <FiX />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { id: 'profile', label: 'Profil', icon: FiUser },
            { id: 'security', label: 'Sécurité', icon: FiLock },
            { id: 'notifications', label: 'Notifications', icon: FiBell },
            { id: 'appearance', label: 'Apparence', icon: FiMoon },
            { id: 'privacy', label: 'Confidentialité', icon: FiShield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                ...styles.tab,
                ...(activeTab === id ? styles.tabActive : {}),
              }}
            >
              <Icon style={styles.tabIcon} />
              {label}
            </button>
          ))}
        </div>

        {/* Contenu des tabs */}
        <div style={styles.tabContent}>

          {/* Tab Profil */}
          {activeTab === 'profile' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Informations du profil</h2>
              <div style={styles.photoSection}>
                <div style={styles.photoContainer}>
                  <img src={profileData.profile_photo_url} alt="Photo de profil" style={styles.photoImage} />
                  <button onClick={() => fileInputRef.current?.click()} className="photo-button" style={styles.photoButton} disabled={saving}>
                    <FiCamera />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </div>
                <div style={styles.photoInfo}>
                  <h3 style={styles.photoTitle}>Photo de profil</h3>
                  <p style={styles.photoDescription}>JPG, PNG ou GIF. Maximum 5MB.</p>
                  <div style={styles.photoActions}>
                    <button onClick={() => fileInputRef.current?.click()} style={styles.buttonSecondary} disabled={saving}>
                      Changer la photo
                    </button>
                    {profileData.profile_photo_url && !profileData.profile_photo_url.includes('ui-avatars') && (
                      <button onClick={handleDeletePhoto} style={styles.buttonDanger} disabled={saving}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom complet</label>
                <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} style={styles.input} placeholder="Votre nom" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse email</label>
                <div style={styles.inputGroup}>
                  <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} style={styles.input} placeholder="votre@email.com" />
                  {profileData.email !== user.email && (
                    <button onClick={handleChangeEmail} style={styles.buttonSecondary} disabled={saving}>
                      Valider le changement
                    </button>
                  )}
                </div>
                <p style={styles.hint}>Un email de vérification sera envoyé à la nouvelle adresse</p>
              </div>
              <button onClick={handleSaveProfile} style={styles.buttonPrimary} disabled={saving}>
                <FiSave style={styles.buttonIcon} />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          )}

          {/* Tab Sécurité */}
          {activeTab === 'security' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Changer le mot de passe</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mot de passe actuel</label>
                <input type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} style={styles.input} placeholder="••••••••" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nouveau mot de passe</label>
                <input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} style={styles.input} placeholder="••••••••" />
                <p style={styles.hint}>Minimum 8 caractères avec majuscules, minuscules, chiffres et symboles</p>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirmer le nouveau mot de passe</label>
                <input type="password" value={passwordData.new_password_confirmation} onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })} style={styles.input} placeholder="••••••••" />
              </div>
              <button onClick={handleChangePassword} style={styles.buttonPrimary} disabled={saving || !passwordData.current_password || !passwordData.new_password}>
                <FiLock style={styles.buttonIcon} />
                {saving ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </div>
          )}

          {/* Tab Notifications */}
          {activeTab === 'notifications' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Préférences de notifications</h2>
              {[
                { key: 'email', title: 'Notifications par email', desc: 'Recevez des notifications par email' },
                { key: 'push', title: 'Notifications push', desc: 'Recevez des notifications sur votre navigateur' },
                { key: 'sms', title: 'Notifications SMS', desc: 'Recevez des notifications par SMS' },
              ].map(({ key, title, desc }) => (
                <div key={key} style={styles.settingItem}>
                  <div>
                    <h3 style={styles.settingTitle}>{title}</h3>
                    <p style={styles.settingDescription}>{desc}</p>
                  </div>
                  <label style={styles.switch}>
                    <input type="checkbox" checked={notifications[key]} onChange={(e) => handleNotificationChange(key, e.target.checked)} style={{ display: 'none' }} />
                    <span className={`switch-slider ${notifications[key] ? 'switch-slider-active' : ''}`} style={styles.switchSlider} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Tab Apparence */}
          {activeTab === 'appearance' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Thème de l'interface</h2>
              <div style={styles.themeGrid}>
                {[
                  { id: 'light', label: 'Clair', icon: FiSun },
                  { id: 'dark', label: 'Sombre', icon: FiMoon },
                  { id: 'system', label: 'Système', icon: FiMonitor },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleThemeChange(id)}
                    className="theme-card"
                    style={{ ...styles.themeCard, ...(selectedTheme === id ? styles.themeCardActive : {}) }}
                  >
                    <Icon style={styles.themeIcon} />
                    <span style={styles.themeLabel}>{label}</span>
                    {selectedTheme === id && <FiCheckCircle style={styles.themeCheck} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Confidentialité */}
          {activeTab === 'privacy' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Paramètres de confidentialité</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Visibilité du profil</label>
                <select value={privacy.profile_visibility} onChange={(e) => handlePrivacyChange('profile_visibility', e.target.value)} style={styles.select}>
                  <option value="public">Public - Visible par tous</option>
                  <option value="private">Privé - Visible uniquement par vous</option>
                  <option value="friends_only">Contacts uniquement</option>
                </select>
              </div>
              <div style={styles.settingItem}>
                <div>
                  <h3 style={styles.settingTitle}>Afficher le statut en ligne</h3>
                  <p style={styles.settingDescription}>Les autres utilisateurs peuvent voir quand vous êtes en ligne</p>
                </div>
                <label style={styles.switch}>
                  <input type="checkbox" checked={privacy.show_online_status} onChange={(e) => handlePrivacyChange('show_online_status', e.target.checked)} style={{ display: 'none' }} />
                  <span className={`switch-slider ${privacy.show_online_status ? 'switch-slider-active' : ''}`} style={styles.switchSlider} />
                </label>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .switch-slider {
          position: absolute; cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1; transition: 0.4s; border-radius: 28px;
        }
        .switch-slider::before {
          position: absolute; content: "";
          height: 20px; width: 20px; left: 4px; bottom: 4px;
          background-color: white; transition: 0.4s; border-radius: 50%;
        }
        .switch-slider-active { background-color: #ef4444; }
        .switch-slider-active::before { transform: translateX(24px); }

        .theme-card { transition: all 0.3s ease; }
        .theme-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }

        button:hover:not(:disabled) { opacity: 0.9; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }

        input:focus, select:focus {
          border-color: #ef4444 !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .photo-button:hover:not(:disabled) { background-color: #dc2626; }

        @media (max-width: 768px) {
          .theme-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 0 4rem 0',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #dbeafe',
    borderTop: '4px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: { color: '#475569', fontSize: '1.125rem' },
  header: { marginBottom: '2rem' },
  title: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem',
  },
  titleIcon: { fontSize: '2rem', color: '#ef4444' },
  subtitle: { color: '#64748b', fontSize: '1rem' },
  messageContainer: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
  },
  messageSuccess: { backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #6ee7b7' },
  messageError: { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
  messageIcon: { fontSize: '1.25rem' },
  messageText: { flex: 1, fontWeight: '600' },
  messageClose: {
    backgroundColor: 'transparent', border: 'none',
    color: 'inherit', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem',
  },
  tabs: {
    display: 'flex', gap: '0.5rem',
    borderBottom: '2px solid #e2e8f0', marginBottom: '2rem', overflowX: 'auto',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '1rem 1.5rem', backgroundColor: 'transparent', border: 'none',
    borderBottom: '3px solid transparent', color: '#64748b',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
    transition: 'all 0.3s', whiteSpace: 'nowrap',
  },
  tabActive: { color: '#ef4444', borderBottomColor: '#ef4444' },
  tabIcon: { fontSize: '1.125rem' },
  tabContent: {
    backgroundColor: '#fff', borderRadius: '1rem',
    padding: '2rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  section: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  sectionTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' },
  photoSection: {
    display: 'flex', alignItems: 'center', gap: '2rem',
    padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem',
  },
  photoContainer: { position: 'relative' },
  photoImage: {
    width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover',
    border: '4px solid #fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  photoButton: {
    position: 'absolute', bottom: '0', right: '0',
    width: '40px', height: '40px', borderRadius: '50%',
    backgroundColor: '#ef4444', color: '#fff', border: '3px solid #fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1.125rem', transition: 'all 0.3s',
  },
  photoInfo: { flex: 1 },
  photoTitle: { fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' },
  photoDescription: { fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' },
  photoActions: { display: 'flex', gap: '0.75rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#475569' },
  input: {
    padding: '0.75rem 1rem', borderRadius: '0.5rem',
    border: '2px solid #e2e8f0', fontSize: '1rem', transition: 'all 0.3s', outline: 'none',
  },
  select: {
    padding: '0.75rem 1rem', borderRadius: '0.5rem',
    border: '2px solid #e2e8f0', fontSize: '1rem',
    backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
  },
  inputGroup: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  hint: { fontSize: '0.75rem', color: '#94a3b8' },
  buttonPrimary: {
    backgroundColor: '#ef4444', color: '#ffffff', border: 'none',
    padding: '0.875rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer',
    fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center',
    gap: '0.5rem', transition: 'all 0.3s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  buttonSecondary: {
    backgroundColor: 'transparent', color: '#ef4444',
    border: '2px solid #ef4444', padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '600',
    fontSize: '0.875rem', transition: 'all 0.3s',
  },
  buttonDanger: {
    backgroundColor: '#dc2626', color: '#fff', border: 'none',
    padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s',
  },
  buttonIcon: { fontSize: '1.125rem' },
  settingItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem', backgroundColor: '#f8fafc',
    borderRadius: '0.75rem', border: '1px solid #e2e8f0',
  },
  settingTitle: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' },
  settingDescription: { fontSize: '0.875rem', color: '#64748b' },
  switch: {
    position: 'relative', display: 'inline-block',
    width: '52px', height: '28px', cursor: 'pointer',
  },
  switchSlider: {
    position: 'absolute', cursor: 'pointer',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#cbd5e1', transition: '0.4s', borderRadius: '28px',
  },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
  themeCard: {
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.75rem', padding: '1.5rem',
    backgroundColor: '#f8fafc', border: '2px solid #e2e8f0',
    borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s',
  },
  themeCardActive: { backgroundColor: '#dbeafe', borderColor: '#ef4444' },
  themeIcon: { fontSize: '2rem', color: '#ef4444' },
  themeLabel: { fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' },
  themeCheck: { position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '1.25rem', color: '#ef4444' },
};
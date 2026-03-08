import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { entrepriseApi } from '../api/entrepriseApi';
import { publicApi } from '../api/publicApi';
import Logo from './Logo';
import {
  FaHome, FaBuilding, FaTools, FaSearch, FaUser,
  FaSignOutAlt, FaBars, FaTimes, FaChevronDown
} from 'react-icons/fa';
import {
  FiMessageSquare, FiSettings, FiUser, FiLock,
  FiBell, FiMoon, FiShield, FiShoppingBag, FiHeart, FiCalendar, FiAward,
  FiChevronDown as FiChevronDownIcon
} from 'react-icons/fi';
import {
  MdDashboard, MdOutlineStorefront
} from 'react-icons/md';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [domaines, setDomaines] = useState([]);
  const [loadingDomaines, setLoadingDomaines] = useState(true);
  
  const settingsDropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfilePhotoUrl(user.profile_photo_url || null);
      checkIfProvider();
    }
  }, [user]);

  const checkIfProvider = async () => {
    try {
      const entreprises = await entrepriseApi.getMesEntreprises();
      setIsProvider(entreprises && entreprises.length > 0);
    } catch (err) {
      console.error('Erreur vérification statut prestataire:', err);
      setIsProvider(false);
    }
  };

  useEffect(() => { fetchDomaines(); }, []);

  const fetchDomaines = async () => {
    try {
      setLoadingDomaines(true);
      const data = await publicApi.getDomaines();
      setDomaines(data);
    } catch {
      setDomaines([]);
    } finally {
      setLoadingDomaines(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target)) {
        setShowSettingsDropdown(false);
      }
    };
    if (showSettingsDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsDropdown]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleDomaineClick = (domaineId) => {
    navigate(`/services?type=${domaineId}`);
    setShowServicesDropdown(false);
    closeMobileMenu();
  };

  const handleSettingsClick = (sectionId) => {
    navigate(`/settings?tab=${sectionId}`);
    setShowSettingsDropdown(false);
  };

  const settingsSections = [
    { id: 'profile', label: 'Profil', icon: FiUser, description: 'Gérer vos informations personnelles', color: '#3b82f6' },
    { id: 'security', label: 'Sécurité', icon: FiLock, description: 'Mot de passe et authentification', color: '#ef4444' },
    { id: 'notifications', label: 'Notifications', icon: FiBell, description: 'Préférences de notifications', color: '#f59e0b' },
    { id: 'appearance', label: 'Apparence', icon: FiMoon, description: 'Thème et affichage', color: '#8b5cf6' },
    { id: 'privacy', label: 'Confidentialité', icon: FiShield, description: 'Contrôle de la vie privée', color: '#10b981' },
  ];

  const UserAvatar = ({ size = 35 }) => {
    const hasPhoto = profilePhotoUrl && !profilePhotoUrl.includes('ui-avatars');
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        backgroundColor: 'var(--brand-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: hasPhoto ? '2px solid var(--brand-light)' : 'none',
      }}>
        {hasPhoto ? (
          <img src={profilePhotoUrl} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setProfilePhotoUrl(null)} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.4 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        backgroundColor: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        padding: scrolled ? '0.75rem 0' : '1rem 0',
        borderBottom: '3px solid var(--brand-primary)',
        boxShadow: scrolled ? 'var(--shadow-lg)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size="md" showText={true} />

          {/* Desktop Menu */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }} className="desktop-nav">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  // Menu Admin
                  <>
                    {[
                      { to: '/admin/dashboard', icon: FaUser, label: 'Dashboard' },
                      { to: '/admin/entreprises', icon: FaBuilding, label: 'Entreprises' },
                      { to: '/messages', icon: FiMessageSquare, label: 'Messages' },
                       { to: '/admin/plans', icon: FiAward, label: 'Plans' }
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} className="nav-link" style={{ ...navLink, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                        <Icon style={{ fontSize: '1rem' }} />{label}
                      </Link>
                    ))}
                  </>
                ) : (
                  // Menu Utilisateur (Client ou Prestataire)
                  <>
                    {isProvider ? (
                     
                      <>
                        {[
                          { to: '/dashboard', icon: MdDashboard, label: 'Tableau de bord' },
                          { to: '/mes-entreprises', icon: FaBuilding, label: 'Entreprises' },
                          { to: '/mes-services', icon: FaTools, label: 'Services' },
                          { to: '/messages', icon: FiMessageSquare, label: 'Messages' },
                          { to: '/mes-rendez-vous', icon: FiCalendar, label: 'Rendez-vous' },
                          { to: '/plans', icon: FiAward, label: 'Plans' },
                          { to: '/abonnements', icon: FiAward, label: 'Mes Abonnements' }
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} className="nav-link" style={{ ...navLink, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                            <Icon style={{ fontSize: '1rem' }} />{label}
                          </Link>
                        ))}
                      </>
                    ) : (
                      // Menu CLIENT
                      <>
                        {[
                          { to: '/dashboard', icon: FiShoppingBag, label: 'Espace Client' },
                          { to: '/mes-rendez-vous', icon: FiCalendar, label: 'Mes Rendez-vous' },
                          { to: '/favoris', icon: FiHeart, label: 'Favoris' },
                          { to: '/messages', icon: FiMessageSquare, label: 'Messages' },
                          { to: '/services', icon: FaSearch, label: 'Explorer' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} className="nav-link" style={{ ...navLink, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                            <Icon style={{ fontSize: '1rem' }} />{label}
                          </Link>
                        ))}
                      </>
                    )}
                  </>
                )}

                {/* Dropdown utilisateur */}
                <div ref={settingsDropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    className="settings-trigger"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.75rem',
                      border: '2px solid var(--border-color)',
                      cursor: 'pointer', transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <UserAvatar size={35} />
                      <div style={{
                        position: 'absolute', bottom: 0, right: -2,
                        width: 12, height: 12, borderRadius: '50%',
                        backgroundColor: '#10b981', border: '2px solid var(--bg-primary)',
                        boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                        animation: 'pulse 2s ease-in-out infinite',
                      }} />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                      {user.name.split(' ')[0]}
                    </span>
                    {user.role === 'admin' && (
                      <span style={{ backgroundColor: 'var(--brand-primary)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                        ADMIN
                      </span>
                    )}
                    {isProvider && !user.role === 'admin' && (
                      <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                        PRESTATAIRE
                      </span>
                    )}
                    <FiChevronDownIcon style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', transition: 'transform 0.3s', transform: showSettingsDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>

                  {showSettingsDropdown && (
                    <div className="settings-dropdown-menu" style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '1rem',
                      boxShadow: 'var(--shadow-lg)',
                      border: '2px solid var(--border-color)',
                      minWidth: 380, maxHeight: '70vh', overflow: 'auto', zIndex: 1001,
                    }}>
                      {/* Header */}
                      <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '2px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        borderRadius: '1rem 1rem 0 0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--brand-primary)', boxShadow: 'var(--shadow-md)' }}>
                            <UserAvatar size={52} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>{user.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</p>
                            {isProvider && (
                              <span style={{ display: 'inline-block', backgroundColor: '#10b981', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                Prestataire
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ padding: '0.75rem' }}>
                        {settingsSections.map(({ id, label, icon: Icon, description, color }) => (
                          <button key={id} onClick={() => handleSettingsClick(id)} className="settings-item" style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.875rem 1rem', width: '100%',
                            backgroundColor: 'transparent', border: 'none',
                            borderRadius: '0.5rem', cursor: 'pointer',
                            marginBottom: '0.25rem', transition: 'all 0.2s',
                            color: 'var(--text-primary)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: `${color}20`, color, fontSize: '1.125rem', flexShrink: 0 }}>
                              <Icon />
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>{label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{description}</div>
                            </div>
                            <FiChevronDownIcon style={{ fontSize: '0.875rem', color: 'var(--text-muted)', transform: 'rotate(-90deg)' }} />
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div style={{ padding: '0.75rem 1.5rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <button onClick={handleLogout} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          width: '100%', padding: '0.75rem',
                          backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)',
                          border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                        }}>
                          <FaSignOutAlt />Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Menu public
              <>
                {[
                  { to: '/', icon: FaHome, label: 'Accueil' },
                  { to: '/entreprises', icon: FaBuilding, label: 'Entreprises' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} className="nav-link" style={{ ...navLink, color: isActive(to) ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: isActive(to) ? 700 : 500 }}>
                    <Icon style={{ fontSize: '1rem' }} />{label}
                  </Link>
                ))}

                {/* Mega dropdown services */}
                <div style={{ position: 'relative' }}
                  onMouseEnter={() => setShowServicesDropdown(true)}
                  onMouseLeave={() => setShowServicesDropdown(false)}
                >
                  <Link to="/services" className="nav-link" style={{ ...navLink, color: isActive('/services') ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    <FaTools style={{ fontSize: '1rem' }} />
                    Services
                    <FaChevronDown style={{ fontSize: '0.75rem' }} />
                  </Link>

                  {showServicesDropdown && (
                    <div className="mega-dropdown" style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                      marginTop: '0.5rem',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '1rem',
                      boxShadow: 'var(--shadow-lg)',
                      border: '2px solid var(--border-color)',
                      minWidth: 600, maxWidth: 700, maxHeight: '70vh', overflow: 'auto',
                    }}>
                      <div style={{ padding: '1.5rem', borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)', borderRadius: '1rem 1rem 0 0' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-primary)', marginBottom: '0.25rem' }}>Nos Services</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {loadingDomaines ? 'Chargement...' : `${domaines.length} domaines disponibles`}
                        </p>
                      </div>

                      {loadingDomaines ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem' }}>
                          <div style={{ width: 30, height: 30, border: '3px solid var(--border-color)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chargement...</p>
                        </div>
                      ) : domaines.length > 0 ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', padding: '1rem' }}>
                            {domaines.map((d) => (
                              <button key={d.id} onClick={() => handleDomaineClick(d.id)} className="service-item" style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '1rem', backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '0.5rem', border: '2px solid var(--border-color)',
                                cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.3s',
                              }}>
                                <FaTools style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'left' }}>{d.name}</span>
                              </button>
                            ))}
                          </div>
                          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                            <Link to="/services" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }} onClick={() => setShowServicesDropdown(false)}>
                              Voir tous les services →
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                          <p style={{ color: 'var(--text-secondary)' }}>Aucun service disponible</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/login" style={{
                  backgroundColor: 'transparent', color: 'var(--brand-primary)',
                  border: '2px solid var(--brand-primary)', padding: '0.625rem 1.5rem',
                  borderRadius: '0.75rem', fontWeight: 600, textDecoration: 'none',
                  fontSize: '0.9rem', transition: 'all 0.3s',
                }}>
                  Connexion
                </Link>
                <Link to="/register" style={{
                  backgroundColor: 'var(--brand-primary)', color: '#fff',
                  border: 'none', padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem', fontWeight: 600, textDecoration: 'none',
                  fontSize: '0.9rem', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s',
                }}>
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Bouton burger mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none', backgroundColor: 'transparent', border: 'none',
              color: 'var(--brand-primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
            }}
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div onClick={closeMobileMenu} style={{
          position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)',
          zIndex: 999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'var(--bg-card)',
            width: '80%', maxWidth: 400, height: '100%',
            padding: '2rem 1.5rem', overflowY: 'auto',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease',
          }}>
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem',
                marginBottom: '1.5rem', border: '1px solid var(--border-color)',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar size={50} />
                  <div style={{ position: 'absolute', bottom: 0, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--bg-primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                  {isProvider && (
                    <span style={{ display: 'inline-block', backgroundColor: '#10b981', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, marginTop: '0.25rem' }}>
                      Prestataire
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    // Menu mobile Admin
                    <>
                      <MobileLink to="/admin/dashboard" icon={FaUser} label="Dashboard Admin" onClick={closeMobileMenu} />
                      <MobileLink to="/admin/entreprises" icon={FaBuilding} label="Entreprises" onClick={closeMobileMenu} />
                      <MobileLink to="/messages" icon={FiMessageSquare} label="Messages" onClick={closeMobileMenu} />
                      <MobileLink to="/entreprises" icon={FaSearch} label="Site Public" onClick={closeMobileMenu} />
                    </>
                  ) : (
                    // Menu mobile Client/Prestataire
                    <>
                      {isProvider ? (
                        // Menu mobile Prestataire
                        <>
                          <MobileLink to="/dashboard" icon={MdDashboard} label="Dashboard Prestataire" onClick={closeMobileMenu} />
                          <MobileLink to="/mes-entreprises" icon={FaBuilding} label="Mes Entreprises" onClick={closeMobileMenu} />
                          <MobileLink to="/mes-services" icon={FaTools} label="Mes Services" onClick={closeMobileMenu} />
                          <MobileLink to="/messages" icon={FiMessageSquare} label="Messages" onClick={closeMobileMenu} />
                          <MobileLink to="/mes-rendez-vous" icon={FiCalendar} label="Rendez-vous" onClick={closeMobileMenu} />
                          <MobileLink to="/plans" icon={FiAward} label="Plans" onClick={closeMobileMenu} />
                          <MobileLink to="/abonnements" icon={FiAward} label="Mes Abonnements" onClick={closeMobileMenu} />
                        </>
                      ) : (
                        // Menu mobile Client
                        <>
                          <MobileLink to="/dashboard" icon={FiShoppingBag} label="Espace Client" onClick={closeMobileMenu} />
                          <MobileLink to="/mes-rendez-vous" icon={FiCalendar} label="Mes Rendez-vous" onClick={closeMobileMenu} />
                          <MobileLink to="/favoris" icon={FiHeart} label="Favoris" onClick={closeMobileMenu} />
                        </>
                      )}
                      <MobileLink to="/messages" icon={FiMessageSquare} label="Messages" onClick={closeMobileMenu} />
                      <MobileLink to="/entreprises" icon={FaSearch} label="Explorer" onClick={closeMobileMenu} />
                    </>
                  )}
                  <MobileLink to="/settings" icon={FiSettings} label="Paramètres" onClick={closeMobileMenu} />
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    width: '100%', padding: '1rem', marginTop: '1rem',
                    backgroundColor: 'var(--brand-primary)', color: '#fff',
                    border: 'none', borderRadius: '0.75rem', cursor: 'pointer',
                    fontWeight: 600, fontSize: '1rem',
                  }}>
                    <FaSignOutAlt />Déconnexion
                  </button>
                </>
              ) : (
                // Menu mobile public
                <>
                  <MobileLink to="/" icon={FaHome} label="Accueil" onClick={closeMobileMenu} />
                  <MobileLink to="/entreprises" icon={FaBuilding} label="Entreprises" onClick={closeMobileMenu} />
                  <MobileLink to="/services" icon={FaTools} label="Services" onClick={closeMobileMenu} />
                  <MobileLink to="/login" icon={FaUser} label="Connexion" onClick={closeMobileMenu} />
                  <MobileLink to="/register" icon={FaUser} label="Inscription" onClick={closeMobileMenu} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex; }

        .nav-link {
          text-decoration: none;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          position: relative;
          transition: all 0.2s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px; left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 80%; height: 3px;
          background: var(--brand-primary);
          border-radius: 2px;
          transition: transform 0.3s ease;
        }
        .nav-link:hover::after { transform: translateX(-50%) scaleX(1); }

        .settings-trigger:hover {
          background-color: var(--bg-tertiary) !important;
        }
        .settings-item:hover {
          background-color: var(--bg-secondary) !important;
          transform: translateX(4px);
        }
        .service-item:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          background-color: var(--bg-tertiary) !important;
        }

        .mega-dropdown, .settings-dropdown-menu {
          animation: slideDown 0.25s ease;
        }

        .mobile-menu-btn { display: none !important; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.15); }
        }

        @media (max-width: 968px) {
          .desktop-nav   { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// Lien mobile réutilisable
function MobileLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '1rem', color: 'var(--text-primary)', textDecoration: 'none',
      borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 500,
      transition: 'background-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Icon style={{ color: 'var(--brand-primary)' }} />{label}
    </Link>
  );
}

// Style de base des liens desktop
const navLink = {
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  whiteSpace: 'nowrap',
  borderRadius: '0.5rem',
  fontSize: '0.95rem',
  transition: 'all 0.2s',
};
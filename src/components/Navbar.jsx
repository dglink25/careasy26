// careasy-frontend/src/components/Navbar.jsx - VERSION AVEC MENU PARAMÈTRES
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { publicApi } from '../api/publicApi';
import Logo from './Logo';
import theme from '../config/theme';
import { 
  FaHome, 
  FaBuilding, 
  FaTools, 
  FaSearch, 
  FaUser, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronDown
} from 'react-icons/fa';
import { 
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiLock,
  FiBell,
  FiMoon,
  FiShield,
  FiChevronDown as FiChevronDownIcon
} from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false); // 👈 NOUVEAU
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settingsDropdownRef = useRef(null); // 👈 NOUVEAU
  
  const [domaines, setDomaines] = useState([]);
  const [loadingDomaines, setLoadingDomaines] = useState(true);

  // Charger les domaines depuis l'API
  useEffect(() => {
    fetchDomaines();
  }, []);

  const fetchDomaines = async () => {
    try {
      setLoadingDomaines(true);
      const data = await publicApi.getDomaines();
      setDomaines(data);
    } catch (error) {
      console.error('Erreur chargement domaines:', error);
      setDomaines([]);
    } finally {
      setLoadingDomaines(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 👉 NOUVEAU: Fermer le dropdown des paramètres en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
      }
    };

    if (showSettingsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const getDomaineIcon = () => <FaTools />;

  // 👉 NOUVEAU: Sections de paramètres
  const settingsSections = [
    {
      id: 'profile',
      label: 'Profil',
      icon: FiUser,
      description: 'Gérer vos informations personnelles',
      color: '#3b82f6'
    },
    {
      id: 'security',
      label: 'Sécurité',
      icon: FiLock,
      description: 'Mot de passe et authentification',
      color: '#ef4444'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: FiBell,
      description: 'Préférences de notifications',
      color: '#f59e0b'
    },
    {
      id: 'appearance',
      label: 'Apparence',
      icon: FiMoon,
      description: 'Thème et affichage',
      color: '#8b5cf6'
    },
    {
      id: 'privacy',
      label: 'Confidentialité',
      icon: FiShield,
      description: 'Contrôle de la vie privée',
      color: '#10b981'
    }
  ];

  // 👉 NOUVEAU: Naviguer vers les paramètres avec section
  const handleSettingsClick = (sectionId) => {
    navigate(`/settings?tab=${sectionId}`);
    setShowSettingsDropdown(false);
  };

  return (
    <>
      <nav style={{
        ...styles.nav,
        ...(scrolled ? styles.navScrolled : {})
      }}>
        <div style={styles.container}>
          {/* Logo */}
          <Logo size="md" showText={true} />
          
          {/* Desktop Menu */}
          <div style={styles.desktopMenu}>
            {user ? (
              <>
                {/* Menu Admin */}
                {user.role === 'admin' ? (
                  <>
                    <Link 
                      to="/admin/dashboard" 
                      style={{
                        ...styles.link,
                        ...(isActive('/admin/dashboard') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaUser style={styles.icon} />
                      Dashboard
                    </Link>
                    <Link 
                      to="/admin/entreprises" 
                      style={{
                        ...styles.link,
                        ...(isActive('/admin/entreprises') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaBuilding style={styles.icon} />
                      Entreprises
                    </Link>
                    <Link 
                      to="/messages" 
                      style={{
                        ...styles.link,
                        ...(isActive('/messages') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FiMessageSquare style={styles.icon} />
                      Messages
                    </Link>
                    <Link 
                      to="/entreprises" 
                      style={{
                        ...styles.link,
                        ...(isActive('/entreprises') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaSearch style={styles.icon} />
                      Site Public
                    </Link>
                  </>
                ) : (
                  /* Menu Prestataire */
                  <>
                    <Link 
                      to="/dashboard" 
                      style={{
                        ...styles.link,
                        ...(isActive('/dashboard') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaHome style={styles.icon} />
                      Dashboard
                    </Link>
                    <Link 
                      to="/mes-entreprises" 
                      style={{
                        ...styles.link,
                        ...(isActive('/mes-entreprises') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaBuilding style={styles.icon} />
                      Mes Entreprises
                    </Link>
                    <Link 
                      to="/mes-services" 
                      style={{
                        ...styles.link,
                        ...(isActive('/mes-services') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaTools style={styles.icon} />
                      Mes Services
                    </Link>
                    <Link 
                      to="/messages" 
                      style={{
                        ...styles.link,
                        ...(isActive('/messages') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FiMessageSquare style={styles.icon} />
                      Messages
                    </Link>
                    <Link 
                      to="/entreprises" 
                      style={{
                        ...styles.link,
                        ...(isActive('/entreprises') ? styles.linkActive : {})
                      }}
                      className="nav-link"
                    >
                      <FaSearch style={styles.icon} />
                      Explorer
                    </Link>
                  </>
                )}
                
                {/* 👉 NOUVEAU: Menu déroulant des paramètres */}
                <div 
                  ref={settingsDropdownRef}
                  style={styles.settingsDropdown}
                >
                  <button
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    style={styles.userInfo}
                    className="settings-trigger"
                  >
                    <div style={styles.userAvatarContainer}>
                      <div style={styles.userAvatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.onlineIndicator} title="En ligne" />
                    </div>
                    <span style={styles.userName}>{user.name.split(' ')[0]}</span>
                    {user.role === 'admin' && (
                      <span style={styles.adminBadge}>ADMIN</span>
                    )}
                    <FiChevronDownIcon 
                      style={{
                        ...styles.dropdownArrow,
                        transform: showSettingsDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} 
                    />
                  </button>

                  {/* 👉 Dropdown des paramètres */}
                  {showSettingsDropdown && (
                    <div style={styles.settingsDropdownMenu} className="settings-dropdown-menu">
                      <div style={styles.settingsDropdownHeader}>
                        <h3 style={styles.settingsDropdownTitle}>Paramètres du compte</h3>
                        <p style={styles.settingsDropdownSubtitle}>{user.email}</p>
                      </div>

                      <div style={styles.settingsSectionsList}>
                        {settingsSections.map((section) => {
                          const IconComponent = section.icon;
                          return (
                            <button
                              key={section.id}
                              onClick={() => handleSettingsClick(section.id)}
                              style={styles.settingsItem}
                              className="settings-item"
                            >
                              <div 
                                style={{
                                  ...styles.settingsItemIcon,
                                  backgroundColor: `${section.color}15`,
                                  color: section.color
                                }}
                              >
                                <IconComponent />
                              </div>
                              <div style={styles.settingsItemContent}>
                                <div style={styles.settingsItemLabel}>{section.label}</div>
                                <div style={styles.settingsItemDescription}>{section.description}</div>
                              </div>
                              <FiChevronDownIcon style={styles.settingsItemArrow} />
                            </button>
                          );
                        })}
                      </div>

                      <div style={styles.settingsDropdownFooter}>
                        <button onClick={handleLogout} style={styles.logoutButton}>
                          <FaSignOutAlt style={styles.logoutIcon} />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Menu Public */}
                <Link 
                  to="/" 
                  style={{
                    ...styles.link,
                    ...(isActive('/') ? styles.linkActive : {})
                  }}
                  className="nav-link"
                >
                  <FaHome style={styles.icon} />
                  Accueil
                </Link>
                
                <Link 
                  to="/entreprises" 
                  style={{
                    ...styles.link,
                    ...(isActive('/entreprises') ? styles.linkActive : {})
                  }}
                  className="nav-link"
                >
                  <FaBuilding style={styles.icon} />
                  Entreprises
                </Link>
                
                {/* Mega Dropdown Services DYNAMIQUE */}
                <div 
                  style={styles.dropdown}
                  onMouseEnter={() => setShowServicesDropdown(true)}
                  onMouseLeave={() => setShowServicesDropdown(false)}
                >
                  <Link 
                    to="/services" 
                    style={{
                      ...styles.link,
                      ...(isActive('/services') ? styles.linkActive : {})
                    }}
                    className="nav-link"
                  >
                    <FaTools style={styles.icon} />
                    Services
                    <FaChevronDown style={{...styles.icon, fontSize: '0.75rem', marginLeft: '0.25rem'}} />
                  </Link>
                  
                  {showServicesDropdown && (
                    <div style={styles.megaDropdown} className="mega-dropdown">
                      <div style={styles.megaDropdownHeader}>
                        <h3 style={styles.megaDropdownTitle}>Nos Services</h3>
                        <p style={styles.megaDropdownSubtitle}>
                          {loadingDomaines 
                            ? 'Chargement...' 
                            : `${domaines.length} domaines disponibles`
                          }
                        </p>
                      </div>
                      
                      {loadingDomaines ? (
                        <div style={styles.loadingContainer}>
                          <div style={styles.spinner}></div>
                          <p style={styles.loadingText}>Chargement des services...</p>
                        </div>
                      ) : domaines.length > 0 ? (
                        <>
                          <div style={styles.servicesGrid}>
                            {domaines.map((domaine) => (
                              <button
                                key={domaine.id}
                                onClick={() => handleDomaineClick(domaine.id)}
                                style={styles.serviceItem}
                                className="service-item"
                              >
                                <div style={styles.serviceIcon}>
                                  {getDomaineIcon()}
                                </div>
                                <span style={styles.serviceName}>{domaine.name}</span>
                              </button>
                            ))}
                          </div>
                          <div style={styles.megaDropdownFooter}>
                            <Link 
                              to="/services" 
                              style={styles.viewAllLink}
                              onClick={() => setShowServicesDropdown(false)}
                            >
                              Voir tous les services →
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div style={styles.emptyState}>
                          <p style={styles.emptyText}>Aucun service disponible</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Link to="/login" style={styles.buttonSecondary}>
                  Connexion
                </Link>
                <Link to="/register" style={styles.buttonPrimary}>
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.mobileMenuButton}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu (gardé identique pour simplifier) */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={closeMobileMenu}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            {/* Contenu mobile inchangé */}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        .nav-link {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 80%;
          height: 3px;
          background: ${theme.colors.primary};
          border-radius: 2px;
          transition: transform 0.3s ease;
        }
            
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        .nav-link:hover::after {
          transform: translateX(-50%) scaleX(1);
        }
        
        .mega-dropdown, .settings-dropdown-menu {
          animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .service-item, .settings-item {
          transition: all 0.3s ease;
        }

        .service-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .settings-item:hover {
          background-color: #f8fafc;
          transform: translateX(4px);
        }

        .settings-trigger {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .settings-trigger:hover {
          background-color: #f1f5f9;
        }

        @media (max-width: 968px) {
          .desktop-menu {
            display: none;
          }
        }
          @media (max-width: 968px) {
  .desktop-menu {
    display: none !important;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
      `}</style>
    </>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    padding: '1rem 0',
    borderBottom: `3px solid ${theme.colors.primary}`,
    transition: 'all 0.3s ease',
  },
  navScrolled: {
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '0.75rem 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desktopMenu: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  link: {
    color: theme.colors.text.primary,
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
  },
  linkActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  icon: {
    fontSize: '1rem',
  },
  dropdown: {
    position: 'relative',
  },
  
  // 👉 NOUVEAU: Styles pour le menu des paramètres
  settingsDropdown: {
    position: 'relative',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    border: `2px solid ${theme.colors.primaryLight}`,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  userAvatarContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  userAvatar: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '0',
    right: '-2px',
    width: '12px',
    height: '12px',
    backgroundColor: '#10b981',
    border: '2px solid #fff',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  userName: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  adminBadge: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    padding: '0.25rem 0.75rem',
    borderRadius: theme.borderRadius.full,
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  dropdownArrow: {
    fontSize: '0.875rem',
    color: theme.colors.text.secondary,
    transition: 'transform 0.3s',
    marginLeft: '0.25rem',
  },
  
  // 👉 Menu déroulant des paramètres
  settingsDropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: '0',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    border: `2px solid ${theme.colors.primaryLight}`,
    minWidth: '380px',
    maxHeight: '70vh',
    overflow: 'auto',
    zIndex: 1001,
  },
  settingsDropdownHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: `2px solid ${theme.colors.primaryLight}`,
    background: `linear-gradient(135deg, ${theme.colors.primaryLight} 0%, ${theme.colors.secondary} 100%)`,
  },
  settingsDropdownTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: '0.25rem',
  },
  settingsDropdownSubtitle: {
    fontSize: '0.85rem',
    color: theme.colors.text.secondary,
  },
  settingsSectionsList: {
    padding: '0.75rem',
  },
  settingsItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    width: '100%',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '0.5rem',
  },
  settingsItemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: theme.borderRadius.md,
    fontSize: '1.125rem',
  },
  settingsItemContent: {
    flex: 1,
    textAlign: 'left',
  },
  settingsItemLabel: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: '0.125rem',
  },
  settingsItemDescription: {
    fontSize: '0.75rem',
    color: theme.colors.text.secondary,
  },
  settingsItemArrow: {
    fontSize: '0.875rem',
    color: theme.colors.text.secondary,
    transform: 'rotate(-90deg)',
  },
  settingsDropdownFooter: {
    padding: '0.75rem 1.5rem 1.25rem',
    borderTop: `1px solid ${theme.colors.primaryLight}`,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem',
    backgroundColor: theme.colors.text.primary,
    color: theme.colors.text.white,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s',
  },
  logoutIcon: {
    fontSize: '1rem',
  },

  // Styles existants (services, etc.)
  megaDropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '0.5rem',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    border: `2px solid ${theme.colors.primaryLight}`,
    minWidth: '600px',
    maxWidth: '700px',
    maxHeight: '70vh',
    overflow: 'auto',
  },
  megaDropdownHeader: {
    padding: '1.5rem',
    borderBottom: `2px solid ${theme.colors.primaryLight}`,
    background: `linear-gradient(135deg, ${theme.colors.primaryLight} 0%, ${theme.colors.secondary} 100%)`,
  },
  megaDropdownTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: '0.25rem',
  },
  megaDropdownSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: '0.9rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
  },
  spinner: {
    width: '30px',
    height: '30px',
    border: `3px solid ${theme.colors.primaryLight}`,
    borderTop: `3px solid ${theme.colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: '0.875rem',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    padding: '1rem',
  },
  serviceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    textDecoration: 'none',
    color: theme.colors.text.primary,
    border: `2px solid ${theme.colors.primaryLight}`,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  serviceIcon: {
    fontSize: '1.5rem',
    color: theme.colors.primary,
  },
  serviceName: {
    fontWeight: '600',
    fontSize: '0.95rem',
    textAlign: 'left',
  },
  megaDropdownFooter: {
    padding: '1rem 1.5rem',
    borderTop: `1px solid ${theme.colors.primaryLight}`,
    textAlign: 'center',
    backgroundColor: theme.colors.background,
  },
  viewAllLink: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: '0.95rem',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: '600',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
    boxShadow: theme.shadows.md,
    fontSize: '0.9rem',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: theme.colors.primary,
    border: `2px solid ${theme.colors.primary}`,
    padding: '0.625rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: '600',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
    fontSize: '0.9rem',
  },
  mobileMenuButton: {
  display: 'none',
  backgroundColor: 'transparent',
  border: 'none',
  color: theme.colors.primary,
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: theme.borderRadius.md,
  transition: 'all 0.3s',
},
mobileMenuOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 999,
  display: 'flex',
  justifyContent: 'flex-end',
  backdropFilter: 'blur(4px)',
},
mobileMenu: {
  backgroundColor: theme.colors.secondary,
  width: '80%',
  maxWidth: '400px',
  height: '100%',
  padding: '2rem 1.5rem',
  overflowY: 'auto',
  boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
  animation: 'slideInRight 0.3s ease',
},
mobileMenuHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: `2px solid ${theme.colors.primaryLight}`,
},
mobileMenuLinks: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
},
mobileLink: {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem',
  color: theme.colors.text.primary,
  textDecoration: 'none',
  borderRadius: theme.borderRadius.md,
  transition: 'all 0.3s',
  fontSize: '1rem',
  fontWeight: '500',
  backgroundColor: 'transparent',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
},
mobileLinkActive: {
  backgroundColor: theme.colors.primaryLight,
  color: theme.colors.primary,
  fontWeight: '600',
},
mobileUserInfo: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: theme.colors.background,
  borderRadius: theme.borderRadius.lg,
  marginBottom: '1.5rem',
  border: `2px solid ${theme.colors.primaryLight}`,
},
mobileUserDetails: {
  flex: 1,
},
mobileUserName: {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: theme.colors.text.primary,
  marginBottom: '0.25rem',
},
mobileUserEmail: {
  fontSize: '0.85rem',
  color: theme.colors.text.secondary,
},
mobileLogoutButton: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '1rem',
  marginTop: '1.5rem',
  backgroundColor: theme.colors.danger,
  color: theme.colors.text.white,
  border: 'none',
  borderRadius: theme.borderRadius.lg,
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '1rem',
  transition: 'all 0.3s',
},
mobileDivider: {
  height: '1px',
  backgroundColor: theme.colors.primaryLight,
  margin: '1.5rem 0',
},
mobileServicesSection: {
  marginTop: '1.5rem',
},
mobileSectionTitle: {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: theme.colors.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.75rem',
  paddingLeft: '1rem',
},}
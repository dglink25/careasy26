// careasy-frontend/src/pages/Partners.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/publicApi';
import theme from '../config/theme';
import { 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope,
  FaWhatsapp,
  FaSearch,
  FaFilter,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaSpinner
} from 'react-icons/fa';

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomaine, setSelectedDomaine] = useState('all');
  const [domaines, setDomaines] = useState([]);

  useEffect(() => {
    fetchPartners();
    fetchDomaines();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getEntreprises();
      // Filtrer uniquement les entreprises validées
      const validatedPartners = data.filter(p => p.status === 'validated');
      setPartners(validatedPartners);
    } catch (err) {
      console.error('Erreur chargement partenaires:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomaines = async () => {
    try {
      const data = await publicApi.getDomaines();
      setDomaines(data);
    } catch (err) {
      console.error('Erreur chargement domaines:', err);
    }
  };

  // Filtrer les partenaires
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.siege?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDomaine = selectedDomaine === 'all' || 
                          partner.domaines?.some(d => d.id === parseInt(selectedDomaine));
    
    return matchesSearch && matchesDomaine;
  });

  // Statistiques
  const stats = {
    total: partners.length,
    domaines: new Set(partners.flatMap(p => p.domaines?.map(d => d.id) || [])).size,
    cities: new Set(partners.map(p => p.siege).filter(Boolean)).size,
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <FaSpinner style={styles.spinner} />
          <p style={styles.loadingText}>Chargement de nos partenaires...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            <FaBuilding style={styles.heroIcon} />
            Nos Partenaires de Confiance
          </h1>
          <p style={styles.heroSubtitle}>
            Découvrez les entreprises qui font confiance à CarEasy pour développer leur activité au Bénin
          </p>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}>
              <div style={styles.heroStatNumber}>{stats.total}</div>
              <div style={styles.heroStatLabel}>Partenaires</div>
            </div>
            <div style={styles.heroStat}>
              <div style={styles.heroStatNumber}>{stats.domaines}</div>
              <div style={styles.heroStatLabel}>Domaines</div>
            </div>
            <div style={styles.heroStat}>
              <div style={styles.heroStatNumber}>{stats.cities}</div>
              <div style={styles.heroStatLabel}>Villes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={styles.content}>
        <div style={styles.filtersSection}>
          {/* Barre de recherche */}
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher un partenaire, une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={styles.clearButton}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres par domaine */}
          <div style={styles.filterContainer}>
            <FaFilter style={styles.filterIcon} />
            <select
              value={selectedDomaine}
              onChange={(e) => setSelectedDomaine(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Tous les domaines</option>
              {domaines.map(domaine => (
                <option key={domaine.id} value={domaine.id}>
                  {domaine.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Résultats */}
        <div style={styles.resultsHeader}>
          <h2 style={styles.resultsTitle}>
            {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
            {selectedDomaine !== 'all' && ` dans ${domaines.find(d => d.id === parseInt(selectedDomaine))?.name}`}
          </h2>
        </div>

        {/* Liste des partenaires */}
        {filteredPartners.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>Aucun partenaire trouvé</h3>
            <p style={styles.emptyText}>
              Essayez de modifier vos critères de recherche
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedDomaine('all');
              }}
              style={styles.resetButton}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div style={styles.partnersGrid}>
            {filteredPartners.map((partner) => (
              <div key={partner.id} style={styles.partnerCard} className="partner-card">
                {/* En-tête de la carte */}
                <div style={styles.partnerHeader}>
                  {partner.logo ? (
                    <img 
                      src={partner.logo}
                      alt={partner.name}
                      style={styles.partnerLogo}
                    />
                  ) : (
                    <div style={styles.partnerLogoPlaceholder}>
                      <FaBuilding style={styles.logoIcon} />
                    </div>
                  )}
                  <div style={styles.partnerBadge}>
                    <FaCheckCircle style={styles.badgeIcon} />
                    Vérifié
                  </div>
                </div>

                {/* Informations */}
                <div style={styles.partnerBody}>
                  <h3 style={styles.partnerName}>{partner.name}</h3>
                  
                  {partner.siege && (
                    <div style={styles.partnerInfo}>
                      <FaMapMarkerAlt style={styles.infoIcon} />
                      <span style={styles.infoText}>{partner.siege}</span>
                    </div>
                  )}

                  {/* Domaines */}
                  {partner.domaines && partner.domaines.length > 0 && (
                    <div style={styles.domainesContainer}>
                      {partner.domaines.slice(0, 3).map(domaine => (
                        <span key={domaine.id} style={styles.domaineTag}>
                          {domaine.name}
                        </span>
                      ))}
                      {partner.domaines.length > 3 && (
                        <span style={styles.moreTag}>
                          +{partner.domaines.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Services count */}
                  {partner.services && partner.services.length > 0 && (
                    <div style={styles.servicesCount}>
                      <FaStar style={styles.starIcon} />
                      {partner.services.length} service{partner.services.length > 1 ? 's' : ''} disponible{partner.services.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={styles.partnerFooter}>
                  <Link 
                    to={`/entreprises/${partner.id}`}
                    style={styles.viewButton}
                  >
                    Voir l'entreprise
                    <FaArrowRight style={styles.arrowIcon} />
                  </Link>
                  
                  <div style={styles.contactButtons}>
                    {partner.whatsapp_phone && (
                      <a
                        href={`https://wa.me/${partner.whatsapp_phone.replace(/\s+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.whatsappButton}
                        title="WhatsApp"
                      >
                        <FaWhatsapp />
                      </a>
                    )}
                    {partner.call_phone && (
                      <a
                        href={`tel:${partner.call_phone}`}
                        style={styles.phoneButton}
                        title="Appeler"
                      >
                        <FaPhone />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div style={styles.ctaSection}>
          <h2 style={styles.ctaTitle}>Vous souhaitez devenir partenaire ?</h2>
          <p style={styles.ctaText}>
            Rejoignez notre réseau de partenaires de confiance et développez votre activité avec CarEasy
          </p>
          <Link to="/register" style={styles.ctaButton}>
            Devenir partenaire
          </Link>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .partner-card {
          animation: fadeIn 0.4s ease-out;
          transition: all 0.3s ease;
        }
        
        .partner-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  
  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  },
  spinner: {
    fontSize: '3rem',
    color: theme.colors.primary,
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: '1.125rem',
  },
  
  // Hero
  hero: {
    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #991b1b 100%)`,
    padding: '4rem 2rem',
    color: '#fff',
  },
  heroContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: '800',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  heroIcon: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    marginBottom: '3rem',
    opacity: 0.95,
    maxWidth: '800px',
    margin: '0 auto 3rem',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '2rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  heroStat: {
    textAlign: 'center',
  },
  heroStatNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
  },
  heroStatLabel: {
    fontSize: '0.95rem',
    opacity: 0.9,
    fontWeight: '500',
  },
  
  // Content
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '3rem 2rem',
  },
  
  // Filtres
  filtersSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
    marginBottom: '3rem',
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.25rem',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.875rem 3rem 0.875rem 3rem',
    border: '2px solid #e2e8f0',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'all 0.3s',
  },
  clearButton: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  filterContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#fff',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: theme.borderRadius.lg,
  },
  filterIcon: {
    fontSize: '1.25rem',
    color: theme.colors.primary,
  },
  filterSelect: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: theme.colors.text.primary,
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  
  // Résultats
  resultsHeader: {
    marginBottom: '2rem',
  },
  resultsTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  
  // Grid des partenaires
  partnersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '2rem',
    marginBottom: '4rem',
  },
  partnerCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    border: `2px solid ${theme.colors.primaryLight}`,
    boxShadow: theme.shadows.md,
    display: 'flex',
    flexDirection: 'column',
  },
  partnerHeader: {
    position: 'relative',
    padding: '2rem',
    backgroundColor: theme.colors.secondary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  partnerLogo: {
    width: '100px',
    height: '100px',
    borderRadius: theme.borderRadius.lg,
    objectFit: 'cover',
    border: `3px solid ${theme.colors.primary}`,
    backgroundColor: '#fff',
  },
  partnerLogoPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `3px solid ${theme.colors.primary}`,
  },
  logoIcon: {
    fontSize: '3rem',
    color: theme.colors.primary,
  },
  partnerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '0.5rem 1rem',
    borderRadius: theme.borderRadius.full,
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  badgeIcon: {
    fontSize: '1rem',
  },
  
  // Body
  partnerBody: {
    padding: '1.5rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  partnerName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: '0.5rem',
  },
  partnerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: theme.colors.text.secondary,
    fontSize: '0.95rem',
  },
  infoIcon: {
    fontSize: '1rem',
    color: theme.colors.primary,
  },
  infoText: {
    flex: 1,
  },
  domainesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  domaineTag: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.primary,
    padding: '0.375rem 0.75rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  moreTag: {
    backgroundColor: '#e2e8f0',
    color: theme.colors.text.secondary,
    padding: '0.375rem 0.75rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  servicesCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: theme.colors.primary,
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: 'auto',
  },
  starIcon: {
    fontSize: '1rem',
  },
  
  // Footer
  partnerFooter: {
    padding: '1.5rem',
    borderTop: `1px solid ${theme.colors.primaryLight}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    padding: '0.75rem 1.25rem',
    borderRadius: theme.borderRadius.lg,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s',
    flex: 1,
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: '0.875rem',
  },
  contactButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  whatsappButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#25D366',
    color: '#fff',
    fontSize: '1.125rem',
    textDecoration: 'none',
    transition: 'all 0.3s',
  },
  phoneButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '1rem',
    textDecoration: 'none',
    transition: 'all 0.3s',
  },
  
  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.xl,
    border: `2px dashed ${theme.colors.primaryLight}`,
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: '0.75rem',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: '1rem',
    marginBottom: '2rem',
  },
  resetButton: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    border: 'none',
    padding: '0.875rem 2rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  
  // CTA
  ctaSection: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  ctaTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: '1rem',
  },
  ctaText: {
    fontSize: '1.125rem',
    color: theme.colors.text.secondary,
    marginBottom: '2rem',
    maxWidth: '600px',
    margin: '0 auto 2rem',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    padding: '1rem 2.5rem',
    borderRadius: theme.borderRadius.lg,
    textDecoration: 'none',
    fontSize: '1.125rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: theme.shadows.lg,
  },
};
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';

export default function PublicServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedDomaine, setSelectedDomaine] = useState(searchParams.get('type') || 'all');

  useEffect(() => {
    fetchData();
  }, []);

  // Mettre à jour les filtres depuis l'URL
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedDomaine(searchParams.get('type') || 'all');
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, domainesData] = await Promise.all([
        publicApi.getServices(),
        publicApi.getDomaines()
      ]);
      setServices(servicesData);
      setDomaines(domainesData);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des paramètres URL
  const updateFilters = (search, domaine) => {
    const params = {};
    if (search) params.search = search;
    if (domaine !== 'all') params.type = domaine;
    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateFilters(value, selectedDomaine);
  };

  const handleDomaineChange = (domaineId) => {
    setSelectedDomaine(domaineId);
    updateFilters(searchTerm, domaineId);
  };

  // Filtrage des services
  const filteredServices = services.filter(s => {
    const matchSearch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.entreprise?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.domaine?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descriptions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchDomaine = selectedDomaine === 'all' || 
      s.domaine?.id === parseInt(selectedDomaine);
    
    return matchSearch && matchDomaine;
  });

  // Statistiques
  const stats = {
    total: services.length,
    filtered: filteredServices.length,
    domaines: new Set(services.map(s => s.domaine?.id).filter(Boolean)).size,
    withPrice: services.filter(s => s.price).length
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>🛠️ Services Automobiles</h1>
          <p style={styles.heroSubtitle}>
            Découvrez {stats.total} services professionnels répartis dans {stats.domaines} domaines
          </p>
        </div>

        {/* Statistiques rapides */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Services disponibles</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.domaines}</div>
            <div style={styles.statLabel}>Domaines d'expertise</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.withPrice}</div>
            <div style={styles.statLabel}>Avec tarifs affichés</div>
          </div>
        </div>

        {/* Filtres */}
        <div style={styles.filtersSection}>
          {/* Recherche */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres par domaine */}
          <div style={styles.domainesFilter}>
            <button
              onClick={() => handleDomaineChange('all')}
              style={{
                ...styles.domaineButton,
                ...(selectedDomaine === 'all' ? styles.domaineButtonActive : {})
              }}
            >
              Tous ({services.length})
            </button>
            {domaines.map(domaine => {
              const count = services.filter(s => s.domaine?.id === domaine.id).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={domaine.id}
                  onClick={() => handleDomaineChange(domaine.id.toString())}
                  style={{
                    ...styles.domaineButton,
                    ...(selectedDomaine === domaine.id.toString() ? styles.domaineButtonActive : {})
                  }}
                >
                  {domaine.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* Résultats */}
        <div style={styles.resultsHeader}>
          <h2 style={styles.resultsTitle}>
            {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} 
            {searchTerm && ` pour "${searchTerm}"`}
            {selectedDomaine !== 'all' && ` dans "${domaines.find(d => d.id === parseInt(selectedDomaine))?.name}"`}
          </h2>
          {(searchTerm || selectedDomaine !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedDomaine('all');
                setSearchParams({});
              }}
              style={styles.resetButton}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {filteredServices.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>Aucun service trouvé</h3>
            <p style={styles.emptyText}>
              {searchTerm || selectedDomaine !== 'all'
                ? "Aucun résultat ne correspond à vos critères. Essayez d'autres filtres."
                : "Aucun service disponible pour le moment."
              }
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredServices.map((service) => (
              <Link
                key={service.id}
                to={`/service/${service.id}`}
                style={styles.card}
                className="service-card"
              >
                {/* Image */}
                {service.medias && service.medias.length > 0 ? (
                  <div style={styles.cardImage}>
                    <img 
                      src={service.medias[0]}
                      alt={service.name}
                      style={styles.image}
                    />
                    {service.medias.length > 1 && (
                      <div style={styles.imageBadge}>
                        +{service.medias.length - 1} photo{service.medias.length > 2 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <div style={styles.placeholderIcon}>🛠️</div>
                  </div>
                )}

                {/* Contenu */}
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{service.name}</h3>
                  
                  {service.domaine && (
                    <div style={styles.domaineTag}>
                      🏷️ {service.domaine.name}
                    </div>
                  )}

                  {service.descriptions && (
                    <p style={styles.description}>
                      {service.descriptions.substring(0, 120)}
                      {service.descriptions.length > 120 ? '...' : ''}
                    </p>
                  )}

                  <div style={styles.details}>
                    <div style={styles.price}>
                      {service.price 
                        ? `${service.price.toLocaleString()} FCFA`
                        : 'Prix sur demande'
                      }
                    </div>
                    {service.is_open_24h ? (
                      <div style={styles.hours}>🕐 24h/24</div>
                    ) : service.start_time && service.end_time ? (
                      <div style={styles.hours}>
                        🕐 {service.start_time} - {service.end_time}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Footer */}
                <div style={styles.cardFooter}>
                  {service.entreprise && (
                    <div style={styles.entrepriseInfo}>
                      {service.entreprise.logo ? (
                        <img 
                          src={service.entreprise.logo}
                          alt={service.entreprise.name}
                          style={styles.entrepriseLogo}
                        />
                      ) : (
                        <div style={styles.logoPlaceholder}>🏢</div>
                      )}
                      <span style={styles.entrepriseName}>
                        {service.entreprise.name}
                      </span>
                    </div>
                  )}
                  <span style={styles.viewLink}>Voir →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .service-card {
          transition: all 0.3s ease;
          animation: fadeIn 0.5s ease-out;
          text-decoration: none;
          color: inherit;
        }
        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    paddingTop: '2rem',
    paddingBottom: '4rem',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1rem',
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
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '1.125rem',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem 1rem',
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1rem',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#64748b',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '0.5rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  filtersSection: {
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '1rem 3rem 1rem 1.5rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: '#fff',
  },
  clearButton: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  domainesFilter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  domaineButton: {
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  domaineButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    color: '#fff',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '0.75rem',
    marginBottom: '2rem',
    border: '2px solid #dc2626',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  resultsTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resetButton: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: '4rem 2rem',
    borderRadius: '1.5rem',
    textAlign: 'center',
    border: '2px dashed #e2e8f0',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '1.125rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '2px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardImage: {
    position: 'relative',
    height: '200px',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageBadge: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: '200px',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: '4rem',
  },
  cardBody: {
    padding: '1.5rem',
    flex: 1,
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.75rem',
  },
  domaineTag: {
    display: 'inline-block',
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
  },
  description: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  price: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: '1.125rem',
  },
  hours: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  cardFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entrepriseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  entrepriseLogo: {
    width: '40px',
    height: '40px',
    borderRadius: '0.5rem',
    objectFit: 'cover',
  },
  logoPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '0.5rem',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
  },
  entrepriseName: {
    fontWeight: '600',
    color: '#1e293b',
  },
  viewLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
};
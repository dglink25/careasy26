// careasy-frontend/src/pages/public/PublicEntreprises.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import ContactModal from '../../components/ContactModal';
import ChatModal from '../../components/Chat/ChatModal';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingAction } from '../../hooks/usePendingAction';
import theme from '../../config/theme';

import {
  FiSearch, FiFilter, FiChevronRight, FiMapPin, FiTool,
  FiStar, FiCheckCircle, FiClock, FiTrendingUp, FiGlobe,
  FiShield, FiUsers, FiTag, FiGrid, FiList, FiHeart,
  FiShare2, FiNavigation, FiArrowRight, FiChevronDown,
  FiRefreshCw, FiX, FiAlertCircle, FiHome, FiBriefcase, FiSettings
} from 'react-icons/fi';
import {
  MdBusiness, MdVerified, MdOutlineLocationOn, MdOutlineWork,
  MdOutlineDirectionsCar, MdOutlineBuild, MdOutlineCarRepair,
  MdOutlineCleaningServices, MdOutlineElectricalServices,
  MdOutlineLocalCarWash, MdOutlineCarRental, MdOutlineDirectionsBike,
  MdOutlineDescription
} from 'react-icons/md';
import { FaComments } from 'react-icons/fa';

export default function PublicEntreprises() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { requireAuth, shouldOpenModal } = usePendingAction({
    redirectPath: '/entreprises',
  });

  const pendingOpenRef = useRef(shouldOpenModal());

  const [entreprises, setEntreprises] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showContactModal, setShowContactModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);

  const searchTerm = searchParams.get('search') || '';
  const selectedDomaine = searchParams.get('domaine') || 'all';
  const viewMode = searchParams.get('view') || 'grid';

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteEntreprises, setFavoriteEntreprises] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [entreprisesData, domainesData] = await Promise.all([
        publicApi.getEntreprises(),
        publicApi.getDomaines()
      ]);
      setEntreprises(entreprisesData);
      setDomaines(domainesData);

      if (pendingOpenRef.current) {
        pendingOpenRef.current = false;
        const saved = window.history.state?.usr?.selectedEntrepriseId;
        if (saved) {
          const found = entreprisesData.find(e => e.id === saved);
          if (found) {
            setSelectedEntreprise(found);
            setShowContactModal(true);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement des données:', err);
      setError('Erreur lors du chargement des entreprises. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSearch = (value) => {
    setLocalSearchTerm(value);
    const params = {};
    if (value) params.search = value;
    if (selectedDomaine !== 'all') params.domaine = selectedDomaine;
    if (viewMode !== 'grid') params.view = viewMode;
    setSearchParams(params);
  };

  const handleDomaineChange = (domaineId) => {
    const params = {};
    if (localSearchTerm) params.search = localSearchTerm;
    if (domaineId !== 'all') params.domaine = domaineId;
    if (viewMode !== 'grid') params.view = viewMode;
    setSearchParams(params);
  };

  const handleViewModeChange = (mode) => {
    const params = {};
    if (localSearchTerm) params.search = localSearchTerm;
    if (selectedDomaine !== 'all') params.domaine = selectedDomaine;
    if (mode !== 'grid') params.view = mode;
    setSearchParams(params);
  };

  const handleClearFilters = () => { setLocalSearchTerm(''); setSearchParams({}); };
  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));

  const handleOpenContact = (entreprise, e) => {
    e.stopPropagation();
    setSelectedEntreprise(entreprise);

    requireAuth(() => {
      setSelectedEntreprise(entreprise);
      setShowContactModal(true);
    });

    if (!user) {
      const currentUsr = window.history.state?.usr ?? {};
      window.history.replaceState(
        { ...window.history.state, usr: { ...currentUsr, selectedEntrepriseId: entreprise.id } },
        ''
      );
    }
  };

  const getDomaineIcon = (domaineName) => {
    const iconMap = {
      'Mécanique': <FiTool style={styles.domaineIcon} />,
      'Carrosserie': <MdOutlineBuild style={styles.domaineIcon} />,
      'Électricité': <MdOutlineElectricalServices style={styles.domaineIcon} />,
      'Peinture': <MdOutlineDescription style={styles.domaineIcon} />,
      'Vidange': <FiSettings style={styles.domaineIcon} />,
      'Pneumatique': <MdOutlineDirectionsCar style={styles.domaineIcon} />,
      'Lavage': <MdOutlineCleaningServices style={styles.domaineIcon} />,
      'Location': <MdOutlineCarRental style={styles.domaineIcon} />,
      'Moto': <MdOutlineDirectionsBike style={styles.domaineIcon} />,
      'Diagnostic': <FiBriefcase style={styles.domaineIcon} />,
      'Carburant': <FiHome style={styles.domaineIcon} />,
      'Batterie': <MdOutlineElectricalServices style={styles.domaineIcon} />,
      'Réparation': <MdOutlineCarRepair style={styles.domaineIcon} />,
      'Entretien': <FiSettings style={styles.domaineIcon} />,
      'Nettoyage': <MdOutlineCleaningServices style={styles.domaineIcon} />
    };
    return iconMap[domaineName] || <MdOutlineDirectionsCar style={styles.domaineIcon} />;
  };

  const filteredEntreprises = useMemo(() => {
    return entreprises.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        e.pdg_full_name?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        e.siege?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(localSearchTerm.toLowerCase());
      const matchDomaine = selectedDomaine === 'all' ||
        e.domaines?.some(d => d.id === parseInt(selectedDomaine));
      return matchSearch && matchDomaine;
    });
  }, [entreprises, localSearchTerm, selectedDomaine]);

  const toggleFavorite = (entrepriseId) => {
    setFavoriteEntreprises(prev =>
      prev.includes(entrepriseId) ? prev.filter(id => id !== entrepriseId) : [...prev, entrepriseId]
    );
  };

  const getEntrepriseStats = useMemo(() => {
    const total = entreprises.length;
    const avecServices = entreprises.filter(e => e.services && e.services.length > 0).length;
    const avecLogo = entreprises.filter(e => e.logo).length;
    const certifies = entreprises.filter(e => e.certificate_number).length;
    return { total, avecServices, avecLogo, certifies };
  }, [entreprises]);

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Chargement des entreprises...</p>
        <p style={styles.loadingSubtext}>Préparation de notre répertoire professionnel</p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>

        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
              <MdOutlineDirectionsCar style={styles.heroTitleIcon} />
              Trouvez Votre Expert Automobile
            </h1>
            <p style={styles.heroSubtitle}>
              Connectez-vous avec <span style={styles.highlight}>{getEntrepriseStats.total}</span> entreprises
              certifiées et professionnelles à travers le Bénin
            </p>
            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <FiCheckCircle style={styles.heroStatIcon} />
                <div style={styles.heroStatContent}>
                  <div style={styles.heroStatNumber}>{getEntrepriseStats.certifies}</div>
                  <div style={styles.heroStatLabel}>Entreprises certifiées</div>
                </div>
              </div>
              <div style={styles.heroStat}>
                <MdOutlineWork style={styles.heroStatIcon} />
                <div style={styles.heroStatContent}>
                  <div style={styles.heroStatNumber}>{getEntrepriseStats.avecServices}</div>
                  <div style={styles.heroStatLabel}>Avec services détaillés</div>
                </div>
              </div>
              <div style={styles.heroStat}>
                <FiShield style={styles.heroStatIcon} />
                <div style={styles.heroStatContent}>
                  <div style={styles.heroStatNumber}>{getEntrepriseStats.avecLogo}</div>
                  <div style={styles.heroStatLabel}>Profils vérifiés</div>
                </div>
              </div>
            </div>
          </div>
          <div style={styles.heroImage}>
            <div style={styles.heroImagePlaceholder}>
              <MdOutlineDirectionsCar style={styles.heroIllustration} />
            </div>
          </div>
        </div>

        {/* Barre de contrôle */}
        <div style={styles.controlBar}>
          <div style={styles.searchContainer}>
            <FiSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Rechercher une entreprise, un service, une ville..."
              value={localSearchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={styles.searchInput}
            />
            {localSearchTerm && (
              <button onClick={() => handleSearch('')} style={styles.clearSearchButton}><FiX /></button>
            )}
          </div>
          <div style={styles.controlActions}>
            <button onClick={() => setShowFilters(!showFilters)} style={styles.filterToggleButton}>
              <FiFilter style={styles.filterToggleIcon} />
              <span style={{ display: 'inline-block' }}>Filtres</span>
              {(localSearchTerm || selectedDomaine !== 'all') && <span style={styles.activeFilterIndicator}></span>}
            </button>
            <div style={styles.viewModeButtons}>
              <button onClick={() => handleViewModeChange('grid')} style={{ ...styles.viewModeButton, ...(viewMode === 'grid' ? styles.viewModeButtonActive : {}) }}><FiGrid /></button>
              <button onClick={() => handleViewModeChange('list')} style={{ ...styles.viewModeButton, ...(viewMode === 'list' ? styles.viewModeButtonActive : {}) }}><FiList /></button>
            </div>
            <button onClick={handleRefresh} style={styles.refreshButton} disabled={refreshing}>
              <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.refreshIcon} />
            </button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div style={styles.filtersPanel}>
            <div style={styles.filtersHeader}>
              <h3 style={styles.filtersTitle}><FiFilter style={styles.filtersTitleIcon} />Filtres et Options</h3>
              <button onClick={handleClearFilters} style={styles.clearAllButton} disabled={!localSearchTerm && selectedDomaine === 'all'}>
                <FiX style={styles.clearAllIcon} />Tout effacer
              </button>
            </div>
            <div style={styles.filterSection}>
              <h4 style={styles.filterSectionTitle}><FiTag style={styles.filterSectionIcon} />Domaine d'activité</h4>
              <div style={styles.domainesGrid}>
                <button onClick={() => handleDomaineChange('all')} style={{ ...styles.domaineButton, ...(selectedDomaine === 'all' ? styles.domaineButtonActive : {}) }}>
                  <FiGlobe style={styles.domaineButtonIcon} />Tous les domaines<span style={styles.domaineCount}>{entreprises.length}</span>
                </button>
                {domaines.map(domaine => {
                  const count = entreprises.filter(e => e.domaines?.some(d => d.id === domaine.id)).length;
                  if (count === 0) return null;
                  return (
                    <button key={domaine.id} onClick={() => handleDomaineChange(domaine.id.toString())}
                      style={{ ...styles.domaineButton, ...(selectedDomaine === domaine.id.toString() ? styles.domaineButtonActive : {}) }}>
                      {getDomaineIcon(domaine.name)}{domaine.name}<span style={styles.domaineCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={styles.filterStats}>
              <div style={styles.filterStat}><div style={styles.filterStatNumber}>{filteredEntreprises.length}</div><div style={styles.filterStatLabel}>Résultats</div></div>
              <div style={styles.filterStat}><div style={styles.filterStatNumber}>{entreprises.length > 0 ? Math.round((filteredEntreprises.length / entreprises.length) * 100) : 0}%</div><div style={styles.filterStatLabel}>Correspondance</div></div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={styles.errorAlert}>
            <FiAlertCircle style={styles.errorAlertIcon} />
            <div style={styles.errorAlertContent}>
              <div style={styles.errorAlertTitle}>Erreur de chargement</div>
              <p style={styles.errorAlertText}>{error}</p>
            </div>
            <button onClick={fetchData} style={styles.errorAlertButton}>Réessayer</button>
          </div>
        )}

        {/* Résultats */}
        {filteredEntreprises.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIllustration}><FiSearch style={styles.emptyIcon} /></div>
            <h3 style={styles.emptyTitle}>Aucune entreprise correspondante</h3>
            <p style={styles.emptyText}>
              {localSearchTerm || selectedDomaine !== 'all'
                ? "Aucun résultat ne correspond à vos critères."
                : "Notre répertoire est en cours de mise à jour."}
            </p>
            <div style={styles.emptyActions}>
              {localSearchTerm && <button onClick={() => handleSearch('')} style={styles.emptyActionButton}><FiX style={styles.emptyActionIcon} />Effacer la recherche</button>}
              {selectedDomaine !== 'all' && <button onClick={() => handleDomaineChange('all')} style={styles.emptyActionButton}><FiFilter style={styles.emptyActionIcon} />Réinitialiser les filtres</button>}
            </div>
          </div>
        ) : (
          <>
            {/* En-tête résultats */}
            <div style={styles.resultsHeader}>
              <div style={styles.resultsInfo}>
                <h2 style={styles.resultsTitle}>
                  {filteredEntreprises.length} entreprise{filteredEntreprises.length > 1 ? 's' : ''}
                  {localSearchTerm ? ` pour "${localSearchTerm}"` : ''}
                  {selectedDomaine !== 'all' ? ` dans "${domaines.find(d => d.id === parseInt(selectedDomaine))?.name || ''}"` : ''}
                </h2>
                <div style={styles.resultsStats}>
                  <span style={styles.resultsStat}><FiTrendingUp style={styles.resultsStatIcon} />{getEntrepriseStats.total} au total</span>
                  {selectedDomaine !== 'all' && <span style={styles.resultsStat}><FiFilter style={styles.resultsStatIcon} />Filtre actif</span>}
                </div>
              </div>
              <div style={styles.resultsSort}>
                <span style={styles.resultsSortLabel}>Trier par :</span>
                <select style={styles.sortSelect}>
                  <option value="relevance">Pertinence</option>
                  <option value="name">Nom (A-Z)</option>
                  <option value="services">Nombre de services</option>
                  <option value="newest">Plus récent</option>
                </select>
              </div>
            </div>

            {/* Grille/Liste */}
            <div style={viewMode === 'grid' ? styles.grid : styles.listContainer}>
              {filteredEntreprises.map((entreprise) => (
                <div
                  key={entreprise.id}
                  style={viewMode === 'grid' ? styles.card : styles.listCard}
                  className="entreprise-card"
                  onClick={() => navigate(`/entreprises/${entreprise.id}`)}
                >
                  {/* Header carte */}
                  <div style={viewMode === 'grid' ? styles.cardHeader : styles.listCardHeader}>
                    <div style={viewMode === 'grid' ? styles.cardImage : styles.listCardImage}>
                      {entreprise.logo && !imageErrors[entreprise.id] ? (
                        <img src={entreprise.logo} alt={entreprise.name} style={viewMode === 'grid' ? styles.logo : styles.listLogo} onError={() => handleImageError(entreprise.id)} />
                      ) : null}
                      <div style={{ ...(viewMode === 'grid' ? styles.logoPlaceholder : styles.listLogoPlaceholder), display: (entreprise.logo && !imageErrors[entreprise.id]) ? 'none' : 'flex' }}>
                        <MdBusiness style={viewMode === 'grid' ? styles.logoPlaceholderIcon : styles.listLogoPlaceholderIcon} />
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(entreprise.id); }} style={styles.favoriteButton}>
                      <FiHeart style={{ ...styles.favoriteIcon, color: favoriteEntreprises.includes(entreprise.id) ? '#ef4444' : '#94a3b8', fill: favoriteEntreprises.includes(entreprise.id) ? '#ef4444' : 'none' }} />
                    </button>
                  </div>

                  {/* Corps */}
                  <div style={viewMode === 'grid' ? styles.cardBody : styles.listCardBody}>
                    <h3 style={viewMode === 'grid' ? styles.cardTitle : styles.listCardTitle}>{entreprise.name}</h3>
                    {entreprise.siege && (
                      <div style={styles.location}>
                        <MdOutlineLocationOn style={styles.locationIcon} />
                        <span style={styles.locationText}>{entreprise.siege}</span>
                      </div>
                    )}
                    {entreprise.description && (
                      <p style={viewMode === 'grid' ? styles.cardDescription : styles.listCardDescription}>
                        {entreprise.description.length > (viewMode === 'grid' ? 100 : 150) ? `${entreprise.description.substring(0, viewMode === 'grid' ? 100 : 150)}...` : entreprise.description}
                      </p>
                    )}
                    {entreprise.domaines?.length > 0 && (
                      <div style={styles.domainesContainer}>
                        <div style={styles.domainesLabel}><FiTool style={styles.domainesLabelIcon} />Spécialités</div>
                        <div style={styles.domainesTags}>
                          {entreprise.domaines.slice(0, viewMode === 'grid' ? 3 : 4).map((domaine) => (
                            <span key={domaine.id} style={styles.domaineTag}>{getDomaineIcon(domaine.name)}{domaine.name}</span>
                          ))}
                          {entreprise.domaines.length > (viewMode === 'grid' ? 3 : 4) && <span style={styles.moreTag}>+{entreprise.domaines.length - (viewMode === 'grid' ? 3 : 4)}</span>}
                        </div>
                      </div>
                    )}
                    {entreprise.services?.length > 0 && (
                      <div style={styles.servicesInfo}>
                        <MdOutlineWork style={styles.servicesIcon} />
                        <span style={styles.servicesText}>{entreprise.services.length} service{entreprise.services.length > 1 ? 's' : ''} disponible{entreprise.services.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={viewMode === 'grid' ? styles.cardFooter : styles.listCardFooter}>
                    <div style={viewMode === 'grid' ? styles.cardActions : styles.listCardActions}>
                      <button
                        onClick={(e) => handleOpenContact(entreprise, e)}
                        style={styles.contactButton}
                        className="contact-btn"
                      >
                        <FaComments style={styles.contactIcon} />
                        Contacter
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/entreprises/${entreprise.id}`); }}
                        style={styles.viewButton}
                      >
                        Voir les détails
                        <FiArrowRight style={styles.viewButtonIcon} />
                      </button>
                    </div>
                    {!user && (
                      <p style={styles.cardAuthHint}> Connexion requise pour contacter</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredEntreprises.length > 0 && (
              <div style={styles.pagination}>
                <div style={styles.paginationInfo}>Affichage de 1 à {filteredEntreprises.length} sur {entreprises.length} entreprises</div>
                <div style={styles.paginationControls}>
                  <button style={styles.paginationButton} disabled><FiChevronRight style={{ transform: 'rotate(180deg)' }} /></button>
                  <span style={styles.paginationPage}>Page 1</span>
                  <button style={styles.paginationButton}><FiChevronRight /></button>
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        {filteredEntreprises.length > 0 && (
          <div style={styles.ctaSection}>
            <div style={styles.ctaContent}>
              <FiStar style={styles.ctaIcon} />
              <div>
                <h3 style={styles.ctaTitle}>Trouvez l'expert qu'il vous faut</h3>
                <p style={styles.ctaText}>Comparez les prestataires, consultez les avis et prenez rendez-vous en ligne.</p>
              </div>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={styles.ctaButton}>
                <FiNavigation style={styles.ctaButtonIcon} />Retour en haut
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showContactModal && selectedEntreprise && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          entreprise={selectedEntreprise}
          onChat={() => { setShowContactModal(false); setTimeout(() => setShowChatModal(true), 200); }}
        />
      )}

      {user && showChatModal && selectedEntreprise && (
        <ChatModal
          receiverId={selectedEntreprise.prestataire_id}
          receiverName={selectedEntreprise.name || 'Prestataire'}
          onClose={() => { setSelectedEntreprise(null); setShowChatModal(false); }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        
        .entreprise-card { 
          transition: all 0.3s ease; 
          cursor: pointer; 
          animation: fadeIn 0.5s ease-out; 
        }
        .entreprise-card:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 15px 40px rgba(0,0,0,0.15); 
        }
        .contact-btn { 
          transition: all 0.2s ease; 
        }
        .contact-btn:hover { 
          filter: brightness(1.1); 
          transform: translateY(-1px); 
        }
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .grid-container { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; }
        }
        
        @media (max-width: 768px) {
          .grid-container { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { 
    minHeight: '100vh', 
    backgroundColor: '#f8fafc', 
    padding: 'clamp(1rem, 4vw, 2rem) 0' 
  },
  content: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '0 clamp(1rem, 4vw, 1.5rem)' 
  },
  loadingContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '60vh', 
    gap: '1rem' 
  },
  spinner: { 
    width: '50px', 
    height: '50px', 
    border: `4px solid ${theme.colors.primaryLight}`, 
    borderTop: `4px solid ${theme.colors.primary}`, 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite' 
  },
  loadingText: { 
    color: theme.colors.text.secondary, 
    fontSize: 'clamp(1rem, 4vw, 1.125rem)' 
  },
  loadingSubtext: { 
    color: '#94a3b8', 
    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' 
  },
  
  // Hero responsive
  hero: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
    gap: 'clamp(1.5rem, 5vw, 3rem)', 
    alignItems: 'center', 
    marginBottom: 'clamp(2rem, 5vw, 3rem)', 
    padding: 'clamp(1rem, 4vw, 2rem) 0' 
  },
  heroContent: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'clamp(1rem, 3vw, 1.5rem)' 
  },
  heroTitle: { 
    fontSize: 'clamp(1.5rem, 5vw, 3rem)', 
    fontWeight: '800', 
    color: '#1e293b', 
    margin: 0, 
    lineHeight: '1.2', 
    display: 'flex', 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    gap: 'clamp(0.5rem, 2vw, 1rem)' 
  },
  heroTitleIcon: { 
    fontSize: 'clamp(2rem, 6vw, 3rem)', 
    color: '#ef4444' 
  },
  heroSubtitle: { 
    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', 
    color: '#64748b', 
    lineHeight: '1.6' 
  },
  highlight: { 
    color: '#ef4444', 
    fontWeight: '700' 
  },
  heroStats: { 
    display: 'flex', 
    gap: 'clamp(1rem, 4vw, 2rem)', 
    flexWrap: 'wrap' 
  },
  heroStat: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(0.5rem, 2vw, 0.75rem)' 
  },
  heroStatIcon: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    color: '#ef4444' 
  },
  heroStatContent: { 
    display: 'flex', 
    flexDirection: 'column' 
  },
  heroStatNumber: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    fontWeight: '700', 
    color: '#1e293b' 
  },
  heroStatLabel: { 
    fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)', 
    color: '#64748b' 
  },
  heroImage: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  heroImagePlaceholder: { 
    width: 'clamp(150px, 30vw, 250px)', 
    height: 'clamp(150px, 30vw, 250px)', 
    backgroundColor: '#dbeafe', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  heroIllustration: { 
    fontSize: 'clamp(4rem, 12vw, 8rem)', 
    color: '#ef4444' 
  },
  
  // Control bar responsive
  controlBar: { 
    backgroundColor: '#fff', 
    padding: 'clamp(1rem, 3vw, 1.5rem)', 
    borderRadius: theme.borderRadius.lg, 
    border: '1px solid #e2e8f0', 
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)', 
    display: 'flex', 
    gap: 'clamp(0.75rem, 2vw, 1.5rem)', 
    alignItems: 'center', 
    flexWrap: 'wrap' 
  },
  searchContainer: { 
    flex: '1', 
    position: 'relative', 
    minWidth: 'clamp(200px, 50%, 300px)' 
  },
  searchIcon: { 
    position: 'absolute', 
    left: 'clamp(0.75rem, 2vw, 1rem)', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
    color: '#94a3b8' 
  },
  searchInput: { 
    width: '100%', 
    padding: 'clamp(0.75rem, 2vw, 0.875rem) clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 0.875rem) clamp(2rem, 6vw, 3rem)', 
    border: '1px solid #e2e8f0', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.875rem, 2.5vw, 0.95rem)', 
    outline: 'none' 
  },
  clearSearchButton: { 
    position: 'absolute', 
    right: 'clamp(0.5rem, 1.5vw, 1rem)', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    backgroundColor: 'transparent', 
    border: 'none', 
    color: '#94a3b8', 
    fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
    cursor: 'pointer', 
    padding: 0, 
    display: 'flex', 
    alignItems: 'center' 
  },
  controlActions: { 
    display: 'flex', 
    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
    alignItems: 'center', 
    flexWrap: 'wrap' 
  },
  filterToggleButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(0.25rem, 1.5vw, 0.5rem)', 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.75rem, 2vw, 1.25rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '500', 
    color: '#475569', 
    cursor: 'pointer', 
    position: 'relative' 
  },
  filterToggleIcon: { 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' 
  },
  activeFilterIndicator: { 
    position: 'absolute', 
    top: '-5px', 
    right: '-5px', 
    width: '10px', 
    height: '10px', 
    backgroundColor: '#ef4444', 
    borderRadius: '50%' 
  },
  viewModeButtons: { 
    display: 'flex', 
    gap: '0.25rem', 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    borderRadius: theme.borderRadius.md, 
    padding: '0.25rem' 
  },
  viewModeButton: { 
    backgroundColor: 'transparent', 
    border: 'none', 
    padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', 
    borderRadius: theme.borderRadius.sm, 
    fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)', 
    color: '#94a3b8', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  viewModeButtonActive: { 
    backgroundColor: '#fff', 
    color: '#ef4444', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
  },
  refreshButton: { 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.5rem, 1.5vw, 0.625rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    color: '#475569', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center' 
  },
  refreshIcon: { fontSize: '1rem' },
  refreshingIcon: { fontSize: '1rem', animation: 'spin 1s linear infinite' },
  
  // Filters panel responsive
  filtersPanel: { 
    backgroundColor: '#fff', 
    borderRadius: theme.borderRadius.lg, 
    border: '1px solid #e2e8f0', 
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)', 
    padding: 'clamp(1rem, 3vw, 1.5rem)', 
    animation: 'slideIn 0.3s ease-out' 
  },
  filtersHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)', 
    flexWrap: 'wrap', 
    gap: '1rem' 
  },
  filtersTitle: { 
    fontSize: 'clamp(1rem, 3vw, 1.125rem)', 
    fontWeight: '600', 
    color: '#1e293b', 
    margin: 0, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem' 
  },
  filtersTitleIcon: { 
    fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
    color: '#3b82f6' 
  },
  clearAllButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    backgroundColor: 'transparent', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    color: '#64748b', 
    cursor: 'pointer' 
  },
  clearAllIcon: { fontSize: '1rem' },
  filterSection: { marginBottom: 'clamp(1rem, 3vw, 1.5rem)' },
  filterSectionTitle: { 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: 'clamp(0.75rem, 2vw, 1rem)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem' 
  },
  filterSectionIcon: { 
    fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
    color: '#94a3b8' 
  },
  domainesGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 25vw, 200px), 1fr))', 
    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' 
  },
  domaineButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    color: '#475569', 
    cursor: 'pointer', 
    position: 'relative' 
  },
  domaineButtonActive: { 
    backgroundColor: '#dbeafe', 
    color: '#851717ff', 
    borderColor: '#ef4444' 
  },
  domaineButtonIcon: { 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    color: '#94a3b8' 
  },
  domaineIcon: { 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    marginRight: '0.5rem' 
  },
  domaineCount: { 
    position: 'absolute', 
    right: 'clamp(0.5rem, 1.5vw, 0.75rem)', 
    backgroundColor: '#e2e8f0', 
    color: '#64748b', 
    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
    padding: '0.125rem 0.375rem', 
    borderRadius: '9999px' 
  },
  filterStats: { 
    display: 'flex', 
    gap: 'clamp(1rem, 4vw, 2rem)', 
    paddingTop: 'clamp(1rem, 3vw, 1.5rem)', 
    borderTop: '1px solid #e2e8f0', 
    flexWrap: 'wrap' 
  },
  filterStat: { textAlign: 'center' },
  filterStatNumber: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    fontWeight: '700', 
    color: '#3b82f6', 
    marginBottom: '0.25rem' 
  },
  filterStatLabel: { 
    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
    color: '#64748b', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
  },
  
  // Error alert responsive
  errorAlert: { 
    backgroundColor: '#fee2e2', 
    border: '1px solid #ef4444', 
    borderRadius: theme.borderRadius.lg, 
    padding: 'clamp(1rem, 3vw, 1.5rem)', 
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(0.75rem, 2vw, 1rem)', 
    flexWrap: 'wrap' 
  },
  errorAlertIcon: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    color: '#dc2626', 
    flexShrink: 0 
  },
  errorAlertContent: { flex: 1 },
  errorAlertTitle: { 
    fontSize: 'clamp(1rem, 3vw, 1.125rem)', 
    fontWeight: '600', 
    color: '#7f1d1d', 
    marginBottom: '0.25rem' 
  },
  errorAlertText: { 
    color: '#991b1b', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' 
  },
  errorAlertButton: { 
    backgroundColor: '#ef4444', 
    color: '#fff', 
    border: 'none', 
    padding: 'clamp(0.5rem, 1.5vw, 0.5rem) clamp(1rem, 3vw, 1.5rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '500', 
    cursor: 'pointer' 
  },
  
  // Empty state responsive
  emptyState: { 
    backgroundColor: '#fff', 
    padding: 'clamp(2rem, 8vw, 4rem) clamp(1rem, 4vw, 2rem)', 
    borderRadius: theme.borderRadius.lg, 
    textAlign: 'center', 
    border: '2px dashed #e2e8f0' 
  },
  emptyIllustration: { 
    fontSize: 'clamp(3rem, 10vw, 5rem)', 
    marginBottom: 'clamp(1rem, 3vw, 1.5rem)', 
    color: '#cbd5e1' 
  },
  emptyIcon: { fontSize: '5rem' },
  emptyTitle: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    fontWeight: '600', 
    color: '#334155', 
    marginBottom: '0.75rem' 
  },
  emptyText: { 
    color: '#64748b', 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    maxWidth: '500px', 
    margin: '0 auto 1.5rem', 
    lineHeight: '1.6' 
  },
  emptyActions: { 
    display: 'flex', 
    gap: 'clamp(0.5rem, 2vw, 0.75rem)', 
    justifyContent: 'center', 
    flexWrap: 'wrap' 
  },
  emptyActionButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.75rem, 2vw, 1.25rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '500', 
    color: '#475569', 
    cursor: 'pointer' 
  },
  emptyActionIcon: { fontSize: '1rem' },
  
  // Results header responsive
  resultsHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 'clamp(1rem, 4vw, 2rem)', 
    flexWrap: 'wrap', 
    gap: 'clamp(0.75rem, 2vw, 1rem)' 
  },
  resultsInfo: { flex: 1 },
  resultsTitle: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    fontWeight: '600', 
    color: '#1e293b', 
    marginBottom: '0.5rem' 
  },
  resultsStats: { 
    display: 'flex', 
    gap: 'clamp(0.75rem, 2vw, 1.5rem)', 
    alignItems: 'center', 
    flexWrap: 'wrap' 
  },
  resultsStat: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    color: '#64748b' 
  },
  resultsStatIcon: { 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    color: '#94a3b8' 
  },
  resultsSort: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(0.5rem, 2vw, 0.75rem)' 
  },
  resultsSortLabel: { 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    color: '#64748b', 
    fontWeight: '500' 
  },
  sortSelect: { 
    padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(1rem, 3vw, 2rem) clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem)', 
    border: '1px solid #e2e8f0', 
    borderRadius: theme.borderRadius.md, 
    backgroundColor: '#fff', 
    color: '#475569', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    cursor: 'pointer' 
  },
  
  // Grid responsive
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(280px, 40vw, 340px), 1fr))', 
    gap: 'clamp(1rem, 3vw, 1.5rem)', 
    marginBottom: '2rem' 
  },
  listContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1rem', 
    marginBottom: '2rem' 
  },
  
  // Card styles
  card: { 
    backgroundColor: '#fff', 
    borderRadius: theme.borderRadius.lg, 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
  },
  listCard: { 
    backgroundColor: '#fff', 
    borderRadius: theme.borderRadius.lg, 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
  },
  cardHeader: { position: 'relative' },
  listCardHeader: { 
    position: 'relative', 
    width: 'clamp(120px, 25vw, 180px)', 
    flexShrink: 0 
  },
  cardImage: { 
    height: 'clamp(160px, 25vw, 180px)', 
    backgroundColor: '#f8fafc', 
    position: 'relative', 
    overflow: 'hidden' 
  },
  listCardImage: { 
    height: '100%', 
    backgroundColor: '#f8fafc', 
    position: 'relative', 
    overflow: 'hidden', 
    minHeight: 'clamp(160px, 30vw, 200px)' 
  },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  listLogo: { width: '100%', height: '100%', objectFit: 'cover' },
  logoPlaceholder: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#dbeafe' 
  },
  listLogoPlaceholder: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#dbeafe' 
  },
  logoPlaceholderIcon: { fontSize: 'clamp(2rem, 6vw, 4rem)', color: '#3b82f6', opacity: 0.6 },
  listLogoPlaceholderIcon: { fontSize: 'clamp(2rem, 6vw, 3rem)', color: '#3b82f6', opacity: 0.6 },
  favoriteButton: { 
    position: 'absolute', 
    top: 'clamp(0.75rem, 2vw, 1rem)', 
    right: 'clamp(0.75rem, 2vw, 1rem)', 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    border: 'none', 
    width: 'clamp(32px, 6vw, 36px)', 
    height: 'clamp(32px, 6vw, 36px)', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
    zIndex: 2 
  },
  favoriteIcon: { fontSize: 'clamp(1rem, 3vw, 1.25rem)' },
  cardBody: { 
    padding: 'clamp(1rem, 3vw, 1.5rem)', 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'clamp(0.75rem, 2vw, 1rem)' 
  },
  listCardBody: { 
    padding: 'clamp(1rem, 3vw, 1.5rem)', 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'clamp(0.75rem, 2vw, 1rem)', 
    minWidth: 'clamp(200px, 50%, 300px)' 
  },
  cardTitle: { 
    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', 
    fontWeight: '700', 
    color: '#1e293b', 
    margin: 0 
  },
  listCardTitle: { 
    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)', 
    fontWeight: '700', 
    color: '#1e293b', 
    margin: 0 
  },
  location: { 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '0.5rem', 
    color: '#64748b', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' 
  },
  locationIcon: { 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    color: '#94a3b8', 
    flexShrink: 0, 
    marginTop: '2px' 
  },
  locationText: { flex: 1, lineHeight: '1.5' },
  cardDescription: { 
    color: '#475569', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    lineHeight: '1.6', 
    margin: 0 
  },
  listCardDescription: { 
    color: '#475569', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    lineHeight: '1.6', 
    margin: 0 
  },
  domainesContainer: { marginTop: '0.5rem' },
  domainesLabel: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
    color: '#64748b', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em', 
    marginBottom: '0.5rem', 
    fontWeight: '600' 
  },
  domainesLabelIcon: { fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' },
  domainesTags: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' 
  },
  domaineTag: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.25rem', 
    backgroundColor: '#f1f5f9', 
    color: '#475569', 
    padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 2vw, 0.75rem)', 
    borderRadius: '9999px', 
    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
    fontWeight: '500' 
  },
  moreTag: { 
    backgroundColor: '#e2e8f0', 
    color: '#64748b', 
    padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 2vw, 0.75rem)', 
    borderRadius: '9999px', 
    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
    fontWeight: '500' 
  },
  servicesInfo: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    color: '#ef4444', 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '500', 
    marginTop: 'auto' 
  },
  servicesIcon: { fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' },
  servicesText: {},
  cardFooter: { 
    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)', 
    borderTop: '1px solid #e2e8f0' 
  },
  listCardFooter: { 
    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)', 
    borderTop: '1px solid #e2e8f0', 
    width: '100%' 
  },
  cardActions: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' 
  },
  listCardActions: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' 
  },
  contactButton: {
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '0.5rem',
    backgroundColor: theme.colors.primary, 
    color: '#fff', 
    border: 'none',
    padding: 'clamp(0.5rem, 1.5vw, 0.625rem)', 
    borderRadius: theme.borderRadius.md,
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '600', 
    cursor: 'pointer',
  },
  contactIcon: { fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' },
  viewButton: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '0.5rem', 
    backgroundColor: '#f1f5f9', 
    color: '#475569', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.5rem, 1.5vw, 0.625rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '500', 
    cursor: 'pointer' 
  },
  viewButtonIcon: { fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' },
  cardAuthHint: { 
    margin: '0.6rem 0 0', 
    fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
    color: '#94a3b8', 
    textAlign: 'center' 
  },
  
  // Pagination responsive
  pagination: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 'clamp(1rem, 3vw, 1.5rem) 0', 
    borderTop: '1px solid #e2e8f0', 
    flexWrap: 'wrap', 
    gap: '1rem' 
  },
  paginationInfo: { 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    color: '#64748b' 
  },
  paginationControls: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' 
  },
  paginationButton: { 
    backgroundColor: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', 
    borderRadius: theme.borderRadius.md, 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    color: '#475569', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center' 
  },
  paginationPage: { 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    color: '#475569', 
    fontWeight: '500' 
  },
  
  // CTA section responsive
  ctaSection: { 
    backgroundColor: '#dbeafe', 
    borderRadius: theme.borderRadius.lg, 
    padding: 'clamp(1.5rem, 4vw, 2rem)', 
    marginTop: 'clamp(1.5rem, 4vw, 2rem)' 
  },
  ctaContent: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 'clamp(1rem, 3vw, 1.5rem)', 
    flexWrap: 'wrap' 
  },
  ctaIcon: { 
    fontSize: 'clamp(2rem, 6vw, 3rem)', 
    color: '#ef4444' 
  },
  ctaTitle: { 
    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
    fontWeight: '700', 
    color: '#ef4444', 
    marginBottom: '0.5rem' 
  },
  ctaText: { 
    color: '#ef4444', 
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', 
    opacity: 0.9 
  },
  ctaButton: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    backgroundColor: '#df2424ff', 
    color: '#fff', 
    border: 'none', 
    padding: 'clamp(0.75rem, 2vw, 0.875rem) clamp(1rem, 3vw, 1.75rem)', 
    borderRadius: theme.borderRadius.lg, 
    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
    fontWeight: '600', 
    cursor: 'pointer', 
    marginLeft: 'auto' 
  },
  ctaButtonIcon: { fontSize: 'clamp(1rem, 3vw, 1.125rem)' },
};
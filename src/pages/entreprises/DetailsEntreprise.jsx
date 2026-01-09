// careasy-frontend/src/pages/entreprises/DetailsEntreprise.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { entrepriseApi } from '../../api/entrepriseApi';
import theme from '../../config/theme';

export default function DetailsEntreprise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntreprise();
  }, [id]);

  const fetchEntreprise = async () => {
    try {
      setLoading(true);
      const data = await entrepriseApi.getEntreprise(id);
      setEntreprise(data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement entreprise:', err);
      setError('Entreprise non trouvée');
      setTimeout(() => navigate('/mes-entreprises'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        emoji: '🟡', 
        text: 'En attente de validation', 
        color: theme.colors.warning,
        bgColor: '#FEF3C7'
      },
      validated: { 
        emoji: '✅', 
        text: 'Validée', 
        color: theme.colors.success,
        bgColor: '#D1FAE5'
      },
      rejected: { 
        emoji: '❌', 
        text: 'Rejetée', 
        color: theme.colors.error,
        bgColor: '#FEE2E2'
      },
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <div style={{...styles.statusBanner, backgroundColor: badge.bgColor}}>
        <span style={styles.statusEmoji}>{badge.emoji}</span>
        <div>
          <div style={{...styles.statusText, color: badge.color}}>
            {badge.text}
          </div>
          {status === 'pending' && (
            <div style={styles.statusSubtext}>
              Votre entreprise est en cours de validation par l'administration
            </div>
          )}
          {status === 'validated' && (
            <div style={styles.statusSubtext}>
              Votre entreprise a été validée. Vous pouvez maintenant créer des services.
            </div>
          )}
          {status === 'rejected' && entreprise?.admin_note && (
            <div style={styles.statusSubtext}>
              Raison: {entreprise.admin_note}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !entreprise) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>{error || 'Entreprise introuvable'}</h2>
          <Link to="/mes-entreprises" style={styles.errorButton}>
            ← Retour à mes entreprises
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/mes-entreprises" style={styles.backButton}>
            ← Retour à mes entreprises
          </Link>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>{entreprise.name}</h1>
              <p style={styles.subtitle}>
                Créée le {new Date(entreprise.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {entreprise.status === 'validated' && (
              <Link to={`/services/creer?entreprise=${entreprise.id}`} style={styles.createServiceButton}>
                ➕ Créer un service
              </Link>
            )}
          </div>
        </div>

        {/* Statut */}
        {getStatusBadge(entreprise.status)}

        {/* Grid principal */}
        <div style={styles.mainGrid}>
          {/* Colonne gauche */}
          <div style={styles.leftColumn}>
            {/* Carte Logo & Images */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🖼️ Médias</h2>
              
              <div style={styles.mediaGrid}>
                {entreprise.logo ? (
                  <div style={styles.mediaItem}>
                    <p style={styles.mediaLabel}>Logo</p>
                    <img 
                      src={`${import.meta.env.VITE_API_URL}/storage/${entreprise.logo}`}
                      alt="Logo"
                      style={styles.mediaImage}
                    />
                  </div>
                ) : (
                  <div style={styles.mediaPlaceholder}>
                    <div style={styles.placeholderIcon}>🏢</div>
                    <p style={styles.placeholderText}>Aucun logo</p>
                  </div>
                )}

                {entreprise.image_boutique ? (
                  <div style={styles.mediaItem}>
                    <p style={styles.mediaLabel}>Image boutique</p>
                    <img 
                      src={`${import.meta.env.VITE_API_URL}/storage/${entreprise.image_boutique}`}
                      alt="Boutique"
                      style={styles.mediaImage}
                    />
                  </div>
                ) : (
                  <div style={styles.mediaPlaceholder}>
                    <div style={styles.placeholderIcon}>🏪</div>
                    <p style={styles.placeholderText}>Aucune image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Domaines */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🏷️ Domaines d'activité</h2>
              {entreprise.domaines && entreprise.domaines.length > 0 ? (
                <div style={styles.domainesGrid}>
                  {entreprise.domaines.map((domaine) => (
                    <div key={domaine.id} style={styles.domaineTag}>
                      {domaine.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>Aucun domaine défini</p>
              )}
            </div>

            {/* Carte Services */}
            {entreprise.status === 'validated' && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>🛠️ Services</h2>
                  <Link 
                    to={`/services/creer?entreprise=${entreprise.id}`}
                    style={styles.linkButton}
                  >
                    ➕ Ajouter
                  </Link>
                </div>
                {entreprise.services && entreprise.services.length > 0 ? (
                  <div style={styles.servicesList}>
                    {entreprise.services.map((service) => (
                      <Link 
                        key={service.id} 
                        to={`/services/${service.id}`}
                        style={styles.serviceItem}
                      >
                        <div>
                          <div style={styles.serviceName}>{service.name}</div>
                          <div style={styles.servicePrice}>
                            {service.price ? `${service.price} FCFA` : 'Prix sur demande'}
                          </div>
                        </div>
                        <span style={styles.serviceArrow}>→</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>Aucun service créé</p>
                    <Link 
                      to={`/services/creer?entreprise=${entreprise.id}`}
                      style={styles.emptyButton}
                    >
                      Créer le premier service
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div style={styles.rightColumn}>
            {/* Carte Informations générales */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📋 Informations générales</h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>🏢 Nom</span>
                  <span style={styles.infoValue}>{entreprise.name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>📍 Siège</span>
                  <span style={styles.infoValue}>{entreprise.siege || 'Non renseigné'}</span>
                </div>
              </div>
            </div>

            {/* Carte Documents légaux */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📄 Documents légaux</h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>🔢 Numéro IFU</span>
                  <span style={styles.infoValue}>{entreprise.ifu_number}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>📋 Numéro RCCM</span>
                  <span style={styles.infoValue}>{entreprise.rccm_number}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>🎫 Certificat</span>
                  <span style={styles.infoValue}>{entreprise.certificate_number}</span>
                </div>
              </div>
            </div>

            {/* Carte Dirigeant */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>👤 Dirigeant</h2>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>👨‍💼 Nom complet</span>
                  <span style={styles.infoValue}>{entreprise.pdg_full_name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>💼 Profession</span>
                  <span style={styles.infoValue}>{entreprise.pdg_full_profession}</span>
                </div>
              </div>
            </div>
            {/* Carte Dirigeant */}
<div style={styles.card}>
  <h2 style={styles.cardTitle}>👤 Dirigeant</h2>
  <div style={styles.infoList}>
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>👨‍💼 Nom complet</span>
      <span style={styles.infoValue}>{entreprise.pdg_full_name}</span>
    </div>
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>💼 Profession</span>
      <span style={styles.infoValue}>{entreprise.pdg_full_profession}</span>
    </div>
  </div>
</div>

{/* 👇 NOUVELLE CARTE: Contact */}
<div style={styles.card}>
  <h2 style={styles.cardTitle}>📞 Contact</h2>
  <div style={styles.infoList}>
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>📱 WhatsApp</span>
      <span style={styles.infoValue}>
        {entreprise.whatsapp_phone ? (
          <a 
            href={`https://wa.me/${entreprise.whatsapp_phone.replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#25D366', textDecoration: 'none', fontWeight: '600' }}
          >
            {entreprise.whatsapp_phone}
          </a>
        ) : 'Non renseigné'}
      </span>
    </div>
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>☎️ Téléphone</span>
      <span style={styles.infoValue}>
        {entreprise.call_phone ? (
          <a 
            href={`tel:${entreprise.call_phone}`}
            style={{ color: theme.colors.primary, textDecoration: 'none', fontWeight: '600' }}
          >
            {entreprise.call_phone}
          </a>
        ) : 'Non renseigné'}
      </span>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
    paddingTop: '2rem',
    paddingBottom: '4rem',
  },
  content: {
    maxWidth: '1200px',
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
    border: `4px solid ${theme.colors.primaryLight}`,
    borderTop: `4px solid ${theme.colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: '1.125rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1.5rem',
  },
  errorIcon: {
    fontSize: '5rem',
  },
  errorTitle: {
    fontSize: '1.75rem',
    color: theme.colors.text.primary,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    padding: '1rem 2rem',
    borderRadius: theme.borderRadius.lg,
    textDecoration: 'none',
    fontWeight: '600',
  },
  header: {
    marginBottom: '2rem',
  },
  backButton: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    marginBottom: '1rem',
    display: 'inline-block',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: '1.125rem',
  },
  createServiceButton: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    padding: '0.875rem 1.75rem',
    borderRadius: theme.borderRadius.lg,
    textDecoration: 'none',
    fontWeight: '600',
    boxShadow: theme.shadows.md,
  },
  statusBanner: {
    padding: '1.5rem',
    borderRadius: theme.borderRadius.lg,
    marginBottom: '2rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    border: '2px solid',
  },
  statusEmoji: {
    fontSize: '2rem',
    flexShrink: 0,
  },
  statusText: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.25rem',
  },
  statusSubtext: {
    fontSize: '0.95rem',
    color: theme.colors.text.secondary,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: theme.colors.secondary,
    padding: '1.5rem',
    borderRadius: theme.borderRadius.xl,
    border: `2px solid ${theme.colors.primaryLight}`,
    boxShadow: theme.shadows.sm,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: '1rem',
  },
  linkButton: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  mediaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mediaLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  mediaImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: theme.borderRadius.md,
    border: `2px solid ${theme.colors.primaryLight}`,
  },
  mediaPlaceholder: {
    width: '100%',
    height: '200px',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    border: `2px dashed ${theme.colors.primaryLight}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  placeholderIcon: {
    fontSize: '3rem',
  },
  placeholderText: {
    color: theme.colors.text.secondary,
    fontSize: '0.875rem',
  },
  domainesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  domaineTag: {
    backgroundColor: theme.colors.primaryLight,
    color: theme.colors.primary,
    padding: '0.5rem 1rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBottom: '1rem',
    borderBottom: `1px solid ${theme.colors.primaryLight}`,
  },
  infoLabel: {
    fontWeight: '600',
    color: theme.colors.text.secondary,
    flex: '0 0 auto',
  },
  infoValue: {
    color: theme.colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  servicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    textDecoration: 'none',
    border: `1px solid ${theme.colors.primaryLight}`,
    transition: 'all 0.3s',
  },
  serviceName: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: '0.25rem',
  },
  servicePrice: {
    fontSize: '0.875rem',
    color: theme.colors.primary,
    fontWeight: '600',
  },
  serviceArrow: {
    color: theme.colors.primary,
    fontSize: '1.25rem',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    padding: '2rem 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '1rem 0',
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.white,
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.md,
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: '600',
    marginTop: '1rem',
  },
};
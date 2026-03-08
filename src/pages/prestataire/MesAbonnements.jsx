import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import paiementApi from '../../api/paiementApi';
import { entrepriseApi } from '../../api/entrepriseApi';
import theme from '../../config/theme';
import {
    FiCheckCircle,
    FiXCircle,
    FiCalendar,
    FiClock,
    FiAward,
    FiInfo,
    FiRefreshCw,
    FiEye,
    FiChevronRight,
    FiGift,
    FiAlertTriangle,
    FiCreditCard,
    FiFileText,
    FiDownload,
    FiTrendingUp
} from 'react-icons/fi';
import { 
    MdOutlineVerified, 
    MdOutlineBusinessCenter,
    MdOutlineTimer,
    MdOutlineStorefront,
    MdOutlineWarning
} from 'react-icons/md';

export default function MesAbonnements() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [abonnements, setAbonnements] = useState([]);
    const [entreprises, setEntreprises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAbonnement, setSelectedAbonnement] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [abonnementToCancel, setAbonnementToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchData();
        
        // Vérifier si on vient d'un paiement réussi
        const params = new URLSearchParams(location.search);
        if (params.get('payment') === 'success') {
            showSuccess('Paiement réussi ! Votre abonnement est actif.');
        }
    }, [location]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Récupérer les abonnements
            const abonnementsResponse = await paiementApi.getAbonnements();
            const abonnementsData = abonnementsResponse.data || [];
            
            // Récupérer les entreprises pour vérifier les essais gratuits
            let entreprisesData = [];
            try {
                const entreprisesResponse = await entrepriseApi.getMesEntreprises();
                entreprisesData = entreprisesResponse || [];
                setEntreprises(entreprisesData);
            } catch (err) {
                console.error('Erreur chargement entreprises:', err);
            }
            
            // Combiner les abonnements payants avec les essais gratuits
            const allSubscriptions = [...abonnementsData];
            
            // Ajouter les essais gratuits des entreprises validées
            entreprisesData.forEach(entreprise => {
                if (entreprise.status === 'validated' && entreprise.trial_ends_at) {
                    // Vérifier si un abonnement d'essai existe déjà
                    const existingTrial = allSubscriptions.find(s => 
                        s.type === 'trial' && s.entreprise_id === entreprise.id
                    );
                    
                    if (!existingTrial) {
                        // Créer un objet d'essai gratuit
                        const trialEndDate = new Date(entreprise.trial_ends_at);
                        const now = new Date();
                        const isActive = trialEndDate > now;
                        const daysLeft = Math.max(0, Math.floor((trialEndDate - now) / (1000 * 60 * 60 * 24)));
                        
                        allSubscriptions.push({
                            id: `trial-${entreprise.id}`,
                            reference: `TRIAL-${entreprise.id}-${new Date(entreprise.created_at).getFullYear()}`,
                            type: 'trial',
                            entreprise_id: entreprise.id,
                            entreprise_name: entreprise.name,
                            plan: {
                                id: null,
                                name: 'Essai Gratuit',
                                code: 'TRIAL',
                                description: 'Période d\'essai de 30 jours pour découvrir la plateforme',
                                duration_text: '30 jours',
                                features_list: [
                                    '3 services maximum',
                                    '1 employé maximum',
                                    'Support standard',
                                    'Statistiques de base'
                                ],
                                max_services: entreprise.max_services_allowed || 3,
                                max_employees: entreprise.max_employees_allowed || 1,
                                has_api_access: entreprise.has_api_access || false
                            },
                            date_debut: new Date(entreprise.created_at).toLocaleDateString('fr-FR'),
                            date_fin: entreprise.trial_ends_at_formatted || trialEndDate.toLocaleDateString('fr-FR'),
                            date_fin_obj: trialEndDate,
                            statut: isActive ? 'actif' : 'expiré',
                            statut_libelle: isActive ? 'Actif' : 'Expiré',
                            statut_color: isActive ? '#10b981' : '#ef4444',
                            jours_restants: daysLeft,
                            est_actif: isActive,
                            est_essai: true,
                            montant: 'Gratuit',
                            montant_formate: 'Gratuit',
                            paiement: null,
                            renouvellement_auto: false,
                            metadata: {
                                type: 'essai_gratuit',
                                max_services: entreprise.max_services_allowed || 3,
                                max_employees: entreprise.max_employees_allowed || 1,
                                services_count: entreprise.services_count || 0
                            }
                        });
                    }
                }
            });
            
            // Trier par date (les plus récents d'abord)
            allSubscriptions.sort((a, b) => {
                const dateA = a.date_fin_obj || new Date(a.date_fin.split('/').reverse().join('-'));
                const dateB = b.date_fin_obj || new Date(b.date_fin.split('/').reverse().join('-'));
                return dateB - dateA;
            });
            
            setAbonnements(allSubscriptions);
        } catch (err) {
            console.error('Erreur chargement abonnements:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
    };

    const handleCancelSubscription = async () => {
        if (!abonnementToCancel || abonnementToCancel.type === 'trial') return;
        
        setCancelling(true);
        try {
            await paiementApi.annulerAbonnement(abonnementToCancel.id, { reason: cancelReason });
            showSuccess('Abonnement annulé avec succès');
            setShowCancelModal(false);
            setAbonnementToCancel(null);
            setCancelReason('');
            fetchData(); // Rafraîchir la liste
        } catch (err) {
            console.error('Erreur annulation:', err);
            alert('Erreur lors de l\'annulation de l\'abonnement');
        } finally {
            setCancelling(false);
        }
    };

    const handleViewInvoice = (abonnement) => {
        if (abonnement.type === 'trial') {
            alert('Aucune facture disponible pour la période d\'essai');
            return;
        }
        
        if (abonnement.paiement?.facture_url) {
            window.open(abonnement.paiement.facture_url, '_blank');
        } else {
            alert('Facture non disponible');
        }
    };

    const getStatutBadge = (abonnement) => {
        if (abonnement.est_essai) {
            if (abonnement.est_actif) {
                return (
                    <span style={styles.badgeEssai}>
                        <FiGift />
                        Essai • {abonnement.jours_restants}j
                    </span>
                );
            } else {
                return (
                    <span style={styles.badgeExpire}>
                        <FiAlertTriangle />
                        Essai expiré
                    </span>
                );
            }
        }
        
        if (abonnement.est_actif) {
            return (
                <span style={styles.badgeActif}>
                    <MdOutlineVerified />
                    Actif
                </span>
            );
        } else if (abonnement.statut === 'expiré' || abonnement.statut === 'expire') {
            return (
                <span style={styles.badgeExpire}>
                    <FiXCircle />
                    Expiré
                </span>
            );
        } else {
            return (
                <span style={styles.badgeAnnule}>
                    <FiXCircle />
                    {abonnement.statut_libelle || abonnement.statut}
                </span>
            );
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dateString;
    };

    const getActiveSubscription = () => {
        return abonnements.find(a => a.est_actif);
    };

    const activeSubscription = getActiveSubscription();

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Chargement de vos abonnements...</p>
                <p style={styles.loadingSubtext}>Veuillez patienter</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Toast de succès */}
            {showSuccessToast && (
                <div style={styles.successToast}>
                    <FiCheckCircle style={styles.toastIcon} />
                    <div style={styles.toastContent}>
                        <strong>Succès</strong>
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}

            <div style={styles.content}>
                {/* Header avec statut actif */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            <FiAward style={styles.titleIcon} />
                            Mes Abonnements
                        </h1>
                        <p style={styles.subtitle}>
                            Gérez vos abonnements et suivez leur statut en temps réel
                        </p>
                    </div>
                    <div style={styles.headerActions}>
                        {activeSubscription && (
                            <div style={styles.activeSubscriptionBadge}>
                                <MdOutlineVerified style={styles.activeIcon} />
                                <span>Abonnement actif</span>
                            </div>
                        )}
                        <button
                            onClick={handleRefresh}
                            style={styles.refreshButton}
                            disabled={refreshing}
                        >
                            <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.refreshIcon} />
                            {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                        </button>
                    </div>
                </div>

                {/* Résumé des abonnements */}
                {abonnements.length > 0 && (
                    <div style={styles.summaryCards}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryIconContainer}>
                                <FiAward style={styles.summaryIcon} />
                            </div>
                            <div>
                                <div style={styles.summaryLabel}>Total abonnements</div>
                                <div style={styles.summaryValue}>{abonnements.length}</div>
                            </div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryIconContainer}>
                                <MdOutlineVerified style={styles.summaryIcon} />
                            </div>
                            <div>
                                <div style={styles.summaryLabel}>Abonnements actifs</div>
                                <div style={styles.summaryValue}>
                                    {abonnements.filter(a => a.est_actif).length}
                                </div>
                            </div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryIconContainer}>
                                <FiGift style={styles.summaryIcon} />
                            </div>
                            <div>
                                <div style={styles.summaryLabel}>Essais gratuits</div>
                                <div style={styles.summaryValue}>
                                    {abonnements.filter(a => a.est_essai).length}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Liste des abonnements */}
                {abonnements.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyStateIconContainer}>
                            <FiInfo style={styles.emptyStateIcon} />
                        </div>
                        <h3 style={styles.emptyStateTitle}>Aucun abonnement</h3>
                        <p style={styles.emptyStateText}>
                            Vous n'avez pas encore souscrit d'abonnement. 
                            Découvrez nos plans pour booster votre activité.
                        </p>
                        <div style={styles.emptyStateActions}>
                            <button
                                onClick={() => navigate('/plans')}
                                style={styles.emptyStateButton}
                            >
                                Voir les plans
                            </button>
                            <button
                                onClick={() => navigate('/mesentreprises')}
                                style={styles.emptyStateSecondaryButton}
                            >
                                Mes entreprises
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={styles.abonnementsList}>
                        {abonnements.map((abonnement) => (
                            <div
                                key={abonnement.id}
                                style={styles.abonnementCard}
                            >
                                <div style={styles.cardHeader}>
                                    <div style={styles.headerLeft}>
                                        {abonnement.est_essai ? (
                                            <div style={styles.planIconEssai}>
                                                <FiGift />
                                            </div>
                                        ) : (
                                            <div style={styles.planIcon}>
                                                <MdOutlineBusinessCenter />
                                            </div>
                                        )}
                                        <div>
                                            <h3 style={styles.planName}>
                                                {abonnement.plan.name}
                                                {abonnement.est_essai && (
                                                    <span style={styles.essaiBadge}>Essai gratuit</span>
                                                )}
                                            </h3>
                                            <div style={styles.planMeta}>
                                                <span style={styles.planCode}>{abonnement.plan.code}</span>
                                                {abonnement.entreprise_name && (
                                                    <>
                                                        <span style={styles.metaSeparator}>•</span>
                                                        <span style={styles.entrepriseName}>
                                                            <MdOutlineStorefront style={styles.metaIcon} />
                                                            {abonnement.entreprise_name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {getStatutBadge(abonnement)}
                                </div>

                                <div style={styles.cardBody}>
                                    <div style={styles.infoGrid}>
                                        <div style={styles.infoItem}>
                                            <div style={styles.infoIconContainer}>
                                                <FiCalendar style={styles.infoIcon} />
                                            </div>
                                            <div>
                                                <div style={styles.infoLabel}>Début</div>
                                                <div style={styles.infoValue}>{abonnement.date_debut}</div>
                                            </div>
                                        </div>
                                        <div style={styles.infoItem}>
                                            <div style={styles.infoIconContainer}>
                                                <FiCalendar style={styles.infoIcon} />
                                            </div>
                                            <div>
                                                <div style={styles.infoLabel}>Fin</div>
                                                <div style={styles.infoValue}>{abonnement.date_fin}</div>
                                            </div>
                                        </div>
                                        {abonnement.est_actif && (
                                            <div style={styles.infoItem}>
                                                <div style={styles.infoIconContainer}>
                                                    <FiClock style={styles.infoIcon} />
                                                </div>
                                                <div>
                                                    <div style={styles.infoLabel}>Jours restants</div>
                                                    <div style={{
                                                        ...styles.infoValue,
                                                        color: abonnement.jours_restants <= 7 ? '#dc2626' : '#059669',
                                                        fontWeight: '600'
                                                    }}>
                                                        {abonnement.jours_restants} jours
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.cardFooter}>
                                        <div style={styles.montantInfo}>
                                            {abonnement.est_essai ? (
                                                <>
                                                    <span style={styles.montantGratuit}>Gratuit</span>
                                                    <span style={styles.montantDetails}>
                                                        • {abonnement.metadata?.services_count || 0}/{abonnement.plan.max_services} services
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={styles.montant}>{abonnement.montant || 'Prix non défini'}</span>
                                                    {abonnement.renouvellement_auto && (
                                                        <span style={styles.renouvellementBadge}>
                                                            <FiRefreshCw style={styles.renouvellementIcon} />
                                                            Auto
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        
                                        <div style={styles.cardActions}>
                                            {abonnement.est_actif && !abonnement.est_essai && (
                                                <button
                                                    onClick={() => {
                                                        setAbonnementToCancel(abonnement);
                                                        setShowCancelModal(true);
                                                    }}
                                                    style={styles.cancelButton}
                                                    title="Annuler l'abonnement"
                                                >
                                                    <FiXCircle />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewInvoice(abonnement)}
                                                style={styles.invoiceButton}
                                                title={abonnement.est_essai ? "Pas de facture" : "Voir la facture"}
                                                disabled={abonnement.est_essai}
                                            >
                                                <FiFileText />
                                            </button>
                                            <button
                                                onClick={() => setSelectedAbonnement(abonnement)}
                                                style={styles.viewButton}
                                            >
                                                Détails
                                                <FiChevronRight style={styles.chevron} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal de détails */}
                {selectedAbonnement && (
                    <div style={styles.modalOverlay} onClick={() => setSelectedAbonnement(null)}>
                        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedAbonnement(null)}
                                style={styles.modalClose}
                            >
                                ×
                            </button>

                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>Détails de l'abonnement</h2>
                                <div style={styles.modalBadge}>
                                    {getStatutBadge(selectedAbonnement)}
                                </div>
                            </div>

                            <div style={styles.modalBody}>
                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>
                                        <FiAward style={styles.modalSectionIcon} />
                                        Plan
                                    </h3>
                                    <div style={styles.modalPlanInfo}>
                                        <div style={styles.modalPlanName}>{selectedAbonnement.plan.name}</div>
                                        <div style={styles.modalPlanCode}>{selectedAbonnement.plan.code}</div>
                                        {selectedAbonnement.plan.description && (
                                            <p style={styles.modalPlanDesc}>{selectedAbonnement.plan.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div style={styles.modalSection}>
                                    <h3 style={styles.modalSectionTitle}>
                                        <FiCalendar style={styles.modalSectionIcon} />
                                        Période
                                    </h3>
                                    <div style={styles.modalInfoGrid}>
                                        <div style={styles.modalInfoItem}>
                                            <span style={styles.modalInfoLabel}>Début</span>
                                            <span style={styles.modalInfoValue}>{selectedAbonnement.date_debut}</span>
                                        </div>
                                        <div style={styles.modalInfoItem}>
                                            <span style={styles.modalInfoLabel}>Fin</span>
                                            <span style={styles.modalInfoValue}>{selectedAbonnement.date_fin}</span>
                                        </div>
                                        {selectedAbonnement.est_actif && (
                                            <div style={styles.modalInfoItem}>
                                                <span style={styles.modalInfoLabel}>Jours restants</span>
                                                <span style={{
                                                    ...styles.modalInfoValue,
                                                    color: selectedAbonnement.jours_restants <= 7 ? '#dc2626' : '#059669'
                                                }}>
                                                    {selectedAbonnement.jours_restants} jours
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedAbonnement.est_essai ? (
                                    <div style={styles.modalSection}>
                                        <h3 style={styles.modalSectionTitle}>
                                            <FiGift style={styles.modalSectionIcon} />
                                            Période d'essai
                                        </h3>
                                        <div style={styles.trialDetails}>
                                            <div style={styles.trialProgress}>
                                                <div style={styles.trialProgressBar}>
                                                    <div style={{
                                                        ...styles.trialProgressFill,
                                                        width: `${((30 - selectedAbonnement.jours_restants) / 30) * 100}%`
                                                    }} />
                                                </div>
                                                <div style={styles.trialStats}>
                                                    <span>Jour {30 - selectedAbonnement.jours_restants}/30</span>
                                                    <span>{selectedAbonnement.jours_restants} jours restants</span>
                                                </div>
                                            </div>
                                            <div style={styles.trialLimits}>
                                                <div style={styles.trialLimit}>
                                                    <span>Services</span>
                                                    <strong>{selectedAbonnement.metadata?.services_count || 0} / {selectedAbonnement.plan.max_services}</strong>
                                                </div>
                                                <div style={styles.trialLimit}>
                                                    <span>Employés</span>
                                                    <strong>0 / {selectedAbonnement.plan.max_employees}</strong>
                                                </div>
                                                <div style={styles.trialLimit}>
                                                    <span>API Access</span>
                                                    <strong>{selectedAbonnement.plan.has_api_access ? 'Oui' : 'Non'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : selectedAbonnement.paiement && (
                                    <div style={styles.modalSection}>
                                        <h3 style={styles.modalSectionTitle}>
                                            <FiCreditCard style={styles.modalSectionIcon} />
                                            Paiement
                                        </h3>
                                        <div style={styles.paymentDetails}>
                                            <div style={styles.paymentRow}>
                                                <span>Référence</span>
                                                <strong>{selectedAbonnement.paiement.reference}</strong>
                                            </div>
                                            <div style={styles.paymentRow}>
                                                <span>Montant</span>
                                                <strong style={styles.paymentAmount}>{selectedAbonnement.montant}</strong>
                                            </div>
                                            <div style={styles.paymentRow}>
                                                <span>Date</span>
                                                <span>{selectedAbonnement.paiement.date}</span>
                                            </div>
                                            <div style={styles.paymentRow}>
                                                <span>Méthode</span>
                                                <span>{selectedAbonnement.paiement.methode || 'Carte bancaire'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedAbonnement.plan.features_list && selectedAbonnement.plan.features_list.length > 0 && (
                                    <div style={styles.modalSection}>
                                        <h3 style={styles.modalSectionTitle}>
                                            <FiTrendingUp style={styles.modalSectionIcon} />
                                            Fonctionnalités incluses
                                        </h3>
                                        <ul style={styles.featuresList}>
                                            {selectedAbonnement.plan.features_list.map((feature, index) => (
                                                <li key={index} style={styles.featureItem}>
                                                    <FiCheckCircle style={styles.featureIcon} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div style={styles.modalFooter}>
                                {selectedAbonnement.est_actif && !selectedAbonnement.est_essai && (
                                    <button
                                        onClick={() => {
                                            setShowCancelModal(true);
                                            setSelectedAbonnement(null);
                                        }}
                                        style={styles.modalCancelButton}
                                    >
                                        <FiXCircle />
                                        Annuler l'abonnement
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedAbonnement(null)}
                                    style={styles.modalButton}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal d'annulation */}
                {showCancelModal && (
                    <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
                        <div style={{...styles.modalContent, maxWidth: '450px'}} onClick={e => e.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>Annuler l'abonnement</h2>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    style={styles.modalClose}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={styles.modalBody}>
                                <div style={styles.cancelWarning}>
                                    <MdOutlineWarning style={styles.warningIcon} />
                                    <p>
                                        Êtes-vous sûr de vouloir annuler cet abonnement ? 
                                        Cette action est irréversible et vous perdrez l'accès 
                                        aux fonctionnalités à la fin de la période en cours.
                                    </p>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>
                                        Motif d'annulation (optionnel)
                                    </label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        style={styles.formTextarea}
                                        placeholder="Dites-nous pourquoi vous annulez..."
                                        rows="4"
                                    />
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    style={styles.modalSecondaryButton}
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={handleCancelSubscription}
                                    style={styles.modalDangerButton}
                                    disabled={cancelling}
                                >
                                    {cancelling ? (
                                        <>
                                            <div style={styles.buttonSpinner}></div>
                                            Annulation...
                                        </>
                                    ) : (
                                        'Confirmer l\'annulation'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem 0',
        position: 'relative',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    },
    content: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 1.5rem'
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
        width: '48px',
        height: '48px',
        border: '3px solid #e2e8f0',
        borderTop: `3px solid ${theme.colors.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#1e293b',
        fontSize: '1.125rem',
        fontWeight: '500'
    },
    loadingSubtext: {
        color: '#64748b',
        fontSize: '0.875rem'
    },
    successToast: {
        position: 'fixed',
        top: '24px',
        right: '24px',
        backgroundColor: '#10b981',
        color: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
        zIndex: 10000,
        animation: 'slideInRight 0.3s ease, fadeIn 0.2s ease',
        minWidth: '300px'
    },
    toastIcon: {
        fontSize: '1.5rem',
        flexShrink: 0
    },
    toastContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem',
        letterSpacing: '-0.02em'
    },
    titleIcon: {
        fontSize: '2rem',
        color: theme.colors.primary
    },
    subtitle: {
        color: '#475569',
        fontSize: '0.95rem',
        lineHeight: '1.5'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    activeSubscriptionBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        borderRadius: '100px',
        fontSize: '0.875rem',
        fontWeight: '500'
    },
    activeIcon: {
        fontSize: '1rem'
    },
    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        color: '#1e293b',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    refreshIcon: {
        fontSize: '1rem'
    },
    refreshingIcon: {
        fontSize: '1rem',
        animation: 'spin 1s linear infinite'
    },
    summaryCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    summaryIconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        backgroundColor: '#f1f5f9',
        borderRadius: '10px'
    },
    summaryIcon: {
        fontSize: '1.25rem',
        color: theme.colors.primary
    },
    summaryLabel: {
        fontSize: '0.75rem',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '0.25rem'
    },
    summaryValue: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#0f172a',
        lineHeight: 1
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    },
    emptyStateIconContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1.5rem'
    },
    emptyStateIcon: {
        fontSize: '4rem',
        color: '#cbd5e1'
    },
    emptyStateTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: '0.75rem'
    },
    emptyStateText: {
        color: '#475569',
        fontSize: '1rem',
        marginBottom: '2rem',
        maxWidth: '400px',
        margin: '0 auto 2rem',
        lineHeight: '1.6'
    },
    emptyStateActions: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
    },
    emptyStateButton: {
        padding: '0.75rem 2rem',
        backgroundColor: theme.colors.primary,
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
    },
    emptyStateSecondaryButton: {
        padding: '0.75rem 2rem',
        backgroundColor: '#f1f5f9',
        color: '#1e293b',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    abonnementsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    abonnementCard: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #f1f5f9'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    planIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        backgroundColor: '#dbeafe',
        borderRadius: '12px',
        fontSize: '1.5rem',
        color: theme.colors.primary
    },
    planIconEssai: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        backgroundColor: '#fef3c7',
        borderRadius: '12px',
        fontSize: '1.5rem',
        color: '#d97706'
    },
    planName: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: '0.375rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    essaiBadge: {
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        backgroundColor: '#fef3c7',
        color: '#b45309',
        fontSize: '0.625rem',
        fontWeight: '600',
        borderRadius: '12px',
        letterSpacing: '0.3px',
        textTransform: 'uppercase'
    },
    planMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: '0.875rem',
        color: '#64748b'
    },
    planCode: {
        color: '#475569'
    },
    metaSeparator: {
        color: '#cbd5e1'
    },
    entrepriseName: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
    },
    metaIcon: {
        fontSize: '0.875rem'
    },
    badgeActif: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        backgroundColor: '#d1fae5',
        color: '#065f46',
        borderRadius: '100px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },
    badgeEssai: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        backgroundColor: '#fef3c7',
        color: '#b45309',
        borderRadius: '100px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },
    badgeExpire: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderRadius: '100px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },
    badgeAnnule: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        borderRadius: '100px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },
    cardBody: {
        padding: '1.5rem'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.25rem'
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    infoIconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px'
    },
    infoIcon: {
        fontSize: '1rem',
        color: theme.colors.primary
    },
    infoLabel: {
        fontSize: '0.6875rem',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '0.125rem'
    },
    infoValue: {
        fontSize: '0.9375rem',
        fontWeight: '500',
        color: '#0f172a'
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #f1f5f9'
    },
    montantInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    montant: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: theme.colors.primary
    },
    montantGratuit: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#059669',
        backgroundColor: '#d1fae5',
        padding: '0.25rem 0.75rem',
        borderRadius: '100px'
    },
    montantDetails: {
        fontSize: '0.875rem',
        color: '#64748b'
    },
    renouvellementBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '500'
    },
    renouvellementIcon: {
        fontSize: '0.75rem'
    },
    cardActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    cancelButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        backgroundColor: '#fee2e2',
        border: 'none',
        borderRadius: '8px',
        color: '#b91c1c',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    invoiceButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        backgroundColor: '#f1f5f9',
        border: 'none',
        borderRadius: '8px',
        color: '#475569',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: props => props.disabled ? 0.5 : 1,
        cursor: props => props.disabled ? 'not-allowed' : 'pointer'
    },
    viewButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#f1f5f9',
        border: 'none',
        borderRadius: '8px',
        color: '#1e293b',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    chevron: {
        fontSize: '0.875rem'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '550px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    modalClose: {
        position: 'absolute',
        top: '1.25rem',
        right: '1.25rem',
        background: 'none',
        border: 'none',
        fontSize: '1.75rem',
        color: '#94a3b8',
        cursor: 'pointer',
        lineHeight: 1,
        zIndex: 10
    },
    modalHeader: {
        padding: '1.5rem 1.5rem 1rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: '1.35rem',
        fontWeight: '600',
        color: '#0f172a',
        margin: 0
    },
    modalBadge: {
        display: 'flex',
        alignItems: 'center'
    },
    modalBody: {
        padding: '1.5rem'
    },
    modalSection: {
        marginBottom: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #f1f5f9'
    },
    modalSectionTitle: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#334155',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.3px'
    },
    modalSectionIcon: {
        fontSize: '1rem',
        color: theme.colors.primary
    },
    modalPlanInfo: {
        marginLeft: '1.75rem'
    },
    modalPlanName: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: '0.25rem'
    },
    modalPlanCode: {
        fontSize: '0.875rem',
        color: '#64748b',
        marginBottom: '0.75rem'
    },
    modalPlanDesc: {
        fontSize: '0.9375rem',
        color: '#475569',
        lineHeight: '1.6',
        marginTop: '0.5rem'
    },
    modalInfoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginLeft: '1.75rem'
    },
    modalInfoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    modalInfoLabel: {
        fontSize: '0.6875rem',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    modalInfoValue: {
        fontSize: '0.9375rem',
        fontWeight: '500',
        color: '#0f172a'
    },
    trialDetails: {
        marginLeft: '1.75rem'
    },
    trialProgress: {
        marginBottom: '1rem'
    },
    trialProgressBar: {
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '0.5rem'
    },
    trialProgressFill: {
        height: '100%',
        backgroundColor: '#f59e0b',
        borderRadius: '4px',
        transition: 'width 0.3s ease'
    },
    trialStats: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8125rem',
        color: '#64748b'
    },
    trialLimits: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginTop: '1rem'
    },
    trialLimit: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '10px'
    },
    paymentDetails: {
        marginLeft: '1.75rem'
    },
    paymentRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        fontSize: '0.9375rem'
    },
    paymentAmount: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: theme.colors.primary
    },
    featuresList: {
        margin: '0.5rem 0 0 1.75rem',
        padding: 0,
        listStyle: 'none'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0',
        fontSize: '0.9375rem',
        color: '#334155'
    },
    featureIcon: {
        fontSize: '1rem',
        color: '#10b981'
    },
    modalFooter: {
        padding: '1.25rem 1.5rem 1.5rem',
        display: 'flex',
        gap: '1rem'
    },
    modalButton: {
        flex: 1,
        padding: '0.875rem',
        backgroundColor: theme.colors.primary,
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9375rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    modalCancelButton: {
        flex: 1,
        padding: '0.875rem',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9375rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    },
    modalSecondaryButton: {
        flex: 1,
        padding: '0.875rem',
        backgroundColor: '#f1f5f9',
        color: '#1e293b',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        fontSize: '0.9375rem',
        fontWeight: '500',
        cursor: 'pointer'
    },
    modalDangerButton: {
        flex: 1,
        padding: '0.875rem',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.9375rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    },
    cancelWarning: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: '#fef3c7',
        borderRadius: '10px',
        marginBottom: '1.5rem'
    },
    warningIcon: {
        fontSize: '1.25rem',
        color: '#d97706',
        flexShrink: 0
    },
    formGroup: {
        marginBottom: '1rem'
    },
    formLabel: {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    formTextarea: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '0.9375rem',
        fontFamily: 'inherit',
        resize: 'vertical'
    },
    buttonSpinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #ffffff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    }
};
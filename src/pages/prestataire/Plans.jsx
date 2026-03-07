import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import planApi from '../../api/planApi';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../config/theme';
import {
    FiCheckCircle,
    FiXCircle,
    FiDollarSign,
    FiCalendar,
    FiBriefcase,
    FiUsers,
    FiZap,
    FiAward,
    FiStar,
    FiInfo,
    FiChevronRight,
    FiRefreshCw,
    FiClock,
    FiCpu,
    FiShield,
    FiTool,
    FiTrendingUp
} from 'react-icons/fi';
import {
    FaCrown,
    FaRocket,
    FaRegGem,
    FaCheckCircle,
    FaTimesCircle
} from 'react-icons/fa';
import {
    MdOutlineCompareArrows,
    MdOutlineVerified,
    MdOutlineWarning,
    MdOutlineInfo
} from 'react-icons/md';

export default function Plans() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await planApi.getPublicPlans();
            console.log('Plans reçus:', response);
            setPlans(response.data || []);
        } catch (err) {
            console.error('Erreur chargement plans:', err);
            showError('Erreur lors du chargement des plans');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPlans();
    };

    const handleCompare = async () => {
        try {
            const response = await planApi.comparePlans();
            console.log('Comparaison reçue:', response);
            setComparisonData(response.data || []);
            setShowComparison(true);
        } catch (err) {
            console.error('Erreur comparaison:', err);
            showError('Erreur lors de la comparaison des plans');
        }
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    const showError = (message) => {
        setErrorMessage(message);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
    };

    const getPlanIcon = (code) => {
        if (code?.includes('VP1')) return <FiZap style={{ color: '#f59e0b' }} />;
        if (code?.includes('VP2')) return <FaCrown style={{ color: '#3b82f6' }} />;
        if (code?.includes('VP3')) return <FaRocket style={{ color: '#10b981' }} />;
        return <FaRegGem style={{ color: '#8b5cf6' }} />;
    };

    const getPlanColor = (code) => {
        if (code?.includes('VP1')) return '#f59e0b';
        if (code?.includes('VP2')) return '#3b82f6';
        if (code?.includes('VP3')) return '#10b981';
        return '#8b5cf6';
    };

    const getPlanGradient = (code) => {
        if (code?.includes('VP1')) return 'linear-gradient(135deg, #f59e0b, #fbbf24)';
        if (code?.includes('VP2')) return 'linear-gradient(135deg, #3b82f6, #60a5fa)';
        if (code?.includes('VP3')) return 'linear-gradient(135deg, #10b981, #34d399)';
        return 'linear-gradient(135deg, #8b5cf6, #a78bfa)';
    };

    const getPlanBadge = (code) => {
        if (code?.includes('VP1')) return 'Débutant';
        if (code?.includes('VP2')) return 'Professionnel';
        if (code?.includes('VP3')) return 'Premium';
        return 'Standard';
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Chargement des plans...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Toasts */}
            {showSuccessToast && (
                <div style={styles.successToast}>
                    <FiCheckCircle style={styles.toastIcon} />
                    <span>{successMessage}</span>
                </div>
            )}
            
            {showErrorToast && (
                <div style={styles.errorToast}>
                    <FiInfo style={styles.toastIcon} />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div style={styles.content}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            <FiAward style={styles.titleIcon} />
                            Plans d'Abonnement
                        </h1>
                        <p style={styles.subtitle}>
                            Découvrez nos plans adaptés à vos besoins et développez votre activité
                        </p>
                    </div>
                    <div style={styles.headerActions}>
                        <button
                            onClick={handleRefresh}
                            style={styles.refreshButton}
                            disabled={refreshing}
                        >
                            <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.refreshIcon} />
                            {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
                        </button>
                        <button
                            onClick={handleCompare}
                            style={styles.compareButton}
                        >
                            <MdOutlineCompareArrows style={styles.compareIcon} />
                            Comparer les plans
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                {plans.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FiInfo style={styles.emptyStateIcon} />
                        <h3 style={styles.emptyStateTitle}>Aucun plan disponible</h3>
                        <p style={styles.emptyStateText}>
                            Les plans d'abonnement seront bientôt disponibles.
                        </p>
                    </div>
                ) : (
                    <div style={styles.plansGrid}>
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                style={styles.planCard}
                                className="plan-card"
                                onClick={() => setSelectedPlan(plan)}
                            >
                                <div style={{
                                    ...styles.planHeader,
                                    background: getPlanGradient(plan.code)
                                }}>
                                    <div style={styles.planBadge}>
                                        {getPlanBadge(plan.code)}
                                    </div>
                                    <div style={styles.planIcon}>
                                        {getPlanIcon(plan.code)}
                                    </div>
                                    <h3 style={styles.planName}>{plan.name}</h3>
                                    <span style={styles.planCode}>{plan.code}</span>
                                </div>

                                <div style={styles.planBody}>
                                    <div style={styles.planPrice}>
                                        <span style={styles.priceAmount}>
                                            {new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: 'XOF',
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            }).format(plan.price)}
                                        </span>
                                        <span style={styles.pricePeriod}>/{plan.duration_text}</span>
                                    </div>

                                    {plan.description && (
                                        <p style={styles.planDescription}>{plan.description}</p>
                                    )}

                                    <div style={styles.planStats}>
                                        {plan.max_services && (
                                            <div style={styles.statItem}>
                                                <FiBriefcase style={styles.statIcon} />
                                                <div>
                                                    <div style={styles.statValue}>{plan.max_services}</div>
                                                    <div style={styles.statLabel}>Services max</div>
                                                </div>
                                            </div>
                                        )}
                                        {plan.max_employees && (
                                            <div style={styles.statItem}>
                                                <FiUsers style={styles.statIcon} />
                                                <div>
                                                    <div style={styles.statValue}>{plan.max_employees}</div>
                                                    <div style={styles.statLabel}>Employés max</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.featuresSection}>
                                        <h4 style={styles.featuresTitle}>Fonctionnalités clés</h4>
                                        <div style={styles.featuresList}>
                                            {(plan.features_list || []).slice(0, 4).map((feature, index) => (
                                                <div key={index} style={styles.featureItem}>
                                                    <FiCheckCircle style={styles.featureIcon} />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPlan(plan);
                                        }}
                                        style={styles.detailsButton}
                                    >
                                        Voir les détails
                                        <FiChevronRight style={styles.detailsIcon} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal de comparaison */}
                {showComparison && (
                    <div style={styles.modalOverlay} onClick={() => setShowComparison(false)}>
                        <div style={styles.comparisonModal} onClick={e => e.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>
                                    <MdOutlineCompareArrows style={styles.modalTitleIcon} />
                                    Comparaison des plans
                                </h2>
                                <button
                                    onClick={() => setShowComparison(false)}
                                    style={styles.modalCloseButton}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={styles.comparisonContainer}>
                                <table style={styles.comparisonTable}>
                                    <thead>
                                        <tr>
                                            <th style={styles.comparisonTh}>Fonctionnalités</th>
                                            {comparisonData.map((plan) => (
                                                <th key={plan.id} style={styles.comparisonTh}>
                                                    <div style={styles.comparisonPlanHeader}>
                                                        <div style={{
                                                            ...styles.comparisonIcon,
                                                            background: getPlanGradient(plan.code)
                                                        }}>
                                                            {getPlanIcon(plan.code)}
                                                        </div>
                                                        <div>
                                                            <div style={styles.comparisonName}>{plan.name}</div>
                                                            <div style={styles.comparisonCode}>{plan.code}</div>
                                                            <div style={styles.comparisonPrice}>{plan.formatted_price}</div>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={styles.comparisonTd}>Durée</td>
                                            {comparisonData.map((plan) => (
                                                <td key={plan.id} style={styles.comparisonTd}>
                                                    {plan.duration}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td style={styles.comparisonTd}>Services maximum</td>
                                            {comparisonData.map((plan) => (
                                                <td key={plan.id} style={styles.comparisonTd}>
                                                    {plan.max_services_text}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td style={styles.comparisonTd}>Employés maximum</td>
                                            {comparisonData.map((plan) => (
                                                <td key={plan.id} style={styles.comparisonTd}>
                                                    {plan.max_employees_text}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td style={styles.comparisonTd}>Support prioritaire</td>
                                            {comparisonData.map((plan) => (
                                                <td key={plan.id} style={styles.comparisonTd}>
                                                    {plan.has_priority_support ? (
                                                        <div style={styles.comparisonYes}>
                                                            <MdOutlineVerified style={styles.checkIcon} />
                                                            Oui
                                                        </div>
                                                    ) : (
                                                        <div style={styles.comparisonNo}>
                                                            <FiXCircle style={styles.xIcon} />
                                                            Non
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td style={styles.comparisonTd}>Statistiques avancées</td>
                                            {comparisonData.map((plan) => (
                                                <td key={plan.id} style={styles.comparisonTd}>
                                                    {plan.has_analytics ? (
                                                        <div style={styles.comparisonYes}>
                                                            <MdOutlineVerified style={styles.checkIcon} />
                                                            Oui
                                                        </div>
                                                    ) : (
                                                        <div style={styles.comparisonNo}>
                                                            <FiXCircle style={styles.xIcon} />
                                                            Non
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td style={styles.comparisonTd}>Accès Notification SMS</td>
                                            {comparisonData.map((plan) => (
                                                <td key={plan.id} style={styles.comparisonTd}>
                                                    {plan.has_api_access ? (
                                                        <div style={styles.comparisonYes}>
                                                            <MdOutlineVerified style={styles.checkIcon} />
                                                            Oui
                                                        </div>
                                                    ) : (
                                                        <div style={styles.comparisonNo}>
                                                            <FiXCircle style={styles.xIcon} />
                                                            Non
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    onClick={() => setShowComparison(false)}
                                    style={styles.modalCloseBtn}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de détails du plan */}
                {selectedPlan && (
                    <div style={styles.modalOverlay} onClick={() => setSelectedPlan(null)}>
                        <div style={styles.detailsModal} onClick={e => e.stopPropagation()}>
                            <div style={{
                                ...styles.detailsHeader,
                                background: getPlanGradient(selectedPlan.code)
                            }}>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    style={styles.detailsCloseButton}
                                >
                                    ×
                                </button>
                                <div style={styles.detailsIcon}>
                                    {getPlanIcon(selectedPlan.code)}
                                </div>
                                <h2 style={styles.detailsTitle}>{selectedPlan.name}</h2>
                                <span style={styles.detailsCode}>{selectedPlan.code}</span>
                            </div>

                            <div style={styles.detailsBody}>
                                <div style={styles.detailsPrice}>
                                    <span style={styles.detailsPriceAmount}>
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: 'XOF',
                                            minimumFractionDigits: 0
                                        }).format(selectedPlan.price)}
                                    </span>
                                    <span style={styles.detailsPricePeriod}>/{selectedPlan.duration_text}</span>
                                </div>

                                {selectedPlan.description && (
                                    <p style={styles.detailsDescription}>{selectedPlan.description}</p>
                                )}

                                <div style={styles.detailsStats}>
                                    {selectedPlan.max_services && (
                                        <div style={styles.detailsStat}>
                                            <FiBriefcase style={styles.detailsStatIcon} />
                                            <div>
                                                <div style={styles.detailsStatValue}>{selectedPlan.max_services}</div>
                                                <div style={styles.detailsStatLabel}>Services maximum</div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedPlan.max_employees && (
                                        <div style={styles.detailsStat}>
                                            <FiUsers style={styles.detailsStatIcon} />
                                            <div>
                                                <div style={styles.detailsStatValue}>{selectedPlan.max_employees}</div>
                                                <div style={styles.detailsStatLabel}>Employés maximum</div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={styles.detailsStat}>
                                        <FiClock style={styles.detailsStatIcon} />
                                        <div>
                                            <div style={styles.detailsStatValue}>{selectedPlan.duration_text}</div>
                                            <div style={styles.detailsStatLabel}>Durée d'abonnement</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.detailsSection}>
                                    <h3 style={styles.detailsSectionTitle}>
                                        <FiCheckCircle style={styles.detailsSectionIcon} />
                                        Toutes les fonctionnalités
                                    </h3>
                                    <div style={styles.detailsFeatures}>
                                        {(selectedPlan.features_list || []).map((feature, index) => (
                                            <div key={index} style={styles.detailsFeature}>
                                                <FiCheckCircle style={styles.detailsFeatureIcon} />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {(selectedPlan.limitations_list || []).length > 0 && (
                                    <div style={styles.detailsSection}>
                                        <h3 style={styles.detailsSectionTitle}>
                                            <FiXCircle style={{...styles.detailsSectionIcon, color: '#ef4444'}} />
                                            Limitations
                                        </h3>
                                        <div style={styles.detailsLimitations}>
                                            {(selectedPlan.limitations_list || []).map((limitation, index) => (
                                                <div key={index} style={styles.detailsLimitation}>
                                                    <FiXCircle style={styles.detailsLimitationIcon} />
                                                    <span>{limitation}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={styles.detailsFooter}>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    style={styles.detailsCloseBtn}
                                >
                                    Fermer
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
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .plan-card {
                    animation: slideIn 0.3s ease;
                    cursor: pointer;
                }
                
                .plan-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                }
                
                .plan-card:hover .details-button {
                    background-color: ${theme.colors.primary};
                    color: #fff;
                }
                
                .toast {
                    animation: slideInRight 0.3s ease;
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
        position: 'relative'
    },
    content: {
        maxWidth: '1200px',
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
        width: '50px',
        height: '50px',
        border: `4px solid ${theme.colors.primaryLight}`,
        borderTop: `4px solid ${theme.colors.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: '#64748b',
        fontSize: '1.125rem'
    },
    successToast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#10b981',
        color: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        zIndex: 10000,
        animation: 'slideInRight 0.3s ease'
    },
    errorToast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#ef4444',
        color: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        zIndex: 10000,
        animation: 'slideInRight 0.3s ease'
    },
    toastIcon: {
        fontSize: '1.25rem'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.5rem'
    },
    titleIcon: {
        fontSize: '2rem',
        color: theme.colors.primary
    },
    subtitle: {
        color: '#64748b',
        fontSize: '1rem'
    },
    headerActions: {
        display: 'flex',
        gap: '1rem'
    },
    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        color: '#475569',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    refreshIcon: {
        fontSize: '1rem'
    },
    refreshingIcon: {
        fontSize: '1rem',
        animation: 'spin 1s linear infinite'
    },
    compareButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: theme.colors.primary,
        border: 'none',
        borderRadius: '0.75rem',
        color: '#fff',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    compareIcon: {
        fontSize: '1rem'
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0'
    },
    emptyStateIcon: {
        fontSize: '4rem',
        color: '#94a3b8',
        marginBottom: '1rem'
    },
    emptyStateTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    emptyStateText: {
        color: '#64748b',
        fontSize: '1rem'
    },
    plansGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s'
    },
    planHeader: {
        position: 'relative',
        padding: '2rem',
        color: '#fff',
        textAlign: 'center'
    },
    planBadge: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        padding: '0.25rem 0.75rem',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backdropFilter: 'blur(4px)'
    },
    planIcon: {
        fontSize: '3rem',
        marginBottom: '1rem'
    },
    planName: {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '0.5rem'
    },
    planCode: {
        display: 'inline-block',
        padding: '0.25rem 1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
    },
    planBody: {
        padding: '2rem'
    },
    planPrice: {
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    priceAmount: {
        fontSize: '2rem',
        fontWeight: '700',
        color: theme.colors.primary,
        marginRight: '0.25rem'
    },
    pricePeriod: {
        fontSize: '0.875rem',
        color: '#64748b'
    },
    planDescription: {
        fontSize: '0.875rem',
        color: '#475569',
        marginBottom: '1.5rem',
        lineHeight: '1.6',
        textAlign: 'center'
    },
    planStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem'
    },
    statIcon: {
        fontSize: '1.25rem',
        color: theme.colors.primary
    },
    statValue: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1e293b'
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#64748b'
    },
    featuresSection: {
        marginBottom: '1.5rem'
    },
    featuresTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem'
    },
    featuresList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: '#475569'
    },
    featureIcon: {
        fontSize: '1rem',
        color: '#10b981',
        flexShrink: 0
    },
    detailsButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '0.75rem',
        backgroundColor: '#fff',
        border: `2px solid ${theme.colors.primary}`,
        borderRadius: '0.5rem',
        color: theme.colors.primary,
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    detailsIcon: {
        fontSize: '1rem'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        padding: '1rem'
    },
    comparisonModal: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column'
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    modalTitleIcon: {
        fontSize: '1.25rem',
        color: theme.colors.primary
    },
    modalCloseButton: {
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        color: '#64748b',
        cursor: 'pointer',
        lineHeight: 1,
        padding: '0.25rem 0.75rem',
        borderRadius: '0.375rem',
        transition: 'all 0.2s'
    },
    comparisonContainer: {
        overflow: 'auto',
        flex: 1
    },
    comparisonTable: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    comparisonTh: {
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#1e293b',
        borderBottom: '2px solid #e2e8f0'
    },
    comparisonPlanHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
    },
    comparisonIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: '0.75rem',
        color: '#fff',
        fontSize: '1.5rem',
        marginBottom: '0.5rem'
    },
    comparisonName: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1e293b'
    },
    comparisonCode: {
        fontSize: '0.75rem',
        color: '#64748b'
    },
    comparisonPrice: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: theme.colors.primary,
        marginTop: '0.25rem'
    },
    comparisonTd: {
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#475569',
        borderBottom: '1px solid #e2e8f0'
    },
    comparisonYes: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        color: '#10b981'
    },
    comparisonNo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        color: '#ef4444'
    },
    checkIcon: {
        fontSize: '1rem'
    },
    xIcon: {
        fontSize: '1rem'
    },
    modalFooter: {
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    modalCloseBtn: {
        padding: '0.75rem 2rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        color: '#475569',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    detailsModal: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column'
    },
    detailsHeader: {
        position: 'relative',
        padding: '2rem',
        color: '#fff',
        textAlign: 'center'
    },
    detailsCloseButton: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        color: '#fff',
        fontSize: '1.5rem',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.2s'
    },
    detailsIcon: {
        fontSize: '3rem',
        marginBottom: '1rem'
    },
    detailsTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '0.5rem'
    },
    detailsCode: {
        display: 'inline-block',
        padding: '0.25rem 1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
    },
    detailsBody: {
        padding: '2rem',
        overflowY: 'auto',
        flex: 1
    },
    detailsPrice: {
        textAlign: 'center',
        marginBottom: '1.5rem'
    },
    detailsPriceAmount: {
        fontSize: '2rem',
        fontWeight: '700',
        color: theme.colors.primary,
        marginRight: '0.25rem'
    },
    detailsPricePeriod: {
        fontSize: '0.875rem',
        color: '#64748b'
    },
    detailsDescription: {
        fontSize: '0.95rem',
        color: '#475569',
        marginBottom: '1.5rem',
        lineHeight: '1.6',
        textAlign: 'center'
    },
    detailsStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
    },
    detailsStat: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem'
    },
    detailsStatIcon: {
        fontSize: '1.5rem',
        color: theme.colors.primary
    },
    detailsStatValue: {
        fontSize: '1.125rem',
        fontWeight: '700',
        color: '#1e293b'
    },
    detailsStatLabel: {
        fontSize: '0.75rem',
        color: '#64748b'
    },
    detailsSection: {
        marginBottom: '1.5rem'
    },
    detailsSectionTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    detailsSectionIcon: {
        fontSize: '1.125rem',
        color: '#10b981'
    },
    detailsFeatures: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    detailsFeature: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: '#475569'
    },
    detailsFeatureIcon: {
        fontSize: '1rem',
        color: '#10b981',
        flexShrink: 0
    },
    detailsLimitations: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    detailsLimitation: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem',
        backgroundColor: '#fef2f2',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: '#991b1b'
    },
    detailsLimitationIcon: {
        fontSize: '1rem',
        color: '#ef4444',
        flexShrink: 0
    },
    detailsFooter: {
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    detailsCloseBtn: {
        padding: '0.75rem 2rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        color: '#475569',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};
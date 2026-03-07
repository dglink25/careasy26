import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import planApi from '../../api/planApi';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../config/theme';
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiEyeOff,
    FiChevronRight,
    FiDollarSign,
    FiCalendar,
    FiCheckCircle,
    FiXCircle,
    FiSettings,
    FiRefreshCw,
    FiGrid,
    FiList,
    FiSearch,
    FiFilter,
    FiMoreVertical,
    FiCopy,
    FiArchive,
    FiAlertCircle,
    FiZap,
    FiUsers,
    FiBriefcase,
    FiStar,
    FiAward,
    FiClock,
    FiSave,
    FiX
} from 'react-icons/fi';
import {
    MdOutlineStorefront,
    MdOutlineBusinessCenter,
    MdOutlineVerified,
    MdOutlineWarning,
    MdOutlineInfo,
    MdOutlineCompareArrows
} from 'react-icons/md';
import { FaCrown, FaRocket, FaRegGem } from 'react-icons/fa';

export default function AdminPlans() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        price: '',
        duration_days: 30,
        features: [],
        limitations: [],
        max_services: '',
        max_employees: '',
        has_priority_support: false,
        has_analytics: false,
        has_api_access: false,
        is_active: true,
        sort_order: 0
    });
    const [featureInput, setFeatureInput] = useState('');
    const [limitationInput, setLimitationInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('sort_order');
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
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
            const response = await planApi.getPlans();
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

    const handleAddPlan = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            price: '',
            duration_days: 30,
            features: [],
            limitations: [],
            max_services: '',
            max_employees: '',
            has_priority_support: false,
            has_analytics: false,
            has_api_access: false,
            is_active: true,
            sort_order: plans.length
        });
        setFeatureInput('');
        setLimitationInput('');
        setFormErrors({});
        setShowFormModal(true);
    };

    const handleEditPlan = (plan) => {
        console.log('Édition du plan:', plan);
        setEditingPlan(plan);
        setFormData({
            name: plan.name || '',
            code: plan.code || '',
            description: plan.description || '',
            price: plan.price || '',
            duration_days: plan.duration_days || 30,
            features: plan.features || [],
            limitations: plan.limitations || [],
            max_services: plan.max_services || '',
            max_employees: plan.max_employees || '',
            has_priority_support: plan.has_priority_support || false,
            has_analytics: plan.has_analytics || false,
            has_api_access: plan.has_api_access || false,
            is_active: plan.is_active !== undefined ? plan.is_active : true,
            sort_order: plan.sort_order || 0
        });
        setShowFormModal(true);
    };

    const handleDeleteClick = (plan) => {
        setPlanToDelete(plan);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!planToDelete) return;

        try {
            setSaving(true);
            await planApi.deletePlan(planToDelete.id);
            await fetchPlans();
            setShowDeleteModal(false);
            setPlanToDelete(null);
            showSuccess('Plan supprimé avec succès');
        } catch (err) {
            console.error('Erreur suppression:', err);
            showError(err.message || 'Erreur lors de la suppression');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (plan) => {
        try {
            await planApi.toggleStatus(plan.id);
            await fetchPlans();
            showSuccess(`Plan ${plan.is_active ? 'désactivé' : 'activé'} avec succès`);
        } catch (err) {
            console.error('Erreur changement statut:', err);
            showError(err.message || 'Erreur lors du changement de statut');
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Le nom est requis';
        }
        
        if (!formData.code || formData.code.trim() === '') {
            errors.code = 'Le code est requis';
        } else if (!/^[A-Z0-9-]+$/.test(formData.code.toUpperCase())) {
            errors.code = 'Le code ne doit contenir que des lettres majuscules, chiffres et tirets';
        }
        
        if (!formData.price || parseFloat(formData.price) <= 0) {
            errors.price = 'Le prix doit être supérieur à 0';
        }
        
        if (!formData.duration_days || parseInt(formData.duration_days) < 1) {
            errors.duration_days = 'La durée doit être d\'au moins 1 jour';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showError('Veuillez corriger les erreurs du formulaire');
            return;
        }

        try {
            setSaving(true);
            
            const planData = {
                ...formData,
                price: parseFloat(formData.price),
                duration_days: parseInt(formData.duration_days),
                max_services: formData.max_services ? parseInt(formData.max_services) : null,
                max_employees: formData.max_employees ? parseInt(formData.max_employees) : null,
                features: formData.features.filter(f => f.trim() !== ''),
                limitations: formData.limitations.filter(l => l.trim() !== '')
            };

            console.log('Données à envoyer:', planData);

            if (editingPlan) {
                await planApi.updatePlan(editingPlan.id, planData);
                showSuccess('Plan mis à jour avec succès');
            } else {
                await planApi.createPlan(planData);
                showSuccess('Plan créé avec succès');
            }
            
            await fetchPlans();
            setShowFormModal(false);
            
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            if (err.errors) {
                setFormErrors(err.errors);
                showError('Veuillez corriger les erreurs du formulaire');
            } else {
                showError(err.message || 'Erreur lors de la sauvegarde');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData({
                ...formData,
                features: [...(formData.features || []), featureInput.trim()]
            });
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (index) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures.splice(index, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleAddLimitation = () => {
        if (limitationInput.trim()) {
            setFormData({
                ...formData,
                limitations: [...(formData.limitations || []), limitationInput.trim()]
            });
            setLimitationInput('');
        }
    };

    const handleRemoveLimitation = (index) => {
        const newLimitations = [...(formData.limitations || [])];
        newLimitations.splice(index, 1);
        setFormData({ ...formData, limitations: newLimitations });
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

    const getFilteredPlans = () => {
        let filtered = [...plans];

        if (searchTerm) {
            filtered = filtered.filter(plan =>
                plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                plan.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus === 'active') {
            filtered = filtered.filter(plan => plan.is_active);
        } else if (filterStatus === 'inactive') {
            filtered = filtered.filter(plan => !plan.is_active);
        }

        filtered.sort((a, b) => {
            if (sortBy === 'price') {
                return (a.price || 0) - (b.price || 0);
            } else if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else {
                return ((a.sort_order || 0) - (b.sort_order || 0));
            }
        });

        return filtered;
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Chargement des plans...</p>
            </div>
        );
    }

    const filteredPlans = getFilteredPlans();

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
                    <FiAlertCircle style={styles.toastIcon} />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div style={styles.content}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>
                            <FiSettings style={styles.titleIcon} />
                            Gestion des Plans d'Abonnement
                        </h1>
                        <p style={styles.subtitle}>
                            Créez et gérez les plans d'abonnement pour les prestataires (VP1, VP2, VP3...)
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
                            onClick={handleAddPlan}
                            style={styles.addButton}
                        >
                            <FiPlus style={styles.addIcon} />
                            Nouveau Plan
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={styles.filtersContainer}>
                    <div style={styles.searchBox}>
                        <FiSearch style={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Rechercher un plan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filterGroup}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="sort_order">Ordre par défaut</option>
                            <option value="price">Prix</option>
                            <option value="name">Nom</option>
                        </select>

                        <div style={styles.viewToggle}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    ...styles.viewToggleButton,
                                    backgroundColor: viewMode === 'grid' ? theme.colors.primary : 'transparent',
                                    color: viewMode === 'grid' ? '#fff' : '#64748b'
                                }}
                            >
                                <FiGrid />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    ...styles.viewToggleButton,
                                    backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
                                    color: viewMode === 'list' ? '#fff' : '#64748b'
                                }}
                            >
                                <FiList />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Plans Grid/List */}
                {filteredPlans.length === 0 ? (
                    <div style={styles.emptyState}>
                        <MdOutlineStorefront style={styles.emptyStateIcon} />
                        <h3 style={styles.emptyStateTitle}>Aucun plan trouvé</h3>
                        <p style={styles.emptyStateText}>
                            Commencez par créer votre premier plan d'abonnement.
                        </p>
                        <button onClick={handleAddPlan} style={styles.emptyStateButton}>
                            <FiPlus />
                            Créer un plan
                        </button>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div style={styles.plansGrid}>
                            {filteredPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    style={styles.planCard}
                                    className="plan-card"
                                >
                                    {!plan.is_active && (
                                        <div style={styles.inactiveBadge}>
                                            <FiEyeOff />
                                            Inactif
                                        </div>
                                    )}

                                    <div style={{
                                        ...styles.planHeader,
                                        background: getPlanGradient(plan.code)
                                    }}>
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
                                            <h4 style={styles.featuresTitle}>Fonctionnalités</h4>
                                            <div style={styles.featuresList}>
                                                {(plan.features_list || []).slice(0, 3).map((feature, index) => (
                                                    <div key={index} style={styles.featureItem}>
                                                        <FiCheckCircle style={styles.featureIcon} />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                                {(plan.features_list || []).length > 3 && (
                                                    <div style={styles.moreFeatures}>
                                                        +{plan.features_list.length - 3} autres
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={styles.planActions}>
                                            <button
                                                onClick={() => handleEditPlan(plan)}
                                                style={styles.actionButton}
                                                title="Modifier"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(plan)}
                                                style={styles.actionButton}
                                                title={plan.is_active ? 'Désactiver' : 'Activer'}
                                            >
                                                {plan.is_active ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(plan)}
                                                style={{ ...styles.actionButton, ...styles.deleteButton }}
                                                title="Supprimer"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>Plan</th>
                                        <th style={styles.th}>Code</th>
                                        <th style={styles.th}>Prix</th>
                                        <th style={styles.th}>Durée</th>
                                        <th style={styles.th}>Statut</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlans.map((plan) => (
                                        <tr key={plan.id} style={styles.tableRow}>
                                            <td style={styles.td}>
                                                <div style={styles.planCell}>
                                                    <div style={{
                                                        ...styles.tableIcon,
                                                        background: getPlanGradient(plan.code)
                                                    }}>
                                                        {getPlanIcon(plan.code)}
                                                    </div>
                                                    <div>
                                                        <div style={styles.planName}>{plan.name}</div>
                                                        {plan.description && (
                                                            <div style={styles.planDesc}>{plan.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.planCode}>{plan.code}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.price}>
                                                    {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'XOF',
                                                        minimumFractionDigits: 0
                                                    }).format(plan.price)}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.duration}>{plan.duration_text}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: plan.is_active ? '#d1fae5' : '#fee2e2',
                                                    color: plan.is_active ? '#059669' : '#dc2626'
                                                }}>
                                                    {plan.is_active ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.tableActions}>
                                                    <button
                                                        onClick={() => handleEditPlan(plan)}
                                                        style={styles.tableActionButton}
                                                        title="Modifier"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(plan)}
                                                        style={styles.tableActionButton}
                                                        title={plan.is_active ? 'Désactiver' : 'Activer'}
                                                    >
                                                        {plan.is_active ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(plan)}
                                                        style={{ ...styles.tableActionButton, ...styles.tableDeleteButton }}
                                                        title="Supprimer"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Modal de création/édition */}
            {showFormModal && (
                <div style={styles.modalOverlay} onClick={() => setShowFormModal(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editingPlan ? 'Modifier le plan' : 'Créer un nouveau plan'}
                            </h2>
                            <button
                                onClick={() => setShowFormModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={styles.modalBody}>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>
                                        Nom du plan <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="ex: Plan Essentiel"
                                        style={{
                                            ...styles.formInput,
                                            borderColor: formErrors.name ? '#ef4444' : '#e2e8f0'
                                        }}
                                    />
                                    {formErrors.name && (
                                        <span style={styles.errorText}>{formErrors.name}</span>
                                    )}
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>
                                        Code <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="ex: VP1, VP2, VP3"
                                        style={{
                                            ...styles.formInput,
                                            borderColor: formErrors.code ? '#ef4444' : '#e2e8f0'
                                        }}
                                    />
                                    {formErrors.code && (
                                        <span style={styles.errorText}>{formErrors.code}</span>
                                    )}
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>
                                        Prix (F CFA) <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="ex: 50000"
                                        style={{
                                            ...styles.formInput,
                                            borderColor: formErrors.price ? '#ef4444' : '#e2e8f0'
                                        }}
                                        min="0"
                                        step="1000"
                                    />
                                    {formErrors.price && (
                                        <span style={styles.errorText}>{formErrors.price}</span>
                                    )}
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>
                                        Durée (jours) <span style={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration_days}
                                        onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                                        placeholder="ex: 30"
                                        style={{
                                            ...styles.formInput,
                                            borderColor: formErrors.duration_days ? '#ef4444' : '#e2e8f0'
                                        }}
                                        min="1"
                                    />
                                    {formErrors.duration_days && (
                                        <span style={styles.errorText}>{formErrors.duration_days}</span>
                                    )}
                                </div>

                                <div style={styles.formGroupFull}>
                                    <label style={styles.formLabel}>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Description du plan..."
                                        style={styles.formTextarea}
                                        rows="3"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Max services</label>
                                    <input
                                        type="number"
                                        value={formData.max_services}
                                        onChange={(e) => setFormData({ ...formData, max_services: e.target.value })}
                                        placeholder="ex: 10 (vide = illimité)"
                                        style={styles.formInput}
                                        min="0"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Max employés</label>
                                    <input
                                        type="number"
                                        value={formData.max_employees}
                                        onChange={(e) => setFormData({ ...formData, max_employees: e.target.value })}
                                        placeholder="ex: 5"
                                        style={styles.formInput}
                                        min="0"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Ordre d'affichage</label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                                        placeholder="0"
                                        style={styles.formInput}
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Options supplémentaires */}
                            <div style={styles.optionsSection}>
                                <h3 style={styles.optionsTitle}>Options supplémentaires</h3>
                                <div style={styles.optionsGrid}>
                                    <label style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.has_priority_support}
                                            onChange={(e) => setFormData({ ...formData, has_priority_support: e.target.checked })}
                                        />
                                        Support prioritaire
                                    </label>
                                    <label style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.has_analytics}
                                            onChange={(e) => setFormData({ ...formData, has_analytics: e.target.checked })}
                                        />
                                        Statistiques avancées
                                    </label>
                                    <label style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.has_api_access}
                                            onChange={(e) => setFormData({ ...formData, has_api_access: e.target.checked })}
                                        />
                                        Accès Notification SMS
                                    </label>
                                    <label style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        Plan actif
                                    </label>
                                </div>
                            </div>

                            {/* Features */}
                            <div style={styles.listSection}>
                                <h3 style={styles.listTitle}>Fonctionnalités</h3>
                                <div style={styles.listInput}>
                                    <input
                                        type="text"
                                        value={featureInput}
                                        onChange={(e) => setFeatureInput(e.target.value)}
                                        placeholder="Ajouter une fonctionnalité..."
                                        style={styles.listField}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddFeature}
                                        style={styles.listAddButton}
                                    >
                                        <FiPlus />
                                    </button>
                                </div>
                                <div style={styles.listItems}>
                                    {(formData.features || []).map((feature, index) => (
                                        <div key={index} style={styles.listItem}>
                                            <span>{feature}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFeature(index)}
                                                style={styles.listRemoveButton}
                                            >
                                                <FiXCircle />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Limitations */}
                            <div style={styles.listSection}>
                                <h3 style={styles.listTitle}>Limitations</h3>
                                <div style={styles.listInput}>
                                    <input
                                        type="text"
                                        value={limitationInput}
                                        onChange={(e) => setLimitationInput(e.target.value)}
                                        placeholder="Ajouter une limitation..."
                                        style={styles.listField}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLimitation())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddLimitation}
                                        style={styles.listAddButton}
                                    >
                                        <FiPlus />
                                    </button>
                                </div>
                                <div style={styles.listItems}>
                                    {(formData.limitations || []).map((limitation, index) => (
                                        <div key={index} style={styles.listItem}>
                                            <span>{limitation}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLimitation(index)}
                                                style={styles.listRemoveButton}
                                            >
                                                <FiXCircle />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    style={styles.modalCancelButton}
                                    disabled={saving}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    style={styles.modalSubmitButton}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <div style={styles.buttonSpinner}></div>
                                            {editingPlan ? 'Mise à jour...' : 'Création...'}
                                        </>
                                    ) : (
                                        <>
                                            <FiSave style={styles.buttonIcon} />
                                            {editingPlan ? 'Mettre à jour' : 'Créer le plan'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de confirmation suppression */}
            {showDeleteModal && (
                <div style={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
                        <div style={styles.confirmIcon}>
                            <FiAlertCircle />
                        </div>
                        <h3 style={styles.confirmTitle}>Confirmer la suppression</h3>
                        <p style={styles.confirmText}>
                            Êtes-vous sûr de vouloir supprimer le plan "{planToDelete?.name}" ?
                            Cette action est irréversible.
                        </p>
                        <div style={styles.confirmActions}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={styles.confirmCancelButton}
                                disabled={saving}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                style={styles.confirmDeleteButton}
                                disabled={saving}
                            >
                                {saving ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                
                .plan-card {
                    animation: slideIn 0.3s ease;
                }
                
                .plan-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
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
    buttonSpinner: {
        width: '16px',
        height: '16px',
        border: '2px solid #fff',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '0.5rem'
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
        marginBottom: '2rem',
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
    addButton: {
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
    addIcon: {
        fontSize: '1rem'
    },
    filtersContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '0 1rem',
        flex: 1,
        minWidth: '250px'
    },
    searchIcon: {
        fontSize: '1rem',
        color: '#94a3b8'
    },
    searchInput: {
        padding: '0.75rem 1rem',
        border: 'none',
        outline: 'none',
        fontSize: '0.95rem',
        width: '100%',
        backgroundColor: 'transparent'
    },
    filterGroup: {
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
    },
    filterSelect: {
        padding: '0.75rem 2rem 0.75rem 1rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        fontSize: '0.95rem',
        color: '#1e293b',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px'
    },
    viewToggle: {
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '0.25rem'
    },
    viewToggleButton: {
        padding: '0.5rem',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'all 0.2s'
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
        fontSize: '1rem',
        marginBottom: '1.5rem'
    },
    emptyStateButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 2rem',
        backgroundColor: theme.colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    plansGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
        position: 'relative'
    },
    inactiveBadge: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.75rem',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        color: '#fff',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backdropFilter: 'blur(4px)'
    },
    planHeader: {
        padding: '2rem',
        color: '#fff',
        textAlign: 'center'
    },
    planIcon: {
        fontSize: '3rem',
        marginBottom: '1rem'
    },
    planName: {
        fontSize: '1.25rem',
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
        padding: '1.5rem'
    },
    planPrice: {
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    priceAmount: {
        fontSize: '1.75rem',
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
        marginBottom: '1rem',
        lineHeight: '1.6',
        textAlign: 'center'
    },
    planStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.5rem'
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem'
    },
    statIcon: {
        fontSize: '1rem',
        color: theme.colors.primary
    },
    statValue: {
        fontSize: '0.875rem',
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
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.75rem'
    },
    featuresList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: '#475569'
    },
    featureIcon: {
        fontSize: '0.875rem',
        color: '#10b981',
        flexShrink: 0
    },
    moreFeatures: {
        fontSize: '0.75rem',
        color: theme.colors.primary,
        marginTop: '0.25rem',
        fontWeight: '500'
    },
    planActions: {
        display: 'flex',
        gap: '0.5rem',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '1rem'
    },
    actionButton: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        color: '#475569',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    deleteButton: {
        color: '#ef4444'
    },
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '2rem'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0'
    },
    th: {
        padding: '1rem',
        textAlign: 'left',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#475569'
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0',
        transition: 'background-color 0.2s'
    },
    td: {
        padding: '1rem',
        fontSize: '0.875rem',
        color: '#1e293b'
    },
    planCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    tableIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '1.25rem'
    },
    planDesc: {
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '0.125rem'
    },
    price: {
        fontWeight: '600',
        color: theme.colors.primary
    },
    duration: {
        color: '#64748b'
    },
    statusBadge: {
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
    },
    tableActions: {
        display: 'flex',
        gap: '0.5rem'
    },
    tableActionButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.375rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.375rem',
        color: '#475569',
        fontSize: '0.875rem',
        cursor: 'pointer'
    },
    tableDeleteButton: {
        color: '#ef4444'
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
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: '#fff',
        zIndex: 10
    },
    modalTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#1e293b'
    },
    modalCloseButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        color: '#64748b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.25rem',
        borderRadius: '0.375rem',
        transition: 'all 0.2s'
    },
    modalBody: {
        padding: '1.5rem'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    formGroup: {
        marginBottom: '0.5rem'
    },
    formGroupFull: {
        gridColumn: '1 / -1',
        marginBottom: '0.5rem'
    },
    formLabel: {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#1e293b'
    },
    required: {
        color: '#ef4444',
        marginLeft: '0.25rem'
    },
    formInput: {
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    formTextarea: {
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit'
    },
    errorText: {
        display: 'block',
        marginTop: '0.25rem',
        fontSize: '0.75rem',
        color: '#ef4444'
    },
    optionsSection: {
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem'
    },
    optionsTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem'
    },
    optionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: '#475569',
        cursor: 'pointer'
    },
    listSection: {
        marginBottom: '1.5rem'
    },
    listTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '1rem'
    },
    listInput: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
    },
    listField: {
        flex: 1,
        padding: '0.75rem 1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        outline: 'none'
    },
    listAddButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        backgroundColor: theme.colors.primary,
        border: 'none',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '1rem',
        cursor: 'pointer'
    },
    listItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxHeight: '200px',
        overflowY: 'auto'
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        color: '#1e293b'
    },
    listRemoveButton: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        fontSize: '1rem',
        cursor: 'pointer',
        padding: '0.25rem'
    },
    modalFooter: {
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '1.5rem'
    },
    modalCancelButton: {
        flex: 1,
        padding: '0.75rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        color: '#475569',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    },
    modalSubmitButton: {
        flex: 1,
        padding: '0.75rem',
        backgroundColor: theme.colors.primary,
        border: 'none',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    },
    buttonIcon: {
        fontSize: '1rem'
    },
    confirmModal: {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
    },
    confirmIcon: {
        fontSize: '3rem',
        color: '#ef4444',
        marginBottom: '1rem'
    },
    confirmTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    confirmText: {
        fontSize: '0.95rem',
        color: '#64748b',
        marginBottom: '1.5rem',
        lineHeight: '1.6'
    },
    confirmActions: {
        display: 'flex',
        gap: '1rem'
    },
    confirmCancelButton: {
        flex: 1,
        padding: '0.75rem',
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        color: '#475569',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    confirmDeleteButton: {
        flex: 1,
        padding: '0.75rem',
        backgroundColor: '#ef4444',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer'
    }
};
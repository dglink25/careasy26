import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiExternalLink } from 'react-icons/fi';
import paiementApi from '../../api/paiementApi';
import theme from '../../config/theme';

export default function PaiementModal({ plan, onClose, onSuccess }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paiement, setPaiement] = useState(null);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(30);
    const [verificationInterval, setVerificationInterval] = useState(null);

    useEffect(() => {
        return () => {
            if (verificationInterval) {
                clearInterval(verificationInterval);
            }
        };
    }, [verificationInterval]);

    const handlePayer = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await paiementApi.initierPaiement(plan.id);
            
            if (response.success) {
                setPaiement(response.data);
                
                // Ouvrir la page de paiement FedaPay
                if (response.data.payment_url) {
                    window.open(response.data.payment_url, '_blank');
                    
                    // Démarrer la vérification du statut
                    startVerification(response.data.paiement.reference);
                }
            } else {
                setError(response.message || 'Erreur lors de l\'initialisation du paiement');
            }
        } catch (err) {
            console.error('Erreur paiement:', err);
            setError(err.message || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const startVerification = (reference) => {

            const interval = setInterval(async () => {
                try {
                    const response = await paiementApi.verifierPaiement(reference);
                    
                    if (response.success) {
                        if (response.data.paiement.statut === 'succes') {
                            clearInterval(interval);
                            onSuccess?.(response.data);
                            // Rediriger vers la page de succès
                            navigate('/paiement/success?reference=' + reference);
                        } else if (response.data.paiement.statut === 'echec') {
                            clearInterval(interval);
                            setError('Le paiement a échoué. Veuillez réessayer.');
                        }
                    }
                } catch (err) {
                    console.error('Erreur vérification:', err);
                }
            }, 50);

        setVerificationInterval(interval);

        // Arrêter après 5 minutes
        setTimeout(() => {
            clearInterval(interval);
            setError('Délai de paiement expiré. Veuillez réessayer.');
        }, 300000);
    };

    const handleRetry = () => {
        setError(null);
        setPaiement(null);
        if (verificationInterval) {
            clearInterval(verificationInterval);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>
                    <FiX />
                </button>

                <div style={styles.header}>
                    <h2 style={styles.title}>Paiement de l'abonnement</h2>
                </div>

                <div style={styles.content}>
                    {/* Récapitulatif du plan */}
                    <div style={styles.planRecap}>
                        <h3 style={styles.planName}>{plan.name}</h3>
                        <p style={styles.planPrice}>
                            {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                                minimumFractionDigits: 0
                            }).format(plan.price)}
                            <span style={styles.planDuration}>/{plan.duration_text}</span>
                        </p>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <FiAlertCircle style={styles.errorIcon} />
                            <p style={styles.errorText}>{error}</p>
                            <button onClick={handleRetry} style={styles.retryButton}>
                                Réessayer
                            </button>
                        </div>
                    )}

                    {!paiement && !error && (
                        <div style={styles.paymentOptions}>
                            <p style={styles.paymentText}>
                                Moyens de paiement acceptés :
                            </p>
                            
                            <div style={styles.methodsList}>
                                <div style={styles.methodItem}>
                                    <span>Mobile Money (MTN, Moov, Celtis, ...)</span>
                                </div>
                                <div style={styles.methodItem}>
                                    <span>Carte bancaire (Visa, Mastercard)</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayer}
                                disabled={loading}
                                style={{
                                    ...styles.payButton,
                                    ...(loading ? styles.payButtonDisabled : {})
                                }}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader style={styles.spinner} />
                                        Initialisation...
                                    </>
                                ) : (
                                    <>
                                        Payer {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: 'XOF',
                                            minimumFractionDigits: 0
                                        }).format(plan.price)}
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {paiement && !error && (
                        <div style={styles.waitingBox}>
                            <FiLoader style={styles.waitingSpinner} />
                            <h3 style={styles.waitingTitle}>En attente de confirmation</h3>
                            <p style={styles.waitingText}>
                                Veuillez finaliser le paiement sur la page FedaPay.
                                Une fois le paiement effectué, votre abonnement sera activé automatiquement.
                            </p>
                            
                            {paiement.payment_url && (
                                <a
                                    href={paiement.payment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.redirectLink}
                                >
                                    <FiExternalLink />
                                    Retourner sur FedaPay
                                </a>
                            )}

                            <div style={styles.verificationNote}>
                                <p>Vérification automatique en cours...</p>
                                <p style={styles.noteSmall}>
                                    Cette fenêtre se fermera automatiquement après confirmation du paiement.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
        padding: '1rem'
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
    },
    closeButton: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        color: '#64748b',
        cursor: 'pointer',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'all 0.2s'
    },
    header: {
        marginBottom: '2rem'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center'
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    planRecap: {
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        textAlign: 'center'
    },
    planName: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    planPrice: {
        fontSize: '2rem',
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: '0.25rem'
    },
    planDuration: {
        fontSize: '0.875rem',
        color: '#64748b',
        fontWeight: 'normal'
    },
    paymentOptions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    paymentText: {
        fontSize: '0.95rem',
        color: '#475569',
        lineHeight: '1.6',
        textAlign: 'center'
    },
    methodsList: {
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderRadius: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    methodItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.95rem',
        color: '#1e293b'
    },
    payButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1rem',
        backgroundColor: theme.colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    payButtonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed'
    },
    spinner: {
        animation: 'spin 1s linear infinite'
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        textAlign: 'center'
    },
    errorIcon: {
        fontSize: '2rem',
        color: '#ef4444',
        marginBottom: '0.5rem'
    },
    errorText: {
        color: '#991b1b',
        fontSize: '0.95rem',
        marginBottom: '1rem'
    },
    retryButton: {
        padding: '0.5rem 1.5rem',
        backgroundColor: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: 'pointer'
    },
    waitingBox: {
        textAlign: 'center',
        padding: '2rem 0'
    },
    waitingSpinner: {
        fontSize: '3rem',
        color: theme.colors.primary,
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
    },
    waitingTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.5rem'
    },
    waitingText: {
        color: '#64748b',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        marginBottom: '1.5rem'
    },
    redirectLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#fff',
        border: `1px solid ${theme.colors.primary}`,
        borderRadius: '0.5rem',
        color: theme.colors.primary,
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: '500',
        marginBottom: '1rem'
    },
    verificationNote: {
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderRadius: '0.5rem'
    },
    noteSmall: {
        fontSize: '0.875rem',
        color: '#94a3b8',
        marginTop: '0.25rem'
    }
};
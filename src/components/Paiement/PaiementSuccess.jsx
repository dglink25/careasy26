import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

export default function PaiementSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reference = searchParams.get('reference');

    useEffect(() => {
        // Fermer automatiquement après 3 secondes
        const timer = setTimeout(() => {
            navigate('/abonnements?payment=success');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <FiCheckCircle style={styles.icon} />
                <h1 style={styles.title}>Paiement réussi !</h1>
                <p style={styles.message}>
                    Votre abonnement a été activé avec succès.
                </p>
                {reference && (
                    <p style={styles.reference}>
                        Référence : {reference}
                    </p>
                )}
                <p style={styles.redirect}>
                    Redirection vers vos abonnements...
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
    },
    card: {
        backgroundColor: '#fff',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px'
    },
    icon: {
        fontSize: '4rem',
        color: '#10b981',
        marginBottom: '1rem'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '1rem'
    },
    message: {
        color: '#475569',
        marginBottom: '1rem'
    },
    reference: {
        color: '#64748b',
        fontSize: '0.875rem',
        marginBottom: '1rem'
    },
    redirect: {
        color: '#94a3b8',
        fontSize: '0.875rem'
    }
};
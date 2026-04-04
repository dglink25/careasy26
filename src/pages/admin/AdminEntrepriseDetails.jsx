// careasy-frontend/src/pages/admin/AdminEntrepriseDetails.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import theme from '../../config/theme';

// Import des icônes React Icons
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiDownload,
  FiUser,
  FiMapPin,
  FiMail,
  FiPhone, 
  FiBriefcase,
  FiCalendar,
  FiGlobe,
  FiLock,
  FiEye,
  FiPrinter,
  FiCopy,
  FiShare2,
  FiRefreshCw,
  FiAlertCircle,
  FiChevronRight,
  FiExternalLink,
  FiHome,
  FiDollarSign,
  FiShield,
  FiInfo,
  FiCheck,
  FiX,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiCornerUpLeft,
  FiImage
} from 'react-icons/fi';
import {
  MdBusiness,
  MdVerified,
  MdCancel,
  MdOutlineDescription,
  MdOutlineAttachFile,
  MdOutlineBusinessCenter,
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineLocationOn,
  MdOutlinePerson,
  MdOutlineWork,
  MdOutlineDocumentScanner,
  MdOutlineAssignment,
  MdOutlineSecurity,
  MdOutlineStorage,
  MdOutlineVerifiedUser
} from 'react-icons/md';
import { 
  FaRegBuilding,
  FaUserTie,
  FaFileInvoice,
  FaRegCalendarAlt,
  FaIdCard,
  FaRegCheckCircle,
  FaRegTimesCircle,
  FaRegClock,
  FaChartLine,
  FaPercentage,
  FaBalanceScale,
  FaRegHandshake,
  FaFileContract,
  FaCertificate
} from 'react-icons/fa';
import { HiOutlineDocumentText, HiOutlineExclamationCircle } from 'react-icons/hi';
import { BsBuilding, BsCardChecklist, BsPersonBadge, BsFileEarmarkText } from 'react-icons/bs';
import { BiSearchAlt, BiCategoryAlt } from 'react-icons/bi';

export default function AdminEntrepriseDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  const fetchEntreprise = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getEntreprise(id);
      setEntreprise(data);
    } catch (err) {
      console.error('Erreur chargement entreprise:', err);
      setError(t('admin.entrepriseDetails.errors.notFound'));
      setTimeout(() => navigate('/admin/entreprises'), 2000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    fetchEntreprise();
  }, [fetchEntreprise]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEntreprise();
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await adminApi.approveEntreprise(id, adminNote || null);
      alert(response.message);
      navigate('/admin/entreprises');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || t('admin.entrepriseDetails.errors.approveFailed');
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!adminNote.trim() || adminNote.length < 10) {
      alert(t('admin.entrepriseDetails.errors.rejectReasonRequired'));
      return;
    }
    
    setActionLoading(true);
    setError('');
    try {
      const response = await adminApi.rejectEntreprise(id, adminNote);
      alert(response.message);
      navigate('/admin/entreprises');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || t('admin.entrepriseDetails.errors.rejectFailed');
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        icon: <FaRegClock style={styles.statusBadgeIcon} />, 
        text: t('admin.entrepriseDetails.status.pending.title'), 
        color: theme.colors.warning, 
        bg: '#FEF3C7',
        description: t('admin.entrepriseDetails.status.pending.description')
      },
      validated: { 
        icon: <MdVerified style={styles.statusBadgeIcon} />, 
        text: t('admin.entrepriseDetails.status.validated.title'), 
        color: theme.colors.success, 
        bg: '#D1FAE5',
        description: t('admin.entrepriseDetails.status.validated.description')
      },
      rejected: { 
        icon: <FaRegTimesCircle style={styles.statusBadgeIcon} />, 
        text: t('admin.entrepriseDetails.status.rejected.title'), 
        color: theme.colors.error, 
        bg: '#FEE2E2',
        description: t('admin.entrepriseDetails.status.rejected.description')
      },
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <div style={{...styles.statusBanner, backgroundColor: badge.bg, borderColor: badge.color}}>
        <div style={styles.statusBannerContent}>
          <div style={styles.statusIconContainer}>
            {badge.icon}
          </div>
          <div style={styles.statusTextContainer}>
            <div style={{...styles.statusTitle, color: badge.color}}>
              {badge.text}
            </div>
            <div style={styles.statusDescription}>
              {badge.description}
              {status === 'rejected' && entreprise?.admin_note && (
                <div style={styles.rejectionReason}>
                  <FiInfo style={styles.rejectionReasonIcon} />
                  <strong>{t('admin.entrepriseDetails.status.rejected.reason')} :</strong> {entreprise.admin_note}
                </div>
              )}
            </div>
          </div>
          {status === 'pending' && (
            <div style={styles.statusActions}>
              <button 
                onClick={() => setShowRejectModal(true)}
                style={styles.quickRejectButton}
              >
                <FiX style={styles.quickActionIcon} />
                {t('admin.entrepriseDetails.actions.reject')}
              </button>
              <button 
                onClick={() => setShowApproveModal(true)}
                style={styles.quickApproveButton}
              >
                <FiCheck style={styles.quickActionIcon} />
                {t('admin.entrepriseDetails.actions.approve')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };


  const renderFileLink = (filePath, label, icon) => {
    if (!filePath) {
      return (
        <div style={styles.noFile}>
          <BsFileEarmarkText style={styles.noFileIcon} />
          <span style={styles.noFileText}>{t('admin.entrepriseDetails.documents.notProvided')}</span>
        </div>
      );
    }


    // Les fichiers sont stockés sur Cloudinary → l'URL est déjà complète
    // On l'utilise directement, sans aucune transformation
    const fullUrl = filePath;

    // Déterminer si c'est un PDF pour forcer l'affichage dans un onglet
    const isPdf = filePath.toLowerCase().includes('.pdf') ||
                  filePath.toLowerCase().includes('/pdf') ||
                  filePath.toLowerCase().includes('application/pdf');


    
    let fullUrl = filePath;
    
    if (filePath.startsWith('https://careasy26.alwaysdata.net/storage')) {
      const cloudinaryUrl = filePath.replace('https://careasy26.alwaysdata.net/storage', '');
      fullUrl = cloudinaryUrl;
    } 
    else if (filePath.startsWith('http')) {
      fullUrl = filePath;
    }
    else {
      const cleanPath = filePath.replace(/^\/?storage\//, '');
      fullUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${cleanPath}`;
    }

    return (
      <div style={styles.fileLinkContainer}>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.fileLink}
          title={t('admin.entrepriseDetails.documents.openInNewTab')}
        >
          <div style={styles.fileLinkContent}>
            {icon}
            <span style={styles.fileLinkText}>{label}</span>
          </div>
          <FiExternalLink style={styles.externalLinkIcon} />
        </a>
        <div style={styles.fileActions}>
          {/* Visualiser : pour PDF ouvre directement, pour image idem */}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.fileActionButton}
            title={t('admin.entrepriseDetails.documents.view')}
          >
            <FiEye />
          </a>
          {/* Copier le lien */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(fullUrl);
              alert('Lien copié !');
            }}
            style={styles.fileActionButton}
            title={t('admin.entrepriseDetails.documents.copyLink')}
          >
            <FiCopy />
          </button>
          {/* Télécharger — pour Cloudinary on passe par fl_attachment */}
          <a
            href={fullUrl.replace('/upload/', '/upload/fl_attachment/')}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.fileActionButton}
            title={t('admin.entrepriseDetails.documents.download')}
          >
            <FiDownload />
          </a>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${t('admin.entrepriseDetails.share.title')} - ${entreprise.name}`,
        text: t('admin.entrepriseDetails.share.text', { name: entreprise.name }),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t('admin.entrepriseDetails.share.linkCopied'));
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>{t('admin.entrepriseDetails.loading.title')}</p>
          <p style={styles.loadingSubtext}>{t('admin.entrepriseDetails.loading.subtext')}</p>
        </div>
      </div>
    );
  }

  if (error || !entreprise) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <HiOutlineExclamationCircle style={styles.errorIcon} />
          <h2 style={styles.errorTitle}>{error || t('admin.entrepriseDetails.errors.notFound')}</h2>
          <p style={styles.errorText}>
            {t('admin.entrepriseDetails.errors.notFoundText')}
          </p>
          <div style={styles.errorActions}>
            <button 
              onClick={() => navigate('/admin/entreprises')}
              style={styles.errorButton}
            >
              <FiArrowLeft style={styles.errorButtonIcon} />
              {t('admin.entrepriseDetails.errors.backToList')}
            </button>
            <button 
              onClick={fetchEntreprise}
              style={styles.errorRetryButton}
            >
              <FiRefreshCw style={styles.errorRetryIcon} />
              {t('admin.entrepriseDetails.errors.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header avec navigation */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <button 
              onClick={() => navigate('/admin/entreprises')}
              style={styles.backButton}
            >
              <FiArrowLeft style={styles.backButtonIcon} />
              {t('admin.entrepriseDetails.header.backToList')}
            </button>
            <div style={styles.headerActions}>
              <button 
                onClick={handleRefresh}
                style={styles.headerActionButton}
                disabled={refreshing}
              >
                <FiRefreshCw style={refreshing ? styles.refreshingIcon : styles.headerActionIcon} />
                {refreshing ? t('admin.entrepriseDetails.header.refreshing') : t('admin.entrepriseDetails.header.refresh')}
              </button>
              <button 
                onClick={handlePrint}
                style={styles.headerActionButton}
              >
                <FiPrinter style={styles.headerActionIcon} />
                {t('admin.entrepriseDetails.header.print')}
              </button>
              <button 
                onClick={handleShare}
                style={styles.headerActionButton}
              >
                <FiShare2 style={styles.headerActionIcon} />
                {t('admin.entrepriseDetails.header.share')}
              </button>
            </div>
          </div>

          <div style={styles.headerMain}>
            <div style={styles.headerLeft}>
              <div style={styles.titleSection}>
                <div style={styles.titleWithLogo}>
                  {entreprise.logo && (
                    <img 
                      src={entreprise.logo}
                      alt={entreprise.name}
                      style={styles.companyLogo}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h1 style={styles.title}>{entreprise.name}</h1>
                    <div style={styles.subtitle}>
                      <FiBriefcase style={styles.subtitleIcon} />
                      <span>{entreprise.role_user || t('admin.entrepriseDetails.company')}</span>
                      <span style={styles.separator}>•</span>
                      <FiCalendar style={styles.subtitleIcon} />
                      <span>
                        {t('admin.entrepriseDetails.header.createdOn')} {new Date(entreprise.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs de navigation */}
              <div style={styles.tabs}>
                <button 
                  onClick={() => setActiveTab('info')}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'info' ? styles.tabButtonActive : {})
                  }}
                >
                  <FiInfo style={styles.tabIcon} />
                  {t('admin.entrepriseDetails.tabs.info')}
                </button>
                <button 
                  onClick={() => setActiveTab('documents')}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'documents' ? styles.tabButtonActive : {})
                  }}
                >
                  <FiFileText style={styles.tabIcon} />
                  {t('admin.entrepriseDetails.tabs.documents')}
                </button>
                <button 
                  onClick={() => setActiveTab('prestataire')}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'prestataire' ? styles.tabButtonActive : {})
                  }}
                >
                  <FiUser style={styles.tabIcon} />
                  {t('admin.entrepriseDetails.tabs.provider')}
                </button>
                <button 
                  onClick={() => setActiveTab('stats')}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'stats' ? styles.tabButtonActive : {})
                  }}
                >
                  <FaChartLine style={styles.tabIcon} />
                  {t('admin.entrepriseDetails.tabs.history')}
                </button>
              </div>
            </div>

            {/* Boutons d'action principaux */}
            {entreprise.status === 'pending' && (
              <div style={styles.actionButtons}>
                <button 
                  onClick={() => setShowRejectModal(true)}
                  style={styles.rejectButton}
                  disabled={actionLoading}
                >
                  <FiXCircle style={styles.actionButtonIcon} />
                  {t('admin.entrepriseDetails.actions.rejectRequest')}
                </button>
                <button 
                  onClick={() => setShowApproveModal(true)}
                  style={styles.approveButton}
                  disabled={actionLoading}
                >
                  <FiCheckCircle style={styles.actionButtonIcon} />
                  {t('admin.entrepriseDetails.actions.approveCompany')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bannière de statut */}
        {getStatusBadge(entreprise.status)}

        {/* Message d'erreur */}
        {error && (
          <div style={styles.errorAlert}>
            <FiAlertCircle style={styles.errorAlertIcon} />
            <div style={styles.errorAlertContent}>
              <div style={styles.errorAlertTitle}>{t('admin.entrepriseDetails.errors.actionError')}</div>
              <p style={styles.errorAlertText}>{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              style={styles.errorAlertClose}
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Contenu principal */}
        <div style={styles.mainContent}>
          
          {/* Onglet Informations */}
          {activeTab === 'info' && (
            <div style={styles.tabContent}>
              <div style={styles.infoGrid}>
                {/* Section Identité */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardHeader}>
                    <MdOutlineBusinessCenter style={styles.infoCardIcon} />
                    <h3 style={styles.infoCardTitle}>{t('admin.entrepriseDetails.info.companyIdentity')}</h3>
                  </div>
                  <div style={styles.infoList}>
                    <div style={styles.infoItem}>
                      <div style={styles.infoItemLabel}>
                        <FiBriefcase style={styles.infoItemIcon} />
                        {t('admin.entrepriseDetails.info.companyName')}
                      </div>
                      <div style={styles.infoItemValue}>{entreprise.name}</div>
                    </div>
                    <div style={styles.infoItem}>
                      <div style={styles.infoItemLabel}>
                        <FiGlobe style={styles.infoItemIcon} />
                        {t('admin.entrepriseDetails.info.legalStatus')}
                      </div>
                      <div style={styles.infoItemValue}>
                        <span style={styles.statusTag}>
                          {entreprise.role_user || t('admin.entrepriseDetails.info.notSpecified')}
                        </span>
                      </div>
                    </div>
                    <div style={styles.infoItem}>
                      <div style={styles.infoItemLabel}>
                        <FiMapPin style={styles.infoItemIcon} />
                        {t('admin.entrepriseDetails.info.headquarters')}
                      </div>
                      <div style={styles.infoItemValue}>{entreprise.siege || t('admin.entrepriseDetails.info.notProvided')}</div>
                    </div>
                  </div>
                </div>

                {/* Section Dirigeant */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardHeader}>
                    <MdOutlinePerson style={styles.infoCardIcon} />
                    <h3 style={styles.infoCardTitle}>{t('admin.entrepriseDetails.info.manager')}</h3>
                  </div>
                  <div style={styles.infoList}>
                    <div style={styles.infoItem}>
                      <div style={styles.infoItemLabel}>
                        <FaUserTie style={styles.infoItemIcon} />
                        {t('admin.entrepriseDetails.info.fullName')}
                      </div>
                      <div style={styles.infoItemValue}>{entreprise.pdg_full_name}</div>
                    </div>
                    <div style={styles.infoItem}>
                      <div style={styles.infoItemLabel}>
                        <MdOutlineWork style={styles.infoItemIcon} />
                        {t('admin.entrepriseDetails.info.profession')}
                      </div>
                      <div style={styles.infoItemValue}>{entreprise.pdg_full_profession}</div>
                    </div>
                    <div style={styles.infoItem}>
                      <div style={styles.infoItemLabel}>
                        <FiMail style={styles.infoItemIcon} />
                        {t('admin.entrepriseDetails.info.contact')}
                      </div>
                      <div style={styles.infoItemValue}>
                        {entreprise.email ? (
                          <a href={`mailto:${entreprise.email}`} style={styles.contactLink}>
                            {entreprise.email}
                          </a>
                        ) : t('admin.entrepriseDetails.info.notProvided')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Médias */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardHeader}>
                    <FiImage style={styles.infoCardIcon} />
                    <h3 style={styles.infoCardTitle}>{t('admin.entrepriseDetails.info.media')}</h3>
                  </div>
                  <div style={styles.mediaSection}>
                    <div style={styles.mediaItem}>
                      <div style={styles.mediaLabel}>
                        <FaRegBuilding style={styles.mediaIcon} />
                        {t('admin.entrepriseDetails.info.logo')}
                      </div>
                      {entreprise.logo ? (
                        <img 
                          src={entreprise.logo}
                          alt={t('admin.entrepriseDetails.info.logoAlt')}
                          style={styles.mediaPreview}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div style={styles.mediaPlaceholder}>
                          <FaRegBuilding style={styles.mediaPlaceholderIcon} />
                          <span>{t('admin.entrepriseDetails.info.noLogo')}</span>
                        </div>
                      )}
                    </div>
                    <div style={styles.mediaItem}>
                      <div style={styles.mediaLabel}>
                        <FiHome style={styles.mediaIcon} />
                        {t('admin.entrepriseDetails.info.shopImage')}
                      </div>
                      {entreprise.image_boutique ? (
                        <img 
                          src={entreprise.image_boutique}
                          alt={t('admin.entrepriseDetails.info.shopAlt')}
                          style={styles.mediaPreview}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div style={styles.mediaPlaceholder}>
                          <FiHome style={styles.mediaPlaceholderIcon} />
                          <span>{t('admin.entrepriseDetails.info.noImage')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Domaines d'activité */}
                {entreprise.domaines && entreprise.domaines.length > 0 && (
                  <div style={styles.infoCard}>
                    <div style={styles.infoCardHeader}>
                      <BiCategoryAlt style={styles.infoCardIcon} />
                      <h3 style={styles.infoCardTitle}>{t('admin.entrepriseDetails.info.businessAreas')}</h3>
                    </div>
                    <div style={styles.domainesGrid}>
                      {entreprise.domaines.map((domaine) => (
                        <div key={domaine.id} style={styles.domaineChip}>
                          <FiCheckCircle style={styles.domaineChipIcon} />
                          {domaine.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Numéros légaux */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardHeader}>
                    <MdOutlineDocumentScanner style={styles.infoCardIcon} />
                    <h3 style={styles.infoCardTitle}>{t('admin.entrepriseDetails.info.legalNumbers')}</h3>
                  </div>
                  <div style={styles.legalNumbers}>
                    <div style={styles.legalNumberItem}>
                      <div style={styles.legalNumberLabel}>
                        <FaIdCard style={styles.legalNumberIcon} />
                        {t('admin.entrepriseDetails.info.ifuNumber')}
                      </div>
                      <code style={styles.legalNumberValue}>{entreprise.ifu_number || 'N/A'}</code>
                    </div>
                    <div style={styles.legalNumberItem}>
                      <div style={styles.legalNumberLabel}>
                        <FaBalanceScale style={styles.legalNumberIcon} />
                        {t('admin.entrepriseDetails.info.rccmNumber')}
                      </div>
                      <code style={styles.legalNumberValue}>{entreprise.rccm_number || 'N/A'}</code>
                    </div>
                    <div style={styles.legalNumberItem}>
                      <div style={styles.legalNumberLabel}>
                        <FaCertificate style={styles.legalNumberIcon} />
                        {t('admin.entrepriseDetails.info.certificateNumber')}
                      </div>
                      <code style={styles.legalNumberValue}>{entreprise.certificate_number || 'N/A'}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Documents */}
          {activeTab === 'documents' && (
            <div style={styles.tabContent}>
              <div style={styles.documentsGrid}>
                {/* Documents légaux */}
                <div style={styles.documentsCard}>
                  <div style={styles.documentsCardHeader}>
                    <MdOutlineSecurity style={styles.documentsCardIcon} />
                    <h3 style={styles.documentsCardTitle}>{t('admin.entrepriseDetails.documents.legalDocuments')}</h3>
                  </div>
                  <div style={styles.documentsList}>
                    <div style={styles.documentItem}>
                      <div style={styles.documentHeader}>
                        <FaFileInvoice style={styles.documentIcon} />
                        <div>
                          <div style={styles.documentTitle}>{t('admin.entrepriseDetails.documents.ifuCertificate')}</div>
                          <div style={styles.documentSubtitle}>
                            {t('admin.entrepriseDetails.documents.number')} : <code style={styles.documentCode}>{entreprise.ifu_number}</code>
                          </div>
                        </div>
                      </div>
                      {renderFileLink(entreprise.ifu_file, t('admin.entrepriseDetails.documents.downloadIFU'), <FaFileInvoice />)}
                    </div>

                    <div style={styles.documentItem}>
                      <div style={styles.documentHeader}>
                        <FaFileContract style={styles.documentIcon} />
                        <div>
                          <div style={styles.documentTitle}>{t('admin.entrepriseDetails.documents.rccmRegister')}</div>
                          <div style={styles.documentSubtitle}>
                            {t('admin.entrepriseDetails.documents.number')} : <code style={styles.documentCode}>{entreprise.rccm_number}</code>
                          </div>
                        </div>
                      </div>
                      {renderFileLink(entreprise.rccm_file, t('admin.entrepriseDetails.documents.downloadRCCM'), <FaFileContract />)}
                    </div>

                    <div style={styles.documentItem}>
                      <div style={styles.documentHeader}>
                        <FaRegHandshake style={styles.documentIcon} />
                        <div>
                          <div style={styles.documentTitle}>{t('admin.entrepriseDetails.documents.complianceCertificate')}</div>
                          <div style={styles.documentSubtitle}>
                            {t('admin.entrepriseDetails.documents.number')} : <code style={styles.documentCode}>{entreprise.certificate_number}</code>
                          </div>
                        </div>
                      </div>
                      {renderFileLink(
                        entreprise.certificate_file, 
                        t('admin.entrepriseDetails.documents.downloadCertificate'), 
                        <FaRegHandshake />
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div style={styles.infoSidebar}>
                  <div style={styles.sidebarCard}>
                    <div style={styles.sidebarCardHeader}>
                      <FiInfo style={styles.sidebarCardIcon} />
                      <h4 style={styles.sidebarCardTitle}>{t('admin.entrepriseDetails.documents.documentValidation')}</h4>
                    </div>
                    <ul style={styles.validationList}>
                      <li style={styles.validationItem}>
                        <FiCheckCircle style={styles.validationIcon} />
                        {t('admin.entrepriseDetails.documents.validation.checkDates')}
                      </li>
                      <li style={styles.validationItem}>
                        <FiCheckCircle style={styles.validationIcon} />
                        {t('admin.entrepriseDetails.documents.validation.checkClarity')}
                      </li>
                      <li style={styles.validationItem}>
                        <FiCheckCircle style={styles.validationIcon} />
                        {t('admin.entrepriseDetails.documents.validation.checkConsistency')}
                      </li>
                      <li style={styles.validationItem}>
                        <FiCheckCircle style={styles.validationIcon} />
                        {t('admin.entrepriseDetails.documents.validation.checkLegality')}
                      </li>
                    </ul>
                  </div>

                  <div style={styles.sidebarCard}>
                    <div style={styles.sidebarCardHeader}>
                      <FiShield style={styles.sidebarCardIcon} />
                      <h4 style={styles.sidebarCardTitle}>{t('admin.entrepriseDetails.documents.documentSecurity')}</h4>
                    </div>
                    <div style={styles.securityInfo}>
                      <div style={styles.securityItem}>
                        <MdOutlineVerifiedUser style={styles.securityIcon} />
                        <span style={styles.securityText}>{t('admin.entrepriseDetails.documents.encryptedDocuments')}</span>
                      </div>
                      <div style={styles.securityItem}>
                        <FiLock style={styles.securityIcon} />
                        <span style={styles.securityText}>{t('admin.entrepriseDetails.documents.secureAccess')}</span>
                      </div>
                      <div style={styles.securityItem}>
                        <MdOutlineStorage style={styles.securityIcon} />
                        <span style={styles.securityText}>{t('admin.entrepriseDetails.documents.protectedStorage')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Prestataire */}
          {activeTab === 'prestataire' && (
            <div style={styles.tabContent}>
              <div style={styles.prestataireContainer}>
                {entreprise.prestataire ? (
                  <div style={styles.prestataireCard}>
                    <div style={styles.prestataireHeader}>
                      <div style={styles.prestataireAvatar}>
                        {entreprise.prestataire.name?.charAt(0) || 'P'}
                      </div>
                      <div style={styles.prestataireInfo}>
                        <h3 style={styles.prestataireName}>{entreprise.prestataire.name}</h3>
                        <div style={styles.prestataireBadge}>
                          <FiUser style={styles.prestataireBadgeIcon} />
                          {t('admin.entrepriseDetails.provider.associatedProvider')}
                        </div>
                      </div>
                    </div>

                    <div style={styles.prestataireDetails}>
                      <div style={styles.prestataireDetailItem}>
                        <div style={styles.prestataireDetailLabel}>
                          <FiMail style={styles.prestataireDetailIcon} />
                          {t('admin.entrepriseDetails.provider.professionalEmail')}
                        </div>
                        <a 
                          href={`mailto:${entreprise.prestataire.email}`}
                          style={styles.prestataireDetailValue}
                        >
                          {entreprise.prestataire.email}
                        </a>
                      </div>

                      <div style={styles.prestataireDetailItem}>
                        <div style={styles.prestataireDetailLabel}>
                          <FiCalendar style={styles.prestataireDetailIcon} />
                          {t('admin.entrepriseDetails.provider.registrationDate')}
                        </div>
                        <div style={styles.prestataireDetailValue}>
                          {entreprise.prestataire.created_at 
                            ? new Date(entreprise.prestataire.created_at).toLocaleDateString('fr-FR')
                            : t('admin.entrepriseDetails.provider.notAvailable')
                          }
                        </div>
                      </div>

                      <div style={styles.prestataireDetailItem}>
                        <div style={styles.prestataireDetailLabel}>
                          <FiBriefcase style={styles.prestataireDetailIcon} />
                          {t('admin.entrepriseDetails.provider.accountStatus')}
                        </div>
                        <div style={styles.prestataireDetailValue}>
                          <span style={styles.prestataireStatusActive}>
                            <FiCheckCircle style={styles.statusIcon} />
                            {t('admin.entrepriseDetails.provider.activeAccount')}
                          </span>
                        </div>
                      </div>

                      {/* NOUVEAUX CHAMPS CONTACT */}
                      <div style={styles.prestataireDetailItem}>
                        <div style={styles.prestataireDetailLabel}>
                          <FiPhone style={styles.prestataireDetailIcon} />
                          {t('admin.entrepriseDetails.provider.whatsapp')}
                        </div>
                        <div style={styles.prestataireDetailValue}>
                          {entreprise.whatsapp_phone ? (
                            <a 
                              href={`https://wa.me/${entreprise.whatsapp_phone.replace(/\s+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#25D366', textDecoration: 'none' }}
                            >
                              {entreprise.whatsapp_phone}
                            </a>
                          ) : t('admin.entrepriseDetails.provider.notProvided')}
                        </div>
                      </div>

                      <div style={styles.prestataireDetailItem}>
                        <div style={styles.prestataireDetailLabel}>
                          <FiPhone style={styles.prestataireDetailIcon} />
                          {t('admin.entrepriseDetails.provider.callPhone')}
                        </div>
                        <div style={styles.prestataireDetailValue}>
                          {entreprise.call_phone || t('admin.entrepriseDetails.provider.notProvided')}
                        </div>
                      </div>
                    </div>

                    <div style={styles.prestataireActions}>
                      <button 
                        onClick={() => console.log('Contacter prestataire')}
                        style={styles.contactButton}
                      >
                        <FiMail style={styles.contactButtonIcon} />
                        {t('admin.entrepriseDetails.provider.contact')}
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/prestataires/${entreprise.prestataire.id}`)}
                        style={styles.viewProfileButton}
                      >
                        <FiExternalLink style={styles.viewProfileIcon} />
                        {t('admin.entrepriseDetails.provider.viewFullProfile')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.noPrestataire}>
                    <FiUser style={styles.noPrestataireIcon} />
                    <h3 style={styles.noPrestataireTitle}>{t('admin.entrepriseDetails.provider.noProvider')}</h3>
                    <p style={styles.noPrestataireText}>
                      {t('admin.entrepriseDetails.provider.noProviderText')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Historique */}
          {activeTab === 'stats' && (
            <div style={styles.tabContent}>
              <div style={styles.historyContainer}>
                <div style={styles.historyCard}>
                  <div style={styles.historyCardHeader}>
                    <FaChartLine style={styles.historyCardIcon} />
                    <h3 style={styles.historyCardTitle}>{t('admin.entrepriseDetails.history.actionHistory')}</h3>
                  </div>
                  <div style={styles.historyTimeline}>
                    <div style={styles.historyItem}>
                      <div style={styles.historyItemIcon}>
                        <FiCalendar />
                      </div>
                      <div style={styles.historyItemContent}>
                        <div style={styles.historyItemTitle}>{t('admin.entrepriseDetails.history.requestCreated')}</div>
                        <div style={styles.historyItemDate}>
                          {new Date(entreprise.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {entreprise.updated_at && entreprise.updated_at !== entreprise.created_at && (
                      <div style={styles.historyItem}>
                        <div style={styles.historyItemIcon}>
                          <FiEdit />
                        </div>
                        <div style={styles.historyItemContent}>
                          <div style={styles.historyItemTitle}>{t('admin.entrepriseDetails.history.lastModified')}</div>
                          <div style={styles.historyItemDate}>
                            {new Date(entreprise.updated_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {entreprise.status !== 'pending' && (
                      <div style={styles.historyItem}>
                        <div style={styles.historyItemIcon}>
                          {entreprise.status === 'validated' 
                            ? <FiCheckCircle style={{color: theme.colors.success}} />
                            : <FiXCircle style={{color: theme.colors.error}} />
                          }
                        </div>
                        <div style={styles.historyItemContent}>
                          <div style={styles.historyItemTitle}>
                            {entreprise.status === 'validated' 
                              ? t('admin.entrepriseDetails.history.adminValidation')
                              : t('admin.entrepriseDetails.history.adminRejection')
                            }
                          </div>
                          <div style={styles.historyItemDate}>
                            {new Date(entreprise.updated_at).toLocaleDateString('fr-FR')}
                          </div>
                          {entreprise.admin_note && (
                            <div style={styles.historyItemNote}>
                              {entreprise.admin_note}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.statsCard}>
                  <div style={styles.statsCardHeader}>
                    <FaPercentage style={styles.statsCardIcon} />
                    <h3 style={styles.statsCardTitle}>{t('admin.entrepriseDetails.history.statistics')}</h3>
                  </div>
                  <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                      <div style={styles.statNumber}>1</div>
                      <div style={styles.statLabel}>{t('admin.entrepriseDetails.history.version')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statNumber}>
                        {entreprise.domaines?.length || 0}
                      </div>
                      <div style={styles.statLabel}>{t('admin.entrepriseDetails.history.domains')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statNumber}>
                        {(entreprise.ifu_file ? 1 : 0) + 
                         (entreprise.rccm_file ? 1 : 0) + 
                         (entreprise.certificate_file ? 1 : 0)}
                      </div>
                      <div style={styles.statLabel}>{t('admin.entrepriseDetails.history.documents')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showApproveModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <FiCheckCircle style={styles.modalIconApprove} />
              <h3 style={styles.modalTitle}>{t('admin.entrepriseDetails.modals.approve.title')}</h3>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                {t('admin.entrepriseDetails.modals.approve.text', { name: entreprise.name })}
              </p>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>
                  <FiEdit style={styles.modalLabelIcon} />
                  {t('admin.entrepriseDetails.modals.approve.comment')}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={styles.modalTextarea}
                  rows="3"
                  placeholder={t('admin.entrepriseDetails.modals.approve.placeholder')}
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowApproveModal(false)}
                style={styles.modalButtonCancel}
                disabled={actionLoading}
              >
                {t('admin.entrepriseDetails.modals.cancel')}
              </button>
              <button 
                onClick={handleApprove}
                disabled={actionLoading}
                style={styles.modalButtonApprove}
              >
                {actionLoading ? t('admin.entrepriseDetails.modals.approve.processing') : t('admin.entrepriseDetails.modals.approve.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <FiXCircle style={styles.modalIconReject} />
              <h3 style={styles.modalTitle}>{t('admin.entrepriseDetails.modals.reject.title')}</h3>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                {t('admin.entrepriseDetails.modals.reject.text', { name: entreprise.name })}
              </p>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>
                  <FiAlertCircle style={styles.modalLabelIcon} />
                  {t('admin.entrepriseDetails.modals.reject.reason')} <span style={styles.required}>*</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={styles.modalTextarea}
                  rows="4"
                  placeholder={t('admin.entrepriseDetails.modals.reject.placeholder')}
                  required
                  disabled={actionLoading}
                />
                <div style={styles.modalHint}>
                  {t('admin.entrepriseDetails.modals.reject.hint')}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowRejectModal(false)}
                style={styles.modalButtonCancel}
                disabled={actionLoading}
              >
                {t('admin.entrepriseDetails.modals.cancel')}
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading || !adminNote.trim() || adminNote.length < 10}
                style={styles.modalButtonReject}
              >
                {actionLoading ? t('admin.entrepriseDetails.modals.reject.processing') : t('admin.entrepriseDetails.modals.reject.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .tab-content {
          animation: fadeIn 0.3s ease-out;
        }
        
        .modal {
          animation: slideIn 0.3s ease-out;
        }
        
        .hover-card {
          transition: all 0.3s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .refreshing {
          animation: spin 1s linear infinite;
        }
        
        @media print {
          .header-actions, .action-buttons, .status-actions, .file-actions {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
// Les styles restent exactement les mêmes
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 0',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
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
  loadingSubtext: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1.5rem',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '5rem',
    color: '#ef4444',
  },
  errorTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  errorText: {
    color: '#64748b',
    fontSize: '1.125rem',
    maxWidth: '400px',
  },
  errorActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  errorButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.875rem 1.75rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  errorButtonIcon: {
    fontSize: '1.125rem',
  },
  errorRetryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '0.875rem 1.75rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  errorRetryIcon: {
    fontSize: '1.125rem',
  },
  header: {
    marginBottom: '2rem',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '0.5rem 0',
    textDecoration: 'none',
  },
  backButtonIcon: {
    fontSize: '1.25rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  headerActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '0.625rem 1rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  headerActionIcon: {
    fontSize: '1rem',
  },
  refreshingIcon: {
    fontSize: '1rem',
    animation: 'spin 1s linear infinite',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  headerLeft: {
    flex: 1,
  },
  titleSection: {
    marginBottom: '1.5rem',
  },
  titleWithLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  companyLogo: {
    width: '64px',
    height: '64px',
    borderRadius: theme.borderRadius.lg,
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b',
    fontSize: '0.95rem',
    flexWrap: 'wrap',
  },
  subtitleIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  separator: {
    color: '#cbd5e1',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.25rem',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0.75rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    borderRadius: theme.borderRadius.md,
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  tabIcon: {
    fontSize: '1rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  approveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)',
  },
  rejectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.25)',
  },
  actionButtonIcon: {
    fontSize: '1.125rem',
  },
  statusBanner: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: '2rem',
    border: '2px solid',
    overflow: 'hidden',
  },
  statusBannerContent: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.5rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  statusIconContainer: {
    fontSize: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
  },
  statusDescription: {
    color: '#374151',
    fontSize: '0.95rem',
  },
  rejectionReason: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '0.75rem',
    borderRadius: theme.borderRadius.md,
    marginTop: '0.75rem',
    fontSize: '0.875rem',
  },
  rejectionReasonIcon: {
    fontSize: '1rem',
    marginTop: '0.125rem',
    flexShrink: 0,
  },
  statusActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  quickApproveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  quickRejectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  quickActionIcon: {
    fontSize: '1rem',
  },
  statusBadgeIcon: {
    fontSize: '2.5rem',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    border: '1px solid #ef4444',
    borderRadius: theme.borderRadius.lg,
    padding: '1rem 1.5rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  errorAlertIcon: {
    fontSize: '1.5rem',
    color: '#dc2626',
    flexShrink: 0,
  },
  errorAlertContent: {
    flex: 1,
  },
  errorAlertTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: '0.25rem',
  },
  errorAlertText: {
    color: '#991b1b',
    fontSize: '0.875rem',
  },
  errorAlertClose: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    marginTop: '2rem',
  },
  tabContent: {
    animation: 'fadeIn 0.3s ease-out',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  infoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  infoCardIcon: {
    fontSize: '1.5rem',
    color: '#ef4444',
  },
  infoCardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoItemLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
  },
  infoItemIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  infoItemValue: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: '500',
    wordBreak: 'break-word',
  },
  statusTag: {
    backgroundColor: '#dbeafe',
    color: '#ef4444',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  contactLink: {
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '500',
  },
  mediaSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  mediaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mediaLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
  },
  mediaIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  mediaPreview: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: theme.borderRadius.md,
    border: '1px solid #e2e8f0',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.md,
    border: '2px dashed #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: '#94a3b8',
  },
  mediaPlaceholderIcon: {
    fontSize: '3rem',
    color: '#cbd5e1',
  },
  domainesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  domaineChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  domaineChipIcon: {
    fontSize: '0.875rem',
    color: '#10b981',
  },
  legalNumbers: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  legalNumberItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  legalNumberLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
  },
  legalNumberIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  legalNumberValue: {
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 0.75rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    color: '#475569',
    wordBreak: 'break-all',
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '2rem',
  },
  documentsCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
  },
  documentsCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  documentsCardIcon: {
    fontSize: '1.5rem',
    color: '#3b82f6',
  },
  documentsCardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  documentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  documentItem: {
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
  },
  documentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  documentIcon: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  documentTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  documentSubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  documentCode: {
    backgroundColor: '#e2e8f0',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    color: '#475569',
  },
  fileLinkContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  fileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '0.75rem 1.25rem',
    borderRadius: theme.borderRadius.md,
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.2s',
    flex: 1,
    minWidth: '200px',
  },
  fileLinkContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
  },
  fileLinkText: {
    fontSize: '0.875rem',
  },
  externalLinkIcon: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fileActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  fileActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '0.5rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '1rem',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  noFile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#f1f5f9',
    borderRadius: theme.borderRadius.md,
    color: '#94a3b8',
  },
  noFileIcon: {
    fontSize: '1.25rem',
  },
  noFileText: {
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
  infoSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sidebarCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
  },
  sidebarCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  sidebarCardIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },
  sidebarCardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  validationList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  validationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.875rem',
    color: '#475569',
  },
  validationIcon: {
    fontSize: '1rem',
    color: '#10b981',
    flexShrink: 0,
  },
  securityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  securityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  securityIcon: {
    fontSize: '1.25rem',
    color: '#ef4444',
  },
  securityText: {
    fontSize: '0.875rem',
    color: '#475569',
  },
  prestataireContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  prestataireCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
    padding: '2rem',
  },
  prestataireHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  prestataireAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: '600',
  },
  prestataireInfo: {
    flex: 1,
  },
  prestataireName: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
  },
  prestataireBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  prestataireBadgeIcon: {
    fontSize: '0.875rem',
  },
  prestataireDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  prestataireDetailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  prestataireDetailLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b',
  },
  prestataireDetailIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  prestataireDetailValue: {
    fontSize: '1.125rem',
    color: '#1e293b',
    fontWeight: '500',
    textDecoration: 'none',
  },
  prestataireStatusActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  statusIcon: {
    fontSize: '0.875rem',
  },
  prestataireActions: {
    display: 'flex',
    gap: '1rem',
  },
  contactButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  contactButtonIcon: {
    fontSize: '1.125rem',
  },
  viewProfileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '0.875rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  viewProfileIcon: {
    fontSize: '1.125rem',
  },
  noPrestataire: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '2px dashed #e2e8f0',
    textAlign: 'center',
  },
  noPrestataireIcon: {
    fontSize: '4rem',
    color: '#cbd5e1',
    marginBottom: '1.5rem',
  },
  noPrestataireTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '0.75rem',
  },
  noPrestataireText: {
    color: '#64748b',
    fontSize: '1rem',
    maxWidth: '400px',
  },
  historyContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '2rem',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
  },
  historyCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  historyCardIcon: {
    fontSize: '1.5rem',
    color: '#ef4444',
  },
  historyCardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  historyTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  historyItem: {
    display: 'flex',
    gap: '1rem',
    position: 'relative',
  },
  historyItemIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: '#64748b',
    flexShrink: 0,
  },
  historyItemContent: {
    flex: 1,
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  historyItemTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  historyItemDate: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '0.5rem',
  },
  historyItemNote: {
    fontSize: '0.875rem',
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: '0.75rem',
    borderRadius: theme.borderRadius.md,
    borderLeft: '3px solid #ef4444',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
  },
  statsCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  statsCardIcon: {
    fontSize: '1.5rem',
    color: '#ef4444',
  },
  statsCardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  statItem: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.md,
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: theme.borderRadius.xl,
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  modalIconApprove: {
    fontSize: '2rem',
    color: '#10b981',
  },
  modalIconReject: {
    fontSize: '2rem',
    color: '#ef4444',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  modalBody: {
    marginBottom: '1.5rem',
  },
  modalText: {
    color: '#64748b',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
  },
  modalFormGroup: {
    marginBottom: '1rem',
  },
  modalLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '0.5rem',
  },
  modalLabelIcon: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  modalTextarea: {
    width: '100%',
    padding: '0.875rem',
    border: '1px solid #e2e8f0',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  required: {
    color: '#ef4444',
  },
  modalHint: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.5rem',
  },
  modalFooter: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalButtonApprove: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalButtonReject: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.md,
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
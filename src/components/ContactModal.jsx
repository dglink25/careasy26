import { useEffect } from 'react';
import { FaTimes, FaPhone, FaWhatsapp, FaComments, FaMapMarkerAlt } from 'react-icons/fa';
import theme from '../config/theme';

function ContactModal({ isOpen, onClose, entreprise, serviceName, onChat }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !entreprise) return null;

  const phone = entreprise.call_phone || entreprise.phone || null;
  const waPhone = entreprise.whatsapp_phone || phone;

  const handlePhone = () => {
    if (phone) { window.location.href = 'tel:' + phone; }
    else { alert('Numéro non disponible'); }
    onClose();
  };

  const handleWhatsApp = () => {
    if (waPhone) {
      const text = encodeURIComponent(
        serviceName
          ? 'Bonjour ' + entreprise.name + ', je suis intéressé(e) par : ' + serviceName
          : 'Bonjour ' + entreprise.name + ', je suis intéressé(e) par vos services.'
      );
      window.open('https://wa.me/' + waPhone.replace(/\D/g, '') + '?text=' + text, '_blank');
    } else { alert('WhatsApp non disponible'); }
    onClose();
  };

  const handleChat = () => {
    onClose();
    setTimeout(() => { if (onChat) onChat(); }, 200);
  };

  const handleMaps = () => {
    if (entreprise.siege) {
      window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(entreprise.siege), '_blank');
    } else { alert('Adresse non disponible'); }
    onClose();
  };

  const methods = [
    { id: 'phone',    Icon: FaPhone,        label: 'Appeler',    sub: phone || 'Non disponible',  bg: '#10b981', onClick: handlePhone,    disabled: !phone },
    { id: 'whatsapp', Icon: FaWhatsapp,     label: 'WhatsApp',   sub: 'Message instantané',        bg: '#25D366', onClick: handleWhatsApp, disabled: !waPhone },
    { id: 'chat',     Icon: FaComments,     label: 'Messagerie', sub: 'Discuter en direct',        bg: theme.colors.primary, onClick: handleChat, disabled: false },
    { id: 'maps',     Icon: FaMapMarkerAlt, label: 'Itinéraire', sub: entreprise.siege ? entreprise.siege.substring(0, 32) + (entreprise.siege.length > 32 ? '…' : '') : 'Non disponible', bg: '#3b82f6', onClick: handleMaps, disabled: !entreprise.siege },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', zIndex:1200 }} />

      <div role="dialog" aria-modal="true" style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:1201, backgroundColor:'#fff', borderRadius:'20px', width:'90%', maxWidth:'440px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 32px 64px rgba(0,0,0,0.3)', animation:'contactModalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'2px solid ' + (theme.colors.primaryLight || '#fecaca'), backgroundColor:'#f8fafc', borderRadius:'20px 20px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
            {entreprise.logo
              ? <img src={entreprise.logo} alt="" style={{ width:'52px', height:'52px', borderRadius:'12px', objectFit:'cover', border:'2px solid ' + theme.colors.primary, flexShrink:0 }} />
              : <div style={{ width:'52px', height:'52px', borderRadius:'12px', backgroundColor:theme.colors.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:'700', flexShrink:0 }}>{(entreprise.name||'E').charAt(0)}</div>
            }
            <div>
              <div style={{ fontSize:'1.05rem', fontWeight:'700', color:'#0f172a' }}>{entreprise.name}</div>
              {serviceName && <div style={{ fontSize:'0.82rem', color:'#64748b', marginTop:'2px' }}>{serviceName}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#64748b', fontSize:'1.1rem', cursor:'pointer', padding:'0.4rem', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FaTimes />
          </button>
        </div>

        {/* Instruction */}
        <p style={{ textAlign:'center', color:'#64748b', fontSize:'0.9rem', padding:'1rem 1.5rem 0.5rem', margin:0 }}>
          Choisissez votre méthode de contact préférée :
        </p>

        {/* Boutons */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', padding:'0.75rem 1.5rem' }}>
          {methods.map(({ id, Icon, label, sub, bg, onClick, disabled }) => (
            <button
              key={id}
              onClick={disabled ? undefined : onClick}
              disabled={disabled}
              style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.9rem 1rem', borderRadius:'12px', border:'1.5px solid #e2e8f0', backgroundColor:'#fff', textAlign:'left', width:'100%', cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.45:1, transition:'all 0.2s ease' }}
              onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.borderColor=theme.colors.primary; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='#e2e8f0'; }}
            >
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', backgroundColor:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', color:'#fff', flexShrink:0 }}>
                <Icon />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.95rem', fontWeight:'600', color:'#0f172a' }}>{label}</div>
                <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:'1px' }}>{sub}</div>
              </div>
              <span style={{ fontSize:'1.4rem', color:theme.colors.primary, opacity:0.7 }}>›</span>
            </button>
          ))}
        </div>

        {/* Note */}
        <div style={{ margin:'0 1.5rem 1.5rem', padding:'0.875rem 1rem', backgroundColor:'#f0f9ff', borderRadius:'10px', fontSize:'0.82rem', color:'#0369a1', lineHeight:'1.5', border:'1px solid #bae6fd' }}>
          <strong>💡 Recommandé :</strong> La messagerie vous permet de suivre vos conversations et de partager des photos ou vidéos.
        </div>
      </div>

      <style>{`
        @keyframes contactModalIn {
          from { opacity:0; transform:translate(-50%,-44%) scale(0.97); }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </>
  );
}

export default ContactModal;
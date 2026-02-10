import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Register from '../pages/Register';
import Login from '../pages/Login';
import ResetPassword from '../pages/ResetPassword';
import theme from '../config/theme';

const Modal = ({ type, props = {}, onClose }) => {
  const [animationDirection, setAnimationDirection] = useState('in');
  const [previousType, setPreviousType] = useState(null);

  useEffect(() => {
    if (type && type !== previousType) {
      setAnimationDirection('in');
      setPreviousType(type);
    } else if (!type && previousType) {
      setAnimationDirection('out');
      setTimeout(() => {
        setPreviousType(null);
      }, 300);
    }
  }, [type, previousType]);

  const handleClose = () => {
    setAnimationDirection('out');
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const switchModal = (newType) => {
    setAnimationDirection('out');
    setTimeout(() => {
      setAnimationDirection('in');
      const { openModal } = props;
      if (openModal) {
        openModal(newType);
      }
    }, 300);
  };

  const getAnimationClass = () => {
    if (!previousType) return '';
    
    const animations = {
      'register': {
        in: 'slideFromRight',
        out: 'slideToLeft'
      },
      'login': {
        in: 'slideFromLeft',
        out: 'slideToRight'
      },
      'reset-password': {
        in: 'slideFromBottom',
        out: 'slideToTop'
      }
    };
    
    return animations[previousType]?.[animationDirection] || '';
  };

  const getComponent = () => {
    const commonProps = {
      isModal: true,
      onClose: handleClose,
      openModal: switchModal
    };

    switch (previousType) {
      case 'register':
        return <Register {...commonProps} {...props} />;
      case 'login':
        return <Login {...commonProps} {...props} />;
      case 'reset-password':
        return <ResetPassword {...commonProps} {...props} />;
      default:
        return null;
    }
  };

  if (!previousType && animationDirection === 'out') return null;

  return createPortal(
    <div 
      className={`modal-overlay ${animationDirection === 'out' ? 'fadeOut' : 'fadeIn'}`}
      style={styles.overlay}
      onClick={handleClose}
    >
      <div 
        className={`modal-content ${getAnimationClass()}`}
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {getComponent()}
      </div>
      
      {/* Styles dynamiques pour les animations */}
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes slideFromRight {
          from { 
            transform: translateX(100%) rotateY(-10deg);
            opacity: 0;
          }
          to { 
            transform: translateX(0) rotateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideToLeft {
          from { 
            transform: translateX(0) rotateY(0);
            opacity: 1;
          }
          to { 
            transform: translateX(-100%) rotateY(10deg);
            opacity: 0;
          }
        }
        
        @keyframes slideFromLeft {
          from { 
            transform: translateX(-100%) rotateY(10deg);
            opacity: 0;
          }
          to { 
            transform: translateX(0) rotateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideToRight {
          from { 
            transform: translateX(0) rotateY(0);
            opacity: 1;
          }
          to { 
            transform: translateX(100%) rotateY(-10deg);
            opacity: 0;
          }
        }
        
        @keyframes slideFromBottom {
          from { 
            transform: translateY(100%) rotateX(-10deg);
            opacity: 0;
          }
          to { 
            transform: translateY(0) rotateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideToTop {
          from { 
            transform: translateY(0) rotateX(0);
            opacity: 1;
          }
          to { 
            transform: translateY(-100%) rotateX(10deg);
            opacity: 0;
          }
        }
        
        .modal-overlay {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
        
        .fadeIn {
          animation-name: fadeIn;
        }
        
        .fadeOut {
          animation-name: fadeOut;
        }
        
        .modal-content {
          animation-duration: 0.4s;
          animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
          animation-fill-mode: both;
          transform-origin: center;
        }
        
        .slideFromRight {
          animation-name: slideFromRight;
        }
        
        .slideToLeft {
          animation-name: slideToLeft;
        }
        
        .slideFromLeft {
          animation-name: slideFromLeft;
        }
        
        .slideToRight {
          animation-name: slideToRight;
        }
        
        .slideFromBottom {
          animation-name: slideFromBottom;
        }
        
        .slideToTop {
          animation-name: slideToTop;
        }
      `}</style>
    </div>,
    document.body
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalContent: {
    width: '100%',
    maxWidth: '420px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: theme.borderRadius.xl,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
  },
};

export default Modal;
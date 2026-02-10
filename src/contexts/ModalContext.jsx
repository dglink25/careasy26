import { createContext, useContext, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalType, setModalType] = useState(null);
  const [modalProps, setModalProps] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const openModal = useCallback((type, props = {}) => {
    setModalType(type);
    setModalProps(props);
    // Ajouter un paramètre d'URL pour indiquer qu'un modal est ouvert
    const params = new URLSearchParams(location.search);
    params.set('modal', type);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location.search, location.pathname, navigate]);

  const closeModal = useCallback(() => {
    setModalType(null);
    setModalProps({});
    // Retirer le paramètre d'URL
    const params = new URLSearchParams(location.search);
    params.delete('modal');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location.search, location.pathname, navigate]);

  return (
    <ModalContext.Provider value={{ modalType, modalProps, openModal, closeModal }}>
      {children}
      {modalType && (
        <Modal
          type={modalType}
          props={modalProps}
          onClose={closeModal}
        />
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
import { useModal } from '../contexts/ModalContext';

export const LoginButton = ({ children = "Se connecter", style = {} }) => {
  const { openModal } = useModal();
  
  return (
    <button
      onClick={() => openModal('login')}
      style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all 0.3s',
        ':hover': {
          backgroundColor: '#0056b3',
          transform: 'translateY(-2px)',
        },
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export const RegisterButton = ({ children = "S'inscrire", style = {} }) => {
  const { openModal } = useModal();
  
  return (
    <button
      onClick={() => openModal('register')}
      style={{
        backgroundColor: 'transparent',
        color: '#007bff',
        padding: '0.75rem 1.5rem',
        borderRadius: '8px',
        border: '2px solid #007bff',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all 0.3s',
        ':hover': {
          backgroundColor: '#007bff',
          color: 'white',
          transform: 'translateY(-2px)',
        },
        ...style,
      }}
    >
      {children}
    </button>
  );
};
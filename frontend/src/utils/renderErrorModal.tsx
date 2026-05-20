// utils/renderErrorModal.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from '../components/Popup';

const renderErrorModal = () => {
  const modalRoot = document.createElement('div');
  document.body.appendChild(modalRoot);

  const root = createRoot(modalRoot);

  const handleClose = () => {
    root.unmount();
    modalRoot.remove();
  };

  root.render(<Popup onClose={handleClose} />);
};

export default renderErrorModal;

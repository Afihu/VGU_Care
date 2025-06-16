import React from 'react';
import '../css/Modal.css'

const Modal = ({isOpen, onClose, children, title}) => {
    // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Click overlay to close */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing */}
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button className="modal-close-button" onClick={onClose}>
            &times; {/* HTML entity for 'x' */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
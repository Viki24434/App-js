import './Modal.css';

export default function Modal({ isOpen, onClose, title, icon, maxWidth = 500, children, id }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" id={id}>
      <div className="modal-box" style={{ maxWidth }}>
        <button type="button" className="modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        {title && (
          <h3 className="modal-title">
            {icon && <i className={icon}></i>} {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
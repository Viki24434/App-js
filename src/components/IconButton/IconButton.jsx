import './IconButton.css';

export default function IconButton({ icon, variant = 'primary', onClick, title }) {
  return (
    <button
      type="button"
      className={`btn-icon btn-icon-${variant}`}
      onClick={onClick}
      title={title}
    >
      <i className={icon}></i>
    </button>
  );
}

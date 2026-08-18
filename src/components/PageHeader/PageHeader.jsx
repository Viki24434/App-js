import './PageHeader.css';

export default function PageHeader({ icon, title, subtitle, actionLabel, actionIcon, onAction }) {
  return (
    <div className="page-header">
      <div>
        <h2>{icon && <i className={icon}></i>} {title}</h2>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionIcon && <i className={actionIcon}></i>} {actionLabel}
        </button>
      )}
    </div>
  );
}

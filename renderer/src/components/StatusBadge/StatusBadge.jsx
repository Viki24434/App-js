import './StatusBadge.css';

const VARIANTS = {
  Lunas: { background: '#dcfce7', color: '#166534' },
};
const DEFAULT_VARIANT = { background: '#fee2e2', color: '#991b1b' };

export default function StatusBadge({ status }) {
  const style = VARIANTS[status] || DEFAULT_VARIANT;
  return (
    <span className="badge-pill" style={style}>
      {status}
    </span>
  );
}

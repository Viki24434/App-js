import './StatCard.css';

export default function StatCard({ variant, icon, label, value, trendIcon, trendLabel }) {
  return (
    <div className={`card-stat stat-${variant}`}>
      <i className={`${icon} stat-bg-icon`}></i>
      <h4>{label}</h4>
      <h2>{value}</h2>
      <div className="trend">
        <i className={trendIcon}></i> {trendLabel}
      </div>
    </div>
  );
}

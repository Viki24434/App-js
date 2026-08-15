import './Card.css';

export default function Card({ children, maxWidth, className = '' }) {
  return (
    <div className={`card ${className}`} style={{ maxWidth }}>
      {children}
    </div>
  );
}

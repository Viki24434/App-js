import './Card.css';

export default function Card({ children, maxWidth = 450, className = '' }) {
  return (
    <div className={`card ${className}`} style={{ maxWidth }}>
      {children}
    </div>
  );
}

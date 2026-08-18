import './Card.css';

export default function Card({ children, maxWidth = '', minWidth = '' }) {
  return (
    <div className={`card`} style={{ maxWidth, minWidth }}>
      {children}
    </div>
  );
}

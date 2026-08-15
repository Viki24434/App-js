import '../Input/Input.css';

export default function Select({ label, children, ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <select className="input-field" {...props}>
        {children}
      </select>
    </div>
  );
}

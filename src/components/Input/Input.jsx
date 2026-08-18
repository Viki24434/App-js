import './Input.css';

export default function Input({ label, style, className = '', ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className={`input-field ${className}`.trim()} style={style} {...props} />
    </div>
  );
}

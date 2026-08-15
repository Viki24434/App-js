import './Input.css';

export default function Input({ label, style, ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className="input-field" style={style} {...props} />
    </div>
  );
}

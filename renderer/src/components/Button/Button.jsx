import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  fullWidth = false,
  icon,
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`}
      {...props}
    >
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );
}

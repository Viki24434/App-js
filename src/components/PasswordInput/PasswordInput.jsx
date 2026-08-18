import { useState } from 'react';
import Input from '../Input/Input';
import './PasswordInput.css';

export default function PasswordInput({ label, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrapper">
      <Input label={label} type={show ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow(!show)}
        tabIndex={-1}
      >
        <i className={show ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
      </button>
    </div>
  );
}

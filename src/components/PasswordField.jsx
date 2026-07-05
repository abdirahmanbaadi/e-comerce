import { useState } from 'react';

export default function PasswordField({
  id,
  placeholder,
  value,
  onChange,
  required = true,
  invalid = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-field">
      <i className="fa-solid fa-lock field-icon" />
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={invalid ? 'is-invalid' : undefined}
      />
      <i
        className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'} pass-toggle password-toggle-icon`}
        onClick={() => setVisible((v) => !v)}
        role="button"
        tabIndex={0}
        aria-label={visible ? 'Hide password' : 'Show password'}
        onKeyDown={(e) => e.key === 'Enter' && setVisible((v) => !v)}
      />
    </div>
  );
}

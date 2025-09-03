import React from 'react';

interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className="checkbox-label">
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="checkmark"></span>
      {label}
    </label>
  );
};

export default Checkbox;

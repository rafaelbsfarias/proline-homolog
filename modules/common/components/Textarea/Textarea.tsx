import React, { TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className, ...props }) => {
  return (
    <div className={styles.textareaContainer}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea id={id} className={`${styles.textarea} ${className || ''}`} {...props} />
    </div>
  );
};

export default Textarea;

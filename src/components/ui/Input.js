import React from 'react';
import styles from './Input.module.css';

export default React.forwardRef(function Input({ 
  label, 
  error, 
  icon, 
  className = '', 
  type = 'text', 
  ...props 
}, ref) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}
        
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            className={`${styles.input} ${styles.textarea} ${icon ? styles.withIcon : ''} ${error ? styles.hasError : ''}`}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            ref={ref}
            className={`${styles.input} ${styles.select} ${icon ? styles.withIcon : ''} ${error ? styles.hasError : ''}`}
            {...props}
          >
            {props.children}
          </select>
        ) : (
          <input
            ref={ref}
            type={type}
            className={`${styles.input} ${icon ? styles.withIcon : ''} ${error ? styles.hasError : ''}`}
            {...props}
          />
        )}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});

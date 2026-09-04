import styles from './Button.module.css';
import Spinner from './Spinner';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  className = '',
  ...props 
}) {
  const baseClass = styles.btn;
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[`size-${size}`] || styles['size-md'];
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingWrapper}>
          <Spinner size="sm" />
          <span style={{ opacity: 0 }}>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

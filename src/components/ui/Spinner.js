import styles from './Spinner.module.css';

export default function Spinner({ size = 'md', text = '' }) {
  return (
    <div className={`${styles.container} ${styles[`size-${size}`]}`}>
      <div className={styles.spinner}></div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}

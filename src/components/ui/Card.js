import styles from "./Card.module.css";

export default function Card({ 
  children, 
  className = "", 
  padding = "md", 
  hoverable = false 
}) {
  const paddingClass = styles[`padding-${padding}`] || styles["padding-md"];
  
  return (
    <div 
      className={`${styles.card} ${paddingClass} ${hoverable ? styles.hoverable : ""} ${className}`}
    >
      {children}
    </div>
  );
}

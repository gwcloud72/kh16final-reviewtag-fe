import styles from "./ErrorCommon.module.css";

const Error403 = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <img src="/errors/403.png" alt="403 Forbidden" className={styles.image} />
        <h1 className={styles.title}>403 - Forbidden</h1>
        <p className={styles.message}>You don't have permission to access this page.</p>
      </div>
    </div>
  );
};

export default Error403;

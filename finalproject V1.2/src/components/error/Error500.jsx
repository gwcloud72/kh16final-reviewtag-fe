import styles from "./ErrorCommon.module.css";

const Error500 = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <img src="/errors/500.png" alt="500 Server Error" className={styles.image} />
        <h1 className={styles.title}>500 - Server Error</h1>
        <p className={styles.message}>Something went wrong on our side. Please try again in a moment.</p>
      </div>
    </div>
  );
};

export default Error500;

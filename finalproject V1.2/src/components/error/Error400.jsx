import styles from "./ErrorCommon.module.css";

const Error400 = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <img src="/errors/400.png" alt="400 Bad Request" className={styles.image} />
        <h1 className={styles.title}>400 - Bad Request</h1>
        <p className={styles.message}>
          Your request couldn't be understood. Please check the URL or try again.
        </p>
      </div>
    </div>
  );
};

export default Error400;

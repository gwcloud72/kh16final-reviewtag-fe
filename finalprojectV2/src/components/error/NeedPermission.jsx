import styles from './NeedPermission.module.css'; // 위에서 만든 CSS 파일 import

export default function NeedPermission() {
  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
          <img
            src="https://i.postimg.cc/QNytBfdm/403.jpg"
            alt="접근 금지(403)"
            className={styles.image}
          />
      </div>
      <h1 className={styles.title}>접근 금지</h1>
      <h2 className={styles.subtitle}>
        해당 기능을 이용하기 위해 필요한 권한이 부족합니다.
      </h2>
    </div>
  );
}
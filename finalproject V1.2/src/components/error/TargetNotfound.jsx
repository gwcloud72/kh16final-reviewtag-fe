import styles from './TargetNotfound.module.css';

export default function TargetNotfound() {
  return (
    <div className={styles.container}>
      <img
        src="https://i.postimg.cc/9Xd221qf/Chat-GPT-Image-2025nyeon-12wol-18il-ohu-10-03-19.png"
        className={styles.image}
        alt="404"
      />
      <h1 className={styles.title}>페이지가 존재하지 않습니다</h1>
      <h2 className={styles.description}>주소가 맞는지 확인 후 다시 이용해주세요</h2>
      <button className={styles.homeBtn} onClick={() => window.location.href='/'}>
        홈으로 가기
      </button>
    </div>
  );
}
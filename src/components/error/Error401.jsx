import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Error401() {
  const navigate = useNavigate();

  // 토큰 만료/인증 실패 시: 잠깐 안내 후 로그인으로 이동
  useEffect(() => {
    const t = setTimeout(() => navigate("/member/login"), 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0b0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div style={{ maxWidth: 980, width: "100%", textAlign: "center" }}>
        <img
          src="/errors/401.png"
          alt="401 Unauthorized"
          style={{
            width: "100%",
            maxWidth: 980,
            borderRadius: 18,
            boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
          }}
        />

        <div style={{ marginTop: 18, color: "#e9e9ef" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            인증이 만료되었습니다. 다시 로그인 해주세요.
          </div>
          <div style={{ marginTop: 8, color: "#bdbdc7" }}>
            1~2초 후 로그인 페이지로 이동합니다.
          </div>
        </div>

        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
          <Link
            to="/member/login"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#18a0fb",
              color: "#0b0b0d",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            로그인하기
          </Link>
          <Link
            to="/"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              color: "#e9e9ef",
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

export default function Error404() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0b0b0d",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <div style={{ maxWidth: 980, width: "100%", textAlign: "center" }}>
        <img
          src={"/errors/404.png"}
          alt="404 Not Found"
          style={{
            width: "100%",
            maxWidth: 980,
            borderRadius: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
          }}
        />

        <div style={{ marginTop: 18, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{
              padding: "12px 18px",
              background: "#22c55e",
              color: "#0b0b0d",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            홈으로
          </Link>

          <Link
            to="/board/list"
            style={{
              padding: "12px 18px",
              background: "#1f2937",
              color: "#e5e7eb",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            게시판으로
          </Link>
        </div>
      </div>
    </div>
  );
}

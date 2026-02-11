import axios from "axios";

// Global Axios setup (applies to every `axios` import)
// Centralize API base + auth redirect handling.
//
// Conventions in this project:
// - Components should call axios with paths like "/member/..." (NO "/api" prefix).
// - This interceptor will automatically prefix "/api" for relative URLs.
// - You can still pass absolute URLs (http/https) and they will be kept as-is.

const baseURL = import.meta.env.VITE_API_BASE_URL || "";
axios.defaults.baseURL = baseURL;

axios.interceptors.request.use(
  (config) => {
    const url = config.url;

    if (typeof url === "string") {
      const isAbsolute = /^https?:\/\//i.test(url);

      if (!isAbsolute) {
        // Normalize to leading slash for checks
        const normalized = url.startsWith("/") ? url : `/${url}`;

        // If missing /api prefix, add it
        if (!normalized.startsWith("/api/") && normalized !== "/api") {
          config.url = `/api${normalized}`;
        } else {
          config.url = normalized;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 토큰 만료/미인증 등 인증 실패 시 로그인 페이지로 이동
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const pathname = window.location?.pathname || "";

      // 이미 로그인 페이지면 재이동하지 않음
      if (!pathname.startsWith("/member/login")) {
        // 로그인 완료 후 돌아오도록 현재 주소 저장(선택)
        try {
          sessionStorage.setItem(
            "redirectAfterLogin",
            window.location?.href || "/"
          );
        } catch (e) {
          // ignore
        }

        window.location.href = "/member/login";
      }
    }
    return Promise.reject(error);
  }
);

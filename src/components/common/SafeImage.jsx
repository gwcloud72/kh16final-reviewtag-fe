import React, { useCallback } from "react";

/**
 * 이미지 로드 실패(엑박) 시 fallback 이미지로 자동 교체
 * - 기본 fallback: /images/error-image.png (public 폴더)
 */
export default function SafeImage({
  src,
  alt = "",
  fallback = "/images/error-image.png",
  ...props
}) {
  const handleError = useCallback((e) => {
    // 무한 onError 루프 방지
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallback;
  }, [fallback]);

  return <img src={src || fallback} alt={alt} onError={handleError} {...props} />;
}

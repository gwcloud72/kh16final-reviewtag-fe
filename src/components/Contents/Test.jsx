import { useState } from "react"
import axios from "axios";

//장르저장
export default function Test() {
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("버튼을 눌러 장르 데이터를 수집");
    
    // TMDB API 호출 핸들러
  const handleCollectGenres = async () => {
    setStatus('loading');
    setMessage('장르 데이터를 수집하고 DB에 저장 중...');
    
    try {
      // Spring Boot의 REST API 호출
      const response = await axios.get("/api/tmdb/genre/collect");
      
      setStatus('success');
      setMessage(response.data); // "장르 마스터 데이터 수집 및 저장 완료" 응답
      
    } catch (error) {
      console.error("API 호출 오류:", error);
      setStatus('error');
      
      let errorMessage = "백엔드 API 호출에 실패했습니다.";
      if (error.response) {
        // 서버 응답이 왔으나 4xx, 5xx 에러인 경우
        errorMessage = `서버 에러 (${error.response.status}): ${error.response.data || '응답 본문 없음'}`;
      } else if (error.request) {
        // 요청은 보냈으나 응답을 받지 못한 경우 (CORS, 서버 꺼짐 등)
        errorMessage = "서버에 연결할 수 없습니다. Spring Boot 서버(8080 포트)가 실행 중인지 확인하세요.";
      }
      
      setMessage(errorMessage);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return "loading";
      case 'success':
        return "success";
      case 'error':
        return "error";
      case 'idle':
      default:
        return "idle";
    }
  };

    //render
    return (<>
        <div className="row mt-4">
            <div className="col">
                <h1>TMDB 테스트</h1>
            </div>
        </div>
        <button onClick={handleCollectGenres} disabled={status==="loading"}
            className={`btn btn-primary`}>눌러</button>
    </>)
}
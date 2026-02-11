import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaBolt, FaUser } from "react-icons/fa6";

export default function RankingNewPage() {
    const [rankList, setRankList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/ranking/realtimeQuiz?limit=20")
            .then(res => setRankList(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // 시간 포맷
    const timeAgo = useCallback((dateString) => {
        if (!dateString) return "";
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) return "방금 전";
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        
        const year = past.getFullYear();
        const month = past.getMonth() + 1;
        const day = past.getDate();
        if (year === now.getFullYear()) return `${month}월 ${day}일`;
        return `${year}. ${month}. ${day}.`;
    }, []);

    // NEW 뱃지 (7일)
    const isNew = useCallback((dateString) => {
        if (!dateString) return false;
        const now = new Date();
        const targetDate = new Date(dateString);
        const diffMs = now - targetDate;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return diffMs < sevenDaysMs;
    }, []);

    return (
        <div className="container-fluid pb-5" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
            <div className="container pt-4">
                
                {/* 상단 헤더 */}
                <div className="mb-5">
                    <Link to="/ranking" className="text-decoration-none text-secondary d-inline-flex align-items-center mb-3 hover-opacity">
                        <FaArrowLeft className="me-2" /> 랭킹 목록으로 돌아가기
                    </Link>
                    <div className="d-flex align-items-center justify-content-between">
                        <h2 className="fw-bold text-white m-0 d-flex align-items-center display-6">
                            <span className="me-3 p-2 rounded-circle bg-info bg-opacity-10">
                                <FaBolt className="text-primary" size={32}/>
                            </span>
                            실시간 퀴즈 업데이트
                        </h2>
                        <span className="badge bg-dark border border-secondary text-secondary px-3 py-2 rounded-pill">
                            최근 20개
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : (
                    <div className="card border-0 shadow bg-dark text-white">
                        <div className="list-group list-group-flush bg-dark rounded">
                            {rankList.map((item, index) => (
                                <Link to={`/contents/detail/${item.contentsId}/quiz`} key={index} className="list-group-item list-group-item-action bg-dark text-white border-secondary py-3">
                                    <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                                        <div className="d-flex align-items-center">
                                            {isNew(item.quizCreatedAt) && <span className="badge bg-danger me-2">NEW</span>}
                                            <h5 className="mb-0 fw-bold">{item.contentsTitle}</h5>
                                        </div>
                                        <small className="text-primary fw-bold">{timeAgo(item.quizCreatedAt)}</small>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-end mt-2">
                                        <span className="text-secondary small">새로운 퀴즈가 등록되었습니다.</span>
                                        <small className="text-secondary d-flex align-items-center">
                                            <FaUser className="me-1" size={12} /> {item.memberNickname}
                                        </small>
                                    </div>
                                </Link>
                            ))}
                            {rankList.length === 0 && <li className="list-group-item bg-dark text-center text-muted py-5">최근 등록된 퀴즈가 없습니다.</li>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
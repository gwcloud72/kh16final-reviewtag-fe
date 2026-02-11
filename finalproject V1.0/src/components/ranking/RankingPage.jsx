import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios"; // axios 설치 필요
import { Link } from "react-router-dom";
import {
    FaCrown,
    FaChevronRight,
    FaMedal,
    FaPenNib,
    FaHeart,
    FaFire,
    FaBolt,
    FaUser
} from "react-icons/fa6";
import { FaTrophy } from "react-icons/fa";

export default function RankingPage() {

    //컨텐츠 url
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

    //State
    const [quizRank, setQuizRank] = useState([]);
    const [reviewRank, setReviewRank] = useState([]);
    const [hotContents, setHotContents] = useState([]);
    const [realtimeQuiz, setRealtimeQuiz] = useState([]);
    const [loading, setLoading] = useState(true);

    //callback
    const fetchAllRankings = useCallback(async () => {
        try {
            // 4개의 API를 병렬로 호출하여 속도 최적화
            const [quizRes, reviewRes, hotRes, liveRes] = await Promise.all([
                axios.get("/ranking/quiz?limit=5"),
                axios.get("/ranking/review?limit=5"),
                axios.get("/ranking/hotContents?limit=5"),
                axios.get("/ranking/realtimeQuiz?limit=5")
            ]);

            setQuizRank(quizRes.data);
            setReviewRank(reviewRes.data);
            setHotContents(hotRes.data);
            setRealtimeQuiz(liveRes.data);
        } catch (error) {
            console.error("랭킹 데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    //effect
    useEffect(() => {
        fetchAllRankings();

        //폴링 방식(n초마다 자동 새로고침)
        const interval = setInterval(() => {
            fetchAllRankings();
        }, 30000);

        //컴포넌트 사라질때 타이머 삭제
        return () => clearInterval(interval);

    }, [fetchAllRankings]);

    //callback
    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    //시간 포맷
    const timeAgo = useCallback((dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        //24시간 이내일때
        if (diffMins < 1) return "방금 전";
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        
        //24시간이 지났을때
        const year = past.getFullYear();
        const month = past.getMonth() + 1;
        const day = past.getDate();

        //올해면 '월 일'만 표시
        if (year === now.getFullYear()) {
            return `${month}월 ${day}일`;
        } 
        
        //'년 월 일' 표시
        return `${year}. ${month}. ${day}.`;
    }, []);

    //실시간 퀴즈 업데이트 뱃지 유무
    const isNew = useCallback((dateString)=> {
        if (!dateString) return false;

        const now = new Date();
        const targetDate = new Date(dateString);
        
        // 시간 차이 계산 (밀리초 단위)
        const diffMs = now - targetDate;
        
        // 7일 = 7 * 24시간 * 60분 * 60초 * 1000밀리초
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        return diffMs < sevenDaysMs;
    }, []);

    //순위별 아이콘/스타일
    const getMedalIcon = useCallback((index) => {
        if (index === 0) return <FaMedal className="fs-2 me-3 text-warning " />; // 금
        if (index === 1) return <FaMedal className="fs-3 me-3 text-secondary ps-2" />; // 은
        if (index === 2) return <FaMedal className="fs-4 me-3 ps-2" style={{ color: '#CD7F32' }} />; // 동
        return <span className="me-3 fw-bold ms-2 text-secondary ps-1">{index + 1}</span>; // 4위부터
    }, []);

    //Render
    return (
        <div className="container-fluid pb-5" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>

            <div className="container pt-4">
                {/* 점보트론 역할 */}
                <div className="p-5 mb-5 rounded-3 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #1e2124 0%, #2c3035 100%)', border: '1px solid #333' }}>
                    <div className="container-fluid py-2">
                        <h1 className="display-5 fw-bold text-white">
                            <FaTrophy className="text-warning me-2" /> 랭킹 & 차트
                        </h1>
                        <p className="col-md-8 fs-5 text-secondary">
                            명예의 전당과 실시간 인기 영화를 확인하세요!
                        </p>
                    </div>
                </div>

                {/* 로딩 중일 때 처리 */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="row">

                        {/* 퀴즈왕 */}
                        <div className="col-md-6 mb-4">
                            <div className="card border-0 shadow h-100 bg-dark text-white">
                                <div className="card-header bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                                    <span className="d-flex align-items-center">
                                        <FaCrown className="me-2" /> 이달의 퀴즈 정답왕 (TOP 5)
                                    </span>
                                    <Link to="/ranking/quiz" className="text-dark small text-decoration-none d-flex align-items-center">
                                        더보기 <FaChevronRight className="ms-1" size={12} />
                                    </Link>
                                </div>
                                <ul className="list-group list-group-flush bg-dark">
                                    {quizRank.map((item, index) => (
                                        <li key={index} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center py-3">
                                            <div className="d-flex align-items-center">
                                                {getMedalIcon(index)}
                                                {/* 추후 아이콘으로 표시 가능 */}
                                                {/* {item.memberImg ? (
                                                    <img src={item.memberImg} className="rounded-circle me-2" alt="profile" style={{ width: 40, height: 40 }} />
                                                ) : (
                                                    <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center me-2" style={{ width: 40, height: 40 }}>
                                                        <FaUser size={20} className="text-dark" />
                                                    </div>
                                                )} */}
                                                <strong>{item.memberNickname}</strong>
                                            </div>
                                            <span className="badge bg-warning text-dark rounded-pill">
                                                {item.count} 문제
                                            </span>
                                        </li>
                                    ))}
                                    {quizRank.length === 0 && <li className="list-group-item bg-dark text-center text-muted py-4">아직 랭킹 데이터가 없습니다.</li>}
                                </ul>
                            </div>
                        </div>

                        {/* 리뷰왕 */}
                        <div className="col-md-6 mb-4">
                            <div className="card border-0 shadow h-100 bg-dark text-white">
                                <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                                    <span className="d-flex align-items-center">
                                        <FaPenNib className="me-2" /> 이달의 리뷰왕 (TOP 5)
                                    </span>
                                    <Link to="/ranking/review" className="text-white small text-decoration-none d-flex align-items-center">
                                        더보기 <FaChevronRight className="ms-1" size={12} />
                                    </Link>
                                </div>
                                <ul className="list-group list-group-flush bg-dark">
                                    {reviewRank.map((item, index) => (
                                        <li key={index} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center py-3">
                                            <div className="d-flex align-items-center">
                                                {getMedalIcon(index)}
                                                <div className="d-flex flex-column">
                                                    <strong>{item.memberNickname}</strong>
                                                    <small style={{ fontSize: '0.8rem', color: '#b2bec3'}}>작성 리뷰 {item.reviewCount}개</small>
                                                </div>
                                            </div>
                                            <div className="text-danger small d-flex align-items-center">
                                                <FaHeart className="me-1" /> {item.count} 좋아요
                                            </div>
                                        </li>
                                    ))}
                                    {reviewRank.length === 0 && <li className="list-group-item bg-dark text-center text-muted py-4">데이터가 없습니다.</li>}
                                </ul>
                            </div>
                        </div>

                        {/* 핫한 영화 */}
                        <div className="col-md-6 mb-4">
                            <div className="card border-0 shadow h-100 bg-dark text-white">
                                <div className="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
                                    <span className="d-flex align-items-center">
                                        <FaFire className="me-2" /> 지금 가장 핫한 컨텐츠 (TOP 5)
                                    </span>
                                    <span className="badge bg-white text-danger d-flex align-items-center">
                                        월간 인기 순위 <FaFire className="ms-1" />
                                    </span>
                                </div>
                                <div className="list-group list-group-flush bg-dark">
                                    {hotContents.map((item, index) => (
                                        <Link to={`/contents/detail/${item.contentsId}`} key={index} className="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex align-items-center gap-3 py-3">
                                            <span className={`fs-4 fw-bold fst-italic me-2 ms-2 ${index < 3 ? 'text-danger' : 'text-secondary'}`}>
                                                {index + 1}
                                            </span>
                                            <img src={getPosterUrl(item.contentsPosterPath)} style={{ width: '50px', height: '70px', objectFit: 'cover' }}
                                                alt={`${item.contentsTitle} 포스터`} className="rounded border border-secondary" />
                                            <div className="d-flex gap-2 w-100 justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1 fw-bold">{item.contentsTitle}</h6>
                                                    <small className="text-secondary">
                                                        이번 달 리뷰 <span className="text-danger fw-bold">+{item.reviewCount}개</span>
                                                    </small>
                                                </div>
                                                <FaChevronRight className="text-secondary me-2" size={14} />
                                            </div>
                                        </Link>
                                    ))}
                                    <Link to="/ranking/contents" className="list-group-item list-group-item-action text-center text-secondary small py-2 bg-dark border-secondary">
                                        컨텐츠 순위 더보기 +
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 실시간 퀴즈 업데이트 */}
                        <div className="col-md-6 mb-4">
                            <div className="card border-0 shadow h-100 bg-dark text-white">
                                <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
                                    <span className="d-flex align-items-center">
                                        <FaBolt className="me-2" /> 실시간 퀴즈 업데이트
                                    </span>
                                    <small className="text-white opacity-75">최근 업로드순이에요!</small>
                                </div>
                                <div className="list-group list-group-flush bg-dark">
                                    {realtimeQuiz.map((item, index) => (
                                        <Link to={`/contents/detail/${item.contentsId}/quiz`} key={index} className="list-group-item list-group-item-action bg-dark text-white border-secondary py-3">
                                            <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                                                <div className="d-flex align-items-center">
                                                    {isNew(item.quizCreatedAt) && (
                                                        <span className="badge bg-danger me-2">NEW</span>
                                                    )}
                                                    <h6 className="mb-0 fw-bold">{item.contentsTitle}</h6>
                                                </div>
                                                <small className="text-primary fw-bold">{timeAgo(item.quizCreatedAt)}</small>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-end">
                                                <small className="text-secondary">새로운 퀴즈가 등록되었습니다.</small>
                                                <small className="text-secondary d-flex align-items-center">
                                                    <FaUser className="me-1" size={10} /> {item.memberNickname}
                                                </small>
                                            </div>
                                        </Link>
                                    ))}
                                    <Link to="/ranking/new" className="list-group-item list-group-item-action text-center text-secondary small py-2 bg-dark border-secondary">
                                        최근 등록된 퀴즈 더보기 +
                                    </Link>
                                    {realtimeQuiz.length === 0 && <li className="list-group-item bg-dark text-center text-muted py-4">최근 등록된 퀴즈가 없습니다.</li>}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
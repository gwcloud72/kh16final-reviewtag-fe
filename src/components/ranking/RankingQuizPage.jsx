import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaMedal, FaCrown, FaUser } from "react-icons/fa6";

export default function RankingQuizPage() {
    const [rankList, setRankList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/ranking/quiz?limit=20")
            .then(res => setRankList(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // 🥇🥈🥉 순위별 스타일 (배경색, 테두리, 그림자)
    const getRankStyle = (index) => {
        const baseStyle = {
            transition: 'transform 0.2s',
            cursor: 'default'
        };

        if (index === 0) return { // 1등 (Gold)
            ...baseStyle,
            background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, rgba(33, 37, 41, 0.6) 100%)',
            borderLeft: '4px solid #FFD700',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.1)'
        };
        if (index === 1) return { // 2등 (Silver)
            ...baseStyle,
            background: 'linear-gradient(90deg, rgba(192, 192, 192, 0.15) 0%, rgba(33, 37, 41, 0.6) 100%)',
            borderLeft: '4px solid #C0C0C0',
        };
        if (index === 2) return { // 3등 (Bronze)
            ...baseStyle,
            background: 'linear-gradient(90deg, rgba(205, 127, 50, 0.15) 0%, rgba(33, 37, 41, 0.6) 100%)',
            borderLeft: '4px solid #CD7F32',
        };
        
        // 4등부터 (일반)
        return {
            ...baseStyle,
            backgroundColor: '#212529', // bg-dark
            borderLeft: '4px solid #495057', // 회색 라인
        };
    };

    // 아이콘 렌더링
    const getMedalIcon = useCallback((index) => {
        if (index === 0) return <FaCrown className="fs-3 text-warning" />;
        if (index === 1) return <FaMedal className="fs-4 text-secondary" />;
        if (index === 2) return <FaMedal className="fs-4" style={{ color: '#CD7F32' }} />;
        return <span className="fs-5 fw-bold text-secondary fst-italic">{index + 1}</span>;
    }, []);

    return (
        <div className="container-fluid pb-5" style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0' }}>
            <div className="container pt-5" style={{ maxWidth: '800px' }}>
                
                {/* 상단 헤더 */}
                <div className="mb-5">
                    <Link to="/ranking" className="text-decoration-none text-secondary d-inline-flex align-items-center mb-3 hover-opacity">
                        <FaArrowLeft className="me-2" /> 랭킹 목록으로 돌아가기
                    </Link>
                    <div className="d-flex align-items-center justify-content-between">
                        <h2 className="fw-bold text-white m-0 d-flex align-items-center display-6">
                            <span className="me-3 p-2 rounded-circle bg-warning bg-opacity-10">
                                <FaCrown className="text-warning" size={32} />
                            </span>
                            이달의 퀴즈 정답왕
                        </h2>
                        <span className="badge bg-dark border border-secondary text-secondary px-3 py-2 rounded-pill">
                            TOP 20
                        </span>
                    </div>
                </div>

                {/* 리스트 영역 */}
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {rankList.map((item, index) => (
                            <div 
                                key={index} 
                                className="rounded-3 p-3 d-flex align-items-center justify-content-between border border-dark"
                                style={getRankStyle(index)}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.zIndex = '10'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; }}
                            >
                                <div className="d-flex align-items-center">
                                    {/* 랭킹 아이콘/숫자 */}
                                    <div className="d-flex justify-content-center align-items-center" style={{ width: '60px' }}>
                                        {getMedalIcon(index)}
                                    </div>
                                    
                                    {/* 프로필 아바타 (없으면 기본 아이콘) */}
                                    {/* <div className="mx-3">
                                        {item.memberImg ? (
                                            <img src={item.memberImg} className="rounded-circle border border-2 border-dark shadow-sm" style={{width: 48, height: 48, objectFit: 'cover'}} alt="profile" />
                                        ) : (
                                            <div className="rounded-circle bg-secondary bg-opacity-25 d-flex justify-content-center align-items-center" style={{width: 48, height: 48}}>
                                                <FaUser className="text-secondary" />
                                            </div>
                                        )}
                                    </div> */}

                                    {/* 닉네임 */}
                                    <div>
                                        <div className={`fw-bold ${index < 3 ? 'fs-5 text-white' : 'text-light'}`}>
                                            {item.memberNickname}
                                        </div>
                                        {index === 0 && <small className="text-warning">👑 현재 1등</small>}
                                    </div>
                                </div>

                                {/* 점수 뱃지 */}
                                <div className="pe-3">
                                    <div className={`px-4 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 ${
                                        index === 0 ? 'bg-warning text-dark' : 
                                        index === 1 ? 'bg-light text-dark' : 
                                        index === 2 ? 'bg-secondary text-white' : 
                                        'bg-dark border border-secondary text-secondary'
                                    }`}>
                                        <span className="fs-6">{item.count}</span>
                                        <small className="opacity-75" style={{fontSize: '0.7em'}}>문제 정답</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {rankList.length === 0 && (
                            <div className="text-center py-5 text-secondary">
                                <div className="fs-1 mb-3">👻</div>
                                아직 명예의 전당에 오른 유저가 없습니다.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
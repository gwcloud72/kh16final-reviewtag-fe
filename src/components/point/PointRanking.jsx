import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './PointRanking.css';

export default function PointRankingPage() {
    const [rankingList, setRankingList] = useState([]);
    const [rankingKeyword, setRankingKeyword] = useState("");
    
    // 페이지네이션 상태 (ranking 접두사 적용)
    const [rankingPage, setRankingPage] = useState(1);
    const [rankingTotalPage, setRankingTotalPage] = useState(0);

    // 데이터 로드 함수
    const rankingLoadData = useCallback(async () => {
        try {
            const rankingResp = await axios.get("/point/ranking/total", {
                params: { 
                    keyword: rankingKeyword,
                    page: rankingPage,
                    size: 10 
                }
            });
            // 서버 응답 데이터 매핑
            setRankingList(rankingResp.data.list || []);
            setRankingTotalPage(rankingResp.data.totalPage || 0);
        } catch (rankingError) {
            console.error("랭킹 로드 실패", rankingError);
        }
    }, [rankingKeyword, rankingPage]);

    useEffect(() => {
        rankingLoadData();
    }, [rankingLoadData]);

    const rankingHandleSearch = () => {
        setRankingPage(1); 
        rankingLoadData();
    };

    const rankingHandleKeyPress = (e) => {
        if (e.key === 'Enter') rankingHandleSearch();
    };

    const rankingChangePage = (rankingNewPage) => {
        if (rankingNewPage >= 1 && rankingNewPage <= rankingTotalPage) {
            setRankingPage(rankingNewPage);
        }
    };

    return (
        <div className="ranking-bg-container">
            <div className="ranking-overlay">
                <div className="container py-5">
                    <h2 className="text-center fw-bold mb-4 ranking-text-glow">
                        ❄️ 무비/애니 명예의 전당 ❄️
                    </h2>

                    {/* 검색창 */}
                    <div className="ranking-search-section mb-4 text-center">
                        <div className="input-group ranking-search-box-glass d-inline-flex">
                            <input 
                                type="text" 
                                className="form-control"
                                placeholder="닉네임 검색..." 
                                value={rankingKeyword}
                                onChange={(e) => setRankingKeyword(e.target.value)}
                                onKeyPress={rankingHandleKeyPress}
                            />
                            <button className="btn ranking-btn-snow" onClick={rankingHandleSearch}>검색</button>
                        </div>
                    </div>

                    {/* 랭킹 리스트 */}
                    <div className="ranking-glass-card mb-4">
                        <div className="ranking-header d-flex justify-content-between px-4 py-2 text-white-50 small">
                            <span>RANKING</span>
                            <span>USER</span>
                            <span>POINTS</span>
                        </div>
                        <div className="ranking-list">
                            {rankingList.length > 0 ? (
                                rankingList.map((rankingUser) => (
                                    <div key={rankingUser.memberId} className="ranking-rank-row d-flex align-items-center">
                                        <div className="ranking-rank-num">
                                            {rankingUser.ranking <= 3 ? (
                                                <span className={`ranking-medal ranking-medal-${rankingUser.ranking}`}></span>
                                            ) : rankingUser.ranking}
                                        </div>
                                        <div className="ranking-user-info flex-grow-1">
                                            <div className="ranking-user-nick text-white fw-bold">{rankingUser.nickname}</div>
                                            <div className="ranking-user-lvl text-info small">{rankingUser.level}</div>
                                        </div>
                                        <div className="ranking-user-pts text-warning fw-bold">
                                            {rankingUser.point.toLocaleString()} P
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-5 text-center text-white">데이터가 없어요! ⛄</div>
                            )}
                        </div>
                    </div>

                    {/* 페이지네이션 UI */}
                    {rankingTotalPage > 1 && (
                        <div className="d-flex justify-content-center">
                            <nav>
                                <ul className="pagination pagination-sm ranking-glass-pagination">
                                    <li className={`page-item ${rankingPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => rankingChangePage(rankingPage - 1)}>&laquo;</button>
                                    </li>
                                    
                                    {Array.from({ length: rankingTotalPage }, (_, i) => i + 1).map(p => (
                                        <li key={p} className={`page-item ${rankingPage === p ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => rankingChangePage(p)}>
                                                {p}
                                            </button>
                                        </li>
                                    ))}

                                    <li className={`page-item ${rankingPage === rankingTotalPage ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => rankingChangePage(rankingPage + 1)}>&raquo;</button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaFire, FaChevronRight } from "react-icons/fa6";

export default function RankingContentsPage() {
    const [rankList, setRankList] = useState([]);
    const [loading, setLoading] = useState(true);
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

    useEffect(() => {
        axios.get("/ranking/hotContents?limit=20")
            .then(res => setRankList(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getPosterUrl = (path) => path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/50x70?text=No+Img';

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
                            <span className="me-3 p-2 rounded-circle bg-danger bg-opacity-10">
                                <FaFire className="text-danger" size={32}/>
                            </span>
                            지금 가장 핫한 영화
                        </h2>
                         {/* 뱃지도 통일감을 위해 추가했습니다 */}
                        <span className="badge bg-dark border border-secondary text-secondary px-3 py-2 rounded-pill">
                            TOP 20
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : (
                    <div className="card border-0 shadow bg-dark text-white">
                        <div className="list-group list-group-flush bg-dark rounded">
                            {rankList.map((item, index) => (
                                <Link to={`/contents/detail/${item.contentsId}`} key={index} className="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex align-items-center gap-3 py-3">
                                    <span className={`fs-4 fw-bold fst-italic me-3 ms-2 ${index < 3 ? 'text-danger' : 'text-secondary'}`} style={{ minWidth: '30px', textAlign: 'center' }}>
                                        {index + 1}
                                    </span>
                                    <img src={getPosterUrl(item.contentsPosterPath)} alt={item.contentsTitle} className="rounded border border-secondary" style={{ width: '60px', height: '85px', objectFit: 'cover' }} />
                                    <div className="d-flex gap-2 w-100 justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1 fw-bold">{item.contentsTitle}</h5>
                                            <span className="text-secondary">
                                                이번 달 리뷰 <span className="text-danger fw-bold">+{item.reviewCount}개</span>
                                            </span>
                                        </div>
                                        <FaChevronRight className="text-secondary me-3" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
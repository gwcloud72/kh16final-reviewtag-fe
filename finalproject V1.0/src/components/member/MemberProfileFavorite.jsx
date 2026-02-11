import { Link, useParams } from "react-router-dom"
import "./Member.css"
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

export default function MemberProfileFavorite() {
    const { memberId } = useParams();

    const [hasWatchlist, setHasWatchlist] = useState(false);
    const [watchlist, setWatchlist] = useState([]);
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";


    
    //callback
    const loadData = useCallback(async () => {
        if (!memberId) return;
        const { data } = await axios.get(`/member/mywatch/${memberId}`)
        setWatchlist(data);
        if (data.length !== 0) {
            setHasWatchlist(true);
        }
    }, [memberId]);

    //effect
    useEffect(() => {
        loadData();
    }, [loadData]);

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    const getFormattedDate = useCallback((text) => {
        return text ? text.substr(0, 10) : "";
    }, []);

    return (<>
        <div className="container pb-5">
            <h1 className="text-center mt-4 mb-5"> {memberId}님의 <span className="text-info">인생작</span></h1>

            <div className="row">
                {watchlist.map((watchlist) => (
                    watchlist.watchlistType === "인생작" && (
                        <div key={watchlist.watchlistContent} className="col-12 col-lg-6 mb-4">
                            {/* 카드 전체 영역 */}
                            <div className="card black-bg-wrapper shadow-sm border-0 h-100" style={{ overflow: "hidden" }}>
                                <div className="row g-0">

                                    {/* 1. 이미지 영역 */}
                                    <div className="col-4 col-sm-4">
                                        <Link to={`/contents/detail/${watchlist.watchlistContent}`}>
                                            <img
                                                src={getPosterUrl(watchlist.contentsPosterPath)}
                                                className="img-fluid rounded-start h-100"
                                                alt={watchlist.contentsTitle}
                                                style={{ objectFit: "cover", minHeight: "220px" }}
                                            />
                                        </Link>
                                    </div>

                                    <div className="col-8 col-sm-8">
                                        {/* 2. 내용 영역 */}
                                        <div className="card-body mt-3 d-flex flex-column justify-content-between">

                                            {/* 상단 정보 (클릭 시 이동) */}
                                            <Link to={`/contents/detail/${watchlist.watchlistContent}`} className="text-decoration-none text-dark">
                                                <h5 className="card-title text-light text-truncate fw-bold">{watchlist.contentsTitle}</h5>
                                                <p className="card-text text-light small mb-2">
                                                    {getFormattedDate(watchlist.watchlistTime)} 등록
                                                </p>

                                                <div className="mb-2">
                                                    <span className="badge bg-warning text-light me-1">{watchlist.contentsType}</span>
                                                    {watchlist.contentsDirector && (
                                                        <span className="badge bg-light text-secondary border me-1 text-truncate" style={{ maxWidth: "80px", verticalAlign: "bottom" }}>
                                                            {watchlist.contentsDirector}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-truncate text-secondary small mb-3">
                                                    출연: {watchlist.contentsMainCast}
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ))}

                {(!hasWatchlist || watchlist.filter(w => w.watchlistType === "인생작").length === 0) && (
                    <div className="col-12 text-center mt-5 text-secondary">
                        <h3>아직 등록된 인생작이 없습니다.</h3>
                    </div>
                )}
            </div>
        </div>
    </>)
}
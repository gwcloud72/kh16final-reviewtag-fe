import { useAtom } from "jotai";
import { loginIdState, loginNicknameState } from "../../utils/jotai";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaBookmark, FaTrashAlt } from "react-icons/fa"; // 아이콘 일부 변경 추천
import { FaRegThumbsDown } from "react-icons/fa6"; // 아이콘 변경 추천
import { toast } from "react-toastify";

export default function MemberMycontent() {
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginNickname, setLoginNickname] = useAtom(loginNicknameState);

    //state
    const [hasWatchlist, setHasWatchlist] = useState(false);
    const [myWatchlist, setMyWatchlist] = useState([]);
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

    //callback
    const loadData = useCallback(async () => {
        if (!loginId) return;
        const { data } = await axios.get(`/member/mywatch/${loginId}`)
        setMyWatchlist(data);
        if (data.length !== 0) {
            setHasWatchlist(true);
        }
    }, [loginId]);

    //effect
    useEffect(() => {
        loadData();
    }, [loadData]);

    // 북마크 삭제 함수 (이벤트 전파 중단 추가)
    const deleteWatchlist = useCallback(async (e, contentsId) => {
        e.preventDefault(); // 링크 이동 방지
        e.stopPropagation(); // 상위 이벤트 전파 방지

        const choice = window.confirm("리스트를 해제하시겠습니까?");
        if (choice === false) return;
        try {
            await axios.delete(`/watchlist/${contentsId}/${loginId}`);
            console.log("삭제성공");
            toast.success("찜목록이 삭제되었습니다");
            loadData()
        }
        catch (err) {
            console.error(err);
            toast.error("찜목록 삭제 실패");
        }
    }, [loginId, loadData])

    // 북마크 TYPE 변경 함수 (이벤트 전파 중단 추가)
    const changeWatchlistType = useCallback(async (e, contentsId) => {
        e.preventDefault(); // 링크 이동 방지
        e.stopPropagation();

        const choice = window.confirm("인생작품을 해제하시겠습니까?");
        if (choice === false) return;

        const watchlistData = {
            watchlistContent: contentsId,
            watchlistMember: loginId,
            watchlistType: "찜",
        };
        try {
            await axios.put("/watchlist/", watchlistData)
            console.log("해제성공");
            toast.success("인생작품이 해제되었습니다");
            loadData()
        }
        catch (err) {
            console.error(err);
            toast.error("인생작 해제 실패");
        }
    }, [loginId, loadData])


    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    const getFormattedDate = useCallback((text) => {
        return text ? text.substr(0, 10) : "";
    }, []);

    return (
        <div className="container pb-5">
            <h1 className="text-center mt-4 mb-5"> {loginNickname}님의 <span className="text-info">인생작</span></h1>

            <div className="row">
                {myWatchlist.map((watchlist) => (
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
                                        {/* 버튼 */}
                                        <div className="d-flex justify-content-end pt-2 mt-2">
                                            {/* 인생작 해제 버튼 */}
                                            <button
                                                className="btn btn-outline-secondary btn-sm me-2"
                                                onClick={(e) => changeWatchlistType(e, watchlist.watchlistContent)}
                                                title="인생작 해제"
                                                >
                                                <FaRegThumbsDown /> 해제
                                            </button>

                                            {/* 삭제 버튼 */}
                                            <button
                                                className="btn btn-outline-danger btn-sm me-2"
                                                onClick={(e) => deleteWatchlist(e, watchlist.watchlistContent)}
                                                title="목록에서 삭제"
                                                >
                                                <FaTrashAlt /> 삭제
                                            </button>
                                        </div>

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

                {(!hasWatchlist || myWatchlist.filter(w => w.watchlistType === "인생작").length === 0) && (
                    <div className="col-12 text-center mt-5 text-secondary">
                        <h3>아직 등록된 인생작이 없습니다.</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
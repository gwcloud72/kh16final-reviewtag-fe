import { useAtom } from "jotai";
import { loginIdState, loginNicknameState } from "../../utils/jotai";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaRegThumbsUp, FaTrashAlt } from "react-icons/fa";


export default function MemberMycontent() {
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginNickname, setLoginNickname] = useAtom(loginNicknameState);

    //state
    const [hasWatchlist, setHasWatchlist] = useState(false);
    const [myWatchlist, setMyWatchlist] = useState([]);
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

    //callback
    const loadData = useCallback(async () => {
        if (!loginId)  return; 
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

    // 북마크 삭제 함수
    const deleteWatchlist = useCallback(async (contentsId) => {
        const choice = window.confirm("리스트를 삭제하시겠습니까?");
        if (choice === false) return;
        try {
            await axios.delete(`/watchlist/${contentsId}/${loginId}`);
            console.log("삭제성공");
            toast.success("찜목록이 삭제되었습니다");
            loadData();
        }
        catch (err) {
            console.error(err);
            toast.error("찜목록 삭제 실패");
            return;
        }
    }, [loginId, loadData])

    // 북마크 TYPE 변경 함수 (찜 ->favorite)
    const changeWatchlistType = useCallback(async (contentsId) => {
        
        const choice = window.confirm("인생작품으로 등록하시겠습니까?");
        if (choice === false) return;

        const watchlistData = {
            watchlistContent: contentsId,
            watchlistMember: loginId,
            watchlistType: "인생작",
        };
        try {
            await axios.put("/watchlist/", watchlistData)
            console.log("해제성공");
            toast.success("인생작품이 등록되었습니다");
            loadData()
        }
        catch (err) {
            console.error(err);
            toast.error("인생작 등록 실패");
            return;
        }
    }, [])

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    const getFormattedDate = useCallback((text) => {
        return text.substr(0, 10);
    }, []);

    return (<>
        <h1 className="text-center mt-4"> {loginNickname}님의 <span className="text-info">WatchList</span></h1>
        {hasWatchlist === false && (
            <div className="col-12 text-center mt-5 text-secondary">
                <h3>아직 찜한 작품이 없습니다.</h3>
            </div>
        )}
        <div className="row mt-3" >
            {myWatchlist.map((watchlist) => (
                <div className="col-6 col-md-3 mt-4" key={watchlist.watchlistContent}>
                    <div className="card p-2 border border-3 h-100 bg-dark text-white">
                        <Link className="text-decoration-none link-body-emphasis" to={`/contents/detail/${watchlist.watchlistContent}`} >
                            <img
                                src={getPosterUrl(watchlist.contentsPosterPath)}
                                className="card-img-top"
                                alt={watchlist.contentsTitle}
                                style={{ height: "300px", objectFit: "cover" }}
                            />
                        </Link>
                        <div className="row card-body align-item-center">

                            <h5 className="col-12 col-md-8 card-title text-truncate text-light mb-2 mb-md-0">{watchlist.contentsTitle}</h5>
                            <div className="col-12 col-md-4 d-flex justify-content-end gap-2">
                                <span className="text-end px-2 rounded border border-secondary border-3" style={{ cursor: "pointer" }} onClick={() => deleteWatchlist(watchlist.watchlistContent)}>
                                    <h5><FaTrashAlt className="text-danger mt-1" /></h5>
                                </span>
                                <span className="text-end px-2 rounded border border-secondary border-3" style={{ cursor: "pointer" }} onClick={() => changeWatchlistType(watchlist.watchlistContent)}>
                                    <h5 className="text-center"><FaRegThumbsUp className="text-info ms-1 mt-1" /></h5>
                                </span>
                            </div>
                            <p className="card-text text-truncate">
                                <small className="text-secondary">등록일 | {getFormattedDate(watchlist.watchlistTime)}</small>
                                <br />
                            </p>
                            <div className="d-flex align-items-center text-nowrap">
                                <span className="badge bg-warning text-dark me-2">
                                    {watchlist.contentsType}
                                </span>
                                <span className="text-light text-truncate">
                                    {watchlist.contentsDirector}
                                </span>
                            </div>    
                        </div>
                    </div>
                </div>  
            ))}

        </div>

    </>)
}
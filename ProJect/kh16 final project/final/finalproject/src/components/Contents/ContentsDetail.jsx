import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FaQuestion, FaShare } from "react-icons/fa";
import { useNavigate, useParams, Outlet, useLocation, Link } from "react-router-dom";
import { ImEyePlus } from "react-icons/im";
import { FaBookmark, FaChevronUp, FaHeart, FaPencil, FaStar, FaXmark } from "react-icons/fa6";
import { FcMoneyTransfer } from "react-icons/fc";
import "./SearchAndSave.css";
import "./Contents.css";
import { useAtom } from "jotai";
import { loginIdState } from "../../utils/jotai";
import { toast } from "react-toastify";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Modal } from "bootstrap";
import { FaCheckCircle } from "react-icons/fa";


const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";


const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: "", contentsType: "",
    contentsOverview: "", contentsPosterPath: "", contentsBackdropPath: "",
    contentsVoteAverage: 0, contentsRuntime: 0, contentsReleaseDate: "",
    contentsDirector: "", contentsMainCast: "", genreNames: [],
    contentsLike: 0, contentsRateAvg: 0, contentsPriceAvg: 0
};

export default function ContentsDetail() {

    //통합 state
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [contentsIcon, setContentsIcon] = useState([]);
    const { contentsId } = useParams();
    const navigate = useNavigate();

    const location = useLocation();

    //현재 위치가 /contents/detail/:contentsId/quiz인지 확인
    const isQuizOpen = location.pathname.includes('/quiz');

    // 북마크 확인용 state
    const [hasWatchlist, setHasWatchList] = useState(false);

    //영화 정보 state
    const [contentsDetail, setContentsDetail] = useState(INITIAL_DETAIL);
    //영화 로딩 상태 state
    const [isLoading, setIsLoading] = useState(false);
    //상태 메세지 state
    const [statusMessage, setStatusMessage] = useState("");
    //리뷰 목록 state
    const [reviewList, setReviewList] = useState([]);
    //나의 리뷰 state
    const [myReview, setMyReview] = useState(null);

    const [boardList, setBoardList] = useState([]);

    //신뢰도 state
    const [realiability, setRealiability] = useState(0);


    const loadContentsIcons = useCallback(async () => {
        if (!contentsId) return;
        try {
            const { data } = await axios.get(`/icon/contents/${contentsId}`);
            setContentsIcon(data);
            console.log("내 아이콘 데이터:", data);
        } catch (e) { console.error(e); }
    }, [contentsId]);

    useEffect(() => { loadContentsIcons(); }, [loadContentsIcons]);




    //effect
    //처음에 컨텐츠 정보와 리뷰 리스트를 불러오는 effect
    useEffect(() => {
        loadData();
        loadReview();
        loadBoard();
    }, [contentsId]);

    //북마크시 contentsLike를 갱신하기 위한 effect
    useEffect(() => {
        loadData();
    }, [loginId, hasWatchlist]);

    //loading 상태에 따라 loadingMeassge를 변경하는 effect
    useEffect(() => {
        if (isLoading === true) {
            setStatusMessage("로딩중...")
        }
    }, [isLoading]);

    useEffect(() => {
        checkWatchlist();
    }, [loginId, contentsId]);

    // 로그인 시 내 리뷰 조회
    useEffect(() => {
        if (!loginId) return;
        setIsLoading(true);
        const fetchMyReview = async () => {
            const { data } = await axios.get(`/review/user/${contentsId}/${loginId}`);
            setMyReview(data); // 없으면 null
        };
        fetchMyReview();
        setIsLoading(false);
    }, [loginId, contentsId]);


    //callback
    //contents 상세 정보
    const loadData = useCallback(async () => {
        setIsLoading(true);
        const { data } = await axios.get(`/api/tmdb/contents/detail/${contentsId}`);
        // console.log("서버에서 받은 데이터:", data);
        setContentsDetail(data);
        setIsLoading(false);
    }, []);

    //review 목록
    const loadReview = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(`/review/list/${contentsId}`);
            console.log("넘어오는데이터:", data);
            const reviewlist = [
                ...data.map(review => ({ ...review }))
            ];
            setReviewList(reviewlist);
        }
        catch (error) {
            console.log("에러 발생 : ", error);
        }
        setIsLoading(false);
    }, []);

    // 콘텐츠 게시글 목록
    const formatWtime = (dateString) => {
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${mm}/${dd}`
    }
    const loadBoard = useCallback(async () => {
        const { data } = await axios.get(`/board/contentsId/${contentsId}/five`);
        const formattedData = data.map(board => ({
            ...board,
            boardWtime: formatWtime(board.boardWtime)
        }));
        setBoardList(formattedData);
    }, [contentsId])




    // 북마크 확인(check) 함수
    const checkWatchlist = useCallback(async () => {
        if (loginId === "") return;
        const watchlistCheckData = {
            watchlistContent: contentsId,
            watchlistMember: loginId,
        };
        try {
            const { data } = await axios.post("/watchlist/check", watchlistCheckData);
            if (data.hasWatchlist === true) {
                console.log("북마크 등록되어있음");
                setHasWatchList(true);
                // 기타 추가 기능 구현
            } else {
                console.log("북마크 없음");
                setHasWatchList(false);
            }
        }
        catch (err) {
            console.log("북마크 확인 error");
            console.error(err);
        }
    }, [contentsId, loginId]);


    // 북마크 등록/삭제 함수
    const changeWatchlist = useCallback(async (e) => {
        if (loginId === "") {
            toast.error("로그인이 필요한 기능입니다");
            return;
        }
        const watchlistData = {
            watchlistContent: contentsId,
            watchlistMember: loginId,
            watchlistType: "찜",
        };

        //state 먼저변경
        const newHasWatchlist = !hasWatchlist;
        setHasWatchList(newHasWatchlist);

        if (hasWatchlist === true) { // 이미 북마크 등록되어있다면
            try {
                await axios.delete(`/watchlist/${contentsId}/${loginId}`);
                console.log("삭제성공");
                toast.success("찜목록이 삭제되었습니다");
            }
            catch (err) {
                console.error(err);
                toast.error("찜목록 삭제 실패");
                setHasWatchList(!newHasWatchlist);
            }
        }
        else { // 북마크가 되어있지 않다면
            try {
                await axios.post("/watchlist/", watchlistData);
                console.log("등록성공");
                toast.success("찜목록에 등록되었습니다");
            }
            catch (err) {
                console.error(err);
                toast.error("찜목록 등록 실패");
                setHasWatchList(!newHasWatchlist);
            }
        }
    }, [contentsId, loginId, hasWatchlist]);

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    //리뷰버튼
    const writeReview = useCallback(() => {
        if (!isLoading && contentsDetail.contentsId) {
            navigate(`/review/write/${contentsDetail.contentsId}`);
        }
    }, [navigate, isLoading, contentsDetail.contentsId]);

    //퀴즈 버튼
    const goToQuiz = () => {
        if (isQuizOpen) {
            // 이미 열려있으면 -> 닫기
            navigate(`/contents/detail/${contentsId}`);
        } else {
            // 닫혀있으면 -> 열기
            navigate(`quiz`);
        }
    };

    //모달
    const modal3 = useRef();

    const openModal3 = () => {
        const open = new Modal(modal3.current);
        open.show();
    }
    const closeModal3 = () => {
        const close = Modal.getInstance(modal3.current);
        if (close) close.hide();
    }

    //Memo
    //장르 목록을 react 엘리먼트로 변환하는 함수
    const renderGenres = useMemo(() => {
        if (!contentsDetail.genreNames || contentsDetail.genreNames.length === 0) {
            return <span className="text-light">장르 정보 없음</span>;
        }
        return contentsDetail.genreNames.map((name, index) => (
            <span key={index} className="text-light me-1">
                {name}
            </span>
        ));
    }, [contentsDetail.genreNames]);

    //방영일 날짜 형식 변경
    const formattedDate = useMemo(() => {
        const formattedDate = contentsDetail.contentsReleaseDate.split(" ")[0];
        return formattedDate;
    }, [contentsDetail.contentsReleaseDate]);

    //나의 리뷰 날짜 형식 변경
    const myReviewDate = useMemo(() => {
        if (!myReview) return "";
        const formattedDate = myReview.reviewEtime
            ? myReview.reviewEtime.replace('T', ' ').substring(0, 16)
            : myReview.reviewWtime.replace('T', ' ').substring(0, 16);
        return formattedDate
    }, [myReview]);

    //나의 리뷰 가격 콤마
    const myReviewPrice = useMemo(() => {
        return myReview?.reviewPrice?.toLocaleString('ko-KR') ?? "";
    }, [myReview]);

    //컨텐츠 평균 가격 콤마
    const getContentsPriceAvg = useMemo(() => {
        const price = contentsDetail?.contentsPriceAvg;

        // 가격 데이터가 없거나(null/undefined) 숫자가 아닐 경우
        if (price === null || isNaN(price)) {
            return "0";
        }

        return Math.floor(price).toLocaleString('ko-KR');
    }, [contentsDetail]);

    //컨텐츠 별점 정수화
    const getContentsRateAvg = useMemo(() => {
        const rate = contentsDetail?.contentsRateAvg;

        if (rate === null || isNaN(rate)) {
            return 0;
        }

        return rate;
    }, [contentsDetail]);

    /// 리뷰 목록 모듈화
    function ReviewItem({ review, loginId }) {
        const [isLiked, setIsLiked] = useState(false);
        const [likeCount, setLikeCount] = useState(review.reviewLike || 0);
        const [showSpoiler, setShowSpoiler] = useState(false);
        const [data, setData] = useState(null);

        // 좋아요 확인
        useEffect(() => {
            if (loginId) {
                axios.post("/review/check", null, {
                    params: { loginId: loginId, reviewNo: review.reviewNo }
                }).then(res => {
                    setIsLiked(res.data.like);
                }).catch(err => console.error(err));
            }
        }, [loginId, review.reviewNo]);

        useEffect(() => {
            // 1. 작성자 ID가 없으면 로딩할 필요 없음
            if (!review.reviewWriter) return;

            const fetchProfile = async () => {
                try {
                    const res = await axios.get(`/member/profile/${review.reviewWriter}`);
                    setData(res.data);
                } catch (err) {
                    console.error(`${review.reviewWriter} 이미지 로드 실패`, err);
                    // 에러 발생 시에도 '로딩중'에 갇히지 않도록 기본값 설정
                    setData({ profile: null, point: { iconSrc: 'default_icon_url' } });
                }
            };

            fetchProfile();

        }, [review.reviewWriter]);

        // 좋아요 토글
        const handleLikeToggle = async () => {
            if (!loginId) {
                toast.error("로그인이 필요합니다.");
                return;
            }
            try {
                const res = await axios.post(`/review/action/${review.reviewNo}/${loginId}`);
                setIsLiked(res.data.like);
                setLikeCount(res.data.count);
            } catch (err) {
                console.error(err);
            }
        };

        // 공유
        const handleShare = async () => {
            try {
                const shareUrl = `${window.location.origin}/review/${contentsId}/${review.reviewNo}`;

                // 클립보드에 복사
                await navigator.clipboard.writeText(shareUrl);
                // 성공 토스트 메시지
                toast.success("클립보드에 링크 복사!");
            }
            catch (error) {
                console.error("복사실패: ", error);
            }
        };

        // 날짜 포맷
        const formattedDate = review.reviewEtime
            ? review.reviewEtime.replace('T', ' ').substring(0, 16)
            : review.reviewWtime.replace('T', ' ').substring(0, 16);


        // 가격 포맷
        const formattedPrice = review.reviewPrice.toLocaleString('ko-KR');


        const [Writer, setWriter] = useState("");

        const isWriter = useMemo(() => {
            return loginId === review.reviewWriter;
        }, [loginId, review.reviewWriter])

        //신고 <기타 버튼>
        const [reportReason, setReportReason] = useState("");
        const [otherReason, setOtherReason] = useState("");


        const sendData2 = useCallback(async () => {
            if (!reportReason) {
                toast.info("신고 사유를 선택해주세요");
                return;
            }
            if (reportReason === "OTHER" && otherReason.trim() === "") {
                toast.info("기타 사유를 입력해주세요");
                return;
            }

            //전송할 데이터 구성
            const payload = {
                reviewReportReviewId: review.reviewNo,       // 신고할 리뷰 번호
                reviewReportType: reportReason,       // 신고 사유
                reviewReportContent: reportReason === "OTHER" ? otherReason : null // 기타일 때만 내용 전송
            };

            try {
                //API 호출
                await axios.post("/review/report/", payload);

                //성공 처리
                toast.success("신고가 정상적으로 접수되었습니다.");
                setReportReason(""); // 선택 초기화
                setOtherReason("");  // 내용 초기화
                closeModal3();       // 모달 닫기

            } catch (error) {
                console.error("신고 전송 실패:", error);

                //에러 처리
                if (error.response) {
                    if (error.response.status === 500) {
                        toast.error("이미 신고하신 리뷰입니다.");
                    } else if (error.response.status === 401) {
                        toast.error("로그인이 만료되었습니다.");
                    } else {
                        toast.error("신고 접수 중 오류가 발생했습니다.");
                    }
                }
            }
        }, [reportReason, otherReason, review.reviewNo, loginId]);

        // console.log("리뷰 데이터:", review);
        //신뢰도 레벨
        const rel = review?.memberReliability ?? 0;

        const relRowLevel = useMemo(() => {
            return rel >= 6 && rel <= 19;
        }, [rel])

        const relMiddleLevel = useMemo(() => {
            return rel >= 20 && rel <= 49;
        }, [rel])

        const relHighLevel = useMemo(() => {
            return rel >= 50;
        }, [rel])

        const { profile, point } = data || {};

        if (!data) {
            return <div className="text-white text-center mt-5">로딩중...</div>;
        }


        //render
        return (
            <div className="row mt-4 p-3 review-card">
                <div className="col mt-2">


                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center w-100 mt-2">
                            {/* 왼쪽 */}
                            <h4 className="text-light">
                                <img src={point?.iconSrc} alt="Icon" className="review avatar-img-v2 me-2 mb-1" />
                                <span style={{ fontSize: "21px", fontWeight: "bold" }}>{review.memberNickname}</span>
                                <span style={{ fontSize: "20px", fontWeight: "700", color: "#acacacff" }}>{review.reviewEtime && " (수정됨)"}</span>

                                {relRowLevel && (
                                    <span className="listRel ms-3">🟢 활동 리뷰어</span>
                                )}
                                {relMiddleLevel && (
                                    <span className="listRel2 ms-3">🔵 신뢰 리뷰어</span>
                                )}
                                {relHighLevel && (
                                    <span className="listRel2 ms-3">🔷 검증된 리뷰어 </span>
                                )}
                            </h4>

                            {/* 오른쪽 - 자동으로 밀기 */}
                            <div className="d-flex align-items-center ms-auto">
                                <p className="text-light mb-0 me-4">{formattedDate}</p>
                                <button
                                    className="mainTitleB p-0"
                                    type="button"
                                    onClick={openModal3}
                                >
                                    <BsThreeDotsVertical />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 신고 모달 */}
                    <div className="modal fade" id="ModalToggle3" data-bs-backdrop="static" tabIndex="-1" ref={modal3}
                        data-bs-keyboard="false">
                        <div className="modal-dialog modal-sm">
                            <div className="three">
                                <div className="modal-content">
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col report text-center mt-2 d-flex">
                                                <div className="col-2 mt-1" style={{ marginLeft: "40%" }}>신고</div>
                                                <div className="col-2">
                                                    <button type="button" className="modalButtonX2" onClick={closeModal3}>
                                                        <FaXmark />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                        <div style={{ color: "white" }} className="mt-3 reportCheck">
                                            <div>
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="SPOILER"
                                                    checked={reportReason === "SPOILER"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    }
                                                /><span className="ms-3">스포일러 포함</span>

                                            </div>
                                            <div className="mt-3">
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="NOWATCH"
                                                    checked={reportReason === "NOWATCH"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    } /><span className="ms-3">작품을 보지 않고 쓴 내용</span>
                                            </div>
                                            <div className="mt-3">
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="AD"
                                                    checked={reportReason === "AD"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    }
                                                /><span className="ms-3"
                                                >홍보성 및 영리목적</span><br />
                                            </div>
                                            <div className="mt-3">
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="SWEAR"
                                                    checked={reportReason === "SWEAR"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    }
                                                /><span className="ms-3"
                                                >욕설 및 특정인 비방</span><br />
                                            </div>
                                            <div className="mt-3">
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="EXPLICIT"
                                                    checked={reportReason === "EXPLICIT"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    } /><span className="ms-3">음란성 및 선정성</span><br />
                                            </div>
                                            <div className="mt-3">
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="BIASED"
                                                    checked={reportReason === "BIASED"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    } /><span className="ms-3">편파적인 언행</span><br />
                                            </div>
                                            <div className="mt-3">
                                                <input type="radio" className="ms-3 form-check-input" name="reportReason" value="OTHER"
                                                    checked={reportReason === "OTHER"}
                                                    onChange={(e) => {
                                                        setReportReason(e.target.value)
                                                        setOtherReason("");
                                                    }
                                                    } /><span className="ms-3">기타</span><br />
                                            </div>
                                            <hr className="HR" />
                                        </div>
                                        <div style={{ color: "#acacbbff" }} className="mt-4 ms-2 mb-3"><span>더 자세한 의견</span></div>

                                        {/* 기타 아닐 시 비활성화 */}
                                        {reportReason !== "OTHER" && (
                                            <textarea name="" className="idea2 ms-3" disabled></textarea>
                                        )}
                                        {/* 기타 일 시, 활성화 */}
                                        {reportReason === "OTHER" && (
                                            <textarea name="" className="idea ms-3" value={otherReason}
                                                onChange={(e) => {
                                                    setOtherReason(e.target.value);
                                                }
                                                }></textarea>
                                        )}

                                        <div className="mt-4 d-flex justify-content-between">
                                            <button type="button" className="reportB col-5 me-4 mb-1"
                                                onClick={sendData2}>신고하기</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link className="text-decoration-none link-body-emphasis text-light"
                        to={`/review/${contentsId}/${review.reviewNo}`}>

                        {/* 별점 */}
                        <div className="mt-2 d-flex align-items-center">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <FaStar key={num} style={{ color: num <= review.reviewRating ? "#ffc107" : "#979797ff", marginRight: "2px" }} />
                            ))}
                            <span className="ms-2 text-light me-2">{review.reviewRating}점 • </span>
                            <span className="ms-2 text-light"><FcMoneyTransfer className="me-1" />{formattedPrice} 원</span>
                        </div>

                        {/* 내용 (스포일러) */}
                        <div className="mt-4">
                            {review.reviewSpoiler === "Y" && !showSpoiler ? (
                                <p onClick={() => setShowSpoiler(true)} className="text-danger fw-bold" style={{ cursor: "pointer" }}>
                                    🚨 스포일러가 포함된 리뷰입니다. (클릭하여 보기)
                                </p>
                            ) : (
                                <p className="break-word text-light text-truncate" style={{ fontWeight: "bold" }}>{review.reviewText}</p>
                            )}
                        </div>
                        <hr className="HR mt-5" />
                    </Link>
                    {/* 좋아요 버튼 */}
                    <div className="text-start">
                        <span style={{ cursor: "pointer", }} onClick={handleLikeToggle}>
                            <span className="fs-4 me-2">
                                <FaHeart className={`${isLiked ? "text-danger" : ""}`} style={{ transition: "0.3s", }} />
                            </span>
                            <span className="fs-5">{likeCount}</span>
                        </span>
                        <button type="button" className="shareButton" onClick={handleShare}>
                            <FaShare className="share ms-4" />
                            <span className="ms-2">공유</span>
                        </button>
                    </div>
                </div>

            </div>
        );
    }

    // 공유
    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/review/${contentsId}/${myReview.reviewNo}`;

            // 클립보드에 복사
            await navigator.clipboard.writeText(shareUrl);
            // 성공 토스트 메시지
            toast.success("클립보드에 링크 복사!");
        }
        catch (error) {
            console.error("복사실패: ", error);
        }
    };

    //render
    return (
        <>
            <div className="container mt-5">
                {isLoading && (
                    <span>{statusMessage}</span>
                )}


                {/* 상세정보 카드 */}
                {!isLoading && contentsDetail.contentsId && (
                    <>
                        <div className="row mt-4 p-3 shadow rounded dark-bg-wrapper">

                            <div className="text-end mb-3">
                                {hasWatchlist === false ? (
                                    <span className="badge bg-danger px-3 btn" onClick={changeWatchlist} style={{ cursor: "pointer" }}><h5><FaBookmark className="text-light" /></h5></span>
                                ) : (
                                    <span className="badge bg-danger px-3 btn" onClick={changeWatchlist} style={{ cursor: "pointer" }}><h5><FaBookmark className="text-dark" /></h5></span>
                                )}
                            </div>

                            {/* 이미지 영역 */}
                            <div className="col-12 col-md-4 p-4 black-bg-wrapper text-light rounded">
                                <img src={getPosterUrl(contentsDetail.contentsPosterPath)} style={{ height: "480px", objectFit: "cover", borderRadius: "4px" }}
                                    alt={`${contentsDetail.contentsTitle} 포스터`} className="text-center w-100" />
                                <div>
                                    <div className="mt-3">
                                        <span>{contentsDetail.contentsType} • {contentsDetail.contentsRuntime} 분</span>
                                    </div>
                                    <div>장르 : {renderGenres}</div>
                                    <div>방영일 : {formattedDate}</div>
                                    <div>평점 : {contentsDetail.contentsVoteAverage.toFixed(1)} / 10</div>
                                    <div className="mt-4 text-center">
                                        <div className="d-inline-flex align-items-center justify-content-center px-4 py-2 rounded-pill like-wrapper">
                                            <ImEyePlus className="me-2 text-info fs-3" />
                                            <span className="fw-bold fs-5">{contentsDetail.contentsLike.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 텍스트 영역 */}
                            <div className="col-9 col-md-7 ms-4 mt-4 text-light">
                                <h3 className="text-light" style={{ fontWeight: "bold" }}>{contentsDetail.contentsTitle}</h3>
                                <div className="mt-5">
                                    <h5>평균 점수</h5>
                                </div>
                                <div className="fs-5 d-flex align-items-center">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <FaStar key={num} style={{ color: num <= getContentsRateAvg ? "#ffc107" : "#979797ff", marginRight: "2px" }} />
                                    ))}
                                    <span className="ms-2 text-light"> • <FcMoneyTransfer className="me-1" />{getContentsPriceAvg} 원</span>
                                </div>
                                <div className="mt-4">
                                    <h5>줄거리</h5>
                                    <span className="break-word">{contentsDetail.contentsOverview}</span>
                                </div>
                                <div className="mt-3">
                                    <h5>감독</h5>
                                    <p>{contentsDetail.contentsDirector}</p>
                                </div>
                                <div className="mt-3">
                                    <h5>주연</h5>
                                    <p>{contentsDetail.contentsMainCast}</p>
                                </div>
                            </div>

                            <div className="text-end mb-3 mt-2">
                                {!myReview && (
                                    <button className="contents btn btn-success" onClick={writeReview}><FaPencil className="mb-1 me-1" /> 리뷰 등록</button>
                                )}

                                <button className="contents btn btn-warning ms-2 text-light" onClick={goToQuiz}>
                                    {isQuizOpen ? (
                                        <><FaChevronUp className="mb-1 me-1" /> 퀴즈 닫기</>
                                    ) : (
                                        <><FaQuestion className="mb-1 me-1" /> 퀴즈 풀기</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 중첩 라우팅 자리 */}
                        <div className="mt-4">
                            <Outlet />
                        </div>
                    </>
                )}

                {/* 컨텐츠 관련 게시글 */}
                <div className="mt-4 quizCard quiz-dark-card text-center">
                    <div className="card-header fw-bold border-0 stats-header-dark p-3 fs-5">
                        <div className="row">
                            <span className="col-12 col-md-10 mb-1">최근 게시글</span>
                            <Link to={`/board/list/${contentsId}`} className="col-md-2 btn btn-secondary">전체보기</Link>
                        </div>

                    </div>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr className="text-truncate quiz-table-thead">
                                    <th className="quiz-table-thead">번호</th>
                                    <th className="quiz-table-thead w-50">제목</th>
                                    <th className="quiz-table-thead">작성시간</th>
                                    <th className="quiz-table-thead">작성자</th>
                                </tr>
                            </thead>
                            <tbody >
                                {boardList.map((boardList) => (
                                    <tr key={boardList.boardNo}>
                                        <td className="quiz-normal">{boardList.boardNo}</td>
                                        <td className="quiz-normal"><Link to={`/board/${boardList.boardNo}`} className="board-link">{boardList.boardTitle}</Link></td>
                                        <td className="quiz-normal">{boardList.boardWtime}</td>
                                        <td className="quiz-normal">{boardList.boardWriter}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* 컨텐츠 관련 아이콘*/}
                <div className="row g-3 mt-1">
                    <div className="col">
                        <h3 className="text-light">등록된 아이콘</h3>
                    </div>
                    {contentsIcon.length === 0 ? (
                        <div className="empty-storage-glass">
                            <div className="empty-icon">📁</div>
                            <p>해당 콘텐츠에 등록된 아이콘이 없습니다</p>
                        </div>
                    ) : (
                        <div className="row g-4 mt-0">
                            {contentsIcon.map((icon) => {
                                console.log(`[${icon.iconRarity}]`, icon.iconRarity.length);
                                return (
                                    <div className="col-4 col-sm-3 col-md-2 text-center" key={icon.iconId}>
                                        <div
                                            className={`card h-100 shadow-sm icon-card  border-0}`}
                                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                        >

                                            <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center">
                                                <span className={`badge mb-1 ${icon.iconRarity === 'LEGENDARY' ? 'bg-warning text-dark border border-dark' :
                                                    icon.iconRarity === 'UNIQUE' ? 'bg-purple text-white' :
                                                        icon.iconRarity === 'EPIC' ? 'bg-danger' :
                                                            icon.iconRarity === 'RARE' ? 'bg-primary' :
                                                                icon.iconRarity === 'EVENT' ? 'bg-event' :
                                                                    icon.iconRarity === 'COMMON' ? 'bg-success' :
                                                                        'bg-secondary'
                                                    }`} style={{ fontSize: '0.6rem' }}>
                                                    {icon.iconRarity}
                                                </span>
                                                <img
                                                    src={icon.iconSrc} className="mb-2" style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                                                    alt={icon.iconName} onError={(e) => { e.target.src = 'https://placehold.co/50x50?text=IMG' }}
                                                />

                                                <small className="text-dark fw-bold text-truncate w-100" style={{ fontSize: '0.75rem' }}>
                                                    {icon.iconName}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>




                {/* 내 리뷰 */}
                {!isLoading && myReview && (
                    <div className="mt-4">
                        <div className="row mt-5">
                            <div className="col">
                                <h3 className="text-light">내 리뷰</h3>
                            </div>
                            <hr className="mt-2 HR mb-4" />
                        </div>
                        <div className="row mt-3 p-3 myreview-card">
                            <div className="col mt-3">
                                <Link className="text-decoration-none link-body-emphasis text-light"
                                    to={`/review/${contentsId}/${myReview.reviewNo}`}>
                                    <div className="d-flex justify-content-between mt-1 align-items-center">
                                        <h4 className="text-light" style={{ fontWeight: "bold" }}>
                                            <span style={{ color: "#d4dcf8ff" }}>{contentsDetail.contentsTitle}</span>
                                            <span className="ms-1" style={{ color: "#acacacff", fontSize: "20px", fontWeight: "700" }} >{myReview.reviewEtime ? " (수정됨)" : ""}</span>
                                        </h4>
                                        <p className="text-light me-2 mb-1">{myReviewDate}</p>
                                    </div>

                                    {/* 별점 */}
                                    <div className="mt-2 d-flex align-items-center">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <FaStar key={num} style={{ color: num <= myReview.reviewRating ? "#ffc107" : "#979797ff", marginRight: "2px" }} />
                                        ))}
                                        <span className="ms-2 text-light me-2">{myReview.reviewRating}점 • </span>

                                        <span className="ms-2 text-light"><FcMoneyTransfer className="me-1" />{myReviewPrice} 원</span>
                                    </div>

                                    {/* 내용 (스포일러) */}
                                    <div className="mt-4">
                                        <p className="break-word text-light text-truncate" style={{ fontWeight: "bold" }}>{myReview.reviewText}</p>
                                    </div>
                                    <hr className="HR mt-5" />
                                </Link>
                                {/* 공유 버튼 */}
                                <div className="text-start">
                                    <span>
                                        <span className="fs-4 me-2">
                                            <FaHeart className="text-danger" />
                                        </span>
                                        <span className="fs-5">{myReview.reviewLike}</span>
                                    </span>
                                    <button type="button" className="shareButton" onClick={handleShare}>
                                        <FaShare className="share ms-4" />
                                        <span className="ms-2">공유</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 리뷰 목록 */}
                {!isLoading && reviewList && reviewList.length > 0 && (
                    <div className="mt-5">
                        <div className="row mt-5">
                            <div className="col">
                                <h3 className="text-light">리뷰</h3>
                            </div>
                            <hr className="mt-2 HR mb-4" />
                        </div>
                        {reviewList
                            .filter(review => review.reviewNo !== myReview?.reviewNo)
                            .map((review) => (
                                <ReviewItem
                                    key={review.reviewNo}
                                    review={review}
                                    loginId={loginId}
                                />
                            ))}
                    </div>
                )}
            </div>
        </>
    );
}
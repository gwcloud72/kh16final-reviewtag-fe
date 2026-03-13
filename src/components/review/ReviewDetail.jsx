import { useAtom } from "jotai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { accessTokenState, loginIdState, loginLevelState, loginNicknameState, refreshTokenState } from "../../utils/jotai";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./review.css";
import { FaStar } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { FaShare, FaXmark } from "react-icons/fa6";
import { IoHeartCircleSharp } from "react-icons/io5";
import { toast } from "react-toastify";
import { Modal } from "bootstrap";
import { FcMoneyTransfer } from "react-icons/fc";
import { FaRegEye } from "react-icons/fa";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: "", contentsType: "",
    contentsOverview: "", contentsPosterPath: "", contentsBackdropPath: "",
    contentsVoteAverage: 0, contentsRuntime: 0, contentsReleaseDate: "",
    contentsDirector: "", contentsMainCast: "", genreNames: [],
};

export default function ReviewDetail() {
    const { contentsId, reviewNo } = useParams();
    const navigate = useNavigate();

    //state
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginLevel, setLoginLevel] = useAtom(loginLevelState);
    const [loginNickname, setLoginNickname] = useAtom(loginNicknameState);
    const [accessToken, setAccessToken] = useAtom(accessTokenState);
    const [refreshToken, setRefreshToken] = useAtom(refreshTokenState);
    const [data, setData] = useState(null);

    const [review, setReview] = useState({
        reviewRating: 0,
        reviewSpoiler: "N",
        reviewText: "",
        reviewLike: 0,
        reviewRealiability: 0,
        reviewPrice: "",
        reviewWtime: "",
        reviewEtime: "",
        reviewWriter: ""
    });

    const [reviewClass, setReviewClass] = useState("");
    //영화 정보 state
    const [contentsDetail, setContentsDetail] = useState(INITIAL_DETAIL);
    //영화 로딩 상태 state
    const [isLoading, setIsLoading] = useState(false);
    //상태 메세지 state
    const [statusMessage, setStatusMessage] = useState("");
    //화면 조건 렌더링 + 리뷰 state
    const [isUpdateReview, setIsUpdateReview] = useState(() => !reviewNo);
    //리뷰 존재 여부 state
    const [userReviewExists, setUserReviewExists] = useState(false);

    const [allReviews, setAllReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);

    const reviewData = {
        ...review,
        reviewContents: contentsId,
    };

    //effect
    useEffect(() => {
        if (isLoading === true) {
            setStatusMessage("로딩중...")
        }
    });

    useEffect(() => {
        if (!contentsId) {
            setStatusMessage("영화 정보를 찾을 수 없습니다.")
            return;
        }
        loadContentData();
    }, [accessToken, contentsId])


    useEffect(() => {
        const fetchReview = async () => {
            try {
                setIsLoading(true);
                const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

                const { data } = await axios.get(`/review/${contentsId}/${reviewNo}`, { headers });
                if (data) {
                    setReview({
                        ...data,
                        reviewNo: reviewNo
                    });
                    setRating(data.reviewRating);
                    setPrice(data.reviewPrice.toLocaleString(`ko-KR`));
                    setLikeCount(data.reviewLike);
                    setWriter(data.reviewWriter);
                    setSpoiler(data.reviewSpoiler);
                    console.log(data, "데이터 구간");
                }
                if (accessToken && loginId) {
                    const { data: likeData } = await axios.post(
                        "/review/check",
                        null,
                        { params: { loginId, reviewNo } }
                    );
                    setIsLiked(likeData.like);
                } else {
                    setIsLiked(false);
                }

            } catch (error) {
                if (error.response?.status === 401) setStatusMessage("로그인이 필요합니다.");
                if (error.response?.status === 404) setStatusMessage("존재하지 않는 리뷰입니다.");
                if (error.response?.status === 500) setStatusMessage("리뷰를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReview();
    }, [reviewNo, contentsId, accessToken]);

    const nowKST = new Date(
        new Date().getTime() + 9 * 60 * 60 * 1000
    ).toISOString(); // 리뷰 수정 시간 / 한국시간 보정



    const loadContentData = useCallback(async () => {
        if (!contentsId) return;

        try {
            setIsLoading(true);
            setStatusMessage("영화 정보를 불러오는 중...");

            const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
            const { data } = await axios.get(`/api/tmdb/contents/detail/${contentsId}`, { headers });

            setContentsDetail(data);
            setStatusMessage("");
        } catch (error) {
            console.error(error);
            setStatusMessage("영화 정보를 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [contentsId, accessToken]);


    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    //별점 기능 구현
    const [rating, setRating] = useState(0);
    const [price, setPrice] = useState(0);

    const handleStarClick = (num) => {
        setRating(num);  // 클릭한 별 번호로 rating 설정
        const calcPrice = num * 3000;
        setPrice(calcPrice.toLocaleString('ko-KR')); //별의 개수로 price를 콤마 찍어서 설정

        setReview(prev => ({
            ...prev,
            reviewRating: num,
            reviewPrice: calcPrice
        }));
    };


    //Memo
    //장르 목록을 react 엘리먼트로 변환하는 함수
    const renderGenres = useMemo(() => {
        if (!contentsDetail.genreNames || contentsDetail.genreNames.length === 0) {
            return <span className="text-muted">장르 정보 없음</span>;
        }
        return contentsDetail.genreNames.map((name, index) => (
            <span key={index} className="text-muted me-1">
                {name}
            </span>
        ));
    }, [contentsDetail.genreNames]);

    //방영일 날짜 형식 변경
    const formattedDate = useMemo(() => {
        const formattedDate = contentsDetail.contentsReleaseDate.split(" ")[0];
        return formattedDate;
    }, [contentsDetail.contentsReleaseDate]);


    //공유하기(링크복사)
    const [link, setLink] = useState("");
    const copyLink = () => {
        const currentUrl = window.location.href;
        setLink(currentUrl);
        navigator.clipboard.writeText(currentUrl)
            .then(() => alert("링크가 복사되었습니다!"))
            .catch(err => console.error("복사 실패", err));
    };

    //좋아요 state
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // 좋아요 확인
    useEffect(() => {
        if (loginId) {
            axios.post("/review/check", null, {
                params: { loginId: loginId, reviewNo: reviewNo }
            }).then(res => {
                setIsLiked(res.data.like);
            }).catch(err => console.error(err));
        }
    }, [loginId, reviewNo]);

    // 좋아요 토글
    const handleLikeToggle = async () => {
        if (!loginId) {
            toast.info("로그인이 필요합니다.");
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

    //날짜 포맷
    const reviewDate = review.reviewEtime
        ? review.reviewEtime.replace('T', ' ').substring(0, 16)
        : review.reviewWtime.replace('T', ' ').substring(0, 16);

    //모달
    const modal1 = useRef();
    const modal2 = useRef();
    const modal3 = useRef();

    const openModal1 = () => {
        const open = new Modal(modal1.current);
        open.show();
    }
    const openModal2 = () => {
        const open = new Modal(modal2.current);
        open.show();
    }
    const closeModal1 = () => {
        const close = Modal.getInstance(modal1.current);
        if (close) close.hide();
    }
    const closeModal2 = () => {
        const close = Modal.getInstance(modal2.current);
        if (close) close.hide();
    }
    const openModal3 = () => {
        const open = new Modal(modal3.current);
        open.show();
    }
    const closeModal3 = () => {
        const close = Modal.getInstance(modal3.current);
        if (close) close.hide();
    }
    //가격 입력창 제어 함수
    const changeNum = useCallback((e) => {
        const regex = /[^0-9]+/g;
        const replacement = e.target.value.replace(regex, "");
        let number = replacement.length == 0 ? "" : parseInt(replacement);
        if (number > 50000) number = 50000;

        const formattedNumber = number === 0 ? "" : number.toLocaleString('ko-KR');
        setPrice(formattedNumber);

        let newRating = 0;
        if (number >= 15000) {
            newRating = 5;
        } else {
            newRating = Math.floor(number / 3000);
        }

        setRating(newRating);

        setReview(prev => ({
            ...prev,
            reviewPrice: number,
            reviewRating: newRating
        }));

    }, [price]);

    //작성자
    const [writer, setWriter] = useState("");

    //작성자 = loginId 비교
    const isWriter = useMemo(() => {
        return loginId === review.reviewWriter;
    }, [loginId, review.reviewWriter])

    //삭제 state
    const Ondelete = useCallback(async () => {
        const url = `/review/${contentsId}/${reviewNo}`;
        console.log("최종 삭제 요청 URL:", url);

        try {
            const { data } = await axios.delete(`/review/${contentsId}/${reviewNo}`)
            toast.success("리뷰 삭제 완료");
            navigate(-1);
        }
        catch (error) {
            console.error("리뷰 삭제 오류:", error.response);
            toast.error("리뷰 삭제 중 오류가 발생했습니다");
        }
    }, [reviewNo, contentsId])

    //스포일러
    const [spoiler, setSpoiler] = useState("");

    const isSpoiler = useMemo(() => {
        return review.reviewSpoiler === "Y";
    }, [review.reviewSpoiler])

    // 수정하기
    const changeTextValue = useCallback(e => {
        const { name, value } = e.target;
        setReview(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const changeSpoilerValue = useCallback(e => { //스포일러
        setReview(prev => ({
            ...prev,
            reviewSpoiler: e.target.checked ? "Y" : "N"
        }))
    }, [])

    //수정 조건
    const reviewValid = useMemo(() => {
        const regex = /^(?=[\s\S]{10,})(?!.*([ㄱ-ㅎㅏ-ㅣ])\1{5,})[\s\S]*$/;
        return regex.test(review.reviewText);
    }, [review.reviewText]);

    const invalidRegex = /([ㄱ-ㅎㅏ-ㅣ])\1{5,}/;
    const reviewClassInValid = useMemo(() => {
        return invalidRegex.test(review.reviewText);
    }, [review.reviewText]);



    const sendData = useCallback(() => {
        if (!reviewValid || reviewClassInValid) {
            toast.error("감상을 10글자 이상 작성해주세요");
            return;
        }

        const payload = {
            reviewText: review.reviewText,
            reviewRating: review.reviewRating,
            reviewSpoiler: review.reviewSpoiler,
            reviewPrice: review.reviewPrice
        };

        axios.patch(`/review/${contentsId}/${reviewNo}`, payload)
            .then(() => {
                toast.success("리뷰 수정 완료");
                setReview(prev => ({
                    ...prev,
                    reviewEtime: nowKST
                }));
                setReviewView(true);
            })
            .catch(() => {
                toast.error("수정 도중 오류가 발생했습니다");
            });

    }, [review, reviewNo, contentsId, reviewValid, reviewClassInValid]);


    //수정하기 버튼
    const [reviewView, setReviewView] = useState(true);
    const openEdit = useCallback(() => {
        setReviewView(false);
    }, [])


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
            console.log("신고 성공");
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

     //프로필 아이콘 불러오기
      const loadProfile = useCallback(async () => {
        if (!review.reviewWriter) return; 

        try {
            const { data } = await axios.get(`/member/profile/${review.reviewWriter}`);
            setData(data);
        } catch (err) {
            console.error("프로필 로드 실패", err);
        }
    }, [review.reviewWriter]);

    useEffect(()=> {
        loadProfile();
    }, [review]);

    const { profile, point } = data || {};

     if (!data) {
        return <div className="text-white text-center mt-5">로딩중...</div>;
    }



    //render
    return (<>

        <div className="container">
            {/* (단일) 조회 페이지 */}
            {(reviewView &&
                <div className="row">
                    <div className="col d-flex justify-content-between align-items-center mt-5">
                        <span className="mainTitle mx-auto">리뷰</span>
                        {isWriter && (
                            <button className="mainTitleB" type="button" onClick={openModal1}
                                data-bs-dismiss="ModalToggle1"
                            ><BsThreeDotsVertical /></button>
                        )}
                        {!isWriter && (
                            <button className="mainTitleB" type="button" onClick={openModal3}
                                data-bs-dismiss="ModalToggle3"
                            ><BsThreeDotsVertical /></button>
                        )}
                    </div>
                    <div className="mt-5 mb-4">
                        <img src={point?.iconSrc} alt="Icon" className="review avatar-img-v2 me-2 mb-1" />
                        <span className="userId">{review.memberNickname}</span>
                        {relRowLevel && (
                            <span className="detailRel ms-3">🟢 활동 리뷰어</span>
                        )}
                        {relMiddleLevel && (
                            <span className="detailRel2 ms-3">🔵 신뢰 리뷰어</span>
                        )}
                        {relHighLevel && (
                            <span className="detailRel2 ms-3">🔷 검증된 리뷰어 </span>
                        )}


                    </div>
                    <div className="col title mb-2">
                        {contentsDetail.contentsTitle}
                        <span className="tv ms-3">방영: {formattedDate}</span>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                        {isWriter && (
                            <span className="me-3"><FaStar className="littleStar me-1" />내 평가</span>
                        )}
                        <span><FcMoneyTransfer className="me-1" />{price.toLocaleString()} 원</span>
                        <span className="littleStar ms-3">{reviewDate}</span>
                        {review.reviewEtime && (
                            <span className="ms-2" style={{ color: "#b1b1b1ff" }}>(수정됨)</span>
                        )}


                    </div>
                    <hr className="HR" />
                    {isSpoiler && (
                        <div className="detailSpo"><FaRegEye /> 스포일러</div>
                    )}
                    <div className="mt-2 reviewText">{review.reviewText}</div>
                    <div className="col iconBox">
                        <div className="ms-2">
                            <span><IoHeartCircleSharp className="me-2 iconH" />
                                <span style={{ fontSize: "20px", fontWeight: "bold" }}>{likeCount}개</span>
                            </span>
                        </div>
                        <hr className="HR" />
                        <div className="mb-1">
                            <button onClick={handleLikeToggle} style={{ color: isLiked ? "#7188faff" : "white", fontWeight: "bold" }} type="button" className="mainTitleB"><FaHeart className="me-2 icon ms-1" />좋아요</button>
                            <button onClick={copyLink} type="button" className="ms-2 mainTitleB"><FaShare className="me-2 icon" />공유하기</button>
                        </div>

                    </div>
                </div>
            )}
            {/* 수정 페이지 */}
            {(!reviewView &&
                <div className="row position-relative">
                    <div className="col text-center mt-5">
                        {/* 본인이면  mainTitleB 버튼 나와서 수정, 삭제  모달*/}
                        <span className="mainTitle2 mx-auto">리뷰</span>
                        <button type="button" className="save position-absolute end-0 top-0"
                            onClick={sendData}
                        >
                            저장하기
                        </button>
                    </div>
                    <div className="mt-5 mb-4">
                        <span className="userId">{review.memberNickname}</span>
                    </div>
                    <div className="col title mb-2">
                        {contentsDetail.contentsTitle}
                        <span className="tv ms-3">방영: {formattedDate}</span>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                        {isWriter && (
                            <span className="me-2">내 평가</span>
                        )}
                        <span><FaStar className="littleStar me-1 mb-1" />{reviewDate}</span>
                    </div>
                    <hr className="HR" />
                    <div className="mt-2 reviewText">
                        <textarea className="reviewText2" value={review.reviewText}
                            name="reviewText"
                            onChange={changeTextValue}
                        > </textarea>
                    </div>
                    <div className="col iconBox2">

                        <div className="rr">
                            <div className="d-flex align-items-center ms-2 me-5">
                                {/* 별점 텍스트 */}
                                <span className="me-2 d-flex align-items-center">
                                    <FaStar className="me-1" /> 별점
                                </span>
                                {/* 별점 별들 */}
                                <div className="d-flex align-items-center me-2"
                                    value={review.reviewRating}
                                    name="reviewRating"
                                >
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <FaStar
                                            key={num}
                                            className={num <= rating ? "fullStar3" : "emptyStar3"}
                                            onClick={() => handleStarClick(num)}
                                            style={{ cursor: "pointer" }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-1 ms-3 input-group price-wrapper2 text-center w-25">
                                    <input type="text" inputMode="numerice"
                                        className="price form-control price-bar text-light"
                                        value={price.toLocaleString()} onChange={changeNum} />
                                    <span className="input-group-text price-label text-light">원</span>
                                </div>
                            </div>
                        </div>

                        <hr className="mt-4" style={{ color: "gray" }} />
                        <div className="d-flex align-items-center ms-2 mb-1 justify-content-between">
                            <span style={{ fontSize: "20px", fontWeight: "bold" }}><FaRegEye className="spo2 me-1" />스포일러 포함</span>
                            <div className="form-switch form-check">
                                <input type="checkbox" className="me-3 form-check-input spo3"
                                    checked={review.reviewSpoiler === "Y"}
                                    onChange={changeSpoilerValue}
                                    name="reviewSpoiler"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 모달(Modal) */}
            <div className="modal fade" id="ModalToggle1" tabIndex="-1" ref={modal1}
                data-bs-keyboard="false">
                <div className="modal-dialog modal-sm">
                    <div className="one">
                        <div className="modal-content">
                            <div className="modal-body">
                                <div>
                                    <button type="button" className="modalButtonX" onClick={closeModal1}>
                                        <FaXmark />
                                    </button>
                                </div>
                                <div>
                                    <button type="button" className="ms-2 mt-2 modalButton"
                                        onClick={() => {
                                            closeModal1();
                                            openEdit();
                                        }}>리뷰 수정하기</button>
                                </div>
                                <div>
                                    <button type="button" className="ms-2 modalButton mt-4"
                                        onClick={() => {
                                            openModal2();
                                            closeModal1();
                                        }}>리뷰 삭제하기</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* 삭제 모달 */}
            <div className="modal fade" id="ModalToggle2" data-bs-backdrop="static" tabIndex="-1" ref={modal2}
                data-bs-keyboard="false">
                <div className="modal-dialog modal-sm">
                    <div className="two">
                        <div className="modal-content">
                            <div className="modal-body">
                                <div className="ask text-center mt-2">
                                    작성하신 리뷰가 삭제됩니다
                                    <span className="ms-2" style={{ fontSize: "25px" }}>😭</span>
                                </div>
                                <div className="realMessage text-center mt-2">
                                    정말 삭제하시나요?
                                </div>
                                <div className="mt-3 d-flex justify-content-between">
                                    <button type="button" onClick={() => {
                                        closeModal1();
                                        closeModal2();
                                    }} className="closeB col-5 ms-4 p-2">취소하기</button>
                                    <button type="button" className="deleteB col-5 me-4"
                                        onClick={() => {
                                            closeModal1();
                                            closeModal2();
                                            Ondelete();
                                        }}>삭제하기</button>
                                </div>
                            </div>
                        </div>
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
        </div>

    </>)
}
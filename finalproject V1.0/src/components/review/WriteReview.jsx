import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import "./review.css";
import { accessTokenState, loginIdState, loginLevelState, refreshTokenState } from "../../utils/jotai";
import { useAtom } from "jotai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaHeart } from "react-icons/fa";
import { FaShare } from "react-icons/fa6";


const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: "", contentsType: "",
    contentsOverview: "", contentsPosterPath: "", contentsBackdropPath: "",
    contentsVoteAverage: 0, contentsRuntime: 0, contentsReleaseDate: "",
    contentsDirector: "", contentsMainCast: "", genreNames: [],
};


export default function WriteReview() {
    const { contentsId, reviewNo } = useParams();

    //state
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [accessToken, setAccessToken] = useAtom(accessTokenState);
    const [refreshToken, setRefreshToken] = useAtom(refreshTokenState);


    const [review, setReview] = useState({
        reviewRating: 0,
        reviewPrice: 0,
        reviewSpoiler: "N",
        reviewText: "",
        reviewLike: 0,
        reviewRealiability: 0
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
        reviewWriter: loginId
    };

    const navigate = useNavigate();

    //effect
    useEffect(() => {
        loadContentData();
    }, []);

    useEffect(() => {
        if (isLoading === true) {
            setStatusMessage("로딩중...")
        }
    });

    // 로그인 시 내 리뷰 조회
    useEffect(() => {
        if (!loginId) return;
        const fetchMyReview = async () => {
            const { data } = await axios.get(`/review/user/${contentsId}/${loginId}`);
            setMyReview(data); // 없으면 null
            if (data) {
                setReview(data);
                setRating(data.reviewRating);
            }
        };
        fetchMyReview();
    }, [loginId, contentsId]);

    //callback
    const loadContentData = useCallback(async () => {
        setIsLoading(true);
        const { data } = await axios.get(`/api/tmdb/contents/detail/${contentsId}`);
        setContentsDetail(data);
        setIsLoading(false);
    }, []);

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);



    const sendData = useCallback(async () => {
        if (reviewClassInValid) {
            setReviewClass("is-invalid");
            return;
        }
        if (invalidRating) {
            return;
        }

        try {
            const response = await axios.post("/review/", reviewData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (response.status === 200) {
                toast.success("등록 완료");
                setIsUpdateReview(true);
                setMyReview(reviewData)
                navigate(`/contents/detail/${contentsId}`, { replace: true });
            }
        }
        catch (error) {
            console.error("오류발생 : ", error);
            toast.error("리뷰 등록 실패");
        }
    }, [review, loginId, accessToken, contentsId]);

    const reviewValid = useMemo(() => {
        const regex = /^(?=.{10,})(?!.*([ㄱ-ㅎㅏ-ㅣ])\1{5,}).*$/;
        return regex.test(review.reviewText);
    }, [review.reviewText]);

    const invalidRegex = /([ㄱ-ㅎㅏ-ㅣ])\1{4,}/;
    const reviewClassInValid = useMemo(() => {
        return invalidRegex.test(review.reviewText);
    }, [review.reviewText]);

    const invalidRating = useMemo(() =>
        review.reviewRating < 1, [review.reviewRating]);


    //별점 기능 구현
    const [rating, setRating] = useState(0);
    const [price, setPrice] = useState(0);
    const [ratingAlert, setRatingAlert] = useState(false);

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

    //가격 입력창 제어 함수
    const changeNum = useCallback((e) => {
        const regex = /[^0-9]+/g;
        const replacement = e.target.value.replace(regex, "");
        let number = replacement.length == 0 ? "" : parseInt(replacement);
        if(number > 50000) number = 50000;
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






    //render
    return (<>
        <div className="container">

            <div className="p-4 rounded review-wrapper">

                {isLoading && (
                    <span>{statusMessage}</span>
                )}

                <div className="row mt-4 p-4 shadow review-wrapper rounded">
                    {/* 이미지 영역 */}
                    <div className="col-12 col-md-4">
                        <img src={getPosterUrl(contentsDetail.contentsPosterPath)} style={{ height: "550px", objectFit: "cover", borderRadius: "4px", }}
                            alt={`${contentsDetail.contentsTitle} 포스터`} className="text-center w-100" />
                    </div>
                    {/* 텍스트 영역 */}
                    <div className="col-12 col-md-8">
                        <div>
                            <h3>{contentsDetail.contentsTitle}</h3>
                        </div>
                        <div className="text-light">
                            <span>{contentsDetail.contentsType} / {contentsDetail.contentsRuntime} 분</span>
                        </div>
                        <div className="text-light">
                            장르 : {renderGenres}
                        </div>
                        <div className="text-light">
                            방영일 : {contentsDetail.contentsReleaseDate}
                        </div>
                        <div className="text-light">
                            평점 : {contentsDetail.contentsVoteAverage.toFixed(1)} / 10
                        </div>
                        <div className="mt-3">
                            <h5>줄거리</h5>
                            <span className="text-light break-word">
                                {contentsDetail.contentsOverview}
                            </span>
                        </div>
                    </div>
                    {/* <div className="col-1 col-sm-1 text-end">
                        <button onClick={() => setIsSelect(false)} className="btn btn-danger">x</button>
                    </div> */}
                </div>

                {!loginId && (
                    <div className="text-center mt-5">
                        리뷰를 작성하려면 로그인해주세요.
                    </div>
                )}

                {/* 리뷰 영역 시작  new-review*/}
                {(loginId && !myReview && !isLoading) && (
                    <div className="row mt-5 new-review">
                        <div className="col">
                            <div className="text-center">
                                <h4 className="mt-3">이 작품 어떠셨나요?</h4>
                            </div>
                            <div className="text-center mt-4">
                                <span>별점이나 영화의 값어치를 입력해주세요</span>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-light opacity-75">가격은 최대 50000원 까지 입니다</span>
                            </div>
                            <div className="mt-3 rating-box" value={review.reviewRating}>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <FaStar
                                        key={num}
                                        className={num <= rating ? "fullStar" : "emptyStar"}
                                        onClick={() => handleStarClick(num)}
                                        style={{ cursor: "pointer" }}
                                    />
                                ))}
                                <span className="me-1 rating-number">{review.reviewRating}.0</span>
                                <div className="mt-1 ms-3 input-group price-wrapper text-center w-25">
                                    <input type="text" inputMode="numerice"
                                        className="price form-control price-bar text-light"
                                        value={price} onChange={changeNum} />
                                    <span className="input-group-text price-label text-light">원</span>
                                </div>
                            </div>

                        </div>

                        <div className="row mt-4">
                            <div className="col text-center">
                                <br />
                                <div className="form-check form-switch d-inline-block mx-auto">
                                    <input type="checkbox" className="me-2 form-check-input spo"
                                        checked={review.reviewSpoiler === "Y"}
                                        onChange={e => {
                                            setReview({
                                                ...review,
                                                reviewSpoiler: e.target.checked ? "Y" : "N"
                                            })
                                        }} />
                                    <span className="spo">스포일러 포함</span><br />
                                </div>
                            </div>
                        </div>
                        <div className="col-10 col-md-12 mt-4 justify-content-center">
                            <textarea
                                className={`form-control textAA ${reviewClass}`}
                                placeholder="작품과 관련된 감상을 10글자 이상 작성해주세요. 자유롭게 의견을 남겨보세요."
                                value={review.reviewText}
                                onChange={e =>
                                    setReview({
                                        ...review,
                                        reviewText: e.target.value
                                    })
                                }
                                onBlur={() => {
                                    setReviewClass(reviewClassInValid ? "is-invalid" : "");
                                }}
                            />
                            <div className="invalid-feedback fd">자음·모음만 반복된 입력은 사용할 수 없어요</div>
                            <div className="success text-center">
                                <button
                                    className="mt-5 mb-3 btn btn-success col-10 col-sm-10"
                                    disabled={!reviewValid || invalidRating}
                                    onClick={sendData}
                                >
                                    리뷰 작성하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>



    </>)
}
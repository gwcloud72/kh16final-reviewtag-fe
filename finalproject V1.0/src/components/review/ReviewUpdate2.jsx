import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import "./review.css";




const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";


const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: "", contentsType: "",
    contentsOverview: "", contentsPosterPath: "", contentsBackdropPath: "",
    contentsVoteAverage: 0, contentsRuntime: 0, contentsReleaseDate: "",
    contentsDirector: "", contentsMainCast: "", genreNames: [],
};


export default function WriteReview() {
    const { contentsId } = useParams();

    //state
    const [review, setReview] = useState({
        reviewRating: 0,
        reviewSpoiler: "N",
        reviewText: ""
    });
    const [reviewClass, setReviewClass] = useState("");
    //영화 정보 state
    const [contentsDetail, setContentsDetail] = useState(INITIAL_DETAIL);
    //영화 로딩 상태 state
    const [isLoading, setIsLoading] = useState(false);
    //상태 메세지 state
    const [statusMessage, setStatusMessage] = useState("");

    const reviewData = {
        ...review,
        contentsId: contentsId
    };


    //effect
    useEffect(() => {
        loadContentData();
    }, []);
    useEffect(() => {
        if (isLoading === true) {
            setStatusMessage("로딩중...")
        }
    }, [isLoading]);

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
            const response = await axios.post("/review/", reviewData);
            if (response.status === 200) {
                toast.success("등록 완료");
                setReview({
                    reviewRating: 0,
                    reviewSpoiler: "N",
                    reviewText: ""
                });
                setRating(0);
            }
        }
        catch (error) {
            console.error("오류발생 : ", error);
        }
    }, [review]);

    const reviewValid = useMemo(() => {
        const regex = /^(?=.*\S).{10,}$/
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
    const [ratingAlert, setRatingAlert] = useState(false);

    const handleStarClick = (num) => {
        setRating(num);  // 클릭한 별 번호로 rating 설정
        setReview(prev => ({
            ...prev,
            reviewRating: num
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

    return (<>
        <div className="container">

            <div className="p-4 rounded review-wrapper">

                {isLoading && (
                    <span>{statusMessage}</span>
                )}

                <div className="row mt-4 p-4 shadow bg-light rounded">
                    {/* 이미지 영역 */}
                    <div className="col-4 col-sm-3">
                        <img src={getPosterUrl(contentsDetail.contentsPosterPath)} className="w-75 h-75"
                            alt={`${contentsDetail.contentsTitle} 포스터`} />
                    </div>
                    {/* 텍스트 영역 */}
                    <div className="col-7 col-sm-8">
                        <div>
                            <h3>{contentsDetail.contentsTitle}</h3>
                        </div>
                        <div className="text-muted">
                            <span>{contentsDetail.contentsType} / {contentsDetail.contentsRuntime} 분</span>
                        </div>
                        <div className="text-muted">
                            장르 : {renderGenres}
                        </div>
                        <div className="text-muted">
                            방영일 : {contentsDetail.contentsReleaseDate}
                        </div>
                        <div className="text-muted">
                            평점 : {contentsDetail.contentsVoteAverage.toFixed(1)} / 10
                        </div>
                        <div className="mt-3">
                            <h5>줄거리</h5>
                            <span className="text-muted break-word">
                                {contentsDetail.contentsOverview}
                            </span>
                        </div>
                    </div>
                    {/* <div className="col-1 col-sm-1 text-end">
                        <button onClick={() => setIsSelect(false)} className="btn btn-danger">x</button>
                    </div> */}


                </div>

                {/* 리뷰 영역 시작 */}
                <div className="row mt-5">
                    <div className="col text-center">
                        <span className="how">이 작품 어떠셨나요?</span><br />

                        <div className="mt-3  d-flex align-items-center justify-content-center">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <FaStar
                                    key={num}
                                    className={num <= rating ? "fullStar" : "emptyStar"}
                                    onClick={() => handleStarClick(num)}
                                    style={{ cursor: "pointer" }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="row mt-2">
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





                    <div className="row mt-4 justify-content-center">
                        <div className="col-10 col-md-12">
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
                            <div className="invalid-feedback">무의미한 자음/모음의 연속입력은 불가능합니다</div>

                            <div className="success text-center">
                            <button
                                className="mt-5 btn btn-success"
                                disabled={!reviewValid || invalidRating}
                                onClick={sendData}
                            >
                                리뷰 작성하기
                            </button>
                            </div>
                        </div>
                    </div>

                </div>


                {/* 이미 작성했을 시, 수정 화면을 보여줘야함  */}
                          




            
            </div>
        </div>


    </>)
}
import { useCallback, useMemo, useState } from "react"
import axios from "axios";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import "./review.css";
import { useParams } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { FaShare } from "react-icons/fa6";


export default function ReviewWriter() {

    const { contentsId } = useParams();

    // //effect
    // useEffect(()=>{
    //     axios({
    //         url:""
    //     })
    // })

    //state
    const [review, setReview] = useState({
        reviewRating: 0,
        reviewSpoiler: "N",
        reviewText: ""
    });

    const [reviewClass, setReviewClass] = useState("");

    const sendData = useCallback(() => {
        if (reviewClassInValid) {
            setReviewClass("is-invalid");
            return;
        }

        if (invalidRating) {
            return;
        }

        const reviewData = {
            ...review,
            contentsId: contentsId
        };

        axios({
            url: "/review/",
            method: "post",
            data: reviewData
        })
            .then(response => {
                toast.success("등록 완료");
                setReview({
                    reviewRating: 0,
                    reviewSpoiler: "N",
                    reviewText: ""
                });
                setRating(0);
            })
    }, [review])

    const reviewValid = useMemo(() => {
        const regex = /^(?=.*\S).{10,}$/
        return regex.test(review.reviewText);
    }, [review.reviewText])

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


    //render
    return (<>
        <div className="container-md">
            <div className="row mt-4">
                <div className="col">
                    <span className="my_review">내가 쓴 리뷰</span>

                    <div className="row border mt-4 rounded-4">
                        <div className="col">

                            <div className="row mt-5">
                                <div className="col text-center">
                                    <span className="how">이 작품 어떠셨나요?</span><br />

                                    <div className="mt-3" value={review.reviewRating}>
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
                                                role="switch"
                                                id="reviewSpoilerCheck"
                                                checked={review.reviewSpoiler === "Y"}
                                                onChange={e => {
                                                    setReview({
                                                        ...review,
                                                        reviewSpoiler: e.target.checked ? "Y" : "N"
                                                    })
                                                }} />
                                            <label className="form-check-label spo" htmlFor="reviewSpoilerCheck">스포일러 포함</label><br />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row mt-2">
                                <div className="col">
                                    <br />
                                    <textarea className={`col-6 form-control mx-auto textAA ${reviewClass}`}
                                        placeholder="영화와 상관 없는 내용은 약관에 의해 제재를 받을 수 있습니다"
                                        value={review.reviewText}
                                        onChange={e => {
                                            setReview({
                                                ...review,
                                                reviewText: e.target.value
                                            })
                                        }}
                                        onBlur={() => {
                                            setReviewClass(
                                                reviewClassInValid ? "is-invalid" : ""
                                            );
                                        }}
                                    />
                                    <div className="invalid-feedback">무의미한 자음/모음의 연속입력은 불가능합니다</div>
                                </div>
                            </div>
                            <div className="success">
                                <button className="mt-5 btn btn-success col-4 mx-auto mb-4 d-block"
                                disabled={!reviewValid || invalidRating} onClick={sendData}>리뷰 작성하기</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col">
                    <span className="my_review">모든 리뷰</span><br />
                    <button type="button" className="cate_btn btn btn-primary me-2 mt-3">전체</button>
                    <button type="button" className="cate_btn btn btn-primary mt-3">
                        <FaShieldAlt className="me-2" />신뢰회원
                    </button>
                </div>
            </div>

            <div className="row">
                <div className="col">

                    <div className="row mt-4 border user-review">
                        <div className="col-12">
                            회원사진 닉네임
                        </div>
                        <div className="col-12 ms-5">몇일전</div>
                        <div className="col-12">내용</div>
                        <div className="col">
                            <button className="mini-button me-4"><FaHeart />
                                <span className="ms-2">좋아요 수</span>
                            </button>
                            <button className="mini-button"><FaShare />
                                <span className="ms-2">공유하기</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>



        </div>
    </>)
}
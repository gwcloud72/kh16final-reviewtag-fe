import axios from "axios";
import { useMemo, useEffect } from "react";
import { useState } from "react";
import { useCallback } from "react";
import { FaStar } from "react-icons/fa6";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function ReviewSearch() {
    //state
     const { contentsId, reviewNo } = useParams();

    // //effect
    useEffect(()=>{
        if (reviewNo) {
            axios.get(`review/${reviewNo}`)
            .then(response => {
                const updateReview = response.data;
                setReview(updateReview);
                setRating(updateReview.reviewRating);
            })
            .catch(error => {
                console.error("리뷰 조회 실패:" , error);
            })
        }
    }, [reviewNo]);

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
            reviewNo: reviewNo,
            ...review,
            contentsId: contentsId
        };

        axios({
            url: `/review/${reviewNo}`,
            method: "patch",
            data: reviewData
        })
            .then(response => {
                toast.success("수정 완료");
                // setReview({
                //     reviewRating: 0,
                //     reviewSpoiler: "N",
                //     reviewText: ""
                // });
                // setRating(0);
            })
    }, [review, reviewNo])

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
    return(<>
    리뷰 수정
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
                                                <label className="form-check-label spo" for="reviewSpoilerCheck">스포일러 포함</label><br />
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
                                <button className="mt-5 btn btn-success  col-4 mx-auto mb-4 d-block"
                                    disabled={!reviewValid || invalidRating} onClick={sendData}>저장하기</button>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
    </>)
}
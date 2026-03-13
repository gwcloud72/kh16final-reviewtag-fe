import React, { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminQuiz.css';

export default function AdminReviewCard({ reviewData, refreshList }) {
    const [openReviewId, setOpenReviewId] = useState(null);

    // 기타 내용 펼침 여부 및 데이터
    const [isEtcOpen, setIsEtcOpen] = useState(false);
    const [etcDetails, setEtcDetails] = useState([]);

    // 상태 변경 핸들러 (삭제)
    const handleStatusChange = async () => {
        try {
            await axios.delete(`/review/report/${reviewData.reviewReportId}`);
            Swal.fire('처리 완료', 'success');
            refreshList(); // 목록 새로고침
        } catch (error) {
            Swal.fire('삭제 오류', 'error');
        }
    };


    //신고내용
    {/* 스포일러, 작품 안 보고 쓴 내용 */ }
    const SpoilerAndNowatch =
        reviewData.reviewReportType === "SPOILER" ||
        reviewData.reviewReportType === "NOWATCH";

    {/* 욕설 / 비방, 편파적인 언행 */ }
    const SwearAndBiased =
        reviewData.reviewReportType === "SWEAR" ||
        reviewData.reviewReportType === "BIASED";

    {/* 홍보 / 영리 목적, 음란 / 선정성 */ }
    const AdAndExplicit =
        reviewData.reviewReportType === "AD" ||
        reviewData.reviewReportType === "EXPLICIT";

    const Other =
        !SpoilerAndNowatch &&
        !AdAndExplicit &&
        !SwearAndBiased;

  // 기타 내용 가져오기
    const OtherText = useCallback(()=>{
        const text = reviewData.reviewReportContent;
        setOpenReviewId(prev =>
             prev === reviewData.reviewId ? null : reviewData.reviewId
    )
    },[reviewData.reviewId]);


    return (
        <div className={`admin-quiz-card mb-4 shadow-sm ${reviewData.reviewStatus === 'BLIND' ? 'blind' : ''}`}>

            {/* 1. 헤더: 질문 & 누적 신고수 */}
            <div className="quiz-header">
                <h5 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '70%' }}>
                    [리뷰] {reviewData.contentsTitle}
                </h5>
                <span className="badge bg-warning fs-6">
                    🚨 누적 신고: {reviewData.reviewReportCount}건
                </span>
            </div>

            {/* 2. 메타 정보: 작성자, 날짜 */}
            <div className="quiz-meta">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                    {/* 왼쪽 그룹 */}
                    <div className="d-flex gap-2 align-items-center">
                        <span>작성자: <strong>{reviewData.memberNickname}({reviewData.reviewWriter})</strong></span>
                        <span className="text-secondary opacity-50">|</span>
                        <span>
                            신고일: {new Date(reviewData.reviewReportDate).toLocaleDateString()}
                        </span>
                    </div>

                    {/* 오른쪽: 신고자 */}
                    <div className="text-secondary">
                        신고자: <strong>{reviewData.reviewReportMemberId}</strong>
                    </div>
                </div>
            </div>

            {/* 3. 신고 사유 요약 박스 */}
            <div className="report-stats-box flex-wrap gap-2">
                <span className="fw-bold me-2">[리뷰 내용]</span>

                {SpoilerAndNowatch && (
                    <span className="report-item" style={{ color: '#ff6b6b' }}>
                        🔴 콘텐츠 문제
                    </span>
                )}

                {SwearAndBiased && (
                    <span className="report-item" style={{ color: '#fcc419' }}>
                        🟡 악성 행위
                    </span>
                )}

                {AdAndExplicit && (
                    <span className="report-item" style={{ color: "#d9b7ffff" }}>
                        🟣 정책 위반
                    </span>
                )}
                {Other && (
                    <span className="d-flex align-items-center gap-2">
                        <span className="report-item">⚪ 기타</span>

                        <button
                            className="ms-2 btn btn-sm btn-outline-primary py-0 d-flex align-items-center gap-1 text-nowrap"
                            style={{ fontSize: '0.8rem' }}
                            onClick={OtherText}
                        >
                            📝 내용 보기 :  
                        </button>
                    </span>
                )}

                
                {openReviewId === reviewData.reviewId && (
                    <div className="mt-2 p-2 rounded bg-secondary ">
                        {reviewData.reviewReportContent}
                    </div>
                )}
                 

                <div className="mt-3">{reviewData.reviewText}</div>

            </div>

            <div className="action-buttons d-flex justify-content-end flex-wrap gap-2">
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={handleStatusChange}>
                    🗑️ <span>삭제 (Delete)</span>
                </button>
            </div>

        </div>




    );
}
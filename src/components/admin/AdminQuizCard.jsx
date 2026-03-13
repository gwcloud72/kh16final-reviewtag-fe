import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminQuiz.css';

export default function AdminQuizCard({ quizData, refreshList }) {

    // 기타 내용 펼침 여부 및 데이터
    const [isEtcOpen, setIsEtcOpen] = useState(false);
    const [etcDetails, setEtcDetails] = useState([]); // QuizReportDetailVO 리스트

    // 상태 변경 핸들러 (블라인드, 삭제, 복구)
    const handleStatusChange = async (newStatus) => {
        try {
            await axios.patch(`/admin/quizzes/${quizData.quizId}/status/${newStatus}`, null, {
                quizId: quizData.quizId,
                quizStatus: newStatus
            });

            Swal.fire('처리 완료', `상태가 ${newStatus}로 변경되었습니다.`, 'success');
            refreshList(); // 목록 새로고침
        } catch (error) {
            Swal.fire('오류', '상태 변경 중 오류가 발생했습니다.', 'error');
        }
    };

    // 기타 내용 가져오기 (Lazy Loading)
    const toggleEtcDetails = async () => {
        if (!isEtcOpen && etcDetails.length === 0) {
            try {
                // API: 해당 퀴즈의 '기타' 신고 내용만 가져옴
                const res = await axios.get(`/admin/quizzes/${quizData.quizId}/reports`);
                setEtcDetails(res.data); // List<QuizReportDetailVO>
            } catch (error) {
                console.error("상세 내용 로드 실패");
            }
        }
        setIsEtcOpen(!isEtcOpen);
    };

    return (
        <div className={`admin-quiz-card mb-4 shadow-sm ${quizData.quizStatus === 'BLIND' ? 'blind' : ''}`}>

            {/* 1. 헤더: 질문 & 누적 신고수 */}
            <div className="quiz-header">
                <h5 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '70%' }}>
                    [퀴즈] {quizData.quizQuestion}
                </h5>
                <span className="badge bg-warning fs-6">
                    🚨 누적 신고: {quizData.totalReportCount}건
                </span>
            </div>

            {/* 2. 메타 정보: 작성자, 날짜 */}
            <div className="quiz-meta">
                {/* 윗줄: 작성자 및 날짜 */}
                <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span>작성자: <strong>{quizData.creatorNickname}</strong></span>
                    <span className="text-secondary opacity-50">|</span>
                    <span>최근 신고: {new Date(quizData.lastReportedAt).toLocaleDateString()}</span>
                </div>

                {/* 아랫줄: 블라인드 상태일 때만 표시 (한 칸 내림) */}
                {quizData.quizStatus === 'BLIND' && (
                    <div className="mt-2 text-danger fw-bold d-flex align-items-center">
                        <span className="me-1">🚫</span>
                        <span>현재 블라인드(숨김) 처리된 게시물입니다.</span>
                    </div>
                )}
            </div>

            {/* 3. 신고 사유 요약 박스 */}
            <div className="report-stats-box">
                <div className="fw-bold mb-2">[주요 신고 사유]</div>

                <div className="report-item" style={{ color: '#ff6b6b' }}>
                    🔴 문제 오류 ({quizData.countError}건)
                </div>
                <div className="report-item" style={{ color: '#fcc419' }}>
                    🟡 스팸/홍보 ({quizData.countSpam}건)
                </div>
                <div className="report-item text-secondary"> {/* 회색 */}
                    ⚪ 욕설/비하 ({quizData.countAbusive}건)
                </div>

                {/* 기타 사유: 건수가 있을 때만 버튼 활성화 */}
                <div className="report-item d-flex align-items-center flex-wrap gap-2">
                    <span className="me-1">⚪ 기타 ({quizData.countEtc}건)</span>

                    {quizData.countEtc > 0 && (
                        <button
                            /* 3. text-nowrap: 버튼 안의 글자는 절대 줄바꿈 금지 */
                            /* 4. d-flex & gap-1: 아이콘과 글자 정렬 */
                            className="btn btn-sm btn-outline-primary py-0 d-flex align-items-center gap-1 text-nowrap"
                            style={{ fontSize: '0.8rem' }}
                            onClick={toggleEtcDetails}
                        >
                            {isEtcOpen ? '▲ 접기' : '▶ 📝 내용 보기'}
                        </button>
                    )}
                </div>
            </div>

            {/* 4. (펼침) 기타 상세 내용 */}
            {isEtcOpen && (
                <div className="report-detail-box">
                    {etcDetails.map((detail, idx) => (
                        <div key={idx} className="detail-row">
                            <span className="fw-bold me-2">└ {detail.memberNickname}:</span>
                            <span>"{detail.quizReportContent}"</span>
                            <span className="text-muted small ms-2">
                                ({new Date(detail.quizReportDate).toLocaleDateString()})
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. 관리자 액션 버튼 */}
            <div className="action-buttons d-flex justify-content-end flex-wrap gap-2">
                {quizData.quizStatus === 'DELETED' ? (
                    // 삭제된 탭일 경우: 복구
                    <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={() => handleStatusChange('ACTIVE')}>
                        ♻️ <span>복구하기</span>
                    </button>
                ) : (
                    // 운영 탭일 경우: 숨기기/해제, 삭제
                    <>
                        {quizData.quizStatus === 'ACTIVE' ? (
                            <button className="btn btn-secondary btn-sm d-flex align-items-center gap-1" onClick={() => handleStatusChange('BLIND')}>
                                👁️ <span>숨기기 (Blind)</span>
                            </button>
                        ) : (
                            <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={() => handleStatusChange('ACTIVE')}>
                                👁️ <span>숨김 해제 (Active)</span>
                            </button>
                        )}

                        <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={() => handleStatusChange('DELETED')}>
                            🗑️ <span>삭제 (Delete)</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
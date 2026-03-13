import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminQuiz.css';
import { toast } from "react-toastify";

export default function AdminBoardCard({ boardData, refreshList, onActionComplete }) {

    // 기타 내용 펼침 여부 및 데이터
    const [isEtcOpen, setIsEtcOpen] = useState(false);
    const [etcDetails, setEtcDetails] = useState([]); // QuizReportDetailVO 리스트
    const [boardText, setBoardText] = useState([]);

    // 기타 내용 가져오기 (Lazy Loading)
    const toggleEtcDetails = async () => {
        if (!isEtcOpen && etcDetails.length === 0) {
            try {
                // API: 해당 게시글의 '기타' 신고 내용만 가져옴
                const res = await axios.get(`/admin/board/${boardData.boardNo}/reports`);
                setEtcDetails(res.data); // List<BoardReportDetailVO>
                console.log(res.data);
            } catch (error) {
                console.error("상세 내용 로드 실패");
            }
        }
        setIsEtcOpen(!isEtcOpen);
    };

    useEffect(()=>{
        loadBoardText();
    }, [boardData]);

    const loadBoardText = useCallback(async () => {
        const { data } = await axios.get(`/admin/board/${boardData.boardNo}/text`);
        setBoardText(data);
    }, [boardText]);

    const deleteReport = useCallback(async () => {
        const response = await axios.delete(`/board/report/${boardData.boardReportId}`);
        if(response) {
          toast.success("신고 처리 완료");
          refreshList();
          onActionComplete(boardData.boardReportId);  
        }
    })

    const deleteBoard = useCallback(async ()=> {
        if(!window.confirm("정말 삭제하시겠습니까?")) return;
        const response = await axios.delete(`/admin/board/${boardData.boardNo}`);
        if(response) {
            toast.success("게시글 삭제 완료");
            onActionComplete(boardData.boardNo); 
            refreshList(); 
        }
    })

    return (
        <div className={`admin-quiz-card mb-4 shadow-sm `}>

            {/* 1. 헤더: 질문 & 누적 신고수 */}
            <div className="quiz-header">
                <h5 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '70%' }}>
                    [게시판] {boardData.boardTitle}
                </h5>
                <span className="badge bg-danger fs-6">
                    🚨 누적 신고: {boardData.totalReportCount}건
                </span>
            </div>

            {/* 2. 메타 정보: 작성자, 날짜 */}
            <div className="quiz-meta">
                {/* 윗줄: 작성자 및 날짜 */}
                <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span>게시글 작성자: <strong>{boardData.writerNickname}</strong></span>
                    <span className="text-secondary opacity-50">|</span>
                    <span>최근 신고: {new Date(boardData.lastReportedAt).toLocaleDateString()}</span>
                </div>
                <div>
                    <span><hr /></span>
                </div>
                <div dangerouslySetInnerHTML={{ __html: boardText.boardText }}></div>
            </div>

            {/* 3. 신고 사유 요약 박스 */}
            <div className="report-stats-box">
                <div className="fw-bold mb-2">[주요 신고 사유]</div>

                <div className="report-item" style={{ color: '#ff6b6b' }}>
                    🔴 부적절한 컨텐츠 ({boardData.countInapposite}건)
                </div>
                <div className="report-item" style={{ color: '#fcc419' }}>
                    🟡 스팸/홍보 ({boardData.countSpam}건)
                </div>
                <div className="report-item text-secondary"> {/* 회색 */}
                    ⚪ 혐오/비방 ({boardData.countHate}건)
                </div>

                {/* 기타 사유: 건수가 있을 때만 버튼 활성화 */}
                <div className="report-item d-flex align-items-center flex-wrap gap-2">
                    <span className="me-1">⚪ 기타 ({boardData.countEtc}건)</span>

                    {boardData.countEtc > 0 && (
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
                            <span>"{detail.boardReportContent}"</span>
                            <span className="text-muted small ms-2">
                                ({new Date(detail.boardReportDate).toLocaleDateString()})
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. 관리자 액션 버튼 */}
            <div className="action-buttons d-flex justify-content-end flex-wrap gap-2">
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={deleteBoard}>
                    🗑️ <span>게시글 삭제</span>
                </button>
                <button className="btn btn-warning btn-sm d-flex align-items-center gap-1" onClick={deleteReport}>
                    🤔 <span>신고 반려</span>
                </button>
            </div>
        </div>
    );
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AdminQuizCard from './AdminQuizCard';
import './AdminQuiz.css'; // CSS 임포트
import { loginIdState, loginLevelState } from '../../utils/jotai';
import { useAtom, useAtomValue } from 'jotai';
import { throttle } from "lodash";
import AdminBoardCard from "./AdminBoardCard";

export default function AdminBoard() {
    //state
    const loginId = useAtomValue(loginIdState);

    const [currentTab, setCurrentTab] = useState('active');
    const [boardList, setBoardList] = useState([]);
    const [loading, setLoading] = useState(false);


    //무한스크롤 페이지네이션
    const [page, setPage] = useState(1);//페이지번호
    const remainDataRef = useRef(0);
    const pageSize = 2; // 서버에서 한 페이지당 보내주는 데이터 수

    // 데이터 로딩 함수
    const fetchBoardList = useCallback(async () => {
        if (!loginId) return;
        setLoading(true);
        try {
            const { data } = await axios.get(`/admin/board/reports`, {
                params: { status: currentTab, page: page }
            });

            // 서버에서 받은 데이터가 pageSize보다 작으면 더 이상 데이터가 없음
            remainDataRef.current = data.length;

            if (page === 1) {//첫페이지면
                setBoardList(data);
            }
            else {//첫페이지가 아니면
                setBoardList(prev => ([...prev, ...data]));
            }
        } catch (error) {
            console.error("목록 로딩 실패", error);
        }
        setLoading(false);

    }, [page, currentTab, loginId]);

    useEffect(() => {
        if (loginId) {
            fetchBoardList();
        }
    }, [currentTab, loginId, page]);

    //최초 1회 실행하여 window에 스크롤 이벤트를 추가
    useEffect(() => {
        const listener = throttle(e => {
            if (remainDataRef.current < pageSize) return;
            const percent = getScrollPercent();
            if (percent >= 90) {
                setPage(prev => prev + 1);
            }
        }, 500);

        window.addEventListener("scroll", listener);

        //effect cleanup 함수 - 이펙트가 종료되는 시점에 실행할 코드를 작성
        return () => {
            window.removeEventListener("scroll", listener);
        };
    }, []);

    // 스크롤바 퍼센트 구하는 함수
    const getScrollPercent = useCallback(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollHeight <= clientHeight) {
            return 0;
        }
        const scrollableHeight = scrollHeight - clientHeight;
        if (scrollableHeight - scrollTop < 1) {
            return 100;
        }
        const percentage = (scrollTop / scrollableHeight) * 100;
        return percentage;
    }, []);

    const removeBoardFromList = useCallback((targetBoardReportId) => {
        setBoardList(prevList => prevList.filter(board => board.boardReportId !== targetBoardReportId));
    }, []);

    return (
        <div className="admin-quiz-container">

            {/* 1. 헤더 영역 */}
            <div className="admin-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <h3 className="admin-title mb-0">
                    👩‍✈️ 게시판 신고 관리
                </h3>
                {/* 필요하다면 여기에 '새로고침' 버튼 등을 둘 수 있음 */}
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchBoardList}>
                    🔄 목록 갱신
                </button>
            </div>

            {/* 3. 리스트 영역 */}
            <div className="mt-4">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">데이터를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <>
                        {boardList.length === 0 ? (
                            // [수정] style 속성 제거 (CSS에서 width: 100% 줬으므로)
                            <div className="empty-state-box">
                                <div className="empty-icon">✨</div>
                                <h5>데이터가 없습니다.</h5>
                                <p>접수된 신고가 없거나 처리할 항목이 없습니다.</p>
                            </div>
                        ) : (
                            // [수정] 데이터가 있을 때만 그리드 레이아웃 적용
                            <div className="quiz-list-grid">
                                {boardList.map(board => (
                                    <AdminBoardCard
                                        key={board.boardNo}
                                        boardData={board}
                                        refreshList={fetchBoardList}
                                        onActionComplete={removeBoardFromList}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
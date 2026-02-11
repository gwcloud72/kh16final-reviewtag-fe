import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaHistory, FaInbox } from "react-icons/fa";
import "./HistoryView.css"; 

export default function HistoryView() {
    // [1] 상태 관리 변수 (history 접두사 적용)
    const [historyList, setHistoryList] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPage, setHistoryTotalPage] = useState(0);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [historyFilterType, setHistoryFilterType] = useState("all"); 

    // [2] 데이터 로드 로직
    const historyLoadData = useCallback(async () => {
        try {
            const historyResponse = await axios.get("/point/history", {
                params: {
                    page: historyPage,
                    type: historyFilterType
                }
            });
            const historyData = historyResponse.data;
            
            setHistoryList(historyData.list || []); 
            setHistoryTotalPage(historyData.totalPage || 0);
            setHistoryTotalCount(historyData.totalCount || 0); 
        } catch (historyError) {
            console.error("history 데이터 로드 중 오류:", historyError);
        }
    }, [historyPage, historyFilterType]);

    useEffect(() => {
        historyLoadData();
    }, [historyLoadData]);

    // [3] 이벤트 핸들러
    const historyHandleFilterChange = (historyType) => {
        setHistoryFilterType(historyType);
        setHistoryPage(1); 
    };

    const historyHandlePageChange = (historyNewPage) => {
        if (historyNewPage >= 1 && (historyTotalPage === 0 || historyNewPage <= historyTotalPage)) {
            setHistoryPage(historyNewPage);
        }
    };

    // [4] 유틸리티 함수
    const historyGetDescription = (historyItem) => {
        if (historyItem.pointHistoryReason) return historyItem.pointHistoryReason;

        const historyTrxType = historyItem.pointHistoryTrxType;
        const historyAmt = historyItem.pointHistoryAmount;

        switch(historyTrxType) {
            case "USE": return "아이템 구매 또는 서비스 이용";
            case "GET": return historyAmt > 0 ? "이벤트 또는 퀘스트 보상" : "포인트 변동";
            case "SEND": return "다른 회원에게 포인트 선물";
            case "RECEIVED": return "회원님에게 도착한 포인트 선물";
            default: return "시스템 포인트 조정";
        }
    };

    const historyFormatDate = (historyDateString) => {
        if (!historyDateString) return "-";
        const historyD = new Date(historyDateString);
        return `${String(historyD.getMonth() + 1).padStart(2, '0')}.${String(historyD.getDate()).padStart(2, '0')}`;
    };

    const historyFormatTime = (historyDateString) => {
        if (!historyDateString) return "-";
        const historyD = new Date(historyDateString);
        return `${String(historyD.getHours()).padStart(2, '0')}:${String(historyD.getMinutes()).padStart(2, '0')}`;
    };
    
    // [5] 페이지네이션 렌더링
    const historyRenderPagination = () => {
        if (historyTotalPage <= 1) return null;
        
        const historyPages = [];
        let historyStartPage = Math.max(1, historyPage - 2);
        let historyEndPage = Math.min(historyTotalPage, historyStartPage + 4);
        
        if (historyEndPage === historyTotalPage) {
            historyStartPage = Math.max(1, historyEndPage - 4);
        }

        for (let i = historyStartPage; i <= historyEndPage; i++) {
            historyPages.push(
                <button 
                    key={i} 
                    className={`historyPageBtn ${i === historyPage ? 'active' : ''}`} 
                    onClick={() => historyHandlePageChange(i)}
                > {i} </button>
            );
        }

        return (
            <div className="historyPagination historyMt4">
                <button className="historyPageBtn arrow" onClick={() => historyHandlePageChange(1)} disabled={historyPage === 1}>&laquo;</button>
                {historyPages}
                <button className="historyPageBtn arrow" onClick={() => historyHandlePageChange(historyTotalPage)} disabled={historyPage === historyTotalPage}>&raquo;</button>
            </div>
        );
    };

    return (
        <div className="historyGlassWrapper animate__animated animate__fadeIn">
            <div className="historyHeaderGlass">
                <div className="historyHeaderTitleBox">
                    <h4 className="historyTitleGlass"><FaHistory className="historyMe2"/>Transaction Log</h4>
                    <span className="historyTotalCntGlass">총 {historyTotalCount.toLocaleString()}건의 내역</span>
                </div>
                
                <div className="historyFilterGroup">
                    {[
                        { id: 'all', label: '전체' },
                        { id: 'earn', label: '적립' },
                        { id: 'use', label: '사용' },
                    ].map(historyBtn => (
                        <button 
                            key={historyBtn.id}
                            className={`historyFilterBtn ${historyFilterType === historyBtn.id ? 'active' : ''}`}
                            onClick={() => historyHandleFilterChange(historyBtn.id)}
                        >
                            {historyBtn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="historyListFrame">
                <div className="historyListHeaderRow">
                    <span className="historyColDate">일시</span>
                    <span className="historyColType">유형</span>
                    <span className="historyColDesc">상세 내용</span>
                    <span className="historyColAmount">변동 금액</span>
                </div>

                <div className="historyListBodyScroll">
                    {historyList.length === 0 ? (
                        <div className="historyEmptyBox">
                            <FaInbox className="historyEmptyIcon" />
                            <span>표시할 포인트 내역이 없습니다.</span>
                        </div>
                    ) : (
                        historyList.map((historyItem) => {
                            const historyIsPositive = historyItem.pointHistoryAmount > 0;
                            const historyIsZero = historyItem.pointHistoryAmount === 0;
                            const historyAmtClass = historyIsZero ? "historyAmtZero" : (historyIsPositive ? "historyAmtPlus" : "historyAmtMinus");

                            return (
                                <div className="historyRow" key={historyItem.pointHistoryId}>
                                    <div className="historyColDate">
                                        <div className="historyRowDate">{historyFormatDate(historyItem.pointHistoryCreatedAt)}</div>
                                        <div className="historyRowTime historyTextSecondary">{historyFormatTime(historyItem.pointHistoryCreatedAt)}</div>
                                    </div>

                                    <div className="historyColType">
                                        {/* 타입별 클래스도 history 접두사 적용 */}
                                        <span className={`historyTypeBadgeGlass historyType${historyItem.pointHistoryTrxType}`}>
                                            {historyItem.pointHistoryTrxType}
                                        </span>
                                    </div>

                                    <div className="historyColDesc" title={historyGetDescription(historyItem)}>
                                        {historyGetDescription(historyItem)}
                                    </div>

                                    <div className={`historyColAmount ${historyAmtClass}`}>
                                        <span className="historyAmtText">
                                            {historyIsPositive ? '+' : ''}{historyItem.pointHistoryAmount.toLocaleString()}
                                        </span>
                                        <span className="historyAmtUnit">P</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {historyRenderPagination()}
        </div>
    );
}
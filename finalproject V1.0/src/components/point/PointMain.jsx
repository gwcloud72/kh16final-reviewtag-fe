import { useEffect, useState, useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { loginIdState, loginLevelState } from "../../utils/jotai";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PointMain.css";

// 하위 컴포넌트 임포트
import AttendanceCalendar from "./AttendanceCalendar";
import StoreView from "./StoreView";
import InventoryView from "./InventoryView";
import HistoryView from "./HistoryView";
import WishlistView from "./WishlistView";
import Donate from "./Donate";
import Roulette from "./Roulette";
import MyIconView from "./MyIconView";
import DailyQuest from "./DailyQuest";
import PointRankingPage from "./PointRanking";
import StoreProfile from "./StoreProfile";
import IconListView from "./IconListView";

export default function PointMain() {
    const pointLoginId = useAtomValue(loginIdState); 
    const pointLoginLevel = useAtomValue(loginLevelState);

    const [pointTab, setPointTab] = useState("store");
    const [pointIsChecked, setPointIsChecked] = useState(false);
    const [pointShowStamp, setPointShowStamp] = useState(false);
    const [pointCalendarRefreshKey, setPointCalendarRefreshKey] = useState(0);
    const [pointShowDonate, setPointShowDonate] = useState(false);
    const [pointRefreshTrigger, setPointRefreshTrigger] = useState(0);

    // 탭 구성 로직
    const pointNavItems = useMemo(() => {
        const pointPublicTabs = [
            { id: 'store', label: '🍿 굿즈 스토어' },
            { id: 'roulette', label: '🎰 룰렛 게임' },
            { id: 'ranking', label: '🏆 랭킹' }
        ];

        if (pointLoginId) {
            return [
                ...pointPublicTabs,
                { id: 'my_icon', label: '🦸 마이 아이콘' },
                { id: 'wish', label: '💖 위시리스트' },
                { id: 'inventory', label: '🎒 인벤토리' },
                { id: 'history', label: '📜 기록' }
            ];
        }
        return pointPublicTabs;
    }, [pointLoginId]);

    const pointRefreshAll = useCallback(() => {
        setPointRefreshTrigger(prev => prev + 1);
    }, []);

    // 출석 상태 확인
    const pointCheckAttendanceStatus = useCallback(async () => {
        if (!pointLoginId) return;
        try {
            const pointResp = await axios.get("/point/main/attendance/status");
            setPointIsChecked(pointResp.data);
        } catch (pointError) {
            console.error("출석 확인 실패:", pointError);
        }
    }, [pointLoginId]);

    useEffect(() => {
        pointCheckAttendanceStatus();
    }, [pointCheckAttendanceStatus, pointRefreshTrigger]);

    const pointHandleAttendance = async () => {
        if (!pointLoginId) return toast.error("로그인이 필요합니다.");
        try {
            const pointResp = await axios.post("/point/main/attendance/check");
            if (pointResp.data && String(pointResp.data).startsWith("success")) {
                const pointAmount = pointResp.data.split(":")[1]?.trim() || "100";
                setPointShowStamp(true);
                setPointIsChecked(true);
                setPointCalendarRefreshKey(prev => prev + 1);
                pointRefreshAll();
                setTimeout(() => toast.success(`🎉 출석 완료! +${pointAmount}P`), 500);
                setTimeout(() => setPointShowStamp(false), 3000);
            }
        } catch (pointError) {
            toast.error("출석 처리 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="point-movie-container">
            <ToastContainer position="top-center" autoClose={2000} theme="dark" />

            <div className="point-inner-wrapper">
                <div className="point-dashboard-row">
                    <div className="point-dashboard-left">
                        <StoreProfile refreshTrigger={pointRefreshTrigger} />
                        <div className="point-mt-4">
                            <DailyQuest setTab={setPointTab} refreshPoint={pointRefreshAll} />
                        </div>
                        {pointLoginId && (
                            <div className="point-text-end point-mt-2">
                                <button className="point-btn-gift-neon-small" onClick={() => setPointShowDonate(true)}>
                                    🎁 포인트 선물하기
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="point-dashboard-right">
                        <div className="point-attendance-unified-panel">
                            <div className="point-unified-header">
                                <div className="point-header-left">
                                    <h2 className="point-header-title">📅 DAILY CHECK-IN</h2>
                                    <span className="point-header-subtitle">매일 접속하고 도장을 찍어보세요!</span>
                                </div>
                                
                                <div className="point-header-right">
                                    {pointIsChecked ? (
                                        <div className="point-attendance-complete-badge">
                                            <span className="point-badge-icon">✔</span>
                                            <div className="point-badge-text">
                                                <div className="point-main-text">오늘 출석 완료</div>
                                                <div className="point-sub-text">내일 다시 만나요</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            className="point-attendance-btn-neon" 
                                            onClick={pointHandleAttendance}
                                            disabled={!pointLoginId}
                                        >
                                            {pointLoginId ? "🎫 지금 출석하기" : "로그인 필요"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <AttendanceCalendar refreshTrigger={pointCalendarRefreshKey} />
                            
                            {pointShowStamp && <div className="point-small-stamp point-stamp-animation">참잘<br/>했어요</div>}
                        </div>
                    </div>
                </div>

                <ul className="point-nav-cinema">
                    {pointNavItems.map(pointNav => (
                        <li className="point-nav-cinema-item" key={pointNav.id}>
                            <button
                                className={`point-nav-cinema-link ${pointTab === pointNav.id ? 'point-active' : ''}`}
                                onClick={() => setPointTab(pointNav.id)}
                            >
                                {pointNav.label}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="point-cinema-content">
                    {pointTab === "store" && <StoreView loginLevel={pointLoginLevel} refreshPoint={pointRefreshAll} />}
                    {pointTab === "roulette" && <Roulette refreshPoint={pointRefreshAll} setTab={setPointTab}/>}
                    {pointTab === "ranking" && <PointRankingPage />}
                    {pointLoginId && (
                        <>
                            {pointTab === "my_icon" && <><MyIconView refreshPoint={pointRefreshAll} /><IconListView refreshPoint={pointRefreshAll}/></>}
                            {pointTab === "wish" && <WishlistView refreshPoint={pointRefreshAll} />}
                            {pointTab === "inventory" && <InventoryView refreshPoint={pointRefreshAll} />}
                            {pointTab === "history" && <HistoryView />}
                        </>
                    )}
                </div>

                {pointShowDonate && (
                    <Donate closeModal={() => setPointShowDonate(false)} onSuccess={pointRefreshAll} />
                )}
            </div>
        </div>
    );
}
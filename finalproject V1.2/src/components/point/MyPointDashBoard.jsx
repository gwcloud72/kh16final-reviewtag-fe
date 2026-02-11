import { useState } from "react";
import InventoryView from "./InventoryView";
import HistoryView from "./HistoryView";
import "./DashBoardView.css";

export default function DashBoardView({ refreshPoint: dashRefreshPoint }) {
    // [1] 서브 탭 상태 관리 (dash 접두사 적용)
    const [dashSubTab, setDashSubTab] = useState("inventory");

    return (
        <div className="dashContainer">
            {/* [2] 서브 탭 메뉴 섹션 */}
            <ul className="dashNavTabs">
                <li className="dashNavItem">
                    <button 
                        className={`dashNavLink ${dashSubTab === 'inventory' ? 'active' : ''}`} 
                        onClick={() => setDashSubTab('inventory')}
                    >
                        📦 아이템 보관함
                    </button>
                </li>
                <li className="dashNavItem">
                    <button 
                        className={`dashNavLink ${dashSubTab === 'history' ? 'active' : ''}`} 
                        onClick={() => setDashSubTab('history')}
                    >
                        📜 포인트 내역
                    </button>
                </li>
            </ul>

            {/* [3] 내용 표시 본문 (유리 질감 스타일 적용) */}
            <div className="dashContentFrame">
                
                {/* 인벤토리 탭 */}
                {dashSubTab === "inventory" && (
                    <div className="dashFadeIn">
                        <div className="dashAlertInfo">
                            <small>💡 구매한 아이템을 사용하거나 환불할 수 있습니다.</small>
                        </div>
                        {/* 상단 포인트 갱신 함수를 dash 접두사로 전달 */}
                        <InventoryView onRefund={dashRefreshPoint} />
                    </div>
                )}

                {/* 히스토리 탭 */}
                {dashSubTab === "history" && (
                    <div className="dashFadeIn">
                        <HistoryView />
                    </div>
                )}
                
            </div>
        </div>
    );
}
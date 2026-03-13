import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAtomValue } from "jotai";
import { loginIdState } from "../../utils/jotai";
import Swal from 'sweetalert2';
import './Roulette.css'; 

// 아이템 설정 (roulette 접두사 적용)
const rouletteItems = [
    { name: "1000 P", value: 1000, icon: "💰", color: "#f1c40f" },
    { name: "다음 기회에", value: 0, icon: "😢", color: "#34495e" },
    { name: "꽝", value: 0, icon: "❌", color: "#3498db" },
    { name: "꽝", value: 0, icon: "❌", color: "#2c3e50" },
    { name: "2000 P", value: 2000, icon: "💎", color: "#a366ff" },
    { name: "다음 기회에", value: 0, icon: "😢", color: "#34495e" },
];

export default function Roulette({ refreshPoint: rouletteRefreshPoint, setTab: rouletteSetTab }) {
    const rouletteLoginId = useAtomValue(loginIdState);
    const [rouletteIsSpinning, setRouletteIsSpinning] = useState(false);
    const [rouletteRotation, setRouletteRotation] = useState(0);
    const [rouletteTicketCount, setRouletteTicketCount] = useState(0);

    const rouletteTicketItemType = "RANDOM_ROULETTE";

    const rouletteLoadTicketCount = useCallback(async () => {
        if (!rouletteLoginId) return;
        try {
            const rouletteResp = await axios.get("/point/main/store/inventory/my");
            const rouletteTickets = rouletteResp.data.filter(item => item.pointItemType === rouletteTicketItemType);
            const rouletteTotal = rouletteTickets.reduce((acc, curr) => acc + curr.inventoryQuantity, 0);
            setRouletteTicketCount(rouletteTotal);
        } catch (rouletteError) {
            console.error("티켓 조회 실패", rouletteError);
        }
    }, [rouletteLoginId]);

    useEffect(() => {
        rouletteLoadTicketCount();
    }, [rouletteLoadTicketCount]);

    const rouletteHandleSpin = async () => {
        if (rouletteIsSpinning) return;
        if (rouletteTicketCount <= 0) {
            toast.warning("🎟️ 룰렛 이용권이 없습니다. 상점에서 구매해주세요!");
            return;
        }

        const rouletteConfirmResult = await Swal.fire({
            title: 'LUCKY SPIN!',
            text: `이용권 1장을 사용하여 룰렛을 돌리시겠습니까?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f1c40f',
            cancelButtonColor: '#444',
            confirmButtonText: '돌리기',
            cancelButtonText: '취소',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (!rouletteConfirmResult.isConfirmed) return;

        setRouletteIsSpinning(true);

        try {
            const rouletteResp = await axios.post("/point/main/store/roulette");
            const rouletteResultIndex = rouletteResp.data; 

            const rouletteSegmentAngle = 360 / rouletteItems.length; // 60도
            const rouletteAdditionalSpins = 360 * 10; 
            
            const rouletteTargetRotation = rouletteRotation + rouletteAdditionalSpins - (rouletteResultIndex * rouletteSegmentAngle) - (rouletteRotation % 360);
           setRouletteRotation(rouletteTargetRotation);
            setTimeout(async () => {
                const rouletteWinItem = rouletteItems[rouletteResultIndex];
                
                if (rouletteWinItem.value > 0) {
                    await Swal.fire({
                        title: `🎊 당첨을 축하합니다!`,
                        html: `<div style="font-size: 1.2rem; margin-bottom: 10px;">결과: <b>${rouletteWinItem.name}</b></div>
                               <div style="color: #f1c40f;">${rouletteWinItem.value} 포인트가 지급되었습니다!</div>`,
                        icon: 'success',
                        background: '#1a1a1a',
                        color: '#fff',
                        confirmButtonColor: '#f1c40f'
                    });
                } else {
                    await Swal.fire({
                        title: `아쉬워요!`,
                        text: `결과: ${rouletteWinItem.name}`,
                        icon: 'info',
                        background: '#1a1a1a',
                        color: '#fff',
                        confirmButtonColor: '#3498db'
                    });
                }
                
                setRouletteIsSpinning(false);
                rouletteLoadTicketCount();
                if (rouletteRefreshPoint) rouletteRefreshPoint();
            }, 4000);

        } catch (rouletteError) {
            console.error(rouletteError);
            toast.error("룰렛 서버 통신 중 오류가 발생했습니다.");
            setRouletteIsSpinning(false);
        }
    };

    return (
        <div className="roulette-roulette-wrapper">
            <div className="roulette-roulette-glass-card">
                <h2 className="roulette-roulette-title">🎰 LUCKY SPIN</h2>
                
                <div className="roulette-ticket-status-box">
                    <div className="roulette-ticket-badge">
                        🎟️ 보유 이용권: <b>{rouletteTicketCount}</b>장
                    </div>
                </div>

                <div className="roulette-wheel-outer">
                    <div className="roulette-wheel-indicator">▼</div>
                    <div 
                        className="roulette-wheel-main"
                        style={{ 
                            transform: `rotate(${rouletteRotation}deg)`,
                            transition: rouletteIsSpinning ? 'transform 4s cubic-bezier(0.15, 0, 0, 1)' : 'none'
                        }}
                    >
                        {rouletteItems.map((rouletteItem, rouletteIndex) => (
                            <div 
                                key={rouletteIndex} 
                                className="roulette-wheel-sec" 
                                style={{ 
                                    transform: `rotate(${rouletteIndex * 60}deg)`,
                                    backgroundColor: rouletteItem.color
                                }}
                            >
                                <div className="roulette-sec-content">
                                    <span className="roulette-sec-icon">{rouletteItem.icon}</span>
                                    <span className="roulette-sec-text">{rouletteItem.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="roulette-wheel-center-pin">GO</div>
                </div>

                <div className="roulette-spin-action-area">
                    <button 
                        className={`roulette-btn-spin-glass ${rouletteTicketCount === 0 ? 'roulette-no-ticket' : ''}`}
                        onClick={rouletteHandleSpin}
                        disabled={rouletteIsSpinning || rouletteTicketCount === 0}
                    >
                        {rouletteIsSpinning ? "행운을 비는 중..." : rouletteTicketCount > 0 ? "지금 돌리기" : "이용권 부족"}
                    </button>
                    
                    {rouletteTicketCount === 0 && !rouletteIsSpinning && (
                        <div className="roulette-shop-link-hint" onClick={() => rouletteSetTab('store')}>
                            🍿 상점에서 룰렛 이용권 구매하기 ➔
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
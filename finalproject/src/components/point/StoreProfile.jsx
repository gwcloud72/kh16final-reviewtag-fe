import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAtomValue } from "jotai";
import { loginIdState, pointRefreshAtom } from "../../utils/jotai"; 
import "./StoreProfile.css"; 

export default function StoreProfile({ refreshTrigger: prcardRefreshTrigger }) {
    const prcardLoginId = useAtomValue(loginIdState);
    const prcardPointRefresh = useAtomValue(pointRefreshAtom);
    
    const [prcardUserInfo, setPrcardUserInfo] = useState({
        nickname: "",
        point: 0,
        level: "",
        iconSrc: null,
        nickStyle: "",
        frameSrc: "", 
        bgSrc: ""     
    });

    const [prcardLoading, setPrcardLoading] = useState(true);

    useEffect(() => {
        if (!prcardLoginId) return;
        
        setPrcardLoading(true);
        axios.get("/api/point/main/store/my-info")
            .then(res => {
                if (res.data) setPrcardUserInfo(res.data);
            })
            .catch(err => console.error("프로필 데이터 로드 실패:", err))
            .finally(() => setPrcardLoading(false));
            
    }, [prcardLoginId, prcardRefreshTrigger, prcardPointRefresh]);

    if (!prcardLoginId) return null;

    const prcardIsReady = prcardUserInfo.nickname || !prcardLoading;

    // 이미지 경로가 있을 경우 배율과 위치를 최적화하여 적용
    const bgStyle = {
        backgroundImage: prcardUserInfo.bgSrc ? `url(${prcardUserInfo.bgSrc})` : 'none',
        backgroundSize: 'cover',      /* 비율 유지하며 꽉 채우기 */
        backgroundPosition: 'center', /* 중앙 정렬 */
        backgroundRepeat: 'no-repeat'
    };

    return (
        <div className="prcard-store-profile-wrapper">
            <div 
                className={`prcard-membership-card ${prcardUserInfo.frameSrc ? `prcard-${prcardUserInfo.frameSrc}` : ""} ${!prcardIsReady ? 'prcard-loading' : ''}`}
                style={bgStyle}
            >
                {!prcardIsReady ? (
                    <div className="prcard-loading-box">
                        <span className="prcard-loading-text">Member Information Loading...</span>
                    </div>
                ) : (
                    <>
                        <div className="prcard-card-user-info">
                            <div className="prcard-card-avatar-box">
                                {prcardUserInfo.iconSrc ? (
                                    <img src={prcardUserInfo.iconSrc} alt="avatar" className="prcard-card-avatar-img" />
                                ) : (
                                    <div className="prcard-default-avatar">👤</div>
                                )}
                            </div>
                            
                            <div className="prcard-card-text-group">
                                <div className={`prcard-card-nickname ${prcardUserInfo.nickStyle ? `prcard-${prcardUserInfo.nickStyle}` : ""}`}>
                                    {prcardUserInfo.nickname || prcardLoginId}
                                </div>
                                <div className="prcard-card-grade">
                                    <span className={`prcard-badge-level ${prcardUserInfo.level === '관리자' ? 'prcard-admin' : ''}`}>
                                        👑 {prcardUserInfo.level || "MEMBER"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="prcard-card-point-wallet">
                            <span className="prcard-wallet-label">CURRENT BALANCE</span>
                            <div className="prcard-wallet-amount">
                                {prcardUserInfo.point?.toLocaleString() || 0}
                                <span className="prcard-currency-unit">P</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
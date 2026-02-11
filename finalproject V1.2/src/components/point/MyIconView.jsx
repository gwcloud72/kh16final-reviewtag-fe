import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAtomValue } from "jotai";
import { loginIdState } from "../../utils/jotai";
import { toast } from "react-toastify";
import Swal from "sweetalert2"; // SweetAlert2 임포트
import "./MyIconView.css"; // 전용 스타일시트

export default function MyIconView({ refreshPoint }) {
    const loginId = useAtomValue(loginIdState);
    const [myIcons, setMyIcons] = useState([]);

    const loadMyIcons = useCallback(async () => {
        if (!loginId) return;
        try {
            const resp = await axios.get("/point/icon/my");
            setMyIcons(resp.data);
        } catch (e) { console.error(e); }
    }, [loginId]);

    useEffect(() => { loadMyIcons(); }, [loadMyIcons]);

    // [함수] 아이콘 장착 처리
    const handleEquip = async (icon) => {
        if (icon.isEquipped === 'Y') {
            toast.info("이미 장착 중인 아이콘입니다. ⭐");
            return;
        }

     
        const result = await Swal.fire({
            title: '아이콘 장착',
            text: `[${icon.iconName}] 아이콘을 프로필에 적용하시겠습니까?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#aaa',
            confirmButtonText: '네, 장착합니다',
            cancelButtonText: '취소',
            background: '#1a1a1a', // 다크 테마 배경
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await axios.post("/point/icon/equip", { iconId: icon.iconId }); 
                
                await Swal.fire({
                    icon: 'success',
                    title: '장착 완료!',
                    text: '선택하신 아이콘이 프로필에 반영되었습니다.',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#1a1a1a',
                    color: '#fff'
                });

                loadMyIcons(); 
                if(refreshPoint) refreshPoint(); 
            } catch(e) { 
                toast.error("장착 중 오류가 발생했습니다."); 
            }
        }
    };

    // [함수] 아이콘 해제 처리
    const handleUnequip = async () => {
        const result = await Swal.fire({
            title: '장착 해제',
            text: "현재 장착된 아이콘을 해제하고 기본 상태로 돌아가시겠습니까?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '네, 해제합니다',
            cancelButtonText: '취소',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await axios.post("/point/icon/unequip");
                toast.info("기본 아이콘으로 변경되었습니다.");
                loadMyIcons(); 
                if(refreshPoint) refreshPoint(); 
            } catch(e) { toast.error("해제 실패"); }
        }
    };

    return (
        <div className="my-icon-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="store-title mb-0">🦸 MY EMOTICON VAULT</h4>
                <button className="btn-unequip-glass" onClick={handleUnequip}>
                    기본 아이콘으로 초기화
                </button>
            </div>

            {myIcons.length === 0 ? (
                <div className="empty-storage-glass">
                    <div className="empty-icon">📁</div>
                    <p>보유한 아이콘이 없습니다.<br/>상점에서 특별한 아이콘을 획득해보세요! 🎲</p>
                </div>
            ) : (
                <div className="row g-4">
                    {myIcons.map((item) => {
                        const isEquipped = item.isEquipped === 'Y';
                        const rarityClass = `rarity-${item.iconRarity.toLowerCase()}`;

                        return (
                            <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={item.memberIconId}>
                                <div 
                                    className={`icon-glass-card ${isEquipped ? 'equipped' : ''} ${rarityClass}`}
                                    onClick={() => handleEquip(item)}
                                >
                                    {isEquipped && (
                                        <div className="equip-tag">장착중</div>
                                    )}

                                    <div className="icon-img-wrapper">
                                        <img 
                                            src={item.iconSrc} 
                                            alt={item.iconName}
                                            onError={(e)=>{e.target.src='https://placehold.co/80x80?text=NONE'}} 
                                        />
                                    </div>
                                    
                                    <div className="icon-info-area">
                                        <span className={`rarity-badge ${rarityClass}`}>
                                            {item.iconRarity}
                                        </span>
                                        <div className="icon-name-text" title={item.iconName}>
                                            {item.iconName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
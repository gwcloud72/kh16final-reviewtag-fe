import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSetAtom } from "jotai";
import { pointRefreshAtom } from "../../utils/jotai"; 
import Swal from "sweetalert2"; 
import "./StoreView.css";

function storeGetScore(storeLevel) {
    if (storeLevel === "관리자") return 99;
    if (storeLevel === "우수회원") return 2;
    if (storeLevel === "일반회원") return 1;
    return 0; 
}

export default function StoreView({ loginLevel: storeLoginLevel, refreshPoint: storeRefreshPoint }) {
    const [storeItems, setStoreItems] = useState([]);      
    const [storeMyItems, setStoreMyItems] = useState([]);   
    const [storeWishList, setStoreWishList] = useState([]); 
    const [activeType, setActiveType] = useState("ALL");
    const [keyword, setKeyword] = useState(""); // 검색어 상태 추가
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const [totalCount, setTotalCount] = useState(0); // 전체 개수
    const pageSize = 10; // 페이지당 아이템 수

    const storeSetPointRefresh = useSetAtom(pointRefreshAtom);

    const storeTabs = [
        { label: "전체", value: "ALL" }, { label: "배경", value: "DECO_BG" },
        { label: "테두리", value: "DECO_FRAME" }, { label: "닉네임", value: "DECO_NICK" },
        { label: "변경권", value: "CHANGE_NICK" }, { label: "랜덤박스", value: "RANDOM_POINT" },
        { label: "아이콘뽑기", value: "RANDOM_ICON" }, { label: "룰렛", value: "RANDOM_ROULETTE" },
        { label: "충전", value: "VOUCHER" }, { label: "하트", value: "HEART_RECHARGE" }
    ];

    const storeLoadData = useCallback(async () => {
        try {
            const [storeResp, storeMyResp, storeWishResp] = await Promise.all([
                axios.get("/point/main/store", { 
                    params: { type: activeType, keyword, page: currentPage, size: pageSize } 
                }),
                storeLoginLevel ? axios.get("/api/point/main/store/inventory/my") : Promise.resolve({ data: [] }),
                storeLoginLevel ? axios.get("/api/point/main/store/wish/check") : Promise.resolve({ data: [] })
            ]);
            setStoreItems(storeResp.data.list); // 백엔드 반환 구조에 맞춤
            setTotalCount(storeResp.data.totalCount);
            setStoreMyItems(storeMyResp.data);
            setStoreWishList(storeWishResp.data);
        } catch (err) { 
            console.error("데이터 로딩 실패", err); 
        }
    }, [storeLoginLevel, activeType, keyword, currentPage]);

    useEffect(() => { 
        storeLoadData(); 
    }, [storeLoadData]);

    // 타입이나 검색어가 바뀌면 1페이지로 리셋
    const handleTypeChange = (type) => {
        setActiveType(type);
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        setKeyword(e.target.value);
        setCurrentPage(1);
    };

    const storeHandleBuy = async (storeItem) => {
        const storeRes = await Swal.fire({ 
            title: '구매 확인', text: `[${storeItem.pointItemName}] 구매하시겠습니까?`, 
            icon: 'question', showCancelButton: true, confirmButtonColor: '#e50914', 
            cancelButtonColor: '#333', background: '#1a1a1a', color: '#fff' 
        });
        if (!storeRes.isConfirmed) return;
        try {
            await axios.post("/point/main/store/buy", { buyItemNo: storeItem.pointItemNo });
            Swal.fire({ title: '완료!', icon: 'success', background: '#1a1a1a', color: '#fff', timer: 1000, showConfirmButton: false });
            storeSetPointRefresh(v => v + 1);
            if (storeRefreshPoint) storeRefreshPoint();
            storeLoadData();
        } catch (err) { 
            Swal.fire({ icon: 'error', title: '실패', text: err.response?.data || "포인트 부족", background: '#1a1a1a', color: '#fff' }); 
        }
    };

    const storeHandleGift = async (storeItem) => {
        const { value: targetId } = await Swal.fire({ 
            title: '선물하기', input: 'text', inputLabel: '상대방 ID', 
            showCancelButton: true, confirmButtonColor: '#e50914', background: '#1a1a1a', color: '#fff' 
        });
        if (!targetId) return;
        try {
            await axios.post("/point/main/store/gift", { itemNo: storeItem.pointItemNo, targetId });
            Swal.fire({ title: '선물 완료!', icon: 'success', background: '#1a1a1a', color: '#fff', timer: 1000 });
            storeSetPointRefresh(v => v + 1);
            storeLoadData();
        } catch (err) { 
            Swal.fire({ icon: 'error', title: '실패', text: "대상을 찾을 수 없습니다.", background: '#1a1a1a', color: '#fff' });
        }
    };

    const storeHandleToggleWish = async (storeItemNo) => {
        if (!storeLoginLevel) return Swal.fire({ icon: 'warning', title: '로그인 필요', background: '#1a1a1a', color: '#fff' });
        try {
            await axios.post("/point/main/store/wish/toggle", { itemNo: storeItemNo });
            storeLoadData();
        } catch (err) { console.error(err); }
    };

    // 페이지네이션 숫자 생성
    const totalPages = Math.ceil(totalCount / pageSize);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

    return (
        <div className="storeContainer">
            <div className="storeHeaderSection">
                <div className="storeFilterTabs">
                    {storeTabs.map(tab => (
                        <button 
                            key={tab.value}
                            className={`storeTabBtn ${activeType === tab.value ? "active" : ""}`}
                            onClick={() => handleTypeChange(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="storeSearchWrapper">
                    <input 
                        type="text" 
                        placeholder="아이템명을 검색하세요" 
                        className="storeSearchInput"
                        value={keyword}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <h4 className="storeMainTitle">popcorn 스토어 <span>({totalCount})</span></h4>

            <div className="storeGoodsGrid">
                {storeItems.map((item) => {
                    const storeMyScore = storeGetScore(storeLoginLevel);
                    const storeReqScore = storeGetScore(item.pointItemReqLevel);
                    const storeCanAccess = (storeMyScore >= storeReqScore);
                    const storeIsSoldOut = item.pointItemStock <= 0;
                    const storeIsOwned = storeMyItems.some(i => Number(i.inventoryItemNo) === Number(item.pointItemNo));
                    const storeIsLimitedOwned = storeIsOwned && item.pointItemIsLimitedPurchase === 1;

                    return (
                        <div className={`storeItemCard ${storeIsSoldOut ? "soldout" : ""}`} key={item.pointItemNo}>
                            <div className="storeItemImgBox">
                                <img src={item.pointItemSrc || "/default.png"} alt="item" />
                                <button className="wishOverlayBtn" onClick={() => storeHandleToggleWish(item.pointItemNo)}>
                                    {storeWishList.includes(item.pointItemNo) ? "❤️" : "🤍"}
                                </button>
                                <div className="badgeOverlay">
                                    {storeIsOwned && <span className="ownBadge">보유중</span>}
                                    {storeIsSoldOut && <div className="soldoutLabel">품절</div>}
                                </div>
                            </div>
                            <div className="storeItemInfo">
                                <h5 className="itemName">{item.pointItemName}</h5>
                                <div className="itemMeta">
                                    <span className="lvBadge">{item.pointItemReqLevel || "일반회원"}</span>
                                    {item.pointItemDailyLimit > 0 && <span className="limitBadge">일일 {item.pointItemDailyLimit}개</span>}
                                </div>
                                <div className="itemPrice">{item.pointItemPrice.toLocaleString()} P</div>
                                <div className="itemActionBtns">
                                    {storeCanAccess ? (
                                        <>
                                            <button 
                                                className={`buyBtn ${storeIsLimitedOwned ? "disabled" : ""}`}
                                                onClick={() => storeHandleBuy(item)}
                                                disabled={storeIsSoldOut || storeIsLimitedOwned}
                                            >
                                                {storeIsLimitedOwned ? "보유함" : "구매"}
                                            </button>
                                            <button className="giftBtn" onClick={() => storeHandleGift(item)} disabled={storeIsSoldOut}>선물</button>
                                        </>
                                    ) : (
                                        <button className="lockBtn" disabled>🔒 등급 부족</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 페이지네이션 버튼 */}
            {totalPages > 0 && (
                <div className="storePagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(v => v - 1)}>이전</button>
                    {pageNumbers.map(num => (
                        <button 
                            key={num} 
                            className={currentPage === num ? "active" : ""}
                            onClick={() => setCurrentPage(num)}
                        >
                            {num}
                        </button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(v => v + 1)}>다음</button>
                </div>
            )}
        </div>
    );
}
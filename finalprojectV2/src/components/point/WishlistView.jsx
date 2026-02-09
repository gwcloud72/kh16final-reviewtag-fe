import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAtomValue } from "jotai"; 
import { loginIdState } from "../../utils/jotai"; 
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./WishlistView.css";
// 상세 모달 컴포넌트
import PointItemDetailView from "./PointitemDetailView"; 

export default function WishlistView({ wishlistRefreshPoint }) { 
    const wishlistLoginId = useAtomValue(loginIdState); 
    const [wishlistItems, setWishlistItems] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(true);
    
    // 모달 제어를 위한 상태 (선택된 상품 번호)
    const [wishlistSelectedItemNo, setWishlistSelectedItemNo] = useState(null);

    // 목록 불러오기 함수
    const wishlistLoadItems = useCallback(async () => {
        if (!wishlistLoginId) {
            setWishlistItems([]);
            setWishlistLoading(false);
            return;
        }
        setWishlistLoading(true);
        try {
            const wishlistResponse = await axios.get("/point/main/store/wish/my");
            setWishlistItems(wishlistResponse.data); 
        } catch (wishlistError) {
            console.error("로드 실패:", wishlistError);
            toast.error("찜 목록을 불러오지 못했습니다. 😥");
            setWishlistItems([]);
        } finally {
            setWishlistLoading(false);
        }
    }, [wishlistLoginId]);

    useEffect(() => {
        wishlistLoadItems();
    }, [wishlistLoadItems]);

    // 삭제 핸들러
    const wishlistHandleRemove = async (wishlistEvent, wishlistTargetNo, wishlistName) => {
        wishlistEvent.stopPropagation(); // 카드 클릭 이벤트 차단
        
        const wishlistResult = await Swal.fire({
            title: '위시리스트 삭제',
            text: `[${wishlistName}] 상품을 찜 목록에서 제거하시겠습니까?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: '삭제',
            background: '#1a1a1a',
            color: '#fff'
        });
        
        if (wishlistResult.isConfirmed) {
            try {
                await axios.post("/point/main/store/wish/toggle", { itemNo: wishlistTargetNo });
                toast.info("찜 목록에서 삭제되었습니다. 🗑️");
                wishlistLoadItems();
                if(wishlistRefreshPoint) wishlistRefreshPoint(); // 포인트 정보 갱신 필요 시 호출
            } catch (wishlistRemoveError) {
                toast.error("삭제에 실패했습니다.");
            }
        }
    };

    if (wishlistLoading) return (
        <div className="text-center p-5">
            <div className="spinner-border text-primary"></div>
            <p className="text-white mt-2">목록을 불러오는 중...</p>
        </div>
    );
    
    if (!wishlistLoginId) return <div className="wishlist-alert-glass text-center mt-4 m-3">🔒 로그인이 필요한 서비스입니다.</div>;
    
    if (wishlistItems.length === 0) return (
        <div className="wishlist-empty-glass text-center">
            <span className="wishlist-empty-icon">💔</span>
            <h5 className="text-white fw-bold mb-2">찜한 상품이 없습니다.</h5>
            <p className="text-secondary small">스토어에서 마음에 드는 상품에 ❤️를 눌러보세요!</p>
        </div>
    );

    return (
        <div className="wishlist-wrapper mt-3">
            <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <h5 className="fw-bold text-white mb-0">
                    💖 MY WISHLIST <span className="wishlist-count-badge">{wishlistItems.length}</span>
                </h5>
            </div>
            
            <div className="wishlist-grid">
                {wishlistItems.map((wishlistItem) => (
                    <div 
                        className="wishlist-glass-card" 
                        key={wishlistItem.pointWishlistNo}
                        onClick={() => setWishlistSelectedItemNo(wishlistItem.pointWishlistItemNo)} 
                        style={{ cursor: 'pointer' }}
                    > 
                        <div className="wishlist-img-wrapper">
                            {wishlistItem.pointItemSrc ? (
                                <img src={wishlistItem.pointItemSrc} alt={wishlistItem.pointItemName} className="wishlist-img" />
                            ) : (
                                <div className="wishlist-no-img-box">No Image</div>
                            )}

                            <button 
                                className="wishlist-btn-remove-glass"
                                onClick={(wishlistE) => wishlistHandleRemove(wishlistE, wishlistItem.pointWishlistItemNo, wishlistItem.pointItemName)}
                                title="목록에서 제거"
                            >
                                ✕
                            </button> 
                        </div>

                        <div className="wishlist-info">
                            <h6 className="wishlist-title-text" title={wishlistItem.pointItemName}>{wishlistItem.pointItemName}</h6>
                            <div className="wishlist-price-tag">{wishlistItem.pointItemPrice.toLocaleString()} P</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 상세 모달 */}
            {wishlistSelectedItemNo && (
    <PointItemDetailView
        itemNo={wishlistSelectedItemNo} 
        onClose={() => setWishlistSelectedItemNo(null)} 
        itemdetailRefresh={wishlistLoadItems} 
    />
            )}
        </div>
    );
}
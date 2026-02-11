/* PointItemDetailView.jsx */
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./PointItemDetailModal.css";

export default function PointItemDetailView({ itemNo: itemdetailNo, onClose: itemdetailOnClose, itemdetailRefresh }) {
    const [itemdetailData, setItemdetailData] = useState(null);
    const [itemdetailLoading, setItemdetailLoading] = useState(true);

    useEffect(() => {
        if (itemdetailNo) itemdetailLoadData();
    }, [itemdetailNo]);

    const itemdetailLoadData = async () => {
        setItemdetailLoading(true);
        try {
            const itemdetailResp = await axios.get(`/point/main/store/detail/${itemdetailNo}`);
            setItemdetailData(itemdetailResp.data);
        } catch (e) {
            toast.error("상품 정보를 불러올 수 없습니다.");
            itemdetailOnClose();
        } finally {
            setItemdetailLoading(false);
        }
    };

    // 구매 버튼 클릭 핸들러
    const itemdetailHandleBuy = async (e) => {
        // 1. 배경 클릭 이벤트(onClose)가 실행되지 않도록 클릭 이벤트 전파를 즉시 차단합니다.
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 2. SweetAlert2 확인창을 띄웁니다.
        const itemdetailConfirm = await Swal.fire({
            title: '상품 구매',
            text: `[${itemdetailData.pointItemName}]을(를) 구매하시겠습니까?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#238636',
            confirmButtonText: '구매하기',
            cancelButtonText: '취소',
            background: '#161b22', 
            color: '#f0f6fc',
            allowOutsideClick: false // 확인창 밖을 눌러도 안 닫히게 설정
        });

        // 사용자가 취소를 눌렀다면 함수를 종료합니다. (모달은 그대로 유지됩니다)
        if (!itemdetailConfirm.isConfirmed) return;

        try {
            await axios.post(`/point/main/store/detail/${itemdetailNo}/buy`);
            
            // 포인트 정보 갱신 (새로고침 없이 데이터만 업데이트)
            if (itemdetailRefresh) itemdetailRefresh(); 

            // 성공 알림 창
            await Swal.fire({
                icon: 'success', 
                title: '구매 완료!',
                text: '인벤토리에 지급되었습니다.',
                background: '#161b22', 
                color: '#f0f6fc',
                timer: 1500, 
                showConfirmButton: false
            });

            // 알림이 끝난 후에만 상세 모달을 닫습니다.
            itemdetailOnClose(); 
            
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: '구매 실패',
                text: e.response?.data || "포인트 부족 또는 서버 오류입니다.",
                background: '#161b22', color: '#f0f6fc'
            });
        }
    };

    if (!itemdetailNo) return null;

    return (
        <div className="itemdetail-overlay" onClick={itemdetailOnClose}>
            {/* 컨텐츠 영역 클릭 시에는 배경 이벤트가 실행되지 않도록 설정 */}
            <div className="itemdetail-glass-content" onClick={(e) => e.stopPropagation()}>
                <button className="itemdetail-close-btn" onClick={itemdetailOnClose}>✕</button>
                
                {itemdetailLoading ? (
                    <div className="itemdetail-loading-box">로딩 중...</div>
                ) : (
                    <div className="itemdetail-body">
                        <div className="itemdetail-img-section">
                            <img src={itemdetailData.pointItemSrc} alt={itemdetailData.pointItemName} />
                        </div>
                        <div className="itemdetail-info-section">
                            <span className="itemdetail-type-badge">{itemdetailData.pointItemType}</span>
                            <h2 className="itemdetail-title">{itemdetailData.pointItemName}</h2>
                            <p className="itemdetail-desc">{itemdetailData.pointItemContent}</p>
                            <div className="itemdetail-price-box">
                                <span className="itemdetail-label">판매 가격</span>
                                <span className="itemdetail-price">{itemdetailData.pointItemPrice.toLocaleString()} P</span>
                            </div>
                            {/* 버튼 클릭 시 전파 차단 로직 포함 */}
                            <button className="itemdetail-buy-btn" onClick={(e) => itemdetailHandleBuy(e)}>
                                구매하기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
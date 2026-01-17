import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Emoticon from './Emoticon';
import "./AdminStore.css";

export default function AdminStore() {
    const [activeTab, setActiveTab] = useState("STORE");
    const [items, setItems] = useState([]);
    
    // --- [추가] 페이징 및 필터 상태 ---
    const [filterType, setFilterType] = useState(""); // ""은 전체보기
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const size = 10; // 페이지당 항목 수
    
    const [showModal, setShowModal] = useState(false);
    const fallbackImage = "https://via.placeholder.com/100?text=No+Image";

    const [formData, setFormData] = useState({
        pointItemNo: 0, pointItemName: "", pointItemPrice: 0, pointItemStock: 0, 
        pointItemType: "DECO_FRAME", pointItemReqLevel: "일반회원", 
        pointItemContent: "", pointItemSrc: "", pointItemIsLimitedPurchase: 0, pointItemDailyLimit: 0
    });

    // ---  로드 함수: 페이징/필터 파라미터 추가 ---
    const loadItems = useCallback(async () => {
        try {
            const res = await axios.get("/admin/store/list", {
                params: { 
                    itemType: filterType, 
                    page: page,
                    size: size 
                }
            });
            // 서버에서 Map으로 보낸 { list: [], totalCount: n } 처리
            setItems(Array.isArray(res.data.list) ? res.data.list : []);
            setTotalCount(res.data.totalCount || 0);
        } catch (err) { 
            console.error("상품 로드 실패", err); 
        }
    }, [filterType, page]);

    useEffect(() => { 
        if (activeTab === "STORE") loadItems(); 
    }, [activeTab, loadItems]);

    // 필터 변경 시 페이지 1로 초기화
    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
        setPage(1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ---  저장 함수: URL 및 메서드(PUT/POST) 정립 ---
    const handleSave = async (e) => {
        e.preventDefault();
        const isEdit = formData.pointItemNo > 0;
        const url = isEdit ? "/admin/store/edit" : "/admin/store/add";
        const method = isEdit ? "put" : "post";

        try {
            await axios[method](url, formData);
            Swal.fire({ title: isEdit ? '수정 완료' : '등록 완료', icon: 'success', background: '#1a1a1a', color: '#fff' });
            setShowModal(false);
            loadItems();
        } catch (err) { 
            Swal.fire('처리 실패', '데이터 형식을 확인하세요.', 'error'); 
        }
    };

    const handleDelete = async (no) => {
        if ((await Swal.fire({ title: '상품 삭제', text: "정말 삭제하시겠습니까?", icon: 'warning', showCancelButton: true, background: '#1a1a1a', color: '#fff' })).isConfirmed) {
            try {
                await axios.delete(`/admin/store/delete/${no}`);
                loadItems();
                Swal.fire('삭제됨', '', 'success');
            } catch (err) { Swal.fire('삭제 실패', '', 'error'); }
        }
    };

    // 페이지네이션 번호 계산
    const totalPages = Math.ceil(totalCount / size);

    return (
        <div className="as-container">
            <header className="as-header">
                <div className="as-title-box">
                    <h1>STORE ADMIN <span className="as-subtitle">통합 관리 시스템</span></h1>
                </div>
                <div className="as-nav-tabs">
                    <button className={activeTab === 'STORE' ? 'active' : ''} onClick={() => setActiveTab('STORE')}>📦 상품 관리</button>
                    <button className={activeTab === 'ICON' ? 'active' : ''} onClick={() => setActiveTab('ICON')}>🎨 아이콘 DB</button>
                </div>
                
                {activeTab === 'STORE' && (
                    <div className="as-header-controls">
                        {/* ---  타입 필터 --- */}
                        <select className="as-filter-select" value={filterType} onChange={handleFilterChange}>
                            <option value="">전체 유형</option>
                            <option value="HEART_RECHARGE">하트 충전권</option>
                            <option value="DECO_FRAME">프로필 테두리</option>
                            <option value="DECO_ICON">프로필 아이콘</option>
                            <option value="CHANGE_NICK">닉네임 변경권</option>
                            <option value="DECO_BG">프로필 배경</option>
                        </select>
                        <button className="as-btn-add-main" onClick={() => { 
                            setFormData({pointItemNo:0, pointItemName:"", pointItemPrice:0, pointItemStock:0, pointItemType:"DECO_FRAME", pointItemReqLevel:"일반회원", pointItemContent:"", pointItemSrc:"", pointItemIsLimitedPurchase:0, pointItemDailyLimit:0}); 
                            setShowModal(true); 
                        }}>+ 새 상품 등록</button>
                    </div>
                )}
            </header>

            {activeTab === 'STORE' ? (
                <div className="as-store-content">
                    <table className="as-item-table">
                        <thead><tr><th>번호</th><th>미리보기</th><th>유형/이름</th><th>가격/재고</th><th>액션</th></tr></thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.pointItemNo}>
                                    <td>{item.pointItemNo}</td>
                                    <td><div className="as-list-img-box"><img src={item.pointItemSrc || fallbackImage} alt="item" /></div></td>
                                    <td><span className={`as-badge as-badge-${item.pointItemType}`}>{item.pointItemType}</span><div className="as-font-bold">{item.pointItemName}</div></td>
                                    <td><div className="as-text-gold">{(item.pointItemPrice || 0).toLocaleString()} P</div><div className="as-text-muted-small">재고: {item.pointItemStock}</div></td>
                                    <td>
                                        <div className="as-action-btns">
                                            <button className="as-btn-sm as-btn-edit" onClick={() => { setFormData(item); setShowModal(true); }}>수정</button>
                                            <button className="as-btn-sm as-btn-delete" onClick={() => handleDelete(item.pointItemNo)}>삭제</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ---  페이지네이션 UI --- */}
                    {totalPages > 0 && (
                        <div className="as-pagination">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>
                                    {i + 1}
                                </button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>다음</button>
                        </div>
                    )}
                </div>
            ) : <Emoticon />}

            {showModal && (
                <div className="as-modal-overlay">
                    <div className="as-modal-content">
                        <h2>{formData.pointItemNo ? `상품 수정 (No.${formData.pointItemNo})` : '신규 상품 등록'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="as-form-group"><label>상품명</label><input className="as-input-field" name="pointItemName" value={formData.pointItemName} onChange={handleInputChange} required /></div>
                            <div className="as-form-group"><label>이미지 URL</label><input className="as-input-field" name="pointItemSrc" value={formData.pointItemSrc} onChange={handleInputChange} /></div>
                            <div className="as-form-group"><label>상품 설명(Content)</label><textarea className="as-input-field" name="pointItemContent" rows="3" value={formData.pointItemContent} onChange={handleInputChange} /></div>
                            <div className="as-flex-row">
                                <div className="as-col-6"><label>가격 (P)</label><input type="number" className="as-input-field" name="pointItemPrice" value={formData.pointItemPrice} onChange={handleInputChange} /></div>
                                <div className="as-col-6"><label>재고</label><input type="number" className="as-input-field" name="pointItemStock" value={formData.pointItemStock} onChange={handleInputChange} /></div>
                            </div>
                            <div className="as-flex-row">
                                <div className="as-col-6"><label>아이템 유형</label>
                                    <select className="as-select-field" name="pointItemType" value={formData.pointItemType} onChange={handleInputChange}>
                                        <option value="HEART_RECHARGE">하트 충전권</option>
                                        <option value="DECO_FRAME">프로필 테두리</option>
                                        <option value="DECO_ICON">프로필 아이콘</option>
                                        <option value="CHANGE_NICK">닉네임 변경권</option>
                                        <option value="DECO_BG">프로필 배경</option>
                                    </select>
                                </div>
                                <div className="as-col-6"><label>1인 1회 제한</label>
                                    <select className="as-select-field" name="pointItemIsLimitedPurchase" value={formData.pointItemIsLimitedPurchase} onChange={handleInputChange}>
                                        <option value={0}>N (중복가능)</option><option value={1}>Y (1회한정)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="as-modal-actions"><button type="button" className="as-btn-cancel" onClick={() => setShowModal(false)}>취소</button><button type="submit" className="as-btn-save">저장하기</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2"; 
import { Modal } from 'bootstrap';
import "./AdminInventory.css";

export default function AdminInventory() {
    const [memberList, setMemberList] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(0);

    const [selectedUser, setSelectedUser] = useState(null);
    const [inventoryList, setInventoryList] = useState([]);
    const [iconList, setIconList] = useState([]);
    const [viewTab, setViewTab] = useState("item");

    // 지급 모달용 상태
    const [storeItems, setStoreItems] = useState([]);
    const [grantItemPage, setGrantItemPage] = useState(1);
    const [grantItemTotalPage, setGrantItemTotalPage] = useState(0);

    const [masterIcons, setMasterIcons] = useState([]);
    const [grantIconPage, setGrantIconPage] = useState(1);
    const [grantIconTotalPage, setGrantIconTotalPage] = useState(0);

    const [grantTab, setGrantTab] = useState("item");

    const detailModalRef = useRef();
    const grantModalRef = useRef();

    const adminSwal = { background: '#161b22', color: '#fff', confirmButtonColor: '#00d2d3' };

    const loadMembers = useCallback(async () => {
        try {
            const resp = await axios.get("/admin/inventory/list", { params: { keyword: keyword || null, page } });
            setMemberList(resp.data.list || []);
            setTotalPage(resp.data.totalPage || 0);
        } catch { console.error("유저 로드 실패"); }
    }, [keyword, page]);

    const loadGrantItems = useCallback(async () => {
        try {
            const resp = await axios.get("/admin/inventory/item-list", { params: { page: grantItemPage, size: 10 } });
            setStoreItems(resp.data.list || []);
            setGrantItemTotalPage(resp.data.totalPage || 0); // 백엔드 수정 후 정상 작동
        } catch { console.error("상점 아이템 로드 실패"); }
    }, [grantItemPage]);

    const loadGrantIcons = useCallback(async () => {
        try {
            const resp = await axios.get("/admin/icon/list", { params: { page: grantIconPage } });
            setMasterIcons(resp.data.list || []);
            setGrantIconTotalPage(resp.data.totalPage || 0);
        } catch { console.error("아이콘 로드 실패"); }
    }, [grantIconPage]);

    useEffect(() => { loadMembers(); }, [loadMembers]);
    useEffect(() => { loadGrantItems(); }, [loadGrantItems]);
    useEffect(() => { loadGrantIcons(); }, [loadGrantIcons]);

    const openManageModal = async (user) => {
        setSelectedUser(user);
        try {
            const [resInv, resIcon] = await Promise.all([
                axios.get(`/admin/inventory/${user.memberId}`),
                axios.get(`/admin/icon/${user.memberId}`)
            ]);
            setInventoryList(resInv.data || []);
            setIconList(resIcon.data || []);
            Modal.getOrCreateInstance(detailModalRef.current).show();
        } catch { Swal.fire({ ...adminSwal, icon: 'error', title: '조회 실패' }); }
    };

    const handleRecall = async (type, no, name) => {
        const result = await Swal.fire({
            ...adminSwal, title: '자산 회수', text: `[${name}]을 회수할까요?`,
            icon: 'warning', showCancelButton: true, confirmButtonText: '회수', cancelButtonText: '취소'
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(type === "item" ? `/admin/inventory/${no}` : `/admin/icon/${no}`);
                if(type === "item") setInventoryList(prev => prev.filter(i => i.inventoryNo !== no));
                else setIconList(prev => prev.filter(i => i.memberIconId !== no));
                Swal.fire({ ...adminSwal, icon: 'success', title: '회수 완료', timer: 1000, showConfirmButton: false });
            } catch { Swal.fire({ ...adminSwal, icon: 'error', title: '회수 실패' }); }
        }
    };

    const handleGrant = async (type, targetNo, name) => {
        try {
            await axios.post(type === "item" ? `/admin/inventory/${selectedUser.memberId}/${targetNo}` : `/admin/icon/${selectedUser.memberId}/${targetNo}`);
            Swal.fire({ ...adminSwal, icon: 'success', title: '지급 완료', timer: 1000, showConfirmButton: false });
            const [resInv, resIcon] = await Promise.all([
                axios.get(`/admin/inventory/${selectedUser.memberId}`),
                axios.get(`/admin/icon/${selectedUser.memberId}`)
            ]);
            setInventoryList(resInv.data || []);
            setIconList(resIcon.data || []);
        } catch (err) { 
            Swal.fire({ ...adminSwal, icon: 'error', title: '지급 실패', text: err.response?.data || "오류 발생" }); 
        }
    };

    return (
        <div className="admin-inv-wrapper">
            <div className="admin-inv-container">
                <div className="admin-inv-header">
                    <h2 className="admin-inv-title">🛡️ 자산 보유 현황 관리</h2>
                    <div className="admin-inv-search-bar">
                        <input className="admin-inv-input" placeholder="아이디 또는 닉네임" value={keyword} 
                               onChange={e => {setKeyword(e.target.value); setPage(1);}} />
                        <button className="admin-inv-btn-search" onClick={loadMembers}>조회</button>
                    </div>
                </div>

                <div className="admin-inv-table-box">
                    <table className="admin-inv-table">
                        <thead><tr><th>아이디</th><th>닉네임</th><th>등급</th><th>액션</th></tr></thead>
                        <tbody>
                            {memberList.map(m => (
                                <tr key={m.memberId}>
                                    <td>{m.memberId}</td>
                                    <td className="admin-inv-nickname">{m.memberNickname}</td>
                                    <td><span className="admin-inv-level-badge">{m.memberLevel}</span></td>
                                    <td><button className="admin-inv-btn-manage" onClick={() => openManageModal(m)}>관리하기</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="admin-inv-pagination">
                    {[...Array(totalPage)].map((_, i) => (
                        <button key={i+1} className={`admin-inv-page-btn ${page === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                    ))}
                </div>

                {/* 상세 관리 모달 */}
                <div className="modal fade" ref={detailModalRef} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content admin-inv-modal">
                            <div className="modal-header">
                                <h5 className="modal-title">📦 {selectedUser?.memberNickname}님의 보유 자산</h5>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div className="modal-body">
                                <div className="admin-inv-modal-top">
                                    <div className="admin-inv-tabs">
                                        <button className={`admin-inv-tab ${viewTab === 'item' ? 'active' : ''}`} onClick={() => setViewTab('item')}>인벤토리</button>
                                        <button className={`admin-inv-tab ${viewTab === 'icon' ? 'active' : ''}`} onClick={() => setViewTab('icon')}>아이콘</button>
                                    </div>
                                    <button className="admin-inv-btn-grant" onClick={() => Modal.getOrCreateInstance(grantModalRef.current).show()}>➕ 신규 지급</button>
                                </div>
                                <div className="admin-inv-asset-grid">
                                    {(viewTab === "item" ? inventoryList : iconList).map(asset => (
                                        <div key={viewTab === "item" ? asset.inventoryNo : asset.memberIconId} className="admin-inv-asset-card">
                                            <img src={viewTab === "item" ? asset.pointItemSrc : asset.iconSrc} alt="" />
                                            <div className="admin-inv-asset-name">{viewTab === "item" ? asset.pointItemName : asset.iconName}</div>
                                            <button className="admin-inv-btn-recall" onClick={() => handleRecall(viewTab, viewTab === "item" ? asset.inventoryNo : asset.memberIconId, viewTab === "item" ? asset.pointItemName : asset.iconName)}>회수</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 지급 모달 */}
                <div className="modal fade" ref={grantModalRef} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content admin-inv-modal">
                            <div className="modal-header">
                                <h5 className="modal-title">🎁 신규 자산 지급하기</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => Modal.getInstance(grantModalRef.current).hide()}></button>
                            </div>
                            <div className="modal-body">
                                <div className="admin-inv-tabs mb-4">
                                    <button className={`admin-inv-tab ${grantTab === 'item' ? 'active' : ''}`} onClick={() => setGrantTab('item')}>상점 아이템</button>
                                    <button className={`admin-inv-tab ${grantTab === 'icon' ? 'active' : ''}`} onClick={() => setGrantTab('icon')}>마스터 아이콘</button>
                                </div>
                                <div className="admin-inv-grant-grid">
                                    {(grantTab === "item" ? storeItems : masterIcons).map(data => (
                                        <div className="admin-inv-grant-card" key={grantTab === "item" ? data.pointItemNo : data.iconId}>
                                            <img src={grantTab === "item" ? data.pointItemSrc : data.iconSrc} alt="" />
                                            <div className="admin-inv-grant-name">{grantTab === "item" ? data.pointItemName : data.iconName}</div>
                                            <button className="admin-inv-btn-give" onClick={() => handleGrant(grantTab, grantTab === "item" ? data.pointItemNo : data.iconId, grantTab === "item" ? data.pointItemName : data.iconName)}>지급하기</button>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* 모달 전용 하단 페이징 버튼 생성 위치 */}
                                <div className="admin-inv-modal-pagination">
                                    {grantTab === "item" ? (
                                        [...Array(grantItemTotalPage)].map((_, i) => (
                                            <button key={i+1} className={`modal-page-btn ${grantItemPage === i+1 ? 'active' : ''}`}
                                                    onClick={() => setGrantItemPage(i+1)}>{i+1}</button>
                                        ))
                                    ) : (
                                        [...Array(grantIconTotalPage)].map((_, i) => (
                                            <button key={i+1} className={`modal-page-btn ${grantIconPage === i+1 ? 'active' : ''}`}
                                                    onClick={() => setGrantIconPage(i+1)}>{i+1}</button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminPoint.css'; 
import { Modal } from 'bootstrap';

export default function AdminPoint() {
    const historyModal = useRef();

    const openModal = (ref) => {
        const instance = Modal.getOrCreateInstance(ref.current);
        instance.show();
    };
    const closeModal = (ref) => {
        const instance = Modal.getInstance(ref.current);
        if (instance) instance.hide();
    };

    const [memberList, setMemberList] = useState([]); 
    const [keyword, setKeyword] = useState(""); 
    const [inputPoints, setInputPoints] = useState({});
    const [pointPage, setPointPage] = useState(1);
    const [pointTotalPage, setPointTotalPage] = useState(0);

    const [historyList, setHistoryList] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPage, setHistoryTotalPage] = useState(0);
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    // 공통 Swal 설정
    const adminSwal = {
        background: '#161b22',
        color: '#c9d1d9',
        confirmButtonColor: '#1f6feb'
    };

    const loadMembers = useCallback(async () => {
        try {
            const resp = await axios.get("/admin/point/list", {
                params: { keyword: keyword, page: pointPage, size: 10 }
            });
            setMemberList(resp.data.list || []);
            setPointTotalPage(resp.data.totalPage || 0);
        } catch (e) { 
            Swal.fire({ ...adminSwal, icon: 'error', title: '목록 로드 실패' });
        }
    }, [keyword, pointPage]);

    const loadHistory = useCallback(async (memberId, page = 1) => {
        try {
            const resp = await axios.get(`/admin/point/history/${memberId}`, {
                params: { page: page, size: 10 }
            });
            setHistoryList(resp.data.list || []);
            setHistoryTotalPage(resp.data.totalPage || 0);
            setHistoryPage(page);
            setSelectedMemberId(memberId);
            openModal(historyModal);
        } catch (e) { 
            Swal.fire({ ...adminSwal, icon: 'error', title: '내역 로드 실패' });
        }
    }, []);

    const handlePointUpdate = async (memberId, mode) => {
        const val = inputPoints[memberId];
        if(!val || isNaN(val) || val <= 0) {
            Swal.fire({ ...adminSwal, icon: 'warning', title: '입력 오류', text: '올바른 숫자를 입력해주세요.' });
            return;
        }
        
        const amount = mode === 'plus' ? parseInt(val) : -parseInt(val);
        
        try {
            const resp = await axios.post("/admin/point/update", {
                memberId: memberId,
                amount: amount
            });
            if(resp.data === "success") {
                Swal.fire({
                    ...adminSwal,
                    icon: 'success',
                    title: '포인트 처리 완료',
                    text: `${Math.abs(amount).toLocaleString()} P가 ${mode === 'plus' ? '지급' : '차감'}되었습니다.`,
                    timer: 1500,
                    showConfirmButton: false
                });
                setInputPoints({...inputPoints, [memberId]: ""});
                loadMembers();
            }
        } catch (e) { 
            Swal.fire({ ...adminSwal, icon: 'error', title: '처리 실패' });
        }
    };

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const renderPagination = (current, total, setter) => {
        if (total <= 1) return null;
        let pages = [];
        for (let i = 1; i <= total; i++) {
            pages.push(
                <button key={i} className={`ap-btn-pagination ${current === i ? 'active' : ''}`} onClick={() => setter(i)}>
                    {i}
                </button>
            );
        }
        return <div className="ap-pagination-group">{pages}</div>;
    };

    return (
        <div className="ap-container">
            <div className="ap-max-width">
                <div className="ap-header-flex">
                    <h2 className="ap-title">💰 포인트 통합 관리 시스템</h2>
                    <div className="ap-search-bar">
                        <input type="text" className="ap-glass-input" placeholder="회원 ID 또는 닉네임 검색" value={keyword} onChange={e => setKeyword(e.target.value)} onKeyPress={e => e.key === 'Enter' && loadMembers()} />
                        <button className="ap-search-btn" onClick={loadMembers}>검색</button>
                    </div>
                </div>

                <div className="ap-content-card">
                    <table className="ap-table">
                        <thead>
                            <tr>
                                <th>회원 정보</th>
                                <th>현재 잔액</th>
                                <th>포인트 조정 (수량 입력 후 +/- 클릭)</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {memberList.map((m) => (
                                <tr key={m.memberId}>
                                    <td className="ap-text-left">
                                        <div className="ap-member-info">
                                            <div className="ap-nick-txt">{m.memberNickname}</div>
                                            <div className="ap-id-txt">({m.memberId})</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="ap-point-amount">{m.memberPoint?.toLocaleString()} P</span>
                                    </td>
                                    <td>
                                        <div className="ap-point-control">
                                            <input type="number" className="ap-point-input" placeholder="0" value={inputPoints[m.memberId] || ""} onChange={e => setInputPoints({...inputPoints, [m.memberId]: e.target.value})} />
                                            <button className="ap-btn-point plus" onClick={() => handlePointUpdate(m.memberId, 'plus')}>지급</button>
                                            <button className="ap-btn-point minus" onClick={() => handlePointUpdate(m.memberId, 'minus')}>차감</button>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="ap-btn-history" onClick={() => loadHistory(m.memberId, 1)}>
                                            📜 내역 보기
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {renderPagination(pointPage, pointTotalPage, setPointPage)}
                </div>
            </div>

            {/* 내역 모달 */}
            <div className="modal fade" tabIndex="-1" ref={historyModal}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content ap-modal-content">
                        <div className="modal-header ap-modal-header">
                            <h5 className="modal-title">💎 <span className="ap-text-highlight">{selectedMemberId}</span> 포인트 변동 이력</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={() => closeModal(historyModal)}></button>
                        </div>
                        <div className="modal-body ap-modal-body">
                            <table className="ap-table">
                                <thead>
                                    <tr><th>일시</th><th>사유</th><th>변동액</th></tr>
                                </thead>
                                <tbody>
                                    {historyList.length > 0 ? (
                                        historyList.map((h) => (
                                            <tr key={h.pointHistoryId}>
                                                <td className="ap-small">{h.pointHistoryCreatedAt}</td>
                                                <td className="ap-text-left">{h.pointHistoryReason}</td>
                                                <td className={h.pointHistoryAmount > 0 ? "ap-text-plus" : "ap-text-minus"}>
                                                    {h.pointHistoryAmount > 0 ? `+${h.pointHistoryAmount.toLocaleString()}` : h.pointHistoryAmount.toLocaleString()} P
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" style={{padding: '60px', textAlign: 'center'}}>변동 내역이 존재하지 않습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="ap-mt-2">
                                {renderPagination(historyPage, historyTotalPage, (p) => loadHistory(selectedMemberId, p))}
                            </div>
                        </div>
                        <div className="modal-footer ap-modal-footer">
                            <button type="button" className="ap-btn-close-modal" onClick={() => closeModal(historyModal)}>닫기</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
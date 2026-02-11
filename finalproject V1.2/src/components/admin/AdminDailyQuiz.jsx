import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTrash, FaPen, FaMagnifyingGlass, FaPlus, FaRotateRight } from "react-icons/fa6"; 
import Swal from "sweetalert2"; 
import "./AdminDailyQuiz.css";

export default function AdminDailyQuiz() {
    // 1. 상태 변수 (adq 접두사 적용)
    const [adqQuizList, setAdqQuizList] = useState([]);
    const [adqPage, setAdqPage] = useState(1);       
    const [adqTotalPage, setAdqTotalPage] = useState(0); 
    const [adqLoading, setAdqLoading] = useState(false);

    const [adqSearchType, setAdqSearchType] = useState("all");
    const [adqSearchKeyword, setAdqSearchKeyword] = useState("");

    const [adqInput, setAdqInput] = useState({ quizNo: 0, quizQuestion: "", quizAnswer: "" });
    const [adqIsEditMode, setAdqIsEditMode] = useState(false);

    // 2. 목록 불러오기 로직 (검색 포함)
    const adqLoadList = useCallback(async () => {
        setAdqLoading(true);
        try {
            const resp = await axios.get(`/admin/dailyquiz/list`, {
                params: {
                    page: adqPage,
                    type: adqSearchType,
                    keyword: adqSearchKeyword
                }
            });
            setAdqQuizList(resp.data.list || []);       
            setAdqTotalPage(resp.data.totalPage || 0); 
        } catch (e) {
            console.error("퀴즈 로드 실패", e);
            toast.error("목록을 불러오지 못했습니다.");
        } finally {
            setAdqLoading(false);
        }
    }, [adqPage, adqSearchType, adqSearchKeyword]);

    useEffect(() => { adqLoadList(); }, [adqLoadList]);

    // 3. 검색 관련 핸들러
    const adqHandleSearch = () => {
        setAdqPage(1); 
        adqLoadList(); 
    };

    const adqHandleEnter = (e) => {
        if(e.key === 'Enter') adqHandleSearch();
    };

    const adqChangeInput = (e) => setAdqInput({ ...adqInput, [e.target.name]: e.target.value });

    // 4. 저장 및 수정 핸들러
    const adqHandleSave = async () => {
        if (!adqInput.quizQuestion.trim() || !adqInput.quizAnswer.trim()) {
            toast.warning("문제와 정답을 모두 입력하세요.");
            return;
        }

        try {
            if (adqIsEditMode) {
                await axios.put("/admin/dailyquiz/", adqInput);
                await Swal.fire({
                    icon: 'success',
                    title: '수정 완료',
                    text: '문제가 성공적으로 업데이트되었습니다.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a1a', color: '#fff'
                });
            } else {
                await axios.post("/admin/dailyquiz/", adqInput);
                await Swal.fire({
                    icon: 'success',
                    title: '등록 완료',
                    text: '새로운 퀴즈가 추가되었습니다.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a1a', color: '#fff'
                });
            }
            adqHandleCancel(); 
            adqLoadList();
        } catch (e) { 
            Swal.fire("오류", "저장에 실패했습니다.", "error");
        }
    };

    // 5. 삭제 핸들러
    const adqHandleDelete = async (quizNo) => {
        const result = await Swal.fire({
            title: '퀴즈 삭제',
            text: `${quizNo}번 문제를 정말 삭제하시겠습니까?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            background: '#1a1a1a', color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/admin/dailyquiz/${quizNo}`);
                toast.success("문제가 삭제되었습니다.");
                adqLoadList();
            } catch (e) { toast.error("삭제 실패"); }
        }
    };

    // 6. UI 제어 핸들러
    const adqHandleEditClick = (quiz) => { 
        setAdqInput({ ...quiz }); 
        setAdqIsEditMode(true); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const adqHandleCancel = () => { 
        setAdqInput({ quizNo: 0, quizQuestion: "", quizAnswer: "" }); 
        setAdqIsEditMode(false); 
    };

    return (
        <div className="adq-wrapper">
            <div className="container py-5 text-white">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">🛠️ 데일리 퀴즈 관리 <span className="text-secondary fs-6">Admin Panel</span></h2>
                    <button className="btn btn-outline-light btn-sm" onClick={() => adqLoadList()}>
                        <FaRotateRight className={adqLoading ? "adq-spin" : ""} /> 새로고침
                    </button>
                </div>

                {/* 입력 폼 영역 */}
                <div className="adq-glass-card mb-4 p-4 shadow">
                    <h5 className="text-info mb-4">
                        {adqIsEditMode ? <><FaPen /> {adqInput.quizNo}번 문제 수정</> : <><FaPlus /> 신규 문제 등록</>}
                    </h5>
                    <div className="row g-3">
                        <div className="col-md-9">
                            <label className="form-label small text-secondary">문제 내용</label>
                            <input type="text" className="adq-input" placeholder="문제 내용을 입력하세요" name="quizQuestion" value={adqInput.quizQuestion} onChange={adqChangeInput} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small text-secondary">정답</label>
                            <input type="text" className="adq-input" placeholder="정답 입력" name="quizAnswer" value={adqInput.quizAnswer} onChange={adqChangeInput} />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4 gap-2">
                        {adqIsEditMode && <button className="btn adq-btn-glass-secondary" onClick={adqHandleCancel}>취소</button>}
                        <button className={`btn ${adqIsEditMode ? "btn-warning text-dark" : "btn-primary"} px-4 fw-bold`} onClick={adqHandleSave}>
                            {adqIsEditMode ? "수정 완료" : "문제 등록"}
                        </button>
                    </div>
                </div>

                {/* 검색 바 영역 */}
                <div className="adq-search-bar mb-3">
                    <div className="d-flex gap-2">
                        <select className="adq-select" style={{width:'150px'}} value={adqSearchType} onChange={(e) => setAdqSearchType(e.target.value)}>
                            <option value="all">전체</option>
                            <option value="question">문제</option>
                            <option value="answer">정답</option>
                        </select>
                        <div className="position-relative flex-grow-1">
                            <input type="text" className="adq-input ps-5" placeholder="검색어를 입력하세요" value={adqSearchKeyword} onChange={(e) => setAdqSearchKeyword(e.target.value)} onKeyDown={adqHandleEnter} />
                            <FaMagnifyingGlass className="adq-search-icon-pos" />
                        </div>
                        <button className="btn btn-primary px-4" onClick={adqHandleSearch}>검색</button>
                    </div>
                </div>

                {/* 테이블 리스트 영역 */}
                <div className="adq-table-container">
                    <table className="table table-dark adq-table align-middle">
                        <thead>
                            <tr>
                                <th width="80" className="text-center">No</th>
                                <th>문제 내용</th>
                                <th width="150" className="text-center">정답</th>
                                <th width="120" className="text-center">액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adqQuizList.length > 0 ? (
                                adqQuizList.map((q) => (
                                    <tr key={q.quizNo}>
                                        <td className="text-center text-secondary">{q.quizNo}</td>
                                        <td className="adq-q-text">{q.quizQuestion}</td>
                                        <td className="text-center"><span className="badge adq-bg-dark-soft text-warning">{q.quizAnswer}</span></td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-2">
                                                <button className="adq-btn-icon-action edit" title="수정" onClick={() => adqHandleEditClick(q)}><FaPen /></button>
                                                <button className="adq-btn-icon-action delete" title="삭제" onClick={() => adqHandleDelete(q.quizNo)}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">등록된 데이터가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 영역 (생략 없음) */}
                {adqTotalPage > 1 && (
                    <div className="d-flex justify-content-center mt-5">
                        <ul className="pagination adq-glass-pagination">
                            <li className={`page-item ${adqPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setAdqPage(1)}>&laquo;</button>
                            </li>
                            {(() => {
                                let start = Math.max(1, adqPage - 2);
                                let end = Math.min(adqTotalPage, start + 4);
                                if (end === adqTotalPage) start = Math.max(1, end - 4);
                                const pages = [];
                                for (let i = start; i <= end; i++) {
                                    if(i >= 1) pages.push(i);
                                }
                                return pages;
                            })().map((p) => (
                                <li key={p} className={`page-item ${adqPage === p ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => setAdqPage(p)}>{p}</button>
                                </li>
                            ))}
                            <li className={`page-item ${adqPage === adqTotalPage ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setAdqPage(adqTotalPage)}>&raquo;</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
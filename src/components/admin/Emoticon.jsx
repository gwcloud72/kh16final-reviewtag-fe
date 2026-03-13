import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import MovieSearch from './MovieSearch';
import './Emoticon.css';

export default function Emoticon() {
    const [iconList, setIconList] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [rarityFilter, setRarityFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(0);
    
    const [form, setForm] = useState({ 
        iconId: 0, iconName: "", iconCategory: "DEFAULT", 
        iconRarity: "COMMON", iconSrc: "", iconContents: "" 
    });
    const [isEdit, setIsEdit] = useState(false);

    const movieModalRef = useRef();

    const loadIcons = useCallback(async () => {
        try {
            const resp = await axios.get("/admin/point/icon/list", { 
                params: { page, category: categoryFilter, rarity: rarityFilter } 
            });
            setIconList(resp.data.list || []);
            setTotalPage(resp.data.totalPage || 0);
        } catch (e) {
            console.error("아이콘 로드 실패", e);
        }
    }, [page, categoryFilter, rarityFilter]);

    useEffect(() => { loadIcons(); }, [loadIcons]);

    const handleCategoryChange = (val) => { setCategoryFilter(val); setPage(1); };
    const handleRarityChange = (val) => { setRarityFilter(val); setPage(1); };

    const handleDelete = async (id) => {
        const res = await Swal.fire({
            title: '정말 삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#333',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            background: '#1a1a1a',
            color: '#fff'
        });
        
        if (res.isConfirmed) {
            try {
                const resp = await axios.delete(`/admin/point/icon/delete/${id}`);
                if(resp.data === "success") {
                    Swal.fire({ title: '삭제 완료', icon: 'success', background: '#1a1a1a', color: '#fff' });
                    loadIcons();
                }
            } catch (e) { 
                Swal.fire({ title: '삭제 실패', icon: 'error', background: '#1a1a1a', color: '#fff' }); 
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEdit ? "/admin/point/icon/edit" : "/admin/point/icon/add";
        try {
            const resp = await axios.post(url, form);
            if (resp.data === "success") {
                Swal.fire({ title: isEdit ? "수정 완료" : "등록 완료", icon: "success", background: "#1a1a1a", color: "#fff" });
                setForm({ iconId: 0, iconName: "", iconCategory: "DEFAULT", iconRarity: "COMMON", iconSrc: "", iconContents: "" });
                setIsEdit(false);
                loadIcons();
            }
        } catch (e) { 
            Swal.fire({ title: "저장 실패", icon: "error", background: "#1a1a1a", color: "#fff" }); 
        }
    };

    const handleMovieSelect = (data) => {
        setForm({ 
            ...form, 
            iconName: data.title, 
            iconSrc: "https://image.tmdb.org/t/p/w500" + data.posterPath, 
            iconContents: data.contentsId, 
            iconCategory: 'MOVIE' 
        });
        const modalInstance = Modal.getInstance(movieModalRef.current);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div className="admin-store-container">
            <header className="store-main-header">
                <div className="header-text">
                    <h2>이모티콘 관리</h2>
                    <p>전체 아이템의 유형, 등급, 이미지를 관리합니다.</p>
                </div>
                <div className="filter-controls">
                    <select className="store-filter-select" value={categoryFilter} onChange={(e) => handleCategoryChange(e.target.value)}>
                        <option value="ALL">전체 유형</option>
                        <option value="DEFAULT">DEFAULT</option>
                        <option value="MOVIE">MOVIE</option>
                    </select>
                    {/* UNIQUE 필터 추가 */}
                    <select className="store-filter-select" value={rarityFilter} onChange={(e) => handleRarityChange(e.target.value)}>
                        <option value="ALL">전체 등급</option>
                        <option value="COMMON">COMMON</option>
                        <option value="RARE">RARE</option>
                        <option value="EPIC">EPIC</option>
                        <option value="LEGENDARY">LEGENDARY</option>
                        <option value="UNIQUE">UNIQUE</option>
                    </select>
                </div>
            </header>

            <section className={`store-quick-form ${isEdit ? 'mode-edit' : ''}`}>
                <div className="form-preview-area">
                    {form.iconSrc ? <img src={form.iconSrc} alt="preview" /> : <div className="no-preview">PREVIEW</div>}
                </div>
                <form className="form-input-area" onSubmit={handleSubmit}>
                    <div className="input-row-top">
                        <input className="input-name-field" placeholder="아이콘 명칭을 입력하세요" value={form.iconName} onChange={e => setForm({...form, iconName: e.target.value})} required />
                        <button type="button" className="btn-open-movie" onClick={() => Modal.getOrCreateInstance(movieModalRef.current).show()}>🎬 영화 데이터 검색</button>
                    </div>
                    <div className="input-row-bottom">
                        <select className="select-field" value={form.iconCategory} onChange={e => setForm({...form, iconCategory: e.target.value})}>
                            <option value="DEFAULT">유형: DEFAULT</option>
                            <option value="MOVIE">유형: MOVIE</option>
                        </select>
                        {/* UNIQUE 선택 옵션 추가 */}
                        <select className="select-field highlight" value={form.iconRarity} onChange={e => setForm({...form, iconRarity: e.target.value})}>
                            <option value="COMMON">등급: COMMON</option>
                            <option value="RARE">등급: RARE</option>
                            <option value="EPIC">등급: EPIC</option>
                            <option value="LEGENDARY">등급: LEGENDARY</option>
                            <option value="UNIQUE">등급: UNIQUE</option>
                        </select>
                        <input className="input-url-field" placeholder="이미지 URL 경로" value={form.iconSrc} onChange={e => setForm({...form, iconSrc: e.target.value})} required />
                        <div className="form-btns">
                            <button type="submit" className="btn-submit-main">{isEdit ? "수정완료" : "아이콘 등록"}</button>
                            {isEdit && <button type="button" className="btn-cancel-edit" onClick={() => { setIsEdit(false); setForm({ iconId: 0, iconName: "", iconCategory: "DEFAULT", iconRarity: "COMMON", iconSrc: "", iconContents: "" }); }}>취소</button>}
                        </div>
                    </div>
                </form>
            </section>

            <section className="store-list-section">
                <div className="list-table-header">
                    <div className="t-num">번호</div>
                    <div className="t-preview">미리보기</div>
                    <div className="t-title">유형/이름</div>
                    <div className="t-price">등급</div>
                    <div className="t-action">액션</div>
                </div>

                {iconList.length > 0 ? (
                    iconList.map((item) => (
                        <div className="list-table-row" key={item.iconId}>
                            <div className="col-num">{item.iconId}</div>
                            <div className="col-preview">
                                <div className="img-container">
                                    <img src={item.iconSrc} alt={item.iconName} onError={(e) => e.target.src = 'https://placehold.co/100x100?text=Error'} />
                                </div>
                            </div>
                            <div className="col-title">
                                <span className="category-tag">{item.iconCategory}</span>
                                <span className="item-name-bold">{item.iconName}</span>
                            </div>
                            <div className="col-price">
                                <span className={`rarity-text ${item.iconRarity.toLowerCase()}`}>{item.iconRarity}</span>
                            </div>
                            <div className="col-action">
                                <button className="btn-edit-row" onClick={() => { setIsEdit(true); setForm(item); window.scrollTo({top: 0, behavior: 'smooth'}); }}>수정</button>
                                <button className="btn-del-row" onClick={() => handleDelete(item.iconId)}>삭제</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="list-empty"><p>등록된 아이콘이 없거나 검색 결과가 없습니다.</p></div>
                )}
            </section>

            <div className="store-pagination">
                {Array.from({ length: totalPage }, (_, i) => i + 1).map(p => (
                    <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
            </div>

            <div className="modal fade" ref={movieModalRef} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content movie-search-modal">
                        <div className="modal-header border-0"><h5 className="modal-title">영화 데이터 찾기</h5><button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                        <div className="modal-body"><MovieSearch onSelect={handleMovieSelect} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
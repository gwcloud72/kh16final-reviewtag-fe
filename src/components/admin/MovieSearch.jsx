import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // toast 대신 Swal 사용
import './MovieSearch.css';

export default function MovieSearch({ onSelect }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

    // 공통 Swal 설정 (다크 모드 테마)
    const searchSwal = {
        background: '#161b22',
        color: '#fff',
        confirmButtonColor: '#00d2d3',
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();

        if (!query.trim()) {
            Swal.fire({
                ...searchSwal,
                icon: 'warning',
                title: '검색어 미입력',
                text: '영화 제목을 입력해 주세요.',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }
        
        setLoading(true);
        try {
            const resp = await axios.get("/api/tmdb/search", { params: { query } });
            setResults(resp.data || []);
            
            // 결과가 없을 때 알림 (선택 사항)
            if (resp.data.length === 0) {
                Swal.fire({
                    ...searchSwal,
                    icon: 'info',
                    title: '검색 결과 없음',
                    text: '해당 제목의 영화를 찾을 수 없습니다.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (err) { 
            Swal.fire({
                ...searchSwal,
                icon: 'error',
                title: '검색 오류',
                text: '데이터를 가져오는 중 문제가 발생했습니다.'
            });
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="ms-container">
            {/* 검색바 영역 */}
            <form className="ms-search-wrapper" onSubmit={handleSearch}>
                <div className="ms-input-box">
                    <span className="search-icon">🔍</span>
                    <input 
                        className="ms-input" 
                        placeholder="영화 제목을 입력하세요..." 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                    />
                </div>
                <button type="submit" className="ms-btn-submit" disabled={loading}>
                    {loading ? <span className="ms-loader"></span> : "검색"}
                </button>
            </form>

            {/* 결과 리스트 영역 */}
            <div className="ms-result-container">
                {results.length > 0 ? (
                    results.map(movie => (
                        <div key={movie.contentsId} className="ms-movie-item">
                            <div className="ms-poster-box">
                                <img 
                                    src={movie.posterPath ? TMDB_IMAGE_BASE_URL + movie.posterPath : ""} 
                                    alt="poster" 
                                    onError={(e) => e.target.src = 'https://placehold.co/60x90?text=No+Image'}
                                />
                            </div>
                            <div className="ms-movie-info">
                                <div className="ms-movie-title">{movie.title}</div>
                                <div className="ms-movie-meta">
                                    <span className="ms-date">{movie.releaseDate || "개봉일 미상"}</span>
                                    <span className="ms-id-badge">ID: {movie.contentsId}</span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="ms-btn-select-action" 
                                onClick={() => onSelect(movie)}
                            >
                                선택
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="ms-empty-state">
                        {!loading && query && (
                            <>
                                <div className="empty-icon">📂</div>
                                <p className="empty-text">검색 결과가 없습니다.</p>
                                <span className="empty-sub">다른 키워드로 검색해 보세요.</span>
                            </>
                        )}
                        {!query && <p className="empty-text">찾으시는 영화 제목을 입력해 주세요.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
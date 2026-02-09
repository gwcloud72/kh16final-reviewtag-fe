import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./SearchAndSave.css";
import "./Contents.css";
import { FaSearch } from "react-icons/fa";

export default function GenreList() {
    //장르 리스트 state
    const [genre, setGenre] = useState([]);
    //검색어 state
    const [query, setQuery] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    //effect
    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (location.pathname === "/contents/genreList" || location.pathname === "/contents/genreList/") {
            // '전체' 목록 페이지로 이동 (replace: true는 뒤로가기 시 갇히는 것 방지)
            navigate("listByGenre/전체", { replace: true });
        }
    }, [location.pathname, navigate]);

    //callback
    const loadData = useCallback(async () => {
        const { data } = await axios.get("/api/tmdb/genre");
        // 전체 추가
        const genreList = [
            { genreId: 0, genreName: "전체" },
            ...data.map(g => ({ ...g }))
        ];
        setGenre(genreList);
    }, []);

    //[입력창 제어 및 검색이동]
    const handleSearch = useCallback(() => {
        if (query.trim().length === 0) return;
        // 검색어와 함께 결과 페이지로 이동
        navigate(`/contents/searchResult/${query}`);
        setQuery(""); // 입력창 비우기 (선택사항)
    }, [query, navigate]);


    //render
    return (<>
        <div className="container mt-2">

             <div className="row">
                <div className="col d-flex justify-content-center text-nowrap">
                    <Link className="text-decoration-none link-body-emphasis" to="/">
                        <svg width="100%"
                            viewBox="0 0 750 150"
                            style={{ maxWidth: "800px" , height: "auto"}}
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <g transform="translate(20, 25)">
                                <path d="M10 0H110C115.523 0 120 4.47715 120 10V30C120 35.5228 124.477 40 130 40C135.523 40 140 35.5228 140 30V10C140 4.47715 144.477 0 150 0H210C215.523 0 220 4.47715 220 10V90C220 95.5228 215.523 100 210 100H150C144.477 100 140 95.5228 140 90V70C140 64.4772 135.523 60 130 60C124.477 60 120 64.4772 120 70V90C120 95.5228 115.523 100 110 100H10C4.47715 100 0 95.5228 0 90V10C0 4.47715 4.47715 0 10 0Z" fill="#FD6565CC" />

                                <circle cx="60" cy="20" r="5" fill="#141414" />
                                <circle cx="60" cy="50" r="5" fill="#141414" />
                                <circle cx="60" cy="80" r="5" fill="#141414" />
                                <line x1="130" y1="5" x2="130" y2="35" stroke="#141414" strokeWidth="2" strokeDasharray="4 4" />
                                <line x1="130" y1="65" x2="130" y2="95" stroke="#141414" strokeWidth="2" strokeDasharray="4 4" />

                                <g transform="translate(125, 25) rotate(15)">
                                    <path d="M0 25C0 11.1929 11.1929 0 25 0H85C90.5228 0 95 4.47715 95 10V40C95 45.5228 90.5228 50 85 50H25C11.1929 50 0 38.8071 0 25Z" fill="#D4AF37" />
                                    <circle cx="25" cy="25" r="8" fill="#141414" />
                                    <text x="60" y="35" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="bold" fontSize="28" fill="#141414" textAnchor="middle">₩</text>
                                </g>
                            </g>

                            <text x="260" y="105" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="900" fontSize="80" letterSpacing="-2">
                                <tspan fill="#FFFFFF">Review</tspan>
                                <tspan fill="#D4AF37">Tag</tspan>
                            </text>
                        </svg>
                    </Link>
                </div>
            </div>

            {/* 검색영역 */}
            <div className="row mt-4 justify-content-center">
                <div className="col-12 col-md-5 d-flex text-nowrap">
                    <div className="input-group search-wrapper">
                        {/* 검색창 */}
                        <input type="text" className="search form-control search-bar text-light" value={query}
                            placeholder="제목" onChange={e => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} />
                        {/* 검색 버튼 */}
                        <button className="search btn btn-success" onClick={handleSearch}
                        >
                            <FaSearch className="fs-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="row mt-5 genre-form">
                <div className="col p-4 rounded">
                    {genre.map(genreDto => (
                        <div className="btn me-2 mt-2" key={genreDto.genreId}>
                            <Link to={`/contents/genreList/listByGenre/${genreDto.genreName}`} className="genreLink" >
                                {genreDto.genreName}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="row mt-4">
            <div className="col">
                <Outlet />
            </div>
        </div>
    </>)
}
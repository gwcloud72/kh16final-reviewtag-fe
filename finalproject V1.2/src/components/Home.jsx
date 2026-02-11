import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link, useNavigate } from "react-router-dom";
import "./MenuForSearch.css";
import "./Home.css";
import { ImEyePlus } from "react-icons/im";
import { FaSearch } from "react-icons/fa";


const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function Home() {

    // 슬라이드 setting (반응형)
    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        autoplay: true,
        autoplaySpeed: 4000,
        responsive: [ // 화면 크기에 따른 설정
            {
                breakpoint: 1024,
                settings: { slidesToShow: 3, slidesToScroll: 3 }
            },
            {
                breakpoint: 768,
                settings: { slidesToShow: 2, slidesToScroll: 2 }
            },
            {
                breakpoint: 480,
                settings: { slidesToShow: 1, slidesToScroll: 1 }
            }
        ]
    };

    const navigate = useNavigate();

    //검색어 state
    const [query, setQuery] = useState("");

    //state
    const [tvList, setTvList] = useState([]);
    const [movieList, setMovieList] = useState([]);
    const [rateList, setRateList] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    //effect
    useEffect(() => {
        loadTVData();
        loadMovieData();
        loadRateData();
        loadPriceData();
    }, []);

    //callback

    //[입력창 제어 및 검색이동]
    const handleSearch = useCallback(() => {
        if (query.trim().length === 0) return;
        // 검색어와 함께 결과 페이지로 이동
        navigate(`/contents/searchResult/${query}`);
        setQuery(""); // 입력창 비우기 (선택사항)
    }, [query, navigate]);


    const loadTVData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("/api/tmdb/contents/list/tv");
            const tvlist = [
                ...data.map(tv => ({ ...tv }))
            ];
            setTvList(tvlist);
        }
        catch (error) {
            console.log("에러발생 : ", error);
        }
        setIsLoading(false);

    }, []);
    const loadMovieData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("/api/tmdb/contents/list/movie");
            const movielist = [
                ...data.map(movie => ({ ...movie }))
            ];
            setMovieList(movielist);
        }
        catch (error) {
            console.log("에러발생 : ", error);
        }
        setIsLoading(false);
    }, []);
    const loadRateData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("/api/tmdb/contents/rank/rate");
            const ratelist = [
                ...data.map(rate => ({ ...rate }))
            ];
            setRateList(ratelist);
            // console.log("불러온 데이터: ", data);
        }
        catch (error) {
            console.log("에러발생 : ", error);
        }
        setIsLoading(false);
    }, []);
    const loadPriceData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get("/api/tmdb/contents/rank/price");
            const pricelist = [
                ...data.map(price => ({ ...price }))
            ];
            setPriceList(pricelist);
        }
        catch (error) {
            console.log("에러발생 : ", error);
        }
        setIsLoading(false);
    }, []);

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ?
            `${TMDB_IMAGE_BASE_URL}${path}`
            :
            'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    //[방영일 format 함수]
    const getFormattedDate = useCallback((text) => {
        return text.substr(0, 10);
    }, []);

    //[카드 렌더링 함수]
    const renderCard = (content) => (
        <div key={content.contentsId} className="px-2 mb-4 mt-2">
            <div className="card h-100 text-white content-wrapper" style={{ backgroundColor: "#212529" }}>
                <Link className="text-decoration-none link-body-emphasis" to={`/contents/detail/${content.contentsId}`}>
                    {/* 이미지 & 뱃지 영역 */}
                    <div className="position-relative">
                        <img src={getPosterUrl(content.contentsPosterPath)}
                            className="card-img-top"
                            alt={content.contentsTitle}
                            style={{ height: "350px", objectFit: "cover" }} />
                        {/* 북마크 수 뱃지 */}
                        <div className="position-absolute top-0 end-0 m-2 px-2 py-2 rounded bg-black bg-opacity-75 text-white shadow-sm"
                            style={{ fontSize: "0.9rem", backdropFilter: "blur(2px)" }}>
                            <span className="fw-bold fs-5">
                                <ImEyePlus className="text-info me-1 mb-1" />
                                {content.contentsLike ? content.contentsLike.toLocaleString() : 0}
                            </span>
                        </div>
                    </div>
                    <div className="card-body shadow">
                        <h5 className="card-title text-truncate text-light">{content.contentsTitle}</h5>
                        <p className="card-text">
                            <small className="text-secondary">{getFormattedDate(content.contentsReleaseDate)}</small>
                            <br />
                            <span className="badge bg-warning text-dark me-1">
                                {content.contentsType}
                            </span>
                            {content.genreNames && content.genreNames.slice(0, 2).map((g, index) => (
                                <span key={index} className="badge bg-secondary me-1">
                                    {g}
                                </span>
                            ))}
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );


    //[카드 렌더링 함수]
    const renderRateRankCard = (content) => (
        <div key={content.contentsId} className="px-2 mb-4 mt-2">
            <div className="card h-100 text-white content-wrapper" style={{ backgroundColor: "#212529" }}>
                <Link className="text-decoration-none link-body-emphasis" to={`/contents/detail/${content.contentsId}`}>
                    {/* 이미지 & 뱃지 영역 */}
                    <div className="position-relative">
                        <img src={getPosterUrl(content.contentsPosterPath)}
                            className="card-img-top"
                            alt={content.contentsTitle}
                            style={{ height: "350px", objectFit: "cover" }} />
                        {/* 랭킹 뱃지 영역 (이미지 내부) */}
                        <div className="position-absolute top-0 start-0 m-0 p-0">
                            <div className="bg-black bg-opacity-75 text-danger d-flex align-items-center justify-content-center shadow"
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderBottomRightRadius: "8px",
                                    backdropFilter: "blur(2px)"
                                }}>
                                {/* 숫자 스타일: 굵고 크게 */}
                                <span className="fw-bold fs-4">
                                    {content.contentsRateRank}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="card-body shadow">
                        <h5 className="card-title text-truncate text-light">{content.contentsTitle}</h5>
                        <p className="card-text">
                            <small className="text-secondary">{getFormattedDate(content.contentsReleaseDate)}</small>
                            <br />
                            <span className="badge bg-warning text-dark me-1">
                                {content.contentsType}
                            </span>
                            {content.genreNames && content.genreNames.slice(0, 2).map((g, index) => (
                                <span key={index} className="badge bg-secondary me-1">
                                    {g}
                                </span>
                            ))}
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );

    //[카드 렌더링 함수]
    const renderPriceRankCard = (content) => (
        <div key={content.contentsId} className="px-2 mb-4 mt-2">
            <div className="card h-100 text-white content-wrapper" style={{ backgroundColor: "#212529" }}>
                <Link className="text-decoration-none link-body-emphasis" to={`/contents/detail/${content.contentsId}`}>
                    {/* 이미지 & 뱃지 영역 */}
                    <div className="position-relative">
                        <img src={getPosterUrl(content.contentsPosterPath)}
                            className="card-img-top"
                            alt={content.contentsTitle}
                            style={{ height: "350px", objectFit: "cover" }} />
                        {/* 랭킹 뱃지 영역 (이미지 내부) */}
                        <div className="position-absolute top-0 start-0 m-0 p-0">
                            <div className="bg-black bg-opacity-75 text-danger d-flex align-items-center justify-content-center shadow"
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderBottomRightRadius: "8px",
                                    backdropFilter: "blur(2px)"
                                }}>
                                {/* 숫자 스타일: 굵고 크게 */}
                                <span className="fw-bold fs-4">
                                    {content.contentsPriceRank}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="card-body shadow">
                        <h5 className="card-title text-truncate text-light">{content.contentsTitle}</h5>
                        <p className="card-text">
                            <small className="text-secondary">{getFormattedDate(content.contentsReleaseDate)}</small>
                            <br />
                            <span className="badge bg-warning text-dark me-1">
                                {content.contentsType}
                            </span>
                            {content.genreNames && content.genreNames.slice(0, 2).map((g, index) => (
                                <span key={index} className="badge bg-secondary me-1">
                                    {g}
                                </span>
                            ))}
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );


    return (<>
        <div className="container mt-2">

            <div className="row">
                <div className="col d-flex justify-content-center text-nowrap">
                    <Link className="text-decoration-none link-body-emphasis" to="/">
                        <svg width="100%"
                            viewBox="0 0 750 150"
                            style={{ maxWidth: "800px" , height:"auto"}}
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


            {/* 별점 랭킹 슬라이더 */}
            <div className="mt-5">
                <h3 className="mb-4 text-white">⭐️ TOP 10 컨텐츠</h3>
                <div className="p-2 pt-3 rounded series-wrapper" >
                    {rateList.length > 0 ? (
                        <Slider {...settings}>
                            {rateList.map((rate) => renderRateRankCard(rate))}
                        </Slider>
                    ) : (
                        <p className="text-white">로딩 중이거나 데이터가 없습니다.</p>
                    )}
                </div>
            </div>

            <div className="row mt-4">
                <div className="col">

                </div>
            </div>

            {/* 가격 랭킹 슬라이더 */}
            <div className="mt-4">
                <h3 className="mb-4 text-white">💰 TOP 10 컨텐츠</h3>
                <div className="p-2 pt-3 rounded series-wrapper" >
                    {priceList.length > 0 ? (
                        <Slider {...settings}>
                            {priceList.map(price => renderPriceRankCard(price))}
                        </Slider>
                    ) : (
                        <p className="text-white">로딩 중이거나 데이터가 없습니다.</p>
                    )}
                </div>
            </div>

            <div className="row mt-4">
                <div className="col">

                </div>
            </div>

            {/* TV 시리즈 슬라이더 */}
            <div className="mt-4">
                <h3 className="mb-4 text-white">📺 최신 TV 시리즈</h3>
                <div className="p-2 pt-3 rounded series-wrapper" >
                    {tvList.length > 0 ? (
                        <Slider {...settings}>
                            {tvList.map(tv => renderCard(tv))}
                        </Slider>
                    ) : (
                        <p className="text-white">로딩 중이거나 데이터가 없습니다.</p>
                    )}
                </div>
            </div>

            <div className="row mt-4">
                <div className="col">

                </div>
            </div>

            {/*  영화 슬라이더 */}
            <div className="mt-4">
                <h3 className="mb-4 text-white">🎬 최신 영화</h3>
                <div className="p-2 pt-3 rounded  series-wrapper">
                    {movieList.length > 0 ? (
                        <Slider {...settings}>
                            {movieList.map(movie => renderCard(movie))}
                        </Slider>
                    ) : (
                        <p className="text-white">로딩 중이거나 데이터가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    </>)
}
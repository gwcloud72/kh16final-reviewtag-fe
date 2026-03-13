import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";


const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function SlideContents() {
    // 슬라이드 setting (반응형 추가)
    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        autoplay: true,
        autoplaySpeed: 500,
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

    //state
    const [tvList, setTvList] = useState([]);
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    //effect
    useEffect(() => {
        loadTVData();
        loadMovieData();
    }, []);

    //callback
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

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ?
            `${TMDB_IMAGE_BASE_URL}${path}`
            :
            'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    const getFormattedDate = useCallback((text) => {
        return text.substr(0, 10);
    }, []);

    // [추가] 카드 렌더링을 위한 헬퍼 함수 (코드 중복 방지)
    const renderCard = (content) => (
        // [중요] Slider 바로 아래 div에는 col- 클래스를 쓰지 않고 px-2로 간격만 줍니다.
        <div key={content.contentsId} className="px-2 mb-4">
            <div className="card h-100 text-white shadow" style={{ backgroundColor: "#2C3A47" }}>
                <Link className="text-decoration-none link-body-emphasis" to={`/contents/detail/${content.contentsId}`}>
                    <img
                        src={getPosterUrl(content.contentsPosterPath)}
                        className="card-img-top"
                        alt={content.contentsTitle}
                        style={{ height: "350px", objectFit: "cover" }}
                    />
                    <div className="card-body">
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
        <div className="container mt-4"> {/* 전체 컨테이너 추가 */}

            {/* 1. TV 시리즈 슬라이더 */}
            <div className="mb-5">
                <h3 className="mb-3 text-white">📺 인기 TV 시리즈</h3>
                {tvList.length > 0 ? (
                    <Slider {...settings}>
                        {tvList.map(tv => renderCard(tv))}
                    </Slider>
                ) : (
                    <p className="text-white">로딩 중이거나 데이터가 없습니다.</p>
                )}
            </div>

            {/* 2. 영화 슬라이더 */}
            <div className="mb-5">
                <h3 className="mb-3 text-white">🎬 최신 영화</h3>
                {movieList.length > 0 ? (
                    <Slider {...settings}>
                        {movieList.map(movie => renderCard(movie))}
                    </Slider>
                ) : (
                    <p className="text-white">로딩 중이거나 데이터가 없습니다.</p>
                )}
            </div>
        </div>

    </>)
}
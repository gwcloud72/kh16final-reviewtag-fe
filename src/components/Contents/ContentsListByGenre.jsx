import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { throttle, debounce } from "lodash";
import { FaRegEye } from "react-icons/fa6";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function ContentsListByGenre() {
    //경로변수 
    const { genreName } = useParams();//장르 id


    //state
    //contents 목록
    const [contentsList, setContentsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    //무한스크롤 페이지네이션
    const [page, setPage] = useState(1);//페이지번호
    const [info, setInfo] = useState({
        page: 0, size: 0, begin: 0, end: 0, count: 0, last: true
    });


    const requestRef = useRef(false);
     const loading = useRef(false);

    //effect
    useEffect(() => {
        if (genreName) {
            loadData();
        }
    }, [genreName, page]);

    useEffect(() => {
        setPage(1);
        setContentsList([]);
        loading.current = false;
        setIsLoading(true);
        window.scrollTo(0, 0);
    }, [genreName]);

    //최초 1회 실행하여 window에 스크롤 이벤트를 추가
    useEffect(() => {
        const listener = throttle(e => {
            const percent = getScrollPercent();

            //if(percent >= 90 && loading.current === false) {//90%↑ + 로딩중이 아닌경우 (문제없음)
            if (percent >= 90 && loading.current === false) {//100% + 로딩중이 아닌 경우 (?)
                setPage(prev => prev + 1);//page를 직전값+1로 변경 (=다음페이지)
            }
        }, 500);

        window.addEventListener("scroll", listener);

        //effect cleanup 함수 - 이펙트가 종료되는 시점에 실행할 코드를 작성
        return () => {
            window.removeEventListener("scroll", listener);
        };
    }, []);

    //callback
    const loadData = useCallback(async () => {
        //중복요청 방지
        if (requestRef.current) return;
        requestRef.current = true;

        try {
            if (page === 1) setIsLoading(true);

            const response = await axios.get(`/api/tmdb/contents/list/${genreName}`, { params: { page: page } });

            if (page === 1) {//첫페이지면
                setContentsList(response.data);

            }
            else {//첫페이지가 아니면
                setContentsList(prev => ([...prev, ...response.data]));//연관항목 없이도 가능한 코드
            }
            //페이지 번호와 목록 데이터를 제외한 나머지를 info에 저장

            //response.data에서 list 빼고 others라고 부르겠다
            const { list, ...others } = response.data;
            setInfo(others);

        } catch (error) {
            console.error("데이터 로드 실패:", error);
        } finally {
            setIsLoading(false);
            requestRef.current = false;
        }
    }, [genreName, page]);

    /**
     * 현재 윈도우 스크롤 위치를 0-100 사이의 백분율로 반환합니다.
     * (useCallback으로 메모이제이션됨)
     */
    const getScrollPercent = useCallback(() => {
        // 현재 스크롤 Y 위치
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        // 문서 전체의 스크롤 가능한 총 높이
        const scrollHeight = document.documentElement.scrollHeight;

        // 브라우저 뷰포트(창)의 높이
        const clientHeight = document.documentElement.clientHeight;

        // 스크롤이 불가능한 경우 (콘텐츠가 창보다 작음) 0 반환
        if (scrollHeight <= clientHeight) {
            return 0;
        }

        // 스크롤 가능한 실제 최대 높이 (전체 높이 - 보이는 높이)
        const scrollableHeight = scrollHeight - clientHeight;

        // 부동 소수점 오차 보정: 
        // 스크롤 가능한 최대 높이와 현재 스크롤 위치의 차이가 1px 미만이면 100%로 간주
        if (scrollableHeight - scrollTop < 1) {
            return 100;
        }

        // (현재 스크롤 위치 / 스크롤 가능한 최대 높이) * 100
        const percentage = (scrollTop / scrollableHeight) * 100;

        return percentage;
    }, []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시 한 번만 생성됩니다.

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


    return (<>
        {isLoading && page === 1 ? (
            <div className="text-center mt-5 text-white">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="mt-3">🎬 콘텐츠를 불러오는 중입니다...</h4>
            </div>
        ) : (
            <div className="container">
                <div className="row mt-4">
                    <div className="col">
                        <h3 className="text-light">🎬 '{genreName}' 부문 컨텐츠 </h3>
                    </div>
                </div>
                <div className="row mt-4">
                    {contentsList.length === 0 ? (
                        <div className="col">
                            <p>해당 장르의 콘텐츠가 없습니다.</p>
                        </div>
                    ) : (
                        contentsList.map((content) => (

                            <div className="col-6 col-md-3 mb-3" key={content.contentsId}>
                                <div className="card h-100 bg-dark text-white border-secondary">
                                    <Link className="text-decoration-none link-body-emphasis" to={`/contents/detail/${content.contentsId}`} >
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
                                                    <FaRegEye className="text-info me-2 mb-1" />
                                                    {content.contentsLike ? content.contentsLike.toLocaleString() : 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <h5 className="card-title text-truncate text-light">{content.contentsTitle}</h5>
                                            <p className="card-text">
                                                <small className="text-secondary">{getFormattedDate(content.contentsReleaseDate)}</small>
                                                <br />
                                                <span className="badge bg-warning text-dark me-1">
                                                    {content.contentsType}
                                                </span>
                                                {/* 장르 목록 표시 (collection으로 가져온 데이터) */}
                                                {content.genreNames && content.genreNames.map((g, index) => (
                                                    <span key={index} className="badge bg-secondary me-1">
                                                        {g}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                        ))
                    )}
                </div>

            </div>

        )}


    </>)
}

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom";
import "./contents.css";
import "./SearchAndSave.css";



const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";


const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: "", contentsType: "",
    contentsOverview: "", contentsPosterPath: "", contentsBackdropPath: "",
    contentsVoteAverage: 0, contentsRuntime: 0, contentsReleaseDate: "",
    contentsDirector: "", contentsMainCast: "", genreNames: [],
};

export default function SearchAndSave() {
    //검색어 state
    const [query, setQuery] = useState("");
    //검색결과 state
    const [resultList, setResultList] = useState([]);
    //사용자가 선택한 영화 정보 state
    const [contentsDetail, setContentsDetail] = useState(INITIAL_DETAIL);
    //영화를 선택했는지 안했는지 여부를 저장하는 state
    const [isSelect, setIsSelect] = useState(false);
    //영화 로딩 상태 state
    const [isLoading, setIsLoading] = useState(false);
    //상태 메세지 state
    const [statusMessage, setStatusMessage] = useState("");

    const navigate = useNavigate();

    //callback

    //[입력창 제어]
    const changeStrValue = useCallback(e => {
        setQuery(e.target.value);
        if (e.target.value.length === 0) {
            setResultList([]);
        }
    }, []);

    //[검색 실행 statusMessage 제어]
    const handleSearch = useCallback(async () => {
        if (query.trim().length === 0) {
            setResultList([]);
            return;
        }

        setIsLoading(true);
        setStatusMessage("TMDB에서 컨텐츠 검색 중..");
        setResultList([]);

        try {
            const response = await axios.get("/api/tmdb/search", { params: { query } });
            //검색결과 리스트 state에 저장
            setResultList(response.data);

            if (response.data.length === 0) {
                setStatusMessage(`"${query}" 와 일치하는 검색 결과를 찾을 수 없습니다.`);
            }
            else {
                setStatusMessage(`"${query}" 에 대한 검색 결과 : ${response.data.length} 개`);
            }
        }
        catch (error) {
            console.error("오류발생 : ", error);
            setStatusMessage("검색 중 서버 오류 발생");
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);

    // [컨텐츠 선택 및 DB저장]
    const handleSelectAndSave = useCallback(async (contents) => {

        setIsLoading(true);

        setIsSelect(true);//리스트 숨김을 위해 state 변경

        try {
            //데이터 restController로 전송
            const response = await axios.post("/api/tmdb/save", {
                contentsId: contents.contentsId,
                type: contents.type
            });

            //응답 데이터 상세정보 업데이트
            setContentsDetail(response.data);
            setIsSelect(true);

            //선택한 영화에 따른 리뷰화면
            const newContentsId = response.data.contentsId;
            navigate(`review/${newContentsId}`)
        }
        catch (error) {
            console.error("저장 API 오류 : ", error);
            setIsSelect(false); //저장 실패 시 리스트를 다시 보여주기 위한 처리 
        }
        finally {
            setIsLoading(false);
        }
    }, [navigate]);

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    //Effect
    //초기화 및 상태관리
    useEffect(() => {
        //컴포넌트 마운트 또는 isSelect false로 바뀔 때 상세 정보 초기화
        if (!isSelect) {
            setContentsDetail(INITIAL_DETAIL);
        }
    }, [isSelect]);

    //Memo
    //장르 목록을 react 엘리먼트로 변환하는 함수
    const renderGenres = useMemo(() => {
        if (!contentsDetail.genreNames || contentsDetail.genreNames.length === 0) {
            return <span className="text-muted">장르 정보 없음</span>;
        }
        return contentsDetail.genreNames.map((name, index) => (
            <span key={index} className="text-muted me-1">
                {name}
            </span>
        ));
    }, [contentsDetail.genreNames]);


    //render
    return (<>
        {/* 검색/검색 결과 영역 (isSelect가 false 일 때만 표시) */}
        <div className="container">
            {!isSelect && (
                <div>

                    {/* 검색영역 */}
                    <div className="row mt-4">
                        <div className="col d-flex flex-wrap text-nowrap mt-2">
                            {/* 검색창 */}
                            <input type="text" className="form-control w-auto" value={query}
                                placeholder="제목 입력" onChange={changeStrValue}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} />
                            {/* 검색 버튼 */}
                            <button className="search btn btn-success ms-2" onClick={handleSearch}
                                disabled={isLoading || query.trim().length === 0}>
                                검색
                            </button>
                        </div>
                    </div>

                    {/* 상태 메세지 */}
                    <div className="row mt-2">
                        <div className="col">
                            <p>{statusMessage}</p>
                        </div>
                    </div>

                    {/* 검색결과 리스트 */}
                    <div className="row">
                        <div className="col">
                            {resultList.length > 0 ? (
                                resultList.map(result => (
                                    <div className="simple-item" key={result.contentsId}
                                        onClick={() => handleSelectAndSave(result)}>
                                        <div className="d-flex align-items-center">
                                            {/* 작은 썸네일 */}
                                            <img src={getPosterUrl(result.posterPath)}
                                                alt={result.title}
                                                style={{ width: "60px", height: "85px", objectFit: "cover", borderRadius: "4px" }}
                                                className="me-3" />
                                            {/* 정보 */}
                                            <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0은 텍스트 말줄임표 필수 속성 */}
                                                <div className="text-light fw-bold text-truncate">{result.title}</div>
                                                <div className="text-light small">
                                                    {result.type} • {result.releaseDate}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (<span> 검색어를 입력하고 컨텐츠를 찾아보세요 </span>)}

                        </div>
                    </div>
                </div>
            )}

            {/* 상세정보 영역 (isSelect가 true일 때만 표시)*/}
            <div>
                {/* 상태메세지 */}
                {isLoading && (
                    <div>
                        <span>{statusMessage}</span>
                    </div>
                )}
                {/* 상세정보 카드 */}
                {!isLoading && contentsDetail.contentsId && (
                    <div className="row mt-4 p-4 shadow rounded">
                        {/* 이미지 영역 */}
                        <div className="col-4 col-sm-3">
                            <img src={getPosterUrl(contentsDetail.contentsPosterPath)} style={{ height: "350px", objectFit: "cover", borderRadius: "4px", }}
                                alt={`${contentsDetail.contentsTitle} 포스터`} className="text-center w-100"/>
                        </div>
                        {/* 텍스트 영역 */}
                        <div className="col-7 col-sm-9">
                            <div>
                                <h3>{contentsDetail.contentsTitle}</h3>
                            </div>
                            <div className="text-muted">
                                <span>{contentsDetail.contentsType} • {contentsDetail.contentsRuntime} 분</span>
                            </div>
                            <div className="text-muted">
                                장르 : {renderGenres}
                            </div>
                            <div className="text-muted">
                                방영일 : {contentsDetail.contentsReleaseDate}
                            </div>
                            <div className="text-muted">
                                평점 : {contentsDetail.contentsVoteAverage.toFixed(1)} / 10
                            </div>
                            <div className="mt-3">
                                <h5>줄거리</h5>
                                <span className="text-muted break-word">
                                    {contentsDetail.contentsOverview}
                                </span>
                            </div>
                        </div>
                        <div className="col-1 col-sm-1 text-end">
                            <button onClick={() => setIsSelect(false)} className="btn btn-danger">x</button>
                        </div>
                    </div>
                )}

                {/* 리뷰 중첩라우팅 적용 */}
                <div className="row mt-4">
                    <div className="col">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    </>)
}

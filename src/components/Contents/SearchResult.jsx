import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./SearchAndSave.css";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function SearchResult() {
    // 1. URL 파라미터 가져오기
    const { query } = useParams();

    const [resultList, setResultList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const navigate = useNavigate();

    // 2. 포스터 URL 생성 함수
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    // 3. 검색 실행 함수
    const handleSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length === 0) return;

        setIsLoading(true);
        setStatusMessage("TMDB에서 컨텐츠 검색 중..");
        setResultList([]);

        try {
            const response = await axios.get("/api/tmdb/search", { params: { query: searchQuery } });
            setResultList(response.data);

            if (response.data.length === 0) {
                setStatusMessage(`"${searchQuery}" 와 일치하는 검색 결과를 찾을 수 없습니다.`);
            } else {
                setStatusMessage(`"${searchQuery}" 에 대한 검색 결과 : ${response.data.length} 개`);
            }
        } catch (error) {
            console.error("오류발생 : ", error);
            setStatusMessage("검색 중 서버 오류 발생");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 4. query 변경 시 자동 검색
    useEffect(() => {
        if (query) {
            handleSearch(query);
        }
    }, [query, handleSearch]);

    // 5. [핵심 수정] 컨텐츠 선택 시 -> DB 저장 후 -> 상세 페이지로 이동
    const handleSelectAndSave = useCallback(async (contents) => {
        // 이미 로딩중이면 중복 클릭 방지
        if(isLoading) return; 
        
        setIsLoading(true);

        try {
            // (1) DB에 저장 (또는 업데이트) 요청
            const response = await axios.post("/api/tmdb/save", {
                contentsId: contents.contentsId,
                type: contents.type
            });

            // (2) 저장된 컨텐츠의 ID를 받아서 상세 페이지로 이동
            // response.data에는 저장된 ContentsDetailDto가 들어있다고 가정
            const savedContentsId = response.data.contentsId;
            
            navigate(`/contents/detail/${savedContentsId}`);

        } catch (error) {
            console.error("저장 및 이동 실패 : ", error);
            alert("컨텐츠 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, navigate]);


    return (
        <div className="container">
            {/* 리스트 화면 */}
            <div>
                <div className="row mt-5">
                    <div className="col">
                        <p className="text-light fs-4">{statusMessage}</p>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        {resultList.length > 0 ? (
                            resultList.map(result => (
                                // 클릭 시 handleSelectAndSave 실행
                                <div className="simple-item" key={result.contentsId} onClick={() => handleSelectAndSave(result)}>
                                    <div className="d-flex align-items-center">
                                        <img src={getPosterUrl(result.posterPath)}
                                            alt={result.title}
                                            style={{ width: "70px", height: "95px", objectFit: "cover", borderRadius: "4px" }}
                                            className="me-3" />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="text-light fw-bold fs-5 text-truncate">{result.title}</div>
                                            <div className="text-light">
                                                {result.type} • {result.releaseDate}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="text-light">검색 결과를 기다리는 중...</span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 로딩 표시 (화면 전체를 덮거나 버튼 비활성화 등 처리가 필요하면 추가) */}
            {isLoading && (
                <div className="text-center mt-3">
                    <span className="text-light spinner-border spinner-border-sm me-2"></span>
                    <span className="text-light">상세 페이지로 이동 중...</span>
                </div>
            )}
        </div>
    );
}
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Link, useNavigate } from "react-router-dom";
import { accessTokenState, adminState, clearLoginState, loginCompleteState, loginIdState, loginLevelState, loginState } from "../utils/jotai";
import "./MenuForSearch.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useRef } from "react";
import { MdMovie } from "react-icons/md";
import axios from "axios";


export default function ManuForSearch() {
    const navigate = useNavigate();

    //통합 state
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginLevel, setLoginLevel] = useAtom(loginLevelState);
    const [loginComplete, setLoginComplete] = useAtom(loginCompleteState);
    const [accessToken, setAccessToken] = useAtom(accessTokenState);
    const isLogin = useAtomValue(loginState);
    const isAdmin = useAtomValue(adminState);
    const clearLogin = useSetAtom(clearLoginState);

    //검색어 state
    const [query, setQuery] = useState("");

    //effect
    useEffect(() => {
        if (accessToken?.length > 0) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        setLoginComplete(true);
    }, [accessToken]);

    //[입력창 제어 및 검색이동]
    const handleSearch = useCallback(() => {
        if (query.trim().length === 0) return;
        // 검색어와 함께 결과 페이지로 이동
        navigate(`/contents/searchResult/${query}`);
        setQuery(""); // 입력창 비우기 (선택사항)
    }, [query, navigate]);


    return (<>
        <div className="sub-navbar p-4">
            
                
                {/* 검색영역 */}
                <div className="row justify-content-center">
                    <div className="col-12 col-md-5 d-flex text-nowrap">
                        <div className="mt-3 input-group search-wrapper">
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

                {/* 장르별 영화 목록
                <Link className="text-decoration-none sub-link" to="/contents/genreList"><span><MdMovie className="me-1 mb-1" /> 장르</span></Link> */}




            
        </div>

    </>)


}
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Link, useNavigate } from "react-router-dom"
import { accessTokenState, adminState, clearLoginState, heartState, loginCompleteState, loginIdState, loginLevelState, loginState , pointRefreshAtom} from "../utils/jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import './Menu.css'
import { MdLiveTv, MdMovie } from "react-icons/md";
import { FaHeart, FaGear, FaRankingStar } from "react-icons/fa6";
import { FaClipboardList, FaHome } from "react-icons/fa";


export default function Menu() {
    const navigate = useNavigate();

    //통합 state
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginLevel, setLoginLevel] = useAtom(loginLevelState);
    const [loginComplete, setLoginComplete] = useAtom(loginCompleteState);
    const [accessToken, setAccessToken] = useAtom(accessTokenState);
    const isLogin = useAtomValue(loginState);
    const isAdmin = useAtomValue(adminState);
    const clearLogin = useSetAtom(clearLoginState);

    //하트 가져오기
    const [heart, setHeart] = useAtom(heartState);
     const [pointRefresh] = useAtom(pointRefreshAtom);
    //effect
    useEffect(() => {
        if (accessToken?.length > 0) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        setLoginComplete(true);
    }, [accessToken]);

    //로그인 성공 시, 내 정보 불러오기
    useEffect(() => {
        if (isLogin && loginId) {
            loadMemberData();
        }
    }, [isLogin, loginId, pointRefresh]);

    //callback
    //내 정보 가져오는 함수
    const loadMemberData = useCallback(async () => {

        //비로그인일때는 불러오지 않음
        if (!loginId || !accessToken) return;

        //보유중인 하트 개수 불러오기
        try {
            const { data } = await axios.get(`/heart/`);

            if (data.heartCount !== undefined) {
                setHeart(data.heartCount);
            } else {
                setHeart(5);
            }
        } catch (error) {
            console.error("내 정보 불러오기 실패:", error);
        }
    }, [loginId, accessToken, setHeart]);

    //로그아웃
    const logout = useCallback(async (e) => {
        e.stopPropagation();
        e.preventDefault();
        clearLogin();
        await axios.delete("/member/logout");
        delete axios.defaults.headers.common['Authorization'];
        navigate("/");

        closeMenu();
    }, []);

    //메뉴가 정상적으로 닫히지 않는 현상에 대한 해결 (좁은 폭인 경우)
    const [open, setOpen] = useState(false);
    const toggleMenu = useCallback(() => { setOpen(prev => !prev); }, []);

    //메뉴 및 외부 영역 클릭 시 메뉴가 닫히도록 처리하는 코드
    const closeMenu = useCallback(() => {
        setOpen(false);
    }, []);
    const menuRef = useRef();
    useEffect(() => {
        //클릭 감지 함수
        const listener = e => {
            if (open === true && menuRef.current.contains(e.target) === false) {
                closeMenu();
            }
        };
        window.addEventListener("mousedown", listener);
        return () => {//clean up 함수
            window.removeEventListener("mousedown", listener);
        };
    }, [open]);


    return (<>

        <nav className="navbar navbar-expand-lg  text-light cinema-navbar fixed-top" data-be-theme="dark"
            ref={menuRef}>
            <div className="container-fluid">

                {/* 브랜딩 텍스트(이미지) : 메뉴 가장 좌측에 나오는 로고 또는 텍스트 */}
                <Link className="navbar-brand cinema-brand text-light" to="/" onClick={closeMenu}>
                    <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="100" cy="100" r="96" fill="#3dc1d3" />
                        <path d="M130 40H70C58.9543 40 50 48.9543 50 60V140C50 151.046 58.9543 160 70 160H130C141.046 160 150 151.046 150 140V60C150 48.9543 141.046 40 130 40Z" fill="#E94560" />
                        <circle cx="100" cy="65" r="8" fill="#3dc1d3" />
                        <path d="M50 100H150" stroke="#3dc1d3" strokeWidth="4" strokeDasharray="8 8" />
                        <text x="100" y="135" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="40" fill="#1A1A2E" textAnchor="middle">₩</text>
                    </svg>
                </Link>

                {/* 토글버튼 */}
                <button className="navbar-toggler " type="button"
                    aria-controls="menu-body" aria-expanded="false" aria-label="Toggle navigation"
                    onClick={toggleMenu}>
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${open && 'show'}`} id="menu-body">
                    {/* 좌측 메뉴 */}
                    <ul className="navbar-nav me-auto">
                        {/* home */}
                        {/* <li className="nav-item" onClick={closeMenu}>
                            <Link className="nav-link" to="/">
                                <FaHome className="fs-4" />
                            </Link>
                        </li> */}
                        {/* contents */}
                        <li className="nav-item" onClick={closeMenu}>
                            <Link className="nav-link" to="/contents/genreList">
                                <MdLiveTv className="fs-4" />
                            </Link>
                        </li>
                        <li className="nav-item" onClick={closeMenu}>
                            <Link className="nav-link" to="/board/list">
                                <FaClipboardList className="fs-4" />
                                {/* <span>게시판</span> */}
                            </Link>
                        </li>
                        <li className="nav-item" onClick={closeMenu}>
                            <Link className="nav-link" to="/ranking">
                                <FaRankingStar className="fs-4" />
                                {/* <span>랭킹</span> */}
                            </Link>
                        </li>
                    </ul>
                    <ul className="navbar-nav ms-auto">
                        {/* 우측 메뉴 */}

                        {isLogin === true ? (<>  {/* 로그인 시 나와야 하는 화면 */}
                            {isAdmin === true ? (
                                <>
                                <li className="nav-item" onClick={closeMenu}>
                                    <Link className="nav-link" to="/point/main">
                                        <FaHeart className="text-danger me-2" />
                                        <span className="fw-bold text-light">{heart} / 5</span>
                                    </Link>
                                </li>
                                <li className="nav-item" onClick={closeMenu}>
                                    <Link className="nav-link" to={`/admin`}>
                                        <span><FaGear /></span>
                                    </Link>
                                </li>
                                </>
                            ) : (
                                <>
                                    {/* 하트 표시(누르면 포인트 상점으로 이동) */}
                                    <li className="nav-item" onClick={closeMenu}>
                                        <Link className="nav-link" to="/point/main">
                                            <FaHeart className="text-danger me-2" />
                                            <span className="fw-bold text-light">{heart} / 5</span>
                                        </Link>
                                    </li>
                                </>
                            )}

                            <li className="nav-item">
                                <Link className="nav-link" to={`/member/mypage/myinfo/${loginId}`} onClick={closeMenu}>
                                    <span>MY</span>
                                </Link>
                            </li>
                            <li className="nav-item" onClick={closeMenu}>
                                <Link className="nav-link" onClick={logout}>
                                    <span>로그아웃</span>
                                </Link>
                            </li>
                        </>) : (<>  {/* 비로그인 시 나와야 하는 화면 */}
                            <li className="nav-item" onClick={closeMenu}>
                                <Link className="nav-link" to="/member/login">
                                    <span>로그인</span>
                                </Link>
                            </li>
                            <li className="nav-item" onClick={closeMenu}>
                                <Link className="nav-link" to="/member/join">
                                    <span>회원가입</span>
                                </Link>
                            </li>
                        </>)}
                    </ul>
                </div>
            </div>
        </nav>
    </>)
}
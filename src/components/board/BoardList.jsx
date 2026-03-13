import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Board.css";
import Pagination from "../Pagination";
import { FaPen } from "react-icons/fa";
import { loginIdState } from "../../utils/jotai";
import { useAtom } from "jotai";

export default function BoardList() {
    //통합 state
    const [loginId, setLoginId] = useAtom(loginIdState);

    const navigate = useNavigate();

    const [boardList, setBoardList] = useState([]);
    const [titles, setTitles] = useState({});

    const [page, setPage] = useState(1);
    const [pageData, setPageData] = useState({
        page: 1, size: 10, totalCount: 0, totalPage: 0, blockStart: 1, blockFinish: 1
    });

    const [isOpen, setIsOpen] = useState(false);
    const [inputColumn, setInputColumn] = useState("title");
    const [inputKeyword, setInputKeyword] = useState("");

    const [searchParams, setSearchParams] = useState({
        column: "title",
        keyword: ""
    });


    const getColumnText = (col) => {
        switch (col) {
            case "title": return "제목";
            case "contents": return "컨텐츠";
            case "writer": return "작성자";
            default: return "제목";
        }
    };

    const formatWtime = (dateString) => {
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${mm}/${dd}`;
    };

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleTypeSelect = (type) => {
        setInputColumn(type);
        setIsOpen(false);
    };

    const loadAllTitles = useCallback(async (list) => {
        if (!list || list.length === 0) {
            return;
        }


        const newTitles = { ...titles };
        let hasUpdate = false;
        const promises = list.map(async (board) => {
            const id = board.boardContentsId;

            if (id && newTitles[id] === undefined) {
                try {
                    const { data } = await axios.get(`/api/tmdb/title/${id}`);
                    newTitles[id] = data;

                    hasUpdate = true;
                } catch (e) {
                    console.error(`제목 로딩 실패 (ID: ${id})`, e);
                    newTitles[id] = "알 수 없음";
                    hasUpdate = true;
                }
            }
        });

        await Promise.all(promises);

        if (hasUpdate) {
            setTitles(prev => ({ ...prev, ...newTitles }));
        }
    }, [titles]); // titles가 바뀔 때마다 갱신


    const loadBoard = useCallback(async () => {
        try {
            const { data } = await axios.get(`/board/page/${page}`, {
                params: {
                    column: searchParams.column,
                    keyword: searchParams.keyword
                }
            });

            const list = data.list || [];

            const formattedData = list.map(board => ({
                ...board,
                boardWtime: formatWtime(board.boardWtime)
            }));

            // 1. 목록 업데이트
            setBoardList(formattedData);
            setPageData(data.pageVO);

            // 2. 제목 업데이트 요청
            loadAllTitles(formattedData);

        } catch (e) {
            console.error("데이터 로드 실패", e);
        }
    }, [page, searchParams, loadAllTitles]);

    const handleSearch = () => {
        setPage(1);
        setSearchParams({
            column: inputColumn,
            keyword: inputKeyword
        });
    };

    useEffect(() => {
        loadBoard();
    }, [loadBoard]);


    return (
        <div className="container mt-5">
            <div className="d-flex align-items-center mb-4 mt-4">
                <h2 className="fw-bold text-white mb-0"
                    onClick={() => { navigate("/board/list") }}
                    style={{ cursor: "pointer" }}>
                    자유게시판
                </h2>
            </div>

            {/* 검색창 영역 */}
            <div className="row mt-2 d-flex justify-content-center">
                <div className="col-12 col-sm-6">
                    <div className="input-group">
                        <button
                            className="btn btn-outline-secondary dropdown-toggle text-white border-secondary"
                            type="button"
                            onClick={toggleDropdown}>
                            {getColumnText(inputColumn)}
                        </button>

                        <ul className={`dropdown-menu dropdown-menu-dark ${isOpen ? "show" : ""}`}>
                            <li><button className="dropdown-item" type="button" onClick={() => handleTypeSelect("title")}>제목</button></li>
                            <li><button className="dropdown-item" type="button" onClick={() => handleTypeSelect("contents")}>컨텐츠</button></li>
                            <li><button className="dropdown-item" type="button" onClick={() => handleTypeSelect("writer")}>작성자</button></li>
                        </ul>

                        <input
                            type="text"
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="검색어를 입력하세요"
                            value={inputKeyword}
                            onChange={e => setInputKeyword(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                        />

                        <button
                            className="btn btn-outline-secondary text-light"
                            type="button"
                            onClick={handleSearch}>
                            검색
                        </button>
                    </div>
                </div>
            </div>

            {loginId && (
            <div className="row">
                <div className="col text-end">
                    <Link className="btn btn-primary rounded-pill px-4 fw-bold" to="/board/insert">
                        <FaPen className="me-2" /> 작성하기
                    </Link>
                </div>
            </div>
            )}

            {/* 게시글 목록 테이블 */}
            <div className="shadow-sm border-0 rounded-4 overflow-hidden mt-4">
                <div className="table-responsive">
                    <table className="table table-dark table-hover text-center align-middle mb-0 text-white text-nowrap" style={{ borderColor: "#495057" }}>
                        <thead className="text-white">
                            <tr>
                                <th className="py-3" style={{ width: "15%" }}>컨텐츠</th>
                                <th className="py-3 text-start ps-4" style={{ width: "50%" }}>제목</th>
                                <th className="py-3">조회수</th>
                                <th className="py-3" style={{ width: "15%" }}>작성자</th>
                                <th className="py-3" style={{ width: "15%" }}>날짜</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boardList.map((board) => (
                                <tr
                                    key={board.boardNo}
                                    onClick={() => navigate(`/board/${board.boardNo}`)}
                                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                                    className="board-row"
                                >
                                    <td className="py-3 text-secondary">
                                        {/* 컨텐츠 ID가 있을 때 제목 표시 */}
                                        {board.boardContentsId ? (
                                            <span className="badge bg-secondary bg-opacity-25 text-light fw-normal border border-secondary border-opacity-25">
                                                {/* titles 객체에서 id에 해당하는 값 꺼내기 */}
                                                {titles[board.boardContentsId] || "Loading..."}
                                            </span>
                                        ) : <span className="text-muted">-</span>}
                                    </td>
                                    <td className="py-3 text-start ps-4 fw-medium">
                                        {board.boardTitle}
                                        {board.boardReplyCount > 0 && (
                                            <span className="ms-2 text-primary small fw-bold">[{board.boardReplyCount}]</span>
                                        )}
                                        {board.boardNotice === 'Y' && (
                                            <span className="ms-2 badge bg-danger">공지</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-light opacity-75">{board.boardViewCount}</td>
                                    <td className="py-3 text-light opacity-75">{board.boardWriter}</td>
                                    <td className="py-3 text-light opacity-75">{board.boardWtime}</td>
                                </tr>
                            ))}
                            {boardList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-5 text-muted">게시글이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="row mt-5">
                <div className="col d-flex justify-content-center">
                    <Pagination
                        page={page}
                        totalPage={pageData.totalPage}
                        blockStart={pageData.blockStart}
                        blockFinish={pageData.blockFinish}
                        onPageChange={setPage}
                    />
                </div>
            </div>
        </div>
    );
}
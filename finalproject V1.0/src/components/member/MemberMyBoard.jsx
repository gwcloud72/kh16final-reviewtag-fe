



import { useNavigate } from "react-router-dom";
import "./Member.css";
import { useCallback, useEffect, useState } from "react";
import Pagination from "../Pagination";
import axios from "axios";
import { useAtom } from "jotai";
import { loginIdState, loginNicknameState } from "../../utils/jotai";



export default function MemberMyBoard(){
    const navigate = useNavigate();
    
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginNickname, setLoginNickname] = useAtom(loginNicknameState);


    const [boardList, setBoardList] = useState([]);
    const [titles, setTitles] = useState({});
    
    const [page, setPage] = useState(1);
    const [pageData, setPageData] = useState({
        page: 1, size: 10, totalCount: 0, totalPage: 0, blockStart: 1, blockFinish: 1
    });

    const formatWtime = (dateString) => {
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${mm}/${dd}`;
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
        if (!loginId) return;
        try {
            const { data } = await axios.get(`/board/page/${page}`, {
                params: {
                    column: 'writer',
                    keyword: loginId
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
    }, [page, loginId, loadAllTitles]); 


    useEffect(() => {
        loadBoard();
    }, [loadBoard]); 

    //render
    return(<>
    <h1 className="text-center mt-4 mb-5"> {loginNickname}님의 <span className="text-info">작성 게시글</span></h1>
    <div className="container mt-5">
    {/* 게시글 목록 */}
        <div className="shadow-sm border-0 rounded-4 overflow-hidden mt-2">
            <div className="table-responsive">
                <table className="table table-dark table-hover text-center align-middle mb-0 text-white text-nowrap" style={{ borderColor: "#495057" }}>
                    <thead className="text-white">
                        <tr>
                            <th className="py-3" style={{ width: "15%" }}>컨텐츠</th>
                            <th className="py-3 text-start ps-4" style={{ width: "55%" }}>제목</th>
                            <th className="py-3" style={{ width: "15%" }}>조회수</th>
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
                                    {board.boardContentsId ? (
                                        <span className="badge bg-secondary bg-opacity-25 text-light fw-normal border border-secondary border-opacity-25">
                                            {titles[board.boardContentsId] || "Loading..."}
                                        </span>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                <td className="py-3 text-start ps-4 fw-medium">
                                    {board.boardTitle}
                                    {/* 댓글 수 뱃지  */}
                                    {board.boardReplyCount > 0 && (
                                        <span className="ms-2 text-primary small fw-bold">
                                            [{board.boardReplyCount}]
                                        </span>
                                    )}
                                    {/* 공지사항 뱃지 */}
                                    {board.boardNotice === 'Y' && (
                                        <span className="ms-2 badge bg-danger">공지</span>
                                    )}
                                </td>
                                <td className="py-3 text-light opacity-75">{board.boardViewCount}</td>
                                <td className="py-3 text-light opacity-75">{board.boardWtime}</td>
                            </tr>
                        ))}
                        {boardList.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-5 text-muted">게시글이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* 페이지네이션 */}
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
                        
    
    </>)
}
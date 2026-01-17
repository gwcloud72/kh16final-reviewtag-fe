import axios from "axios";
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom";
import "./Board.css";
import Pagination from "../Pagination";
import { FaPen } from "react-icons/fa";

export default function BoardContentsList() {
    const { contentsId } = useParams();

    const navigate = useNavigate();


    //state
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
        return `${mm}/${dd}`
    }
    
    //callback
    const loadBoard = useCallback(async () => {
        const { data } = await axios.get(`/board/contentsId/${contentsId}/${page}`)
        console.log(data);
        const formattedData = data.list.map(board => ({
            ...board,
            boardWtime: formatWtime(board.boardWtime)
        }));
        setBoardList(formattedData);
        setPageData(data.pageVO);

        loadAllTitles(formattedData);
    }, [contentsId]);
    
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
    
    //effect
    useEffect(() => {
        loadBoard();
    }, [page])

    //rendar
    return (<>

        <div className="container mt-5">
            <div className="d-flex align-items-center mb-4 mt-4">
                <h2 className="fw-bold text-white mb-0" 
                    onClick={()=>{navigate("/board/list")}}
                    style={{cursor:"pointer"}}>
                자유게시판
                </h2>
            </div>

            <div className="row">
                <div className="col text-end">
                    <Link className="btn btn-primary rounded-pill px-4 fw-bold" to="/board/insert">
                        <FaPen className="me-2" /> 작성하기
                    </Link>
                </div>
            </div>

            {/* 게시글 목록 테이블 */}
            <div className="shadow-sm border-0 rounded-4 overflow-hidden mt-4">

                <div className="table-responsive">
                    <table className="table table-dark table-hover text-center align-middle mb-0 text-white text-nowrap" style={{ borderColor: "#495057" }}>
                        <thead className="text-white">
                            <tr>

                                <th className="py-3" style={{ width: "15%" }}>콘텐츠</th>
                                <th className="py-3 text-start ps-4" style={{ width: "50%" }}>제목</th>
                                <th className="py-3" style={{ width: "15%" }}>조회수</th>
                                <th className="py-3" style={{ width: "15%" }}>작성자</th>
                                <th className="py-3" style={{ width: "15%" }}>작성시간</th>
                            </tr>
                        </thead>
                        <tbody >
                            {boardList.map((boardList) => (
                                <tr key={boardList.boardNo}
                                    onClick={() => navigate(`/board/${boardList.boardNo}`)}
                                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                                    className="board-row">
                                    <td className="py-3 text-secondary">
                                        {/* 컨텐츠 ID가 있을 때 제목 표시 */}
                                        {boardList.boardContentsId ? (
                                            <span className="badge bg-secondary bg-opacity-25 text-light fw-normal border border-secondary border-opacity-25">
                                                {/* titles 객체에서 id에 해당하는 값 꺼내기 */}
                                                {titles[boardList.boardContentsId] || "Loading..."}
                                            </span>
                                        ) : <span className="text-muted">-</span>}  
                                    </td>
                                    <td className="py-3 text-start ps-4 fw-medium">
                                        {boardList.boardTitle}
                                        {boardList.boardReplyCount > 0 && (
                                            <span className="ms-2 text-primary small fw-bold">[{boardList.boardReplyCount}]</span>
                                        )}
                                        {boardList.boardNotice === 'Y' && (
                                            <span className="ms-2 badge bg-danger">공지</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-light opacity-75">{boardList.boardViewCount}</td>
                                    <td className="py-3 text-light opacity-75">{boardList.boardWriter}</td>
                                    <td className="py-3 text-light opacity-75">{boardList.boardWtime}</td>

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
            {/* 페이지네이션 */}
            <div className="row mt-4">
                <div className="col-6 offset-3">
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
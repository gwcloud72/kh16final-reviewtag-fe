import axios from "axios";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react"
import { FaComment, FaPen, FaRegEye, FaRegThumbsDown, FaRegThumbsUp, FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify";
import { loginIdState, loginLevelState } from "../../utils/jotai";
import { cleanExpiredViews } from '../../utils/localStorage/cleanStorage';
import { Modal } from "bootstrap";
import { FaXmark } from "react-icons/fa6";


export default function BoardDetail() {

    //통합 state
    const [loginId, setLoginId] = useAtom(loginIdState);
    const [loginLevel, setLoginLevel] = useAtom(loginLevelState);

    const navigate = useNavigate();
    const { boardNo } = useParams();


    //모달
    const modal3 = useRef();

    const openModal3 = () => {
        const open = new Modal(modal3.current);
        open.show();
    }
    const closeModal3 = () => {
        const close = Modal.getInstance(modal3.current);
        if (close) close.hide();
    }

    //state
    const [board, setBoard] = useState({
        boardNo: null, boardTitle: "", boardContentsId: null,
        boardWtime: "", boardEtime: "", boardText: "",
        boardLike: 0, boardUnlike: 0, boardReplyCount: 0,
        boardNotice: "", boardViewCount: 0
    });

    const [showText, setShowText] = useState();

    const [contentsTitle, setContentsTitle] = useState("");

    const [boardResponseVO, setBoardResponseVO] = useState({
        response: false, responseType: "", likeCount: 0, unlikeCount: 0
    });

    const [reply, setReply] = useState({
        replyNo: null, replyTarget: null, replyWriter: "",
        replyContent: "", replyEtime: "", replyWtime: ""
    });

    const [replyList, setReplyList] = useState([]);

    const [editReplyNo, setEditReplyNo] = useState(null); // 현재 수정 중인 댓글 번호
    const [editContent, setEditContent] = useState("");   // 수정 중인 내용

    const [data, setData] = useState(null);

    // effect
    useEffect(() => {
        loadData();
        loadReply();
    }, [boardNo]);

    useEffect(() => {
        loadData();
    }, [boardResponseVO]);

    useEffect(() => {
        if (board.boardContentsId) {
            loadTitle(board.boardContentsId);
        }
    }, [board.boardContentsId]);

    useEffect(() => {
        checkResponse();
    }, [loginId, boardNo]);


    // 조회수 : 로컬 스토리지에서 검사 + 증가 요청
    const viewTimeLimit = 60 * 60 * 1000; // 1시간
    const checkView = useCallback(async () => {
        if (!loginId) return;
        const key = `view_${loginId}_${boardNo}`;
        const now = Date.now();

        const stored = localStorage.getItem(key);
        const viewed = stored ? JSON.parse(stored) : null;

        // 값이 없거나 30분이 지났다면
        if (!viewed || now - viewed.time > viewTimeLimit) {
            localStorage.setItem(key, JSON.stringify({ time: now })); // 로컬스토리지 key저장
            //조회 수 증가 요청
            try { const response = await axios.post(`/board/viewUpdate/${boardNo}`); }
            catch (e) { console.log("조회 수 증가 실패") };
        };
    }, [loginId, boardNo])

    // 조회수 증가요청 실행
    useEffect(() => {
        checkView();
        cleanExpiredViews(); // 로컬 스토리지에서 만료된 키 제거
    }, [checkView])

    // callback
    const changeStrValue = useCallback(e => {
        const { name, value } = e.target;
        setReply(prev => ({ ...prev, [name]: value }))
    }, [])

    //[댓글 목록 조회]
    const loadReply = useCallback(async () => {
        if (!boardNo) return;
        try {
            const dataToSend = {
                loginId: loginId,
                boardNo: boardNo
            };
            const { data } = await axios.post("/reply/", null, { params: dataToSend });
            setReplyList(data);
        }
        catch (err) {
            console.error("댓글 목록 조회 실패", err);
        }
    }, [boardNo, loginId]);

    //[게시글 상세 정보 조회]
    const loadData = useCallback(async () => {
        try {
            const { data } = await axios.get(`/board/detail/${boardNo}`);
            setBoard(data);
            if (board.boardUnlike >= 10) setShowText(false);
        }
        catch (err) {
            console.error("게시글 상세 로드 실패: ", err);
        }
    }, [boardNo]);

    //[컨텐츠 제목 조회]
    const loadTitle = useCallback(async (id) => {
        if (!id) return;
        try {
            const { data } = await axios.get(`/api/tmdb/title/${id}`);
            setContentsTitle(data);
        }
        catch (err) {
            console.error("컨텐츠 제목 로드 실패: ", err);
        }
    }, []);

    //[좋아요 싫어요 여부 조회]
    const checkResponse = useCallback(async () => {
        if (loginId === "") return;

        try {
            const { data } = await axios.post("/board/check", null,
                { params: { loginId: loginId, boardNo: boardNo } });
            setBoardResponseVO(data);
            if (boardResponseVO.unlikeCount >= 10) setShowText(false);
        }
        catch (err) {
            console.error("[checkResponse] 실패 : ", err);
        }

    }, [boardNo, loginId]);

    //[좋아요 등록 / 삭제]
    const changeLike = useCallback(async (e) => {
        if (loginId === "") {
            toast.error("로그인이 필요한 기능입니다");
            return;
        }
        const boardResponseDto = {
            memberId: loginId,
            boardNo: boardNo,
            responseType: "좋아요"
        }

        try {
            const { data } = await axios.post("/board/action", boardResponseDto);
            setBoardResponseVO(data);
            console.log("좋아요 등록 삭제 성공");

        }
        catch (err) {
            console.error("좋아요 등록 삭제 실패 : ", err);
        }


    }, [loginId, boardNo, boardResponseVO]);


    //[좋아요 등록 / 삭제]
    const changeUnlike = useCallback(async (e) => {
        if (loginId === "") {
            toast.error("로그인이 필요한 기능입니다");
            return;
        }
        const boardResponseDto = {
            memberId: loginId,
            boardNo: boardNo,
            responseType: "싫어요"
        }

        try {
            const { data } = await axios.post("/board/action", boardResponseDto);
            setBoardResponseVO(data);
            console.log("싫어요 등록 삭제 성공");

        }
        catch (err) {
            console.error("좋아요 등록 삭제 실패 : ", err);
        }


    }, [loginId, boardNo, boardResponseVO]);

    //[댓글 등록]
    const sendData = useCallback(async () => {
        if (!loginId) {
            toast.error("로그인이 필요합니다.");
            return;
        }

        if (!reply.replyContent || reply.replyContent.trim().length === 0) {
            toast.error("내용을 입력해주세요.");
            return;
        }

        // 기존 state(reply)에 작성자와 타겟 번호를 합침
        const dataToSend = {
            ...reply,
            replyTarget: boardNo,
            replyWriter: loginId
        };

        try {
            await axios.post("/reply/write", dataToSend);

            // 성공 후 입력창 초기화 
            setReply(prev => ({ ...prev, replyContent: "" }));

            // 댓글 목록과 댓글 수 최신화
            loadReply();
            loadData();

        } catch (err) {
            console.error("댓글 등록 실패: ", err);
        }

    }, [reply, boardNo, loginId]);

    //[댓글 삭제]
    const deleteReply = useCallback(async (no) => {
        try {
            await axios.delete(`/reply/${no}`)
            loadData();
            loadReply();
        }
        catch (err) {
            console.error("댓글 삭제 실패: ", err);
        }
    }, [loadData, loadReply]);

    //[댓글 수정]
    //수정 모드 시작
    const startEdit = useCallback((replyDto) => {
        setEditReplyNo(replyDto.replyNo);
        setEditContent(replyDto.replyContent); // 기존 내용을 입력창에 채움
    }, []);

    //수정 취소
    const cancelEdit = useCallback(() => {
        setEditReplyNo(null);
        setEditContent("");
    }, []);

    //댓글 수정 요청 
    const updateReply = useCallback(async () => {
        if (!editContent || editContent.trim().length === 0) {
            toast.error("내용을 입력해주세요.");
            return;
        }

        try {
            await axios.put(`/reply/${editReplyNo}`, null, { params: { editContent: editContent } });

            toast.success("댓글이 수정되었습니다.");
            setEditReplyNo(null); // 수정 모드 종료
            loadReply(); // 목록 갱신
        } catch (err) {
            console.error("댓글 수정 실패: ", err);
            toast.error("댓글 수정에 실패했습니다.");
        }
    }, [editReplyNo, editContent, loadReply]);

    const deleteBoard = useCallback(async () => {
        const choice = window.confirm("게시글을 삭제하시겠습니까?");
        if (choice === false) return;
        try {
            await axios.delete(`/board/${boardNo}`);
            console.log("삭제 완료");
            toast.success("게시글이 삭제되었습니다");
            navigate("/board/list");
        }
        catch (err) {
            toast.error("삭제 실패")
            return;
        }
    }, [])

    // [날짜 포맷팅 함수] 
    const getDisplayDate = (dateString) => {
        if (!dateString) return ""; // 데이터가 로딩 전이면 빈 문자열 반환

        const targetDate = new Date(dateString);
        const today = new Date();

        // 날짜가 같은지 비교 (년, 월, 일이 모두 같으면 오늘)
        const isToday = targetDate.getFullYear() === today.getFullYear() &&
            targetDate.getMonth() === today.getMonth() &&
            targetDate.getDate() === today.getDate();

        if (isToday) {
            // 오늘이면: 시:분 (HH:mm)
            const hours = String(targetDate.getHours()).padStart(2, '0');
            const minutes = String(targetDate.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        } else {
            // 오늘이 아니면: 년-월-일 (YYYY-MM-DD)
            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    };

    //신고 <기타 버튼>
    const [reportReason, setReportReason] = useState("");
    const [otherReason, setOtherReason] = useState("");


    const sendData2 = useCallback(async () => {
        if (!reportReason) {
            toast.info("신고 사유를 선택해주세요");
            return;
        }
        if (reportReason === "OTHER" && otherReason.trim() === "") {
            toast.info("기타 사유를 입력해주세요");
            return;
        }

        //전송할 데이터 구성
        const payload = {
            boardReportBoardNo: boardNo,       // 신고할 게시글 번호
            boardReportType: reportReason,       // 신고 사유
            boardReportContent: reportReason === "ETC" ? otherReason : null // 기타일 때만 내용 전송
        };

        try {
            //API 호출
            await axios.post("/board/report/", payload);

            //성공 처리
            toast.success("신고가 정상적으로 접수되었습니다.");
            setReportReason(""); // 선택 초기화
            setOtherReason("");  // 내용 초기화
            closeModal3();       // 모달 닫기

        } catch (error) {
            console.error("신고 전송 실패:", error);

            //에러 처리
            if (error.response) {
                if (error.response.status === 500) {
                    toast.error("이미 신고하신 게시글입니다.");
                } else if (error.response.status === 401) {
                    toast.error("로그인이 만료되었습니다.");
                } else {
                    toast.error("신고 접수 중 오류가 발생했습니다.");
                }
            }
        }
    }, [reportReason, otherReason, boardNo, loginId]);

    //프로필 아이콘 불러오기
    const loadProfile = useCallback(async () => {
        if (!board.boardWriter) return;

        try {
            const { data } = await axios.get(`/member/profile/${board.boardWriter}`);
            setData(data);
        } catch (err) {
            console.error("프로필 로드 실패", err);
        }
    }, [board.boardWriter]);

    useEffect(() => {
        loadProfile();
    }, [board]);

    const { profile, point } = data || {};

    const [profileMap, setProfileMap] = useState({});

    useEffect(() => {
        if (replyList.length === 0) return;

        const fetchProfileImages = async () => {
            // 1. 댓글 목록에서 중복을 제거한 작성자 ID 목록 추출
            const writers = [...new Set(replyList.map(r => r.replyWriter))];

            // 2. 이미 불러온 작성자는 제외 (API 중복 호출 방지)
            const writersToFetch = writers.filter(writer => !profileMap[writer]);

            if (writersToFetch.length === 0) return;

            const newProfiles = {};

            // 3. 비동기로 이미지 요청 (Promise.all로 병렬 처리)
            await Promise.all(
                writersToFetch.map(async (writer) => {
                    try {
                        const res = await axios.get(`/member/profile/${writer}`);
                        // 데이터 구조에 맞춰 수정 (res.data.point.iconSrc 가정)
                        newProfiles[writer] = res.data.point?.iconSrc || null;
                    } catch (err) {
                        console.error(`${writer} 이미지 로드 실패`, err);
                        newProfiles[writer] = null; 
                    }
                })
            );

            // 4. 상태 업데이트 (기존 맵에 새로운 작성자 정보 병합)
            setProfileMap(prev => ({ ...prev, ...newProfiles }));
        };

        fetchProfileImages();
    }, [replyList]);

    if (!data) {
        return <div className="text-white text-center mt-5">로딩중...</div>;
    }


    //rendar
    return (<>
        <div className="container mt-5">
            <div className="d-flex align-items-center mb-4 mt-4">
                <h2 className="fw-bold text-white mb-0"
                    onClick={() => { navigate("/board/list") }}
                    style={{ cursor: "pointer" }}>
                    자유게시판
                </h2>
            </div>

            <hr className="text-light mt-5" />

            <div className="row">
                <div className="col text-light d-flex align-items-center">
                    {/* 제목 */}
                    <h3 className="m-0 me-3 fw-bold">
                        {board.boardTitle}
                        {board.boardEtime && (
                            <span className="ms-2 fs-6 text-secondary fw-normal">
                                (수정됨)
                            </span>
                        )}
                    </h3>
                    {/* 컨텐츠 제목 벳지 */}
                    {contentsTitle && (
                        <Link className="text-decoration-none" to={`/contents/detail/${board.boardContentsId}`}>
                            <h5 className="mt-2">
                                <span className="badge bg-primary text-truncate">
                                    {contentsTitle}
                                </span>
                            </h5>
                        </Link>
                    )}
                </div>
            </div>

            <hr className="text-light mb-2" />

            <div className="row">
                <div className="col text-light d-flex justify-content-between align-items-center">
                    <span onClick={() => navigate(`/member/profile/info/${board.boardWriter}`)}
                        style={{ cursor: "pointer" }} className="fs-4">
                        <img src={point?.iconSrc} alt="Icon" className="board avatar-img-v2 me-2 mb-1" />
                        {board.boardWriter}
                    </span>
                    {/* 신고 버튼 */}
                    {loginId && loginId !== board.boardWriter && (
                        <span className="ms-3 text-danger" onClick={openModal3}
                            style={{ cursor: "pointer" }}>
                            신고 🚨
                        </span>
                    )}
                </div>

            </div>

            <hr className="text-light mb-0 mt-2" />

            <div className="row mt-2">
                <div className="col text-light d-flex align-items-center justify-content-end text-nowrap">
                    <span className="ms-4 me-5"><FaRegEye className="me-1" />{board.boardViewCount}</span>
                    <span>{getDisplayDate(board.boardWtime)}</span>
                </div>
            </div>
            {/* 본문 */}
            {board.boardUnlike >= 10 && !showText ? (
                <div
                    onClick={() => setShowText(true)}
                    className="text-danger fw-bold"
                    style={{
                        cursor: "pointer",
                        minHeight: "200px",
                        whiteSpace: "pre-wrap",
                        overflowX: "auto",
                        overflowY: "hidden",
                        maxWidth: "100%",
                        wordBreak: "break-word"
                    }}>
                    ⚠️ 블라인드 처리된 게시글 입니다. (클릭하여 보기)
                </div>
            ) : (<div
                className="text-light"
                style={{
                    minHeight: "200px",
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                    overflowY: "hidden",
                    maxWidth: "100%",
                    wordBreak: "break-word"
                }}
                dangerouslySetInnerHTML={{ __html: board.boardText }}
            ></div>)}

            {/* 좋아요 싫어요 */}
            <div className="row mt-5">
                <div className="col justify-content-center d-flex">
                    <div className="me-2">
                        {/* 좋아요 */}
                        {boardResponseVO.responseType === "좋아요" ? (
                            <h1 className="ms-2 border rounded p-4 text-primary bg-light"
                                onClick={changeLike}>
                                <FaRegThumbsUp className="mb-1" />
                            </h1>
                        ) : (
                            <h1 className="ms-2 border rounded p-4 text-primary"
                                onClick={changeLike}>
                                <FaRegThumbsUp className="mb-1" />
                            </h1>
                        )}
                        <h2 className="text-center mt-4">{board.boardLike}</h2>
                    </div>
                    <div className="ms-2">
                        {/* 싫어요 */}
                        {boardResponseVO.responseType === "싫어요" ? (
                            <h1 className="ms-2 border rounded p-4 text-danger bg-light"
                                onClick={changeUnlike}>
                                <FaRegThumbsDown className="mt-1" />
                            </h1>
                        ) : (
                            <h1 className="ms-2 border rounded p-4 text-danger"
                                onClick={changeUnlike}>
                                <FaRegThumbsDown className="mt-1" />
                            </h1>
                        )}
                        <h2 className="text-center mt-4">{board.boardUnlike}</h2>
                    </div>
                </div>
            </div>

            <hr className="text-light mt-5 mb-4" />

            {/* 댓글 */}

            {/* 댓글 수 */}
            <div className="row">
                <div className="col">
                    <h4><FaComment className="me-3" />{board.boardReplyCount}</h4>
                </div>
            </div>
            {/* 댓글 입력 창 */}
            {loginId && (<>
                <div className="row mt-4">
                    <div className="col-12 d-flex align-items-stretch">
                        <div className="flex-grow-1">
                            <textarea
                                className="reply-write w-100"
                                name="replyContent"
                                value={reply.replyContent}
                                onChange={changeStrValue}
                                placeholder="댓글을 입력하세요"
                            />
                        </div>
                        <div className="ms-2">
                            <button
                                type="button"
                                className="reply-btn h-100 text-nowrap"
                                style={{ width: "80px" }}
                                onClick={sendData}>
                                등록
                            </button>
                        </div>
                    </div>
                </div>
            </>)}

            {/* 댓글 목록 */}
            <div className="row mt-4">
                <div className="col-12">
                    {replyList.map(replyDto => (
                        <div className="reply-card w-100 mb-3" key={replyDto.replyNo}>
                            {/* 수정 모드인지 확인 */}
                            {editReplyNo === replyDto.replyNo ? (
                                // 수정 댓글 창
                                <div>
                                    <textarea
                                        className="form-control mb-2 text-white bg-secondary border-0"
                                        style={{ resize: "none", minHeight: "100px" }}
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                    />
                                    <div className="text-end">
                                        <button className="btn btn-sm btn-info me-2" onClick={updateReply}>저장</button>
                                        <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>취소</button>
                                    </div>
                                </div>
                            ) : (
                                // 일반 댓글 창
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-2">

                                        <h5 className="m-0 fw-bold" onClick={() => navigate(`/member/profile/info/${replyDto.replyWriter}`)}
                                            style={{ cursor: "pointer" }}>
                                            <img src={profileMap[replyDto.replyWriter] || null}
                                                alt="profile" className="board avatar-img-v2 me-2 mt-3" />
                                            <span>{replyDto.replyWriter}</span>
                                        </h5>
                                        <div className="m-0 d-flex text-nowarp">
                                            {replyDto.replyEtime ? (
                                                <span className="d-flex"><p className="text-info me-2">(수정됨)</p> {getDisplayDate(replyDto.replyEtime)}</span>
                                            ) : (
                                                <span>{getDisplayDate(replyDto.replyWtime)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                        {replyDto.replyContent}
                                    </div>

                                    {(replyDto.owner || loginLevel === "관리자") && (
                                        <div className="text-end">
                                            <FaPen
                                                className="text-info me-3"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => startEdit(replyDto)}
                                            />
                                            <FaTrashAlt
                                                className="text-danger"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => deleteReply(replyDto.replyNo)}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <hr className="text-light mt-5 mb-4" />

            {/* 버튼 */}
            <div className="row mt-4 text-end">
                {(loginId && loginId === board.boardWriter || loginLevel === "관리자") ? (
                    <div className="col">
                        <button type="button" className="btn btn-danger me-2" onClick={deleteBoard}>삭제</button>
                        {(loginId && loginId === board.boardWriter) && (
                            <Link className="btn btn-secondary me-2" to={`/board/edit/${board.boardNo}`}>수정</Link>
                        )}
                        <Link className="btn btn-info " to="/board/list">목록</Link>
                    </div>
                ) : (
                    <div className="col">
                        <Link className="btn btn-info " to="/board/list">목록</Link>
                    </div>
                )}

            </div>

            {/* 신고 모달 */}
            <div className="modal fade" id="ModalToggle3" data-bs-backdrop="static" tabIndex="-1" ref={modal3}
                data-bs-keyboard="false">
                <div className="modal-dialog modal-sm">
                    <div className="three">
                        <div className="modal-content">
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col report text-center mt-2 d-flex">
                                        <div className="col-2 mt-1" style={{ marginLeft: "40%" }}>신고</div>
                                        <div className="col-2">
                                            <button type="button" className="modalButtonX2" onClick={closeModal3}>
                                                <FaXmark />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                                <div style={{ color: "white" }} className="mt-3 reportCheck">
                                    <div>
                                        <input type="radio" className="ms-3 form-check-input" name="reportReason" value="INAPPOSITE"
                                            checked={reportReason === "INAPPOSITE"}
                                            onChange={(e) => {
                                                setReportReason(e.target.value)
                                                setOtherReason("");
                                            }
                                            } /><span className="ms-3">부적절한 컨텐츠</span>
                                    </div>
                                    <div className="mt-3">
                                        <input type="radio" className="ms-3 form-check-input" name="reportReason" value="SPAM"
                                            checked={reportReason === "SPAM"}
                                            onChange={(e) => {
                                                setReportReason(e.target.value)
                                                setOtherReason("");
                                            }
                                            }
                                        /><span className="ms-3"
                                        >광고 및 도배</span><br />
                                    </div>
                                    <div className="mt-3">
                                        <input type="radio" className="ms-3 form-check-input" name="reportReason" value="HATE"
                                            checked={reportReason === "HATE"}
                                            onChange={(e) => {
                                                setReportReason(e.target.value)
                                                setOtherReason("");
                                            }
                                            }
                                        /><span className="ms-3"
                                        >혐오 및 비방</span><br />
                                    </div>
                                    <div className="mt-3">
                                        <input type="radio" className="ms-3 form-check-input" name="reportReason" value="ETC"
                                            checked={reportReason === "ETC"}
                                            onChange={(e) => {
                                                setReportReason(e.target.value)
                                                setOtherReason("");
                                            }
                                            } /><span className="ms-3">기타</span><br />
                                    </div>
                                    <hr className="HR" />
                                </div>
                                <div style={{ color: "#acacbbff" }} className="mt-4 ms-2 mb-3"><span>더 자세한 의견</span></div>

                                {/* 기타 아닐 시 비활성화 */}
                                {reportReason !== "ETC" && (
                                    <textarea name="" className="idea2 ms-3" disabled></textarea>
                                )}
                                {/* 기타 일 시, 활성화 */}
                                {reportReason === "ETC" && (
                                    <textarea name="" className="idea ms-3" value={otherReason}
                                        onChange={(e) => {
                                            setOtherReason(e.target.value);
                                        }
                                        }></textarea>
                                )}

                                <div className="mt-4 d-flex justify-content-between">
                                    <button type="button" className="reportB col-5 me-4 mb-1"
                                        onClick={sendData2}>신고하기</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>)


}
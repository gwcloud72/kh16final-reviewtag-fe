import axios from "axios";
import { Modal } from "bootstrap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import { loginIdState, loginLevelState } from "../../utils/jotai";
import { useAtomValue } from "jotai";
import "./Board.css";

import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: ""
};

// 툴바 컴포넌트
const CustomToolbar = () => (
    <div id="toolBar">
        <span className="ql-formats">
            <select className="ql-header" defaultValue="">
                <option value="1">Header 1</option>
                <option value="2">Header 2</option>
                <option value="">Normal</option>
            </select>
            <select className="ql-size" defaultValue="">
                <option value="small">Small</option>
                <option value="">Normal</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
            </select>
        </span>
        <span className="ql-formats">
            <button className="ql-bold" />
            <button className="ql-italic" />
            <button className="ql-underline" />
            <button className="ql-strike" />
            <button className="ql-blockquote" />
        </span>
        <span className="ql-formats">
            <select className="ql-color" />
            <select className="ql-background" />
        </span>
        <span className="ql-formats">
            <button className="ql-image" />
            <button className="ql-video" />
        </span>
        <span className="ql-formats">
            <button className="ql-clean" />
        </span>
    </div>
);

const formats = [
    "header", "size", "font",
    "bold", "italic", "underline", "strike", "blockquote",
    "list", "indent", "link", "image",
    "video", "color", "background", "align",
    "script", "code-block"
];

export default function BoardEdit() {
    // 통합 state
    const loginId = useAtomValue(loginIdState);
    const loginLevel = useAtomValue(loginLevelState);

    // 수정할 게시글의 번호
    const { boardNo } = useParams();

    // 원래 게시글의 정보
    const [beforeBoard, setBeforeBoard] = useState(null);

    // 수정한 내용 state 
    const [board, setBoard] = useState({
        boardTitle: "", boardText: "", boardNotice: "N",
        boardContentsId: null, boardWriter: ""
    });

    // 유효성 검사 상태
    const [boardClass, setBoardClass] = useState({
        boardTitle: "is-valid",
        boardText: "is-valid",
        boardNotice: "",
        boardContentsId: ""
    });

    // 검색 관련 state
    const [query, setQuery] = useState("");
    const [resultList, setResultList] = useState([]);
    const [contentsDetail, setContentsDetail] = useState(INITIAL_DETAIL);
    const [isSelect, setIsSelect] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const [attachmentList, setAttachmentList] = useState([]);


    // 도구
    const navigate = useNavigate();
    const modal = useRef();
    const quillRef = useRef(null);

    // boardValid 계산 
    const boardValid = useMemo(() => {
        return boardClass.boardTitle === "is-valid" && boardClass.boardText === "is-valid";
    }, [boardClass]);

    // 데이터 초기화 함수
    const clearData = useCallback(() => {
        setQuery("");
        setResultList([]);
        setStatusMessage("");
    }, []);

    const openModal = useCallback(() => {
        const instance = Modal.getOrCreateInstance(modal.current);
        instance.show();
    }, [modal]);

    const closeModal = useCallback(() => {
        const instance = Modal.getInstance(modal.current);
        instance.hide();
    }, [modal]);

    const clearAndCloseModal = useCallback(() => {
        closeModal();
        setTimeout(() => { clearData(); }, 100);
    }, [closeModal, clearData]);


    //게시글 정보 불러오기
    useEffect(() => {
        loadData();
    }, [boardNo]);

    const loadData = useCallback(async () => {
        try {
            const { data } = await axios.get(`/board/detail/${boardNo}`);
            setBeforeBoard(data);
        }
        catch (err) {
            console.error("게시글 수정 정보 조회 실패", err);
        }
    }, [boardNo]);


    //불러온 beforeBoard 데이터를 board State에 동기화
    useEffect(() => {
        if (beforeBoard) {
            setBoard({
                boardTitle: beforeBoard.boardTitle,
                boardText: beforeBoard.boardText,
                boardNotice: beforeBoard.boardNotice || "N",
                boardContentsId: beforeBoard.boardContentsId,
                boardWriter: beforeBoard.boardWriter
            });

            // 컨텐츠 ID가 있다면 관련 정보 로드 트리거
            if (beforeBoard.boardContentsId) {
                loadTitle(beforeBoard.boardContentsId);
                setIsSelect(true);
            }
        }
    }, [beforeBoard]);


    // 게시글의 관련 컨텐츠 제목 불러오기
    const loadTitle = useCallback(async (contentsId) => {
        if (!contentsId) return;
        try {
            const { data } = await axios.get(`/api/tmdb/title/${contentsId}`);
            setContentsDetail(prev=>({...prev, contentsTitle: data}));
            setIsSelect(true);
            setBoardClass(prev => ({ ...prev, boardContentsId: "is-valid" }));

        }
        catch (err) {
            console.error("컨텐츠 title 조회 실패", err);
        }
    }, []);


    // 입력값 변경 핸들러
    const changeStrValue = useCallback(e => {
        const { name, value } = e.target;
        setBoard(prev => ({ ...prev, [name]: value }));

        // 제목 유효성 검사
        if (name === 'boardTitle') {
            const valid = value.length > 0;
            setBoardClass(prev => ({ ...prev, boardTitle: valid ? "is-valid" : "is-invalid" }));
        }
    }, []);

    const changeCheckValue = useCallback(e => {
        setBoard(prev => ({ ...prev, boardNotice: e.target.checked ? "Y" : "N" }));
    }, []);


    // 검색 실행 statusMessage 제어
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

    // 컨텐츠 선택 및 DB저장
    const handleSelectAndSave = useCallback(async (contents) => {
        setIsLoading(true);

        try {
            const response = await axios.post("/api/tmdb/save", {
                contentsId: contents.contentsId,
                type: contents.type
            });

            setContentsDetail(response.data);
            setIsSelect(true);
            setBoard(prev => ({ ...prev, boardContentsId: contents.contentsId }));
            setBoardClass(prev => ({ ...prev, boardContentsId: "is-valid" }));
        }
        catch (error) {
            console.error("저장 API 오류 : ", error);
            setIsSelect(false);
        }
        finally {
            setIsLoading(false);
            clearAndCloseModal(); // 모달 닫기
        }
    }, [clearAndCloseModal]);

    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('attach', file);

            try {
                const res = await axios.post("/board/temp", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const attachmentNo = res.data;
                const imageUrl = `http://localhost:8080/attachment/download?attachmentNo=${attachmentNo}`;

                const quill = quillRef.current.getEditor();
                const range = quill.getSelection(true);
                let index = (range && range.index) ? range.index : quill.getLength();

                quill.insertEmbed(index, 'image', imageUrl);
                quill.setSelection(index + 1);

                setAttachmentList(prev => [...prev, attachmentNo]);

            } catch (error) {
                console.error("이미지 업로드 실패", error);
                alert("이미지 업로드에 실패했습니다.");
            }
        };
    }, []);

    // 수정 데이터 전송
    const sendData = useCallback(async () => {
        if (boardValid === false) return;
        try {
            await axios.put(`/board/${boardNo}`, board);
            navigate(`/board/${boardNo}`);
            console.log("보낸 데이터 : ", board);
        }
        catch (err) {
            console.error("수정 실패 : ", err);
        }

    }, [board, boardValid, boardNo, navigate]);

    const modules = useMemo(() => ({
        toolbar: {
            container: "#toolBar",
            handlers: {
                image: imageHandler
            }
        },
    }), [imageHandler]);

    const handleChange = (value) => {
        setBoard(prev => ({ ...prev, boardText: value }));
        const textOnly = value.replace(/<[^>]*>?/gm, '');
        const valid = textOnly.length > 0;
        setBoardClass(prev => ({ ...prev, boardText: valid ? "is-valid" : "is-invalid" }));
    };

    // 로딩 중이거나 데이터가 없으면 로딩 표시
    if (!beforeBoard) {
        return <div className="container mt-5 text-center"><h1>데이터를 불러오는 중...</h1></div>;
    }

    return (
        <div className="container">
            <h1> 게시글 수정 </h1>

            {/* 관리자 일 경우에만 나오는 공지등록 checkbox */}
            {loginLevel === "관리자" && (
                <div className="row mt-2">
                    <div className="col-12 col-md-2 mt-4">
                        <label className="me-2 p-2 rounded bg-warning text-muted">공지등록
                        <input type="checkbox" className="form-check-input ms-2"
                            name="boardNotice"
                            checked={board.boardNotice === "Y"}
                            onChange={changeCheckValue}
                        />
                        </label>
                    </div>
                </div>
            )}
            {/* 제목 입력 */}
            <div className="row mt-3">
                <div className="input-group">
                    <label className="input-group-text">제목</label>
                    <input type="text"
                        className={`col-sm-9 form-control ${boardClass.boardTitle} `}
                        name="boardTitle"
                        onChange={changeStrValue}
                        value={board.boardTitle}
                    />
                </div>
            </div>


            {/* 컨텐츠 선택 */}
            <div className="row mt-3">
                <div className="col">
                    <div className="input-group text-nowarp" onClick={openModal} style={{ cursor: "pointer" }}>
                        <label className="input-group-text">관련 컨텐츠</label>
                        <span className="input-group-text bg-light">🔍</span>
                        <input type="text"
                            className={`form-control ${boardClass.boardContentsId}`} // 유효성 클래스 적용
                            value={contentsDetail?.contentsTitle || ""}
                            placeholder={contentsDetail?.contentsTitle || "컨텐츠 제목 입력"}
                            readOnly
                            style={{ cursor: "pointer", backgroundColor: "white" }}
                        />
                        <input type="hidden" readOnly name="boardContentsId" value={board.boardContentsId || ""} />
                        {board.boardContentsId && (
                            <span className="input-group-text bg-success text-white">선택됨</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 내용 */}
            <div className="mb-3 mt-4">
                <label className="form-label fw-bold">내용</label>
                <div className="editor-container">
                    <CustomToolbar />
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={board.boardText}
                        onChange={handleChange}
                        modules={modules}
                        formats={formats}
                        style={{ height: "400px" }}
                    />
                </div>
                {/* 유효성 메시지 표시용 */}
                {boardClass.boardText === "is-invalid" && (
                    <div className="text-danger small mt-1">내용을 입력해주세요.</div>
                )}
                <div style={{ height: "50px" }}></div>
            </div>

            <div className="row mt-4 mb-5">
                <div className="col">
                    <button type="button" className="btn btn-lg btn-success w-100"
                        disabled={!boardValid}
                        onClick={sendData}>
                        <span>수정하기</span>
                    </button>
                </div>
            </div>

            {/* 모달(Modal) */}
            <div className="modal fade" tabIndex="-1" data-bs-backdrop="static" ref={modal} data-bs-keyboard="false">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">컨텐츠 검색</h5>
                            <button type="button" className="btn-close" onClick={clearAndCloseModal}></button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group mb-3">
                                <input type="text" className="form-control" value={query}
                                    placeholder="영화/드라마 제목 검색"
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                />
                                <button className="btn btn-success" onClick={handleSearch} disabled={isLoading}>
                                    검색
                                </button>
                            </div>

                            <div className="mb-3 text-secondary small">
                                {statusMessage}
                            </div>

                            <div className="list-group">
                                {resultList.map(result => (
                                    <button key={result.contentsId}
                                        className="list-group-item list-group-item-action d-flex align-items-center p-2"
                                        onClick={() => handleSelectAndSave(result)}>

                                        <img src={getPosterUrl(result.posterPath)}
                                            alt={result.title}
                                            className="rounded me-3"
                                            style={{ width: "50px", height: "75px", objectFit: "cover" }} />

                                        <div className="flex-fill">
                                            <div className="fw-bold">{result.title}</div>
                                            <div className="text-muted small">
                                                {result.type} | {result.releaseDate || "날짜 미상"}
                                            </div>
                                        </div>
                                        <div className="ms-2">
                                            <span className="badge bg-primary rounded-pill">선택</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={clearAndCloseModal}>닫기</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
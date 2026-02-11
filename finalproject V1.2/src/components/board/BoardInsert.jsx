import { useAtomValue } from "jotai";
import { loginIdState, loginLevelState } from "../../utils/jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Modal } from "bootstrap";
import { useNavigate } from "react-router-dom";
import "./Board.css";

import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";


const INITIAL_DETAIL = {
    contentsId: null, contentsTitle: ""
};

// 툴바 컴포넌트 (HTML 구조)
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
    "color", "background", "align",
    "script", "code-block"
];

export default function boardInsert() {
    // 통합 state
    const loginId = useAtomValue(loginIdState);
    const loginLevel = useAtomValue(loginLevelState);

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


    //도구
    const navigate = useNavigate();
    const modal = useRef();
    const quillRef = useRef(null);

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
    }, [modal]);

    //state
    const [board, setBoard] = useState({
        boardTitle: "", boardText: "", boardNotice: "N",
        boardContentsId: "", boardWriter: ""
    });
    const [boardClass, setBoardClass] = useState({
        boardTitle: "", boardText: "", boardNotice: "",
        boardContentsId: ""
    })
    const [attachmentList, setAttachmentList] = useState([]);

    //effect
    useEffect(() => {
        if (loginId) {
            setBoard(prev => ({ ...prev, boardWriter: loginId }));
        }
    }, [loginId])
    //초기화 및 상태관리
    useEffect(() => {
        //컴포넌트 마운트 또는 isSelect false로 바뀔 때 상세 정보 초기화
        if (!isSelect) {
            setContentsDetail(INITIAL_DETAIL);
        }
    }, [isSelect]);


    // callback
    const changeStrValue = useCallback(e => {
        const { name, value } = e.target;
        setBoard(prev => ({ ...prev, [name]: value }))
    }, [])

    // callback
    const changeCheckValue = useCallback(e => {
        if (e.target.value !== "on") return;
        setBoard(prev => ({ ...prev, boardNotice: "Y" }))
    }, [])

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
            setBoard(prev => ({ ...prev, boardContentsId: contents.contentsId }));
        }
        catch (error) {
            console.error("저장 API 오류 : ", error);
            setIsSelect(false); //저장 실패 시 리스트를 다시 보여주기 위한 처리 
        }
        finally {
            setIsLoading(false);
            closeModal();
        }
    }, [board, isSelect, isLoading]);

    //[포스터 이미지 url 생성 함수]
    const getPosterUrl = useCallback((path) => {
        return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://placehold.co/500x750/cccccc/333333?text=No+Image';
    }, []);

    // 이미지 처리를 위한 커스텀 핸들러
    const imageHandler = useCallback(() => {
        // 1. 이미지를 업로드하기 위한 input 태그 생성
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        // 2. 파일이 선택되었을 때의 동작
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('attach', file);

            try {
                // 3. 서버로 업로드 요청
                const res = await axios.post("/board/temp", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const attachmentNo = res.data; // 서버에서 받은 파일 번호
                const baseUrl = import.meta.env.VITE_BASE_URL;
                const imageUrl = `${baseUrl}/attachment/download?attachmentNo=${attachmentNo}`;

                // 4. 에디터 객체 가져오기
                const quill = quillRef.current.getEditor();

                // 5. 현재 커서 위치 가져오기 (없으면 문서 맨 끝으로 설정)
                // getSelection(true) : 포커스가 없어도 강제로 위치를 가져옴
                const range = quill.getSelection(true);
                let index = (range && range.index) ? range.index : quill.getLength();

                // 이미지를 먼저 에디터에 넣습니다. (리렌더링 전에 DOM 조작 완료)
                quill.insertEmbed(index, 'image', imageUrl);

                // 커서를 이미지 다음으로 이동
                quill.setSelection(index + 1);

                // 그 다음, State를 업데이트합니다. 
                // (이제 리렌더링이 일어나도 이미지는 이미 들어가 있습니다)
                setAttachmentList(prev => [...prev, attachmentNo]);

            } catch (error) {
                console.error("이미지 업로드 실패", error);
                alert("이미지 업로드에 실패했습니다.");
            }
        };
    }, []);


    //  제목
    const checkBoardTitle = useCallback(e => {
        const valid = board.boardTitle.length > 0;
        setBoardClass({ ...boardClass, boardTitle: valid ? "is-valid" : "is-invalid" });
    }, [board, boardClass])
    // 내용
    const checkBoardText = useCallback(e => {
        const valid = board.boardText.length > 0;
        setBoardClass({ ...boardClass, boardText: valid ? "is-valid" : "is-invalid" });
    }, [board, boardClass])
    //콘텐츠번호
    const checkBoardContents = useCallback(() => {
        const valid = isSelect;
        setBoardClass({ ...boardClass, boardContentsId: valid ? "is-valid" : "is-invalid" });
    }, [isSelect, boardClass]);
    // 공지등록



    const boardValid = useMemo(() => {
        if (boardClass.boardTitle !== "is-valid") return false;
        if (boardClass.boardText !== "is-valid") return false;
        // if(boardClass.boardContentsId !== "is-valid" ) return false;
        return true;
    }, [boardClass]);

    // 등록
    const sendData = useCallback(async () => {
        if (boardValid === false) return;

        const reqData = {
            ...board,
            attachmentNoList: attachmentList
        }
        try {
            await axios.post("/board/", reqData);

            navigate("/board/list");
        }
        catch (err) {
            console.error("등록 실패 : ", err);
        }

    }, [board, boardValid, attachmentList, navigate]);

    const modules = useMemo(() => ({
        toolbar: {
            container: "#toolBar",
            handlers: {
                image: imageHandler
            }
        },
    }), [imageHandler]);

    const handleChange = (value) => {
        // 에디터의 내용을 board state에 반영
        setBoard(prev => ({ ...prev, boardText: value }));

        // 유효성 검사 (태그 제외하고 내용이 있는지 확인)
        const textOnly = value.replace(/<[^>]*>?/gm, '');
        const valid = textOnly.length > 0;
        setBoardClass(prev => ({ ...prev, boardText: valid ? "is-valid" : "is-invalid" }));
    };

    //render
    return (<>
        <div className="container">

            <h1> 게시글 등록 </h1>

            {/* 관리자 일 경우에만 나오는 공지등록 checkbox */}
            {loginLevel === "관리자" && (

                <div className="row mt-2">
                    <div className="col-12 col-md-2 mt-4">
                        <label className="me-2 p-2 rounded bg-warning text-muted">공지등록
                            <input type="checkbox" className="form-check-input ms-2" name="boardNotice" onChange={changeCheckValue}></input>
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
                        onBlur={checkBoardTitle}
                        onChange={changeStrValue}
                    />
                </div>
            </div>


            {/*  컨텐츠 선택  */}
            <div className="row mt-3">
                <div className="col">
                    <div className="input-group text-nowarp" onClick={openModal} style={{ cursor: "pointer" }}>
                        <label className="input-group-text">관련 컨텐츠</label>
                        <span className="input-group-text bg-light">🔍</span>
                        <input type="text"
                            className={`form-control ${board.boardContentsId ? "is-valid" : ""}`}
                            value={contentsDetail.contentsTitle || ""} // 선택된 영화 제목 표시
                            placeholder="검색"
                            readOnly
                            style={{ cursor: "pointer" }}
                        />
                        <input type="hidden" readOnly name="boardContentsId" value={contentsDetail.contentsId || ""} />
                        {/* 선택된 컨텐츠가 있으면 뱃지 표시 */}
                        {contentsDetail.contentsId && (
                            <span className="input-group-text bg-success text-white">선택됨</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 내용 (에디터) */}
            <div className="mb-3 mt-4">
                <label className="form-label fw-bold">내용</label>

                {/* 툴바와 에디터를 감싸는 div */}
                <div className="editor-container">
                    <CustomToolbar />
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        name="boardText"
                        value={board.boardText} // state 연결
                        onChange={handleChange} // handler 연결
                        modules={modules}
                        formats={formats}
                        style={{ height: "400px" }} // 에디터 높이 지정
                    />
                </div>
                {/* 에디터 하단 여백 확보를 위한 빈 div (툴바 때문에 밀릴 수 있음) */}
                <div style={{ height: "50px" }}></div>
            </div>

            <div className="row mt-4">
                <div className="col">
                    <button type="button" className="btn btn-lg btn-success w-100" disabled={boardValid === false}
                        onClick={sendData}>
                        <span>작성</span>
                    </button>
                </div>
            </div>

            {/* 모달(Modal) */}
            <div className="modal fade" tabIndex="-1" data-bs-backdrop="static" ref={modal} data-bs-keyboard="false">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-muted">컨텐츠 검색</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {/* 검색창 */}
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

                            {/* 상태 메시지 */}
                            <div className="mb-3 text-secondary small">
                                {statusMessage}
                            </div>

                            {/* 검색 결과 목록 */}
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
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>닫기</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </>)
}
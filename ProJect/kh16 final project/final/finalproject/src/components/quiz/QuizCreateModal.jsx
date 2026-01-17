import { useState, useEffect, useCallback } from "react";
import { quizApi } from "./api/quizApi";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegCircle, FaXmark } from "react-icons/fa6";
import "./QuizCreateModal.css"; 

export default function QuizCreateModal({ show, onClose, contentsId }) {
    
    // 공통 state
    const [quizType, setQuizType] = useState("MULTI");
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState({ 1: "", 2: "", 3: "", 4: "" });
    const [correctOptionIndex, setCorrectOptionIndex] = useState(null);

    useEffect(() => {
        if (show) {
            setQuizType("MULTI");
            setQuestion("");
            setOptions({ 1: "", 2: "", 3: "", 4: "" });
            setCorrectOptionIndex(null);
        }
    }, [show]);

    // ESC 키 누르면 닫히는 기능 추가
    useEffect(() => {
        const handleEscKey = (event) => {
            // 모달이 켜져있고(show), 누른 키가 Escape라면
            if (show && event.key === 'Escape') {
                onClose(); // 닫기 함수 실행
            }
        };

        //키보드 누를 때마다 검사
        window.addEventListener('keydown', handleEscKey);

        //모달 꺼질 때 이벤트 삭제
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, [show, onClose]);

    //제목 입력 수 제한
    const handleQuestionChange = useCallback((e) => {
        if (e.target.value.length <= 150) setQuestion(e.target.value);
    }, []);

    //문제 입력 수 제한
    const handleOptionChange = useCallback((idx, e) => {
        if (e.target.value.length <= 100) {
            setOptions(prev => ({ ...prev, [idx]: e.target.value }));
        }
    }, []);

    //문제 유형 변경 핸들러
    const handleTypeChange = useCallback((type) => {
        setQuizType(type);
        setCorrectOptionIndex(null);
        if (type === 'OX') {
            setOptions({ 1: "O", 2: "X", 3: "", 4: "" });
        } else {
            setOptions({ 1: "", 2: "", 3: "", 4: "" });
        }
    }, []);

    //문제 등록 제출
    const handleSubmit = useCallback(async () => {
        if (!question.trim()) return Swal.fire("내용 부족", "문제 내용을 입력해주세요.", "warning");
        if (correctOptionIndex === null) return Swal.fire("정답 미선택", "정답이 무엇인지 선택해주세요.", "warning");
        
        if (quizType === 'MULTI') {
            if (!options[1] || !options[2] || !options[3] || !options[4]) {
                return Swal.fire("보기 부족", "4지선다 보기를 모두 입력해주세요.", "warning");
            }
        }

        //화면에 찍기 위해 만든 임시 배열
        const quizDto = {
            quizContentsId: contentsId,
            quizQuestion: question,
            quizQuestionType: quizType,
            quizQuestionOption1: options[1],
            quizQuestionOption2: options[2],
            quizQuestionOption3: quizType === 'MULTI' ? options[3] : null,
            quizQuestionOption4: quizType === 'MULTI' ? options[4] : null,
            quizAnswer: String(correctOptionIndex)
        };

        //퀴즈 등록 시도
        try {
            await quizApi.insertQuiz(quizDto);
            await Swal.fire({
                icon: "success",
                title: "등록 완료!",
                text: "당신의 퀴즈가 등록되었어요.",
                confirmButtonColor: "#59cc9d"
            });
            onClose();
        } catch (error) {
            console.error("등록 실패", error);
            Swal.fire("등록 실패", "퀴즈 등록 중 오류가 발생했어요.", "error");
        }
    }, [question, correctOptionIndex, quizType, options, contentsId, onClose]); 

    if (!show) return null;

    return (
        <div className="modal fade show d-block quiz-modal-backdrop" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    
                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold">✍️ 퀴즈 만들기</h5>
                        {/* 닫기 버튼 (이걸 눌러야만 닫힘) */}
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-4">
                        
                        {/* 1. 타입 선택 버튼 그룹 */}
                        <div className="mb-4 text-center">
                            <div className="btn-group" role="group">
                                {/* 4지선다 선택 */}
                                <input type="radio" className="btn-check" name="btnradio" id="typeMulti" 
                                    checked={quizType === 'MULTI'} onChange={() => handleTypeChange('MULTI')} />
                                <label className="btn btn-outline-primary" htmlFor="typeMulti">4지선다 (객관식)</label>

                                {/* OX 퀴즈 선택 */}
                                <input type="radio" className="btn-check" name="btnradio" id="typeOX" 
                                    checked={quizType === 'OX'} onChange={() => handleTypeChange('OX')} />
                                <label className="btn btn-outline-primary" htmlFor="typeOX">OX 퀴즈</label>
                            </div>
                        </div>

                        {/* 2. 문제 입력 영역 */}
                        <div className="mb-4">
                            <label className="form-label fw-bold">문제 내용 <span className="text-danger">*</span></label>
                            <textarea 
                                className="form-control" 
                                rows="3"
                                placeholder="예) 아이언맨의 슈트 색깔이 아닌 것은?"
                                value={question}
                                onChange={handleQuestionChange}
                            ></textarea>
                            <div className="quiz-text-counter">
                                {question.length} / 150자
                            </div>
                        </div>

                        {/* 3. 보기 입력 및 정답 체크 영역 */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">보기 입력 및 정답 체크 <span className="text-danger">*</span></label>
                            <p className="text-muted small mb-2">
                                <i className="bi bi-info-circle me-1"></i> 
                                보기를 입력하고, 정답인 항목의 라디오 버튼을 선택해주세요.
                            </p>

                            <div className="d-flex flex-column gap-2">
                                {/* 1~4번 보기 */}
                                {[1, 2, 3, 4].map((idx) => {
                                    if (quizType === 'OX' && idx > 2) return null;

                                    return (
                                        <div key={idx} className="input-group">
                                            <div className="input-group-text bg-white">
                                                <input 
                                                    className="form-check-input mt-0 cursor-pointer" 
                                                    type="radio" 
                                                    name="correctOption" 
                                                    checked={correctOptionIndex === idx}
                                                    onChange={() => setCorrectOptionIndex(idx)}
                                                />
                                            </div>
                                            
                                            {/* 보기 번호 표시 */}
                                            <span className="input-group-text bg-light quiz-option-number">
                                                {idx}
                                            </span>
                                            
                                            {/* 보기 내용 */}
                                            {quizType === 'OX' ? (
                                                <div className={`form-control fw-bold quiz-ox-box ${idx === 1 ? 'text-success' : 'text-danger'}`}>
                                                    {idx === 1 ? <FaRegCircle className="me-2" /> : <FaXmark className="me-2" />}
                                                </div>
                                            ) : (
                                                //4지선다: 사용자 입력창
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    placeholder={`보기 ${idx}번 내용`}
                                                    value={options[idx]}
                                                    onChange={(e) => handleOptionChange(idx, e)}
                                                />
                                            )}
                                            
                                            {/* 보기 글자수 */}
                                            {quizType === 'MULTI' && (
                                                <span className="input-group-text quiz-option-counter">
                                                    {options[idx].length} / 100
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {/* 취소/등록 버튼 */}
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>취소</button>
                        <button className="btn btn-primary px-4" onClick={handleSubmit}>
                            등록하기
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
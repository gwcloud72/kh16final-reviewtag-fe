import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { currentQuizIndexAtom, heartState, quizListAtom, userAnswersAtom } from "../../utils/jotai";
import { quizApi } from "./api/quizApi";
import Swal from "sweetalert2";
import "./QuizGameModal.css";
import withReactContent from 'sweetalert2-react-content';
import { FaDoorOpen, FaRegCircle, FaTrophy, FaXmark } from "react-icons/fa6";
import { FaRedo } from "react-icons/fa";

// SweetAlert와 리액트 연결
const MySwal = withReactContent(Swal);

const ReportForm = ({ onDataChange }) => {
    const [type, setType] = useState('');
    const [content, setContent] = useState('');

    const handleChange = (newType, newContent) => {
        setType(newType);
        setContent(newContent);
        onDataChange({
            type: newType,
            content: newType === 'ETC' ? newContent : null
        });
    };

    return (
        <div className="report-form-container">
            <div className="report-label">신고 사유</div>
            <select
                className="form-select mb-3"
                value={type}
                onChange={(e) => handleChange(e.target.value, content)}
            >
                <option value="" disabled>사유를 선택해주세요</option>
                <option value="INCORRECT">문제 오류 (정답 없음/오타)</option>
                <option value="SPAM">스팸 / 홍보성 내용</option>
                <option value="ABUSIVE">욕설 / 비하 / 혐오 표현</option>
                <option value="ETC">기타 (직접 입력)</option>
            </select>

            {type === 'ETC' && (
                <>
                    <div className="report-label">상세 내용</div>
                    <textarea
                        className="form-control"
                        rows="3"
                        placeholder="상세 내용을 입력해주세요 (필수)"
                        value={content}
                        onChange={(e) => handleChange(type, e.target.value)}
                    ></textarea>
                </>
            )}
        </div>
    );
};

export default function QuizGameModal({ show, onClose, contentsId }) {

    //통합 state
    const [currentIndex, setCurrentIndex] = useAtom(currentQuizIndexAtom);
    const [quizList, setQuizList] = useAtom(quizListAtom);
    const [userAnswers, setUserAnswers] = useAtom(userAnswersAtom);

    //하트 상태 관리
    const [heart, setHeart] = useAtom(heartState);

    // 게임 상태 관리 (PLAYING / RESULT)
    const [gameState, setGameState] = useState('PLAYING');
    // 점수 결과 저장
    const [scoreResult, setScoreResult] = useState({ correct: 0, total: 0, points: 0 });

    //effect
    useEffect(() => {
        
        //게임 상태 초기화
        if (show) {
            setGameState('PLAYING');
            setCurrentIndex(0);
            setUserAnswers({});
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


    //callback
    //퀴즈 데이터 가져오기
    const loadQuizGame = useCallback(async () => {

        //하트가 없으면 차단
        if (heart <= 0) {
            Swal.fire({
                icon: 'warning',
                title: '하트가 부족해요! 💔',
                text: '내일 다시 도전해주세요.',
                confirmButtonColor: '#fe8563'
            });
            onClose();
            return;
        }

        try {
            // 서버에서 랜덤 5문제 가져오기
            setGameState('PLAYING');
            const data = await quizApi.getQuizGame(contentsId);
            setQuizList(data);     // 퀴즈 문제 데이터를 저장
            setCurrentIndex(0);    // 인덱스 초기화
            setUserAnswers({});    // 답안 초기화
        } catch (error) {
            console.error("퀴즈 로드 에러", error);
            Swal.fire({
                icon: "error",
                title: "로딩 실패",
                text: "퀴즈 데이터를 불러오지 못했어요.",
                confirmButtonColor: "#59cc9d"
            });
            onClose();
        }
    }, [contentsId, setQuizList, setCurrentIndex, setUserAnswers, onClose, heart]);


    //보기 버튼 클릭
    const handleOptionClick = useCallback((optionNumber) => {
        const currentQuiz = quizList[currentIndex];
        // 기존 답안 복사 후 현재 문제 ID에 대한 답만 업데이트
        setUserAnswers(prev => ({
            ...prev,
            [currentQuiz.quizId]: String(optionNumber)
        }));
    }, [quizList, currentIndex, setUserAnswers]);


    //다음 문제 이동
    const handleNext = useCallback(() => {
        if (currentIndex < quizList.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, quizList, setCurrentIndex]);


    //이전 문제 이동
    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex, setCurrentIndex]);


    //퀴즈 제출
    const handleSubmit = useCallback(async () => {
        //안 푼 문제 체크
        if (Object.keys(userAnswers).length < quizList.length) {
            Swal.fire({
                title: "잠시만요!",
                text: "아직 풀지 않은 문제가 남아있어요.",
                icon: "warning",
                confirmButtonColor: "#59cc9d",
                confirmButtonText: "확인"
            });
            return;
        }

        //제출 확인
        const choice = await Swal.fire({
            title: "답안을 제출하시겠습니까?",
            text: "제출 후에는 수정할 수 없어요",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#59cc9d",
            cancelButtonColor: "#fe8563",
            confirmButtonText: "예, 제출할게요",
            cancelButtonText: "아니오, 더 검토할래요",
            allowOutsideClick: false,
        });

        // 사용자가 취소를 눌렀으면 함수 종료
        if (!choice.isConfirmed) return;

        try {
            // 로직 수행
            let correctCount = 0;
            const logList = quizList.map(quiz => {
                const myAnswer = userAnswers[quiz.quizId];

                const isCorrect = (myAnswer.trim() === quiz.quizAnswer.trim()) ? 'Y' : 'N';

                if (isCorrect === 'Y') correctCount++;

                return {
                    quizLogQuizId: quiz.quizId,
                    quizLogIsCorrect: isCorrect
                };
            });

            await quizApi.submitQuizLog(logList);
            
            //화면의 하트 개수도 1 줄이기
            setHeart((prev) => prev - 1);

            //결과 상태 업데이트 및 화면 전환
            setScoreResult({
                correct: correctCount,
                total: quizList.length,
                points: correctCount * 20
            });
            setGameState('RESULT');

            //성공 알림
            // await Swal.fire({
            //     title: "제출 완료!",
            //     text: "결과 페이지로 이동합니다.",
            //     icon: "success",
            //     confirmButtonColor: "#59cc9d",
            //     confirmButtonText: "확인"
            // });

            // onClose(); // 모달 닫기

        } catch (error) {
            console.error(error);
            Swal.fire({
                title: "제출 오류",
                text: "제출 중 문제가 발생했습니다. 다시 시도해주세요.",
                icon: "error",
                confirmButtonColor: "#fe8563"
            });
        }

    }, [quizList, userAnswers]);

    //신고 버튼 핸들러
    const handleReport = () => {
        let currentReportData = { type: '', content: null };

        MySwal.fire({
            title: '퀴즈 신고하기',
            html: (
                <ReportForm
                    onDataChange={(data) => {
                        currentReportData = data;
                    }}
                />
            ),
            showCancelButton: true,
            confirmButtonText: '신고 접수',
            confirmButtonColor: '#dc3545',
            cancelButtonText: '취소',
            preConfirm: () => {
                if (!currentReportData.type) {
                    Swal.showValidationMessage('신고 사유를 선택해주세요!');
                    return false;
                }
                if (currentReportData.type === 'ETC' && !currentReportData.content?.trim()) {
                    Swal.showValidationMessage('기타 사유는 상세 내용을 입력해야 해요.');
                    return false;
                }
                return currentReportData;
            }
        }).then(async (result) => {

            if (result.isConfirmed) {
                const { type, content } = result.value;

                // 서버로 보낼 데이터 구성
                const payload = {
                    quizReportQuizId: currentQuiz.quizId,   // 현재 문제 ID
                    quizReportType: type,       //신고 유형
                    quizReportContent: content  //신고 유형이 'ETC'일때만 작성 가능한 내용
                };

                try {
                    // API 호출
                    const response = await quizApi.reportQuiz(payload);

                    if (response === "DUPLICATE") {
                        // 중복 신고인 경우
                        await MySwal.fire({
                            icon: 'warning',
                            title: '이미 신고 접수됨',
                            text: '이 문제는 이미 신고하셨습니다.',
                            confirmButtonColor: "#f0ad4e"
                        });
                    } else {
                        // 성공인 경우
                        await MySwal.fire({
                            icon: 'success',
                            title: '신고 완료',
                            text: '소중한 의견 감사합니다. 검토 후 반영하겠습니다.',
                            confirmButtonColor: "#59cc9d"
                        });
                    }
                } catch (error) {
                    console.error("신고 전송 실패:", error);
                    // 실패 알림
                    
                    MySwal.fire({
                        icon: 'error',
                        title: '전송 실패',
                        text: '일시적인 오류로 신고를 보내지 못했어요.',
                        confirmButtonColor: "#fe8563"
                    });
                }
            }
        });
    };

    // 현재 퀴즈 객체
    const currentQuiz = quizList[currentIndex];


    // 데이터가 로딩되지 않았으면 아무것도 그리지 않음
    if (!show || (!currentQuiz && gameState === 'PLAYING')) return null;


    // 보기 배열 생성 (MULTI: 4개, OX: 2개)
    const options = [];
    if (currentQuiz.quizQuestionOption1) options.push(currentQuiz.quizQuestionOption1);
    if (currentQuiz.quizQuestionOption2) options.push(currentQuiz.quizQuestionOption2);
    if (currentQuiz.quizQuestionType === 'MULTI') {
        if (currentQuiz.quizQuestionOption3) options.push(currentQuiz.quizQuestionOption3);
        if (currentQuiz.quizQuestionOption4) options.push(currentQuiz.quizQuestionOption4);
    }

    return (
        <div className="modal fade show d-block quiz-game-modal-backdrop" tabIndex="-1">

            {/* 모달 위치 및 크기 설정 */}
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">

                    {/* 결과 화면 */}
                    {gameState === 'RESULT' ? (
                        <div className="modal-body p-5 text-center animate__animated animate__fadeIn">
                            <div className="mb-4">
                                <FaTrophy size={80} className="text-warning mb-3 drop-shadow" />
                                <h2 className="fw-bold">퀴즈 종료!</h2>
                                <p className="text-muted">수고하셨습니다 🎉</p>
                            </div>

                            <div className="card bg-light border-0 mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                                <div className="card-body">
                                    <div className="row g-0">
                                        <div className="col-6 border-end">
                                            <div className="text-muted small">정답</div>
                                            <div className="fs-3 fw-bold text-success">
                                                {scoreResult.correct} <span className="fs-6 text-muted">/ {scoreResult.total}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted small">획득 포인트</div>
                                            <div className="fs-3 fw-bold text-primary">
                                                +{scoreResult.points} P
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-grid gap-2 col-8 mx-auto">
                                <button className="btn btn-primary btn-lg shadow-sm" onClick={loadQuizGame}>
                                    <FaRedo className="me-2" /> 다시 도전하기
                                </button>
                                <button className="btn btn-outline-secondary" onClick={onClose}>
                                    <FaDoorOpen className="me-2" /> 나가기
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                        {/* 플레이 화면 */}
                            <div className="modal-header bg-light d-flex justify-content-between align-items-center">
                                <h5 className="modal-title fw-bold">
                                    Quiz ({currentIndex + 1} / {quizList.length})
                                </h5>

                                {/* 우측 상단 버튼 그룹 (신고 + 닫기) */}
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm btn-report"
                                        onClick={handleReport}
                                    >
                                        🚨 신고
                                    </button>
                                    <button type="button" className="btn-close" onClick={onClose}></button>
                                </div>
                            </div>

                            {/* 모달 바디 (Body) */}
                            <div className="modal-body p-4 text-center">

                                {/* 문제 질문 텍스트 */}
                                <h3 className="mb-4 fw-bold">{currentQuiz.quizQuestion}</h3>

                                {/* 보기 버튼들이 들어갈 그리드 컨테이너 */}
                                <div className="d-grid gap-3 col-10 col-md-8 mx-auto">
                                    {/* options 배열을 순회하며 버튼 생성 */}
                                    {options.map((option, idx) => {

                                        //보기
                                        const optionNumber = idx + 1;
                                        // 사용자가 선택한 답인지 확인
                                        const isSelected = userAnswers[currentQuiz.quizId] === String(optionNumber);
                                        // 현재 문제가 OX 퀴즈인지 확인
                                        const isOX = currentQuiz.quizQuestionType === 'OX';

                                        return (
                                            <button
                                                key={idx}
                                                className={`btn py-3 fs-5 ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => handleOptionClick(optionNumber)}
                                            >
                                                {/* OX 퀴즈일 때와 일반 퀴즈일 때 내용을 다르게 보여줌 */}
                                                {isOX ? (
                                                    <span className={`icon-wrapper ${!isSelected ? (option === 'O' ? 'text-success' : 'text-danger') : ''}`}>
                                                        {option === 'O' ? <FaRegCircle className="me-2" /> : <FaXmark className="me-2 2x" />}
                                                    </span>
                                                ) : (
                                                    option
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="modal-footer justify-content-between">

                                {/* 이전 버튼 */}
                                <div className="modal-footer-btn-wrapper">
                                    {/* 첫 번째 문제(index 0)가 아닐 때만 '이전' 버튼 표시 */}
                                    {currentIndex > 0 && (
                                        <button className="btn btn-secondary w-100" onClick={handlePrev}>
                                            &lt; 이전
                                        </button>
                                    )}
                                </div>

                                {/* 진행 상태 */}
                                <div>
                                    {quizList.map((_, idx) => (
                                        <span
                                            key={idx}
                                            className={`badge rounded-pill mx-1 ${idx === currentIndex ? 'bg-primary' : 'bg-secondary'}`}
                                        >
                                            {idx + 1}
                                        </span>
                                    ))}
                                </div>

                                {/* 다음 또는 제출 버튼 */}
                                <div className="modal-footer-btn-wrapper">
                                    {currentIndex < quizList.length - 1 ? (
                                        // 마지막 문제가 아니면 [다음] 버튼
                                        <button className="btn btn-success w-100" onClick={handleNext}>
                                            다음 &gt;
                                        </button>
                                    ) : (
                                        // 마지막 문제면 [제출] 버튼
                                        <button className="btn btn-danger w-100" onClick={handleSubmit}>
                                            제출
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
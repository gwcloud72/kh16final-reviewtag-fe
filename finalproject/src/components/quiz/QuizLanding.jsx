import React, { useState, useEffect, useCallback } from 'react';
import { FaCrown, FaGamepad, FaPenNib, FaChartBar, FaTrophy } from "react-icons/fa6";
import { quizApi } from './api/quizApi';
import { useNavigate, useParams } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { heartState, loginIdState, quizListAtom } from '../../utils/jotai';
import Swal from "sweetalert2";
import "./QuizLanding.css"

//퀴즈 모달
import QuizGameModal from './QuizGameModal';
import QuizCreateModal from './QuizCreateModal';

export default function QuizLanding() {

    //URL에서 ID 직접 가져오기
    const { contentsId } = useParams();
    //console.log("QuizLanding contentsId:", contentsId);

    const navigate = useNavigate();

    //통합 state
    const loginId = useAtomValue(loginIdState);
    const setQuizList = useSetAtom(quizListAtom);

    //하트 상태 관리
    const [heart, setHeart] = useAtom(heartState);

    //로딩 상태 관리
    const [isLoading, setIsLoading] = useState(false);

    //모달 상태 관리
    const [showGameModal, setShowGameModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    //랭킹 데이터 관리
    const [topRanker, setTopRanker] = useState(null);
    const [myStats, setMyStats] = useState({ totalSolved: 0, bestScore: 0, rankPercent: 0, accuracy: 0 });

    const loadAllData = useCallback(async () => {
        if (!contentsId) return;

        try {
            //랭킹 1위 가져오기
            const rankingList = await quizApi.getRanking(contentsId);

            if (rankingList && rankingList.length > 0) {
                const numberOne = rankingList[0];
                setTopRanker({
                    nickname: numberOne.memberNickname || "익명의 고수",
                    score: numberOne.score || 0,
                    //avatar: numberOne.memberImg || "https://via.placeholder.com/100"
                });
            } else {
                setTopRanker(null);
            }

            //나의 통계 가져오기
            if (loginId) {
                const statsData = await quizApi.getMyStats(contentsId, loginId);

                //하트 개수 갱신
                const currentHeart = await quizApi.getMyHeart();
                setHeart(currentHeart);

                if (statsData) {
                    //console.log("📊 내 통계 데이터:", statsData);
                    // 상위 % 계산 (내등수 / 전체인원)
                    let percent = 0;
                    if (statsData.totalUsers > 0) {
                        //기본 퍼센트 계산
                        const rawPercent = (statsData.myRank / statsData.totalUsers) * 100;

                        //소수점 올림 처리
                        percent = Math.ceil(rawPercent);

                        //계산된 값이 1 이하면
                        if (statsData.myRank === 1) {
                            percent = 1;
                        }
                    }

                    setMyStats({
                        totalSolved: statsData.totalSolved, // 푼 문제 수
                        bestScore: statsData.myScore,       // 획득 점수
                        rankPercent: percent,                // 상위 N%
                        accuracy: statsData.accuracy
                    });
                }
            }

        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        }
    });

    useEffect(() => {
        if (!contentsId) return;

        loadAllData();
    }, [contentsId, loginId]);

    const handleRequireLogin = (actionCallback) => {
        //console.log("1. handleRequireLogin 실행됨. 로그인ID:", loginId);
        //로그인 상태
        if (loginId) {
            //console.log("로그인 상태임 -> 콜백 실행");
            actionCallback();
            return;
        }

        //비로그인 상태
        Swal.fire({
            title: '로그인이 필요해요!',
            text: '퀴즈를 풀거나 등록하려면 로그인이 필요해요.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#59cc9d',
            cancelButtonColor: '#fe8563',
            confirmButtonText: '로그인 하러가기',
            cancelButtonText: '구경만 할래요'
        }).then((result) => {
            if (result.isConfirmed) {
                // 확인 누르면 로그인 페이지로 이동
                navigate('/member/login');
            }
            // 취소 누르면 위치 유지
        });
    };

    const handleQuizChallenge = async () => {
        //console.log("handleQuizChallenge 진입함");
        //로딩중이면 실행 중지
        if (isLoading) return;

        //하트가 0개라면
        if (heart <= 0) {
            Swal.fire({
                icon: 'warning',
                title: '하트가 부족해요! 💔',
                text: '내일 다시 도전해주세요.',
                confirmButtonColor: '#fe8563',
                confirmButtonText: '확인'
            });
            return; 
        }

        try {
            //로딩 시작
            setIsLoading(true);
            //console.log("API 호출 시작. contentsId:", contentsId);
            //서버에 퀴즈 데이터가 있는지 확인
            const quizList = await quizApi.getQuizGame(contentsId);
            //console.log("API 응답 받음:", quizList);

            //퀴즈가 하나도 없다면
            if (!quizList || quizList.length === 0) {
                Swal.fire({
                    icon: 'question',
                    title: '등록된 퀴즈가 없어요 텅~',
                    text: '첫 번째 출제자가 되어주시겠어요? ✍️',
                    showCancelButton: true,
                    confirmButtonColor: '#198754',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: '네, 제가 낼게요!',
                    cancelButtonText: '다음에 할게요'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // 확인 누르면 -> 문제 출제 모달 열기!
                        setShowCreateModal(true);
                    }
                });
                return; // 게임 모달 열지 않고 종료
            }

            //서버에서 받아온 문제를 저장
            setQuizList(quizList);

            //퀴즈가 있다면
            setShowGameModal(true);

        } catch (error) {
            console.error("퀴즈 조회 에러:", error);

            if (error.response && error.response.status === 402) {
                 Swal.fire({
                    icon: 'error',
                    title: '진입 실패',
                    text: '하트가 부족하여 퀴즈를 시작할 수 없습니다.',
                    confirmButtonColor: '#fe8563'
                });
            } else {
                // 에러 상황에서도 알림
                Swal.fire({
                    icon: 'error',
                    title: '오류 발생',
                    text: '퀴즈 정보를 불러오는 중 문제가 발생했습니다.',
                    confirmButtonColor: '#fe8563'
                });
            }
        } finally {
            //모든 작업이 끝나면 로딩 풀기
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    return (
        <div className="container p-4 quiz-text-light">

            {/* --- 랭킹 섹션 --- */}
            <div className="quizCard border-0 mb-4 quiz-dark-card text-center shadow-sm">
                <div className="card-body py-5">
                    {/* topRanker 데이터가 있을 때만 출력 */}
                    {topRanker ? (
                        <>
                            <div className="mb-3 position-relative d-inline-block">
                                <FaCrown size={40} className="text-warning position-absolute start-50 translate-middle-x rank-crown-pos" />
                                {/* <img 
                                    src={topRanker.avatar} 
                                    alt="Rank 1" 
                                    className="rounded-circle rank-avatar" 
                                /> */}
                            </div>

                            {/* 닉네임 출력 */}
                            <h3 className="fw-bold mt-2">{topRanker.nickname}</h3>

                            <p className="opacity-75 mb-0">
                                이 영화의 퀴즈 마스터 <FaTrophy className='text-warning' /> <br />
                                <span className="badge bg-warning text-dark mt-2">
                                    {/* 점수 출력 */}
                                    점수 {topRanker.score}점
                                </span>
                            </p>
                        </>
                    ) : (
                        /* 랭킹 데이터가 없을 때 */
                        <div className="py-4 opacity-75">
                            <FaCrown className="rank-empty-icon" />
                            <h5>아직 퀴즈 마스터가 없습니다!</h5>
                            <br />
                            <p>첫 번째 주인공이 되어보세요</p>
                        </div>
                    )}
                </div>
            </div>


            {/* --- 2. 버튼 섹션 --- */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <button
                        className="btn btn-primary w-100 shadow-sm quiz-btn-custom"
                        onClick={() => !isLoading && handleRequireLogin(handleQuizChallenge)}
                        disabled={isLoading}
                    >
                        <FaGamepad size={32} className="mb-2 me-2"/>
                        <span className="fs-5 fw-bold">
                            {isLoading ? "로딩 중..." : "퀴즈 도전하기"}
                        </span>
                        <br />
                        <small className="opacity-75 mt-1">내 지식을 테스트해보세요!</small>
                    </button>
                </div>

                <div className="col-md-6">
                    <button
                        className="btn btn-success w-100 shadow-sm quiz-btn-custom"
                        onClick={() => handleRequireLogin(() => setShowCreateModal(true))}
                    >
                        <FaPenNib size={32} className="mb-2 me-2" />
                        <span className="fs-5 fw-bold">문제 출제하기</span>
                        <br />
                        <small className="opacity-75 mt-1">직접 문제를 만들어보세요!</small>
                    </button>
                </div>
            </div>


            {/* --- 3. 통계 섹션 --- */}
            <div className="quizCard border-0 shadow-sm quiz-dark-card">
                <div className="card-header fw-bold border-0 pt-3 stats-header-dark">
                    <FaChartBar className="me-2" />
                    나의 퀴즈 기록
                </div>
                <div className="card-body">
                    <div className="row text-center">
                        {/* 푼 문제 */}
                        <div className="col-3 stats-divider">
                            <h5 className="fw-bold text-primary">{myStats.totalSolved}</h5>
                            <small className="opacity-75">푼 문제</small>
                        </div>

                        {/* 점수 */}
                        <div className="col-3 stats-divider">
                            <h5 className="fw-bold text-success">{myStats.bestScore}</h5>
                            <small className="opacity-75">점수</small>
                        </div>

                        {/* 정답률 */}
                        <div className="col-3 stats-divider">
                            {/* 100%면 초록색, 아니면 노란색 등 색상 포인트 */}
                            <h5 className={`fw-bold ${myStats.accuracy === 100 ? 'text-success' : 'text-warning'}`}>
                                {myStats.accuracy}%
                            </h5>
                            <small className="opacity-75">정답률</small>
                        </div>

                        {/* 순위 */}
                        <div className="col-3">
                            <h5 className="fw-bold text-info">상위 {myStats.rankPercent}%</h5>
                            <small className="opacity-75">순위</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* 모달들 */}
            {showGameModal && (
                <QuizGameModal
                    show={showGameModal}
                    onClose={() => {
                        setShowGameModal(false);
                        loadAllData();
                    }}
                    contentsId={contentsId}
                />
            )}

            {showCreateModal && (
                <QuizCreateModal
                    show={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        loadAllData();
                    }}
                    contentsId={contentsId}
                />
            )}

        </div>
    );
};


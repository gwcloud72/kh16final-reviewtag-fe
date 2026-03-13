import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { loginIdState } from "../../utils/jotai";
import axios from "axios";
import './AdminQuiz.css'; // CSS 임포트
import AdminReviewCard from "./AdminReviewCard";
import { throttle } from "lodash";


export default function AdminReviewReport() {
    //state
    const loginId = useAtomValue(loginIdState);
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState('active');
    const [reviewList, setReviewList] = useState([]);
    const [quizList, setQuizList] = useState([]);

    //무한스크롤 페이지네이션
    const [page, setPage] = useState(1);//페이지번호
    const remainDataRef = useRef(0);
    const pageSize = 2; // 서버에서 한 페이지당 보내주는 데이터 수

    // 데이터 로딩 함수
    // const fetchQuizList = useCallback(async () => {
    //     if (!loginId) return;
    //     setLoading(true);
    //     try {
    //         const { data } = await axios.get(`/admin/quizzes/reports`, {
    //             params: { status: currentTab, page: page }
    //         });
            
    //         // 서버에서 받은 데이터가 pageSize보다 작으면 더 이상 데이터가 없음
    //         remainDataRef.current = data.length;

    //         if (page === 1) {//첫페이지면
    //             setQuizList(data);
    //         }
    //         else {//첫페이지가 아니면
    //             setQuizList(prev => ([...prev, ...data]));
    //         }
    //     } catch (error) {
    //         console.error("목록 로딩 실패", error);
    //     }
    //     setLoading(false);
        
    // },[page, currentTab, loginId]);

    // useEffect(() => {
    //     if (loginId) {
    //         fetchQuizList();
    //     }
    // }, [currentTab, loginId, page]);

    // 데이터 로딩함수
    const fetchReviewList = useCallback(async () => {
        setLoading(false);
        if (!loginId) return;
        try {
            const { data } = await axios.get(`/review/report/list`);
            console.log("데이터", data);
            setReviewList(data);
        }
        catch (err) {
            console.log(err);
        }

    }, [loginId]);

    useEffect(() => {
        if (loginId) {
            fetchReviewList();
        }
    }, [loginId]);

    //최초 1회 실행하여 window에 스크롤 이벤트를 추가
    useEffect(() => {
        const listener = throttle(e => {
            if (remainDataRef.current < pageSize) return;
            const percent = getScrollPercent();
            if (percent >= 90) {
                setPage(prev => prev + 1);
            }
        }, 500);

        window.addEventListener("scroll", listener);

        //effect cleanup 함수 - 이펙트가 종료되는 시점에 실행할 코드를 작성
        return () => {
            window.removeEventListener("scroll", listener);
        };
    }, []);

    // 스크롤바 퍼센트 구하는 함수
    const getScrollPercent = useCallback(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollHeight <= clientHeight) {
            return 0;
        }
        const scrollableHeight = scrollHeight - clientHeight;
        if (scrollableHeight - scrollTop < 1) {
            return 100;
        }
        const percentage = (scrollTop / scrollableHeight) * 100;
        return percentage;
    }, []);


    return (
        <div className="admin-quiz-container">

            {/* 1. 헤더 영역 */}
            <div className="admin-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                <h3 className="admin-title mb-0">
                    👮‍♀️ 리뷰 신고 관리
                </h3>
                {/* 필요하다면 여기에 '새로고침' 버튼 등을 둘 수 있음 */}
                <button className="btn btn-sm btn-outline-secondary" >
                    🔄 목록 갱신
                </button>
            </div>

            {/* 2. 탭 메뉴 (CSS 클래스 적용) */}
            <ul className="nav nav-tabs admin-tabs mb-4">
                <li className="nav-item">
                    <button
                        type="button"
                        className={`nav-link ${currentTab === 'active' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('active')}
                    >
                        🚨 접수된 신고 <span className="badge bg-danger ms-1 rounded-pill">Active</span>
                    </button>
                </li>
            </ul>

            {/* 3. 리스트 영역 */}
            <div className="mt-4">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                        <p className="mt-2 text-muted">데이터를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <>
                        {reviewList.length === 0 ? (
                            <div className="empty-state-box">
                                <div className="empty-icon">✨</div>
                                <h5>데이터가 없습니다.</h5>
                                <p>접수된 신고가 없거나 처리할 항목이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="quiz-list-grid">
                                {reviewList.map(review => (
                                    <AdminReviewCard
                                        key={review.reviewReportId}
                                        reviewData={review} 
                                        refreshList={fetchReviewList} 
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* <div className="mt-4">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">데이터를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <>
                        {quizList.length === 0 ? (
                            <div className="empty-state-box">
                                <div className="empty-icon">✨</div>
                                <h5>데이터가 없습니다.</h5>
                                <p>접수된 신고가 없거나 처리할 항목이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="quiz-list-grid">
                                {quizList.map(quiz => (
                                    <AdminQuizCard
                                        key={quiz.quizId}
                                        quizData={quiz}
                                        refreshList={fetchQuizList}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div> */}





        </div>
    );
}

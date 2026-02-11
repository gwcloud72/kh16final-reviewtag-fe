import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { loginIdState, loginLevelState } from '../../utils/jotai';
import { FaArrowLeft, FaRegCircle, FaTrashCan, FaXmark } from "react-icons/fa6";
import { quizApi } from './api/quizApi';

export default function MyCreatedQuizDetail() {

    const { quizId } = useParams();
    const navigate = useNavigate();

    //통합 state
    const loginId = useAtomValue(loginIdState);
    const loginLevel = useAtomValue(loginLevelState);

    //state
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [optionList, setOptionList] = useState([]);

    //데이터 로드
    useEffect(() => {
        const fetchQuizDetail = async () => {

            try {
                //const res = await axios.get(`/quiz/${quizId}`);
                const quizDetail = await quizApi.getQuizDetail(quizId);
                setQuizData(quizDetail);

                //삭제된 퀴즈라면 돌아가게 하기
                if (quizDetail.quizStatus === 'DELETED') {
                    await Swal.fire({
                        icon: 'error',
                        title: '삭제된 퀴즈',
                        text: '이미 삭제되어 내용을 확인할 수 없습니다.'
                    });
                    navigate(-1);//이전 페이지로 돌아가기
                    return;
                }

                const options = [];
                if (quizDetail.quizQuestionType === 'OX') {
                    // OX 퀴즈
                    options.push({ no: 1, content: 'O', icon: <FaRegCircle /> });
                    options.push({ no: 2, content: 'X', icon: <FaXmark /> });
                } else {
                    // 4지선다
                    if (quizDetail.quizQuestionOption1) options.push({ no: 1, content: quizDetail.quizQuestionOption1 });
                    if (quizDetail.quizQuestionOption2) options.push({ no: 2, content: quizDetail.quizQuestionOption2 });
                    if (quizDetail.quizQuestionOption3) options.push({ no: 3, content: quizDetail.quizQuestionOption3 });
                    if (quizDetail.quizQuestionOption4) options.push({ no: 4, content: quizDetail.quizQuestionOption4 });
                }

                setOptionList(options);
            } catch (error) {
                console.error(error);
                Swal.fire("오류", "퀴즈 정보를 불러오지 못했습니다.", "error");
                navigate(-1);
            } finally {
                setLoading(false);
            }

        };

        if (quizId) fetchQuizDetail();
    }, [quizId, navigate]);

    //퀴즈 삭제
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: '퀴즈 삭제',
            text: "정말 이 퀴즈를 삭제하시겠습니까? (복구 불가)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: '네, 삭제합니다',
            cancelButtonText: '취소'
        });

        if (result.isConfirmed) {
            try {
                const token = sessionStorage.getItem('accessTokenState');

                //const res = await axios.delete(`/quiz/${quizId}`);
                const res = await quizApi.deleteQuiz(quizId);

                await Swal.fire('삭제 완료', '퀴즈가 삭제되었습니다.', 'success');
                navigate(-1);
            } catch (error) {
                console.error(error);
                Swal.fire('실패', '삭제 권한이 없거나 오류가 발생했습니다.', 'error');
            }
        }
    };

    if (loading) return <div className="text-white text-center p-5">로딩중...</div>;
    if (!quizData) return <div className="text-white text-center p-5">데이터가 없습니다.</div>;

    //권한 체크
    const canDelete = (loginId && quizData.quizCreatorId === loginId) || (loginLevel === '관리자');

    //상태 체크
    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className='badge bg-success rounded-pill px-3 py-2'>정상 (Active)</span>;
            case 'BLIND':
                return <span className='badge bg-warning rounded-pill px-3 py-2'>🚨 블라인드 (신고 누적)</span>;
                
            default:
                return <span className="badge bg-light text-dark ms-2">{status}</span>;
        }
    };

    return (
        <div className="container py-5 text-white" style={{ maxWidth: '800px' }}>

            {/* 상단 헤더 */}
            <div className="d-flex align-items-center mb-5 border-bottom border-secondary pb-3">
                <button
                    className="btn btn-outline-light me-3"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> 이전으로
                </button>
                <h3 className="mb-0 fw-bold">✍️ 퀴즈 상세페이지</h3>
            </div>

            {/* --- 메인 컨텐츠 카드 --- */}
            <div className="card-header border-secondary p-4">
                <div className="d-flex align-items-center flex-wrap gap-2 mb-3">

                    <span className="badge bg-primary rounded-pill px-3 py-2">
                        ID: {quizData.quizId}
                    </span>

                    <span className={`badge rounded-pill px-3 py-2 ${quizData.quizQuestionType === 'OX' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                        {quizData.quizQuestionType === 'OX' ? 'OX 퀴즈' : '4지선다'}
                    </span>

                    {getStatusBadge(quizData.quizStatus)}
                </div>

                <h2 className="card-title fw-bold mb-0 text-light">{quizData.quizQuestion}</h2>

                <p className="text-muted mt-2 mb-0 d-flex align-items-center">
                    <span className="me-2 text-light">작성자:</span>
                    <span className="text-light fw-bold">{quizData.quizCreatorId}</span>
                </p>
            </div>

            <div className="card-body p-4">
                <h5 className="mb-3 text-light">선택지 및 정답</h5>

                <div className={quizData.quizQuestionType === 'OX' ? 'd-flex justify-content-center gap-4' : 'd-flex flex-column gap-3'}>
                    {optionList.map((opt) => {
                        const isAnswer = String(quizData.quizAnswer) === String(opt.no);

                        //OX 퀴즈
                        if (quizData.quizQuestionType === 'OX') {
                            return (
                                <div
                                    key={opt.no}
                                    className={`p-4 rounded border text-center position-relative cursor-default
                                            ${isAnswer
                                            ? 'border-success border-3 bg-success bg-opacity-25'
                                            : 'border-secondary bg-dark opacity-50'
                                        }`
                                    }
                                    style={{ minWidth: '150px' }}
                                >
                                    <div className={`display-1 ${opt.no === 1 ? 'text-success' : 'text-danger'}`}>
                                        {opt.icon}
                                    </div>
                                    {isAnswer && <span className="badge bg-success mt-2">정답 ✅</span>}
                                </div>
                            );
                        }

                        //4지선다
                        return (
                            <div
                                key={opt.no}
                                className={`p-3 rounded border text-start position-relative d-flex align-items-center text-light
                                        ${isAnswer
                                        ? 'border-success border-3 bg-success bg-opacity-10'
                                        : 'border-secondary bg-dark'
                                    }`
                                }
                            >
                                <span className="fw-bold fs-5 me-3 text-secondary">{opt.no}.</span>
                                <span className="fs-5 flex-grow-1">{opt.content}</span>
                                {isAnswer && <span className="badge bg-success rounded-pill px-3 py-2">정답 ✅</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 하단 버튼 영역 */}
            {canDelete && (
                <div className="card-footer border-secondary p-3 text-end">
                    <button className="btn btn-danger btn-lg" onClick={handleDelete}>
                        <FaTrashCan className="me-2" /> 퀴즈 삭제하기
                    </button>
                </div>
            )}
        </div>
    );
}
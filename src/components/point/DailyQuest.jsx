import React, { useEffect, useState, useCallback } from 'react';
import { toast } from "react-toastify";
import axios from "axios";
import { useAtomValue } from "jotai";
import { loginIdState } from "../../utils/jotai";
import Swal from 'sweetalert2';
import "./DailyQuest.css";

export default function DailyQuest({ setTab: questSetTab, refreshPoint: questRefreshPoint }) {
    const questLoginId = useAtomValue(loginIdState);
    const [questList, setQuestList] = useState([]);
    const [questTimeLeft, setQuestTimeLeft] = useState("");

    // 1. 자정까지 남은 시간 계산
    const questCalculateTimeLeft = useCallback(() => {
        const questNow = new Date();
        const questMidnight = new Date();
        questMidnight.setHours(24, 0, 0, 0); 
        const questDiff = questMidnight - questNow;
        const questHours = Math.floor((questDiff / (1000 * 60 * 60)) % 24);
        const questMinutes = Math.floor((questDiff / 1000 / 60) % 60);
        const questSeconds = Math.floor((questDiff / 1000) % 60);
        return `${String(questHours).padStart(2, "0")}:${String(questMinutes).padStart(2, "0")}:${String(questSeconds).padStart(2, "0")}`;
    }, []);

    useEffect(() => {
        setQuestTimeLeft(questCalculateTimeLeft());
        const questTimer = setInterval(() => setQuestTimeLeft(questCalculateTimeLeft()), 1000);
        return () => clearInterval(questTimer);
    }, [questCalculateTimeLeft]);

    // 2. 퀘스트 목록 로드
    const questLoadData = useCallback(async () => {
        if (!questLoginId) return;
        try {
            const questResp = await axios.get("/point/quest/list");
            setQuestList(questResp.data);
        } catch (e) { console.error("퀘스트 로드 실패", e); }
    }, [questLoginId]);

    useEffect(() => { questLoadData(); }, [questLoadData]);

    // 3. 퀘스트 클릭 핸들러
    const questHandleClick = async (questItem) => {
        if (questItem.done) return;

        if (questItem.action === "quiz") {
            try {
                const questQuizResp = await axios.get("/point/quest/quiz/random");
                if (!questQuizResp.data) {
                    toast.info("오늘의 퀴즈를 이미 완료하셨습니다.");
                    return;
                }

                const { quizNo: questQuizNo, quizQuestion: questQuizQuestion } = questQuizResp.data;

                const { value: questUserAnswer } = await Swal.fire({
                    title: '🎬 영화/애니 퀴즈',
                    text: questQuizQuestion,
                    input: 'text',
                    inputLabel: '정답을 입력하세요',
                    inputPlaceholder: '정답은 무엇일까요?',
                    showCancelButton: true,
                    confirmButtonText: '제출',
                    cancelButtonText: '취소',
                    background: '#1a1a1a',
                    color: '#fff',
                    confirmButtonColor: '#00d2d3',
                    inputValidator: (value) => {
                        if (!value) return '정답을 입력해야 합니다!';
                    }
                });

                if (questUserAnswer) {
                    const questCheckResp = await axios.post("/point/quest/quiz/check", { 
                        quizNo: questQuizNo, 
                        answer: questUserAnswer 
                    });

                    if (questCheckResp.data === "success") {
                        await Swal.fire({
                            icon: 'success',
                            title: '정답입니다!',
                            text: '🎉 퀘스트가 완료되었습니다.',
                            timer: 1500,
                            showConfirmButton: false,
                            background: '#1a1a1a',
                            color: '#fff'
                        });
                        questLoadData();
                    } else {
                        toast.error("오답입니다! 다시 시도해보세요.");
                    }
                }
            } catch (e) {
                toast.error("오류가 발생했습니다.");
            }
        } 
        else if (questItem.action === "roulette") {
            questSetTab("roulette");
            toast.info("🎰 룰렛 탭으로 이동합니다!");
        } 
        else if (questItem.type === "LIKE") {
            window.location.href = "/board/list";
        } 
        else if (questItem.type === "REVIEW") {
            window.location.href = "/contents/genreList/listByGenre/전체";
        }
    };

    // 4. 보상 받기
    const questHandleClaim = async (questType) => {
        try {
            const questClaimResp = await axios.post("/point/quest/claim", { type: questType });
            if (questClaimResp.data.startsWith("success")) {
                const questRewardAmount = questClaimResp.data.split(":")[1];
                toast.success(`보상 지급 완료! +${questRewardAmount}P 💰`);
                
                questLoadData(); 
                if (typeof questRefreshPoint === 'function') questRefreshPoint();
            } else {
                toast.warning(questClaimResp.data.split(":")[1]);
            }
        } catch (e) { toast.error("보상 수령 실패"); }
    };

    return (
        <div className="questCardWrapper">
            <div className="questHeaderRow">
                <h5 className="questMainTitle">📜 일일 퀘스트</h5>
                <span className="questTimerBadge">
                    ⏳ Reset {questTimeLeft}
                </span>
            </div>

            <div className="questListBox">
                {questList.map((quest, index) => (
                    <div key={quest.type || index} className={`questItemUnit ${quest.done ? 'questDoneBg' : ''}`}>
                        <div className="questItemFlex">
                            <div className="questIconFrame">{quest.icon}</div>
                            <div className="questContentBody">
                                <div className="questTopInfo">
                                    <span className={`questTitleText ${quest.done ? 'questTextDone' : ''}`}>{quest.title}</span>
                                    <span className="questRewardText">+{quest.reward} P</span>
                                </div>
                                <div className="questBottomInfo">
                                    <small className="questDescText">{quest.desc}</small>
                                    {quest.claimed ? (
                                        <span className="questStatusFinished">완료</span>
                                    ) : quest.done ? (
                                        <button className="questClaimBtn" onClick={() => questHandleClaim(quest.type)}>받기</button>
                                    ) : (
                                        <span className="questProgressText">{quest.current} / {quest.target}</span>
                                    )}
                                </div>
                                <div className="questProgressTrack">
                                    <div 
                                        className="questProgressBar" 
                                        style={{
                                            width: `${Math.min((quest.current / quest.target) * 100, 100)}%`, 
                                            backgroundColor: quest.done ? '#00d2d3' : '#e50914'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            {!quest.done && (
                                <button className="questShortcutBtn" onClick={() => questHandleClick(quest)} title="바로가기">🚀</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
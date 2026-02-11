import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAtomValue } from "jotai";
import { loginIdState } from "../../utils/jotai";
import Swal from "sweetalert2"; 
import "./Donate.css";

export default function Donate({ closeModal: donateCloseModal, onSuccess: donateOnSuccess }) {
    const donateLoginId = useAtomValue(loginIdState);

    const [donateTargetId, setDonateTargetId] = useState("");
    const [donateAmount, setDonateAmount] = useState("");
    const [donateIsLoading, setDonateIsLoading] = useState(false);

    const donateHandleSubmit = async () => {
        // 1. 유효성 검사
        if (!donateTargetId.trim()) {
            return toast.warning("받는 사람의 ID를 입력해주세요. 🧐");
        }
        if (donateTargetId === donateLoginId) {
            return toast.warning("본인에게는 선물할 수 없습니다. 😅");
        }
        if (!donateAmount || isNaN(donateAmount) || parseInt(donateAmount) <= 0) {
            return toast.warning("올바른 포인트 금액을 입력해주세요.");
        }

        // 2. 확인창
        const donateConfirmResult = await Swal.fire({
            title: '포인트 선물',
            html: `<div style="text-align: center;">
                    <b style="color: #f1c40f;">${donateTargetId}</b>님에게<br/>
                    <b style="font-size: 1.5rem;">${parseInt(donateAmount).toLocaleString()} P</b>를<br/>
                    선물하시겠습니까?
                   </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f1c40f',
            cancelButtonColor: '#444',
            confirmButtonText: '네, 보냅니다! 🚀',
            cancelButtonText: '취소',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (!donateConfirmResult.isConfirmed) return;

        setDonateIsLoading(true);

        try {
            // 3. 서버 요청
            const donateAxiosResponse = await axios.post("/point/donate", {
                targetId: donateTargetId,
                amount: parseInt(donateAmount)
            });

            // 4. 성공 응답 처리
            if (donateAxiosResponse.data === "success") {
                await Swal.fire({
                    icon: 'success',
                    title: '선물 완료!',
                    text: `${donateTargetId}님에게 마음을 전달했습니다.`,
                    showConfirmButton: false,
                    timer: 2000,
                    background: '#1a1a1a',
                    color: '#fff',
                    backdrop: `rgba(0,0,0,0.6) url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ0M255NnYycHF5NmR3eXNxcXRxNmR3eXNxcXRxNmR3eXNxcXRxJmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/26tOZ42Mg6pbMubM4/giphy.gif") center center no-repeat`
                });
                
                if (donateOnSuccess) donateOnSuccess(); 
                donateCloseModal();
            }
        } catch (donateError) {
            const donateErrorMessage = donateError.response?.data || "시스템 오류로 선물을 보내지 못했습니다.";
            
            Swal.fire({
                icon: 'error',
                title: '선물 실패',
                text: donateErrorMessage,
                background: '#1a1a1a',
                color: '#fff'
            });
        } finally {
            setDonateIsLoading(false);
        }
    };

    return (
        <div className="donateModalOverlay" onClick={donateCloseModal}>
            <div className="donateModalContent animate__animated animate__zoomIn" onClick={(e) => e.stopPropagation()}>
                
                <div className="donateHeader">
                    <div className="donateIconCircle">🎁</div>
                    <h4 className="donateTitle">POINT GIFT</h4>
                    <p className="donateSubtitle">친구에게 따뜻한 마음을 전하세요</p>
                    <button className="donateCloseBtn" onClick={donateCloseModal}>&times;</button>
                </div>

                <div className="donateBody">
                    <div className="donateInputGroupGlass">
                        <label className="donateInputLabel">받는 사람 아이디</label>
                        <input 
                            type="text" 
                            className="donateInputField" 
                            placeholder="상대방의 ID를 입력하세요"
                            value={donateTargetId}
                            onChange={(e) => setDonateTargetId(e.target.value)}
                        />
                    </div>

                    <div className="donateInputGroupGlass">
                        <label className="donateInputLabel">선물할 포인트 금액</label>
                        <div className="donateAmountInputWrapper">
                            <input 
                                type="number" 
                                className="donateInputField donateAmountField" 
                                placeholder="0"
                                value={donateAmount}
                                onChange={(e) => setDonateAmount(e.target.value)}
                            />
                            <span className="donateUnitText">P</span>
                        </div>
                    </div>
                </div>

                <div className="donateFooter">
                    <button 
                        className="donateSubmitBtn" 
                        onClick={donateHandleSubmit}
                        disabled={donateIsLoading}
                    >
                        {donateIsLoading ? "전송 중..." : "포인트 선물하기"}
                    </button>
                    <button className="donateCancelBtn" onClick={donateCloseModal}>닫기</button>
                </div>
            </div>
        </div>
    );
}
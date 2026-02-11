import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; 

export default function ProductAdd({ closeModal, reload }) {
    // [1] 입력값 관리: 백엔드 int 타입에 맞춰 초기값을 0으로 설정
    const [input, setInput] = useState({
        pointItemName: "",
        pointItemPrice: 0,
        pointItemStock: 10,
        pointItemType: "FOOD", 
        pointItemReqLevel: "일반회원",
        pointItemContent: "",
        pointItemSrc: "",
        pointItemIsLimitedPurchase: 0, 
        pointItemDailyLimit: 0          
    });

    // 입력값 변경 핸들러
    const changeInput = (e) => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
    };

    // [2] 등록 실행
    const handleAdd = async () => {
        // 필수 입력값 검증
        if (!input.pointItemName || !input.pointItemPrice) {
            return toast.warning("상품명과 가격은 필수입니다. 😫");
        }

        try {
            // 서버 전송 전 데이터 정제: 모든 숫자 필드를 Number()로 확실히 변환
            const payload = {
                ...input,
                pointItemPrice: Number(input.pointItemPrice),
                pointItemStock: Number(input.pointItemStock),
                pointItemDailyLimit: Number(input.pointItemDailyLimit),
                // 핵심 수정: String "N" 에러를 방지하기 위해 숫자로 변환하여 전송
                pointItemIsLimitedPurchase: Number(input.pointItemIsLimitedPurchase)
            };

            const resp = await axios.post("/point/main/store/item/add", payload);
            
            if (resp.data === "success") {
                toast.success("📦 상품 등록 완료!"); 
                reload(); // 목록 새로고침
                closeModal(); // 모달 닫기
            } else if (resp.data === "fail_auth") {
                toast.error("관리자만 등록할 수 있습니다. 👮");
            } else {
                toast.error("등록 실패: " + resp.data);
            }
        } catch (e) {
            toast.error("서버 오류가 발생했습니다. ☠️");
            console.error(e);
        }
    };

    return (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title fw-bold">📦 신규 상품 등록</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body p-4">
                        
                        {/* 상품명 */}
                        <div className="mb-3">
                            <label className="form-label fw-bold small">상품명</label>
                            <input type="text" name="pointItemName" className="form-control" onChange={changeInput} placeholder="예: 하트 5개 충전권" />
                        </div>

                        {/* 가격 & 재고 */}
                        <div className="row mb-3">
                            <div className="col">
                                <label className="form-label fw-bold small">가격(P)</label>
                                <input type="number" name="pointItemPrice" className="form-control" onChange={changeInput} placeholder="0" />
                            </div>
                            <div className="col">
                                <label className="form-label fw-bold small">재고</label>
                                <input type="number" name="pointItemStock" className="form-control" value={input.pointItemStock} onChange={changeInput} />
                            </div>
                        </div>

                        {/* 유형 & 등급 */}
                        <div className="row mb-3">
                            <div className="col">
                                <label className="form-label fw-bold small">유형</label>
                                <select name="pointItemType" className="form-select" onChange={changeInput} value={input.pointItemType}>
                                    <option value="">== 유형 선택 ==</option>
                                    <optgroup label="기능성 아이템">
                                        <option value="HEART_RECHARGE">하트 충전권 (5개)</option>
                                        <option value="CHANGE_NICK">닉네임 변경권</option>
                                        <option value="LEVEL_UP">레벨업 부스터</option>
                                    </optgroup>
                                    <optgroup label="치장/꾸미기">
                                        <option value="DECO_NICK">닉네임 치장</option>
                                        <option value="DECO_ICON">프로필 아이콘</option>
                                        <option value="DECO_BG">배경 스킨</option>
                                        <option value="DECO_FRAME">프로필 테두리</option>
                                    </optgroup>
                                    <optgroup label="이벤트/기타">
                                        <option value="VOUCHER">포인트 충전권</option>
                                        <option value="RANDOM_ICON">아이콘뽑기</option>
                                        <option value="RANDOM_ROULETTE">룰렛이용권</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="col">
                                <label className="form-label fw-bold small">필요 등급</label>
                                <select name="pointItemReqLevel" className="form-select" onChange={changeInput} value={input.pointItemReqLevel}>
                                    <option value="일반회원">일반회원</option>
                                    <option value="우수회원">우수회원</option>
                                    <option value="관리자">관리자</option>
                                </select>
                            </div>
                        </div>

                        {/* 구매 제한 설정 (중복구매 여부 숫자로 매핑) */}
                        <div className="row mb-3">
                            <div className="col-6">
                                <label className="form-label fw-bold small">중복 구매 제한</label>
                                <select 
                                    name="pointItemIsLimitedPurchase" 
                                    className="form-select" 
                                    onChange={changeInput} 
                                    value={input.pointItemIsLimitedPurchase}
                                >
                                    {/* 백엔드 DTO의 int 타입에 맞춰 value를 숫자로 설정 */}
                                    <option value={0}>제한 없음 (계속 구매)</option>
                                    <option value={1}>1인 1회 한정</option>
                                </select>
                            </div>
                            <div className="col-6">
                                <label className="form-label fw-bold small text-danger">일일 구매 제한 (개수)</label>
                                <input 
                                    type="number" 
                                    name="pointItemDailyLimit" 
                                    className="form-control" 
                                    value={input.pointItemDailyLimit} 
                                    onChange={changeInput} 
                                    placeholder="0 (제한없음)"
                                />
                            </div>
                        </div>

                        {/* 이미지 & 설명 */}
                        <div className="mb-3">
                            <label className="form-label fw-bold small">이미지 URL</label>
                            <input type="text" name="pointItemSrc" className="form-control" placeholder="http://..." onChange={changeInput} />
                        </div>
                        <div className="mb-0">
                            <label className="form-label fw-bold small">설명</label>
                            <textarea name="pointItemContent" className="form-control" rows="2" onChange={changeInput} placeholder="상품 설명을 입력하세요."></textarea>
                        </div>

                    </div>
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>취소</button>
                        <button type="button" className="btn btn-primary px-4 fw-bold" onClick={handleAdd}>상품 등록</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
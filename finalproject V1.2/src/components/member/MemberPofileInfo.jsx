import { Link, useParams } from "react-router-dom"
import "./MemberCustom.css"
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaGift } from "react-icons/fa";
import { useAtomValue } from "jotai";
import { loginIdState } from "../../utils/jotai";
import { toast } from "react-toastify";
import Donate from "../Point/Donate";


export default function MemberProfileInfo() {

    const loginId = useAtomValue(loginIdState);

    const { memberId } = useParams();

    const [data, setData] = useState(null);

    const [showDonate, setShowDonate] = useState(false);
    // ★ 포인트 갱신 트리거 (하위 컴포넌트에서 포인트 변동 시 호출)
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 포인트 갱신 함수 (StoreView, Roulette 등에 전달)
    const refreshAll = useCallback(() => {
        setRefreshTrigger(prev => prev + 1); // 이 값이 변하면 StoreProfile이 다시 로딩됨
    }, []);

    const loadData = useCallback(async () => {
        const { data } = await axios.get(`/member/profile/${memberId}`);
        setData(data);
    }, [memberId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const { profile = {}, point = {} } = data || {};

    // //신뢰도 레벨
    // const rel = profile?.memberReliability ?? 0;

    // const relRowLevel = useMemo(() => {
    //     return rel >= 6 && rel <= 19;
    // }, [rel])

    // const relMiddleLevel = useMemo(() => {
    //     return rel >= 20 && rel <= 49;
    // }, [rel])

    // const relHighLevel = useMemo(() => {
    //     return rel >= 50;
    // }, [rel])


    const formattedDate = useMemo(() => {
        if (!profile || !profile.memberJoin) return "";
        const date = profile.memberJoin;
        return date.substring(0, 16);
    }, [profile]);

    // 신뢰도 배지 계산
    const reliabilityInfo = useMemo(() => {
        const rel = data?.profile?.memberReliability || 0;
        if (rel >= 50) return { text: "◆ 검증된 리뷰어", class: "rel-high" };
        if (rel >= 20) return { text: "● 신뢰 리뷰어", class: "rel-mid" };
        return { text: "● 일반 멤버", class: "rel-none" };
    }, [data]);

    const isUrl = point.bgSrc?.startsWith('http');
    const heroStyle = isUrl ? { backgroundImage: `url(${point.bgSrc})` } : {};

    if (!data) {
        return <div className="text-white text-center mt-5">로딩중...</div>;
    }

    return (<>
        <div className="mypage-info-wrapper">
            {/* 1. 상단 히어로 (배경 + 아이콘 + 신뢰도 게이지) */}
            {/* <div className={`profile-hero-v2 ${!isUrl ? (point.bgSrc || "") : ""} ${point.frameSrc || ""}`} style={heroStyle}> */}
            <div className={`profile-hero-v2 ${!isUrl ? (point.bgSrc || "") : ""} `} style={heroStyle}>
                <div className="hero-content-v2">
                    <div className="avatar-box-v2">
                        <img src={point?.iconSrc} alt="Icon" className="avatar-img-v2" />
                    </div>
                    <div className="user-info-v2">
                        <h1 className="nickname-v2">
                            {profile.memberNickname}
                        </h1>
                        <div className={`badge-v2 ${reliabilityInfo.class}`}>
                            {reliabilityInfo.text}
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. 상세 정보 관리 (표 형식을 카드 스타일로 개선) */}
            <div className="account-info-card">
                <h3 className="card-title-v2">상세 정보</h3>
                <div className="info-list-v2 mt-4">
                    <div className="info-item-v2">
                        <span className="label-v2">아이디</span>
                        <span className="value-v2">{profile.memberId}</span>
                    </div>
                    <div className="info-item-v2">
                        <span className="label-v2">닉네임</span>
                        <span className="value-v2">{profile.memberNickname}</span>
                    </div>
                    <div className="info-item-v2">
                        <span className="label-v2">등급</span>
                        <span className="value-v2">{profile.memberLevel}</span>
                    </div>
                    <div className="info-item-v2">
                        <span className="label-v2">가입일</span>
                        <span className="value-v2">{formattedDate}</span>
                    </div>
                    <div className="info-item-v2">
                        <span className="label-v2">신뢰도</span>
                        <span className="value-v2">{profile.memberReliability}</span>
                    </div>
                </div>
            </div>

            {/* 4. 액션 버튼 영역 */}
            {loginId && loginId !== memberId && (

                <div className="row mt-4">
                    <div className="col">
                        <div className="mypage-actions-v2">
                            <button onClick={() => setShowDonate(true)}
                                className="btn btn-main me-2">
                                <FaGift className="me-2" />선물하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 후원 모달 */}
            {showDonate &&
                <Donate closeModal={() => setShowDonate(false)}
                    onSuccess={() => { refreshAll(); toast.success("후원 완료! 🎁"); }} />
            }

        </div>

    </>)
}
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate, NavLink } from "react-router-dom";
import { useAtom, useSetAtom } from "jotai";
import axios from "axios";
import Swal from "sweetalert2"; 
import { clearLoginState, loginNicknameState } from "../../utils/jotai";
import "./MemberCustom.css"; 

export default function MemberMyinfo() {
    const { loginId } = useParams();
    const navigate = useNavigate();

    // 전역 상태 및 데이터 상태 관리
    const [loginNickname, setLoginNickname] = useAtom(loginNicknameState);
    const clearLogin = useSetAtom(clearLoginState);
    const [data, setData] = useState(null);

    // 마이페이지 데이터 로드 로직
    const loadData = useCallback(async () => {
        if (!loginId) return;
        try {
            const res = await axios.get(`/member/mypage/${loginId}`);
            setData(res.data);
            if (res.data?.member?.memberNickname) {
                setLoginNickname(res.data.member.memberNickname);
            }
        } catch (err) {
            console.error("데이터 로딩 실패", err);
        }
    }, [loginId, setLoginNickname]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 회원 탈퇴 로직
    const deleteMember = useCallback(async () => {
        const result = await Swal.fire({
            title: '정말 탈퇴하시겠습니까?',
            text: "탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff3b30', 
            cancelButtonColor: '#333',
            confirmButtonText: '탈퇴하기',
            cancelButtonText: '취소',
            background: '#1a1a1a', 
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/member/${loginId}`);
                await Swal.fire({ title: '탈퇴 완료', text: '그동안 이용해주셔서 감사합니다.', icon: 'success', background: '#1a1a1a', color: '#fff' });
                clearLogin();
                navigate("/");
            } catch (err) {
                Swal.fire({ title: '오류 발생', icon: 'error', background: '#1a1a1a', color: '#fff' });
            }
        }
    }, [loginId, navigate, clearLogin]);

    // 신뢰도 배지 계산
    const reliabilityInfo = useMemo(() => {
        const rel = data?.member?.memberReliability || 0;
        if (rel >= 50) return { text: "◆ 검증된 리뷰어", class: "rel-high" };
        if (rel >= 20) return { text: "● 신뢰 리뷰어", class: "rel-mid" };
        return { text: "● 일반 멤버", class: "rel-none" };
    }, [data]);

    if (!data) return <div className="loading-container">데이터 로딩 중...</div>;

    const { member = {}, point = {}, reviewCount = 0, wishCount = 0, quizCount = 0 } = data;
    const isUrl = point.bgSrc?.startsWith('http');
    const heroStyle = isUrl ? { backgroundImage: `url(${point.bgSrc})` } : {};

    return (
        <div className="mypage-info-wrapper">
            {/* 1. 멤버십 카드 스타일의 프로필 히어로 */}
            <div className={`profile-hero-v2 ${!isUrl ? (point.bgSrc || "") : ""} ${point.frameSrc || ""}`} style={heroStyle}>
            {/* <div className={`profile-hero-v2 ${!isUrl ? (point.bgSrc || "") : ""} `} style={heroStyle}> */}

                <div className="hero-content-v2">
                    <div className="avatar-box-v2">
                        <img src={point.iconSrc || "/default-profile.png"} className="avatar-img-v2" alt="icon" />
                    </div>
                    <div className="user-info-v2">
                        <h1 className="nickname-v2">{member.memberNickname}</h1>
                        <div className={`badge-v2 ${reliabilityInfo.class}`}>
                            {reliabilityInfo.text}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. 활동 통계 그리드 */}
            <div className="activity-stats-row">
                <NavLink to="/point/main">
                    <div className="stat-card">
                        <span className="stat-label">보유 포인트</span>
                        <span className="stat-value text-gold">{member.memberPoint?.toLocaleString()} P</span>
                    </div>
                </NavLink>
                <NavLink to={`/member/mypage/myreview/${loginId}`}>
                    <div className="stat-card">
                        <span className="stat-label">작성한 리뷰</span>
                        <span className="stat-value">{reviewCount || 0}</span>
                    </div>
                </NavLink>
                <NavLink to={`/member/mypage/mycontent/${loginId}`}>
                    <div className="stat-card">
                        <span className="stat-label">찜한 목록</span>
                        <span className="stat-value">{wishCount || 0}</span>
                    </div>
                </NavLink>
                <NavLink to={`/member/mypage/myquiz/${loginId}`}>
                    <div className="stat-card">
                        <span className="stat-label">참여 퀴즈</span>
                        <span className="stat-value">{quizCount || 0}</span>
                    </div>
                </NavLink>
            </div>

            {/* 3. 상세 정보 카드 */}
            <div className="account-info-card">
                <h3 className="section-title">상세 정보 관리</h3>
                <div className="info-list-v2">
                    <div className="info-item-v2"><span>아이디</span><strong>{member.memberId}</strong></div>
                    <div className="info-item-v2"><span>등급</span><strong>{member.memberLevel}</strong></div>
                    <div className="info-item-v2"><span>이메일</span><strong>{member.memberEmail}</strong></div>
                    <div className="info-item-v2"><span>연락처</span><strong>{member.memberContact}</strong></div>
                </div>
            </div>

            {/* 4. 수정된 하단 액션 버튼 */}
            <div className="mypage-actions-v2">
                <Link to={`/member/mypage/edit/${loginId}`} className="btn-edit-v2">정보 수정</Link>
                <Link to={`/member/mypage/password/${loginId}`} className="btn-sub-v2">비밀번호 변경</Link>
                <button className="btn-out-v2" onClick={deleteMember}>회원 탈퇴</button>
            </div>
        </div>
    );
}
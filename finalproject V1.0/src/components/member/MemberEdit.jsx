import { FaEraser, FaMagnifyingGlass, FaUser, FaCakeCandles, FaPhone, FaXmark } from "react-icons/fa6";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { useDaumPostcodePopup } from "react-daum-postcode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import "./MemberDetail.css";

const contactRegex = /^010[1-9][0-9]{7}$/;

export default function MemberEdit() {
    const { loginId } = useParams();
    const navigate = useNavigate();
    const memberAddress2Ref = useRef(null);
    const open = useDaumPostcodePopup(); // 주소 팝업 오픈 함수

    const [member, setMember] = useState({ 
        memberBirth: "", memberContact: "", memberPost: "", memberAddress1: "", memberAddress2: "" 
    });
    const [memberClass, setMemberClass] = useState({ 
        memberBirth: "", memberContact: "", memberPost: "", memberAddress1: "", memberAddress2: "" 
    });

    // 1. 검증 로직
    const getValidation = useCallback((m) => {
        const isBirthValid = m.memberBirth !== "";
        const isContactValid = m.memberContact === "" ? true : contactRegex.test(m.memberContact);
        const isAddrValid = (m.memberPost && m.memberAddress1 && m.memberAddress2) || (!m.memberPost && !m.memberAddress1 && !m.memberAddress2);
        return { isBirthValid, isContactValid, isAddrValid };
    }, []);

    const memberValid = useMemo(() => {
        const { isBirthValid, isContactValid, isAddrValid } = getValidation(member);
        return isBirthValid && isContactValid && isAddrValid;
    }, [member, getValidation]);

    const handleBlur = useCallback(() => {
        const { isBirthValid, isContactValid, isAddrValid } = getValidation(member);
        setMemberClass({
            memberBirth: isBirthValid ? "is-valid" : "is-invalid",
            memberContact: isContactValid ? "is-valid" : "is-invalid",
            memberPost: isAddrValid ? (member.memberPost ? "is-valid" : "") : "is-invalid",
            memberAddress1: isAddrValid ? (member.memberAddress1 ? "is-valid" : "") : "is-invalid",
            memberAddress2: isAddrValid ? (member.memberAddress2 ? "is-valid" : "") : "is-invalid"
        });
    }, [member, getValidation]);

    useEffect(() => {
        if (!loginId) return;
        axios.get(`/member/mypage/${loginId}`).then(res => {
            const m = res.data.member;
            setMember({
                memberBirth: m.memberBirth ?? "",
                memberContact: m.memberContact ?? "",
                memberPost: m.memberPost ?? "",
                memberAddress1: m.memberAddress1 ?? "",
                memberAddress2: m.memberAddress2 ?? ""
            });
        });
    }, [loginId]);

    // 주소 검색 핸들러
    const handleAddressSearch = () => {
        open({
            onComplete: (data) => {
                setMember(prev => ({
                    ...prev,
                    memberPost: data.zonecode,
                    memberAddress1: data.address
                }));
                setMemberClass(prev => ({
                    ...prev,
                    memberPost: "is-valid",
                    memberAddress1: "is-valid"
                }));
                memberAddress2Ref.current.focus();
            }
        });
    };

    // 날짜 변경 핸들러 (시차 문제 방지)
    const handleDateChange = (date) => {
        if (!date) return;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setMember({ ...member, memberBirth: formattedDate });
    };

    // 서버 전송
    const sendData = async () => {
        if (!memberValid) return;
        try {
            await axios.put(`/member/${loginId}`, member);
            await Swal.fire({
                title: '수정 완료',
                text: '회원 정보가 성공적으로 변경되었습니다.',
                icon: 'success',
                background: '#161618',
                color: '#fff',
                confirmButtonColor: '#00ffcc'
            });
            navigate(`/member/mypage/myinfo/${loginId}`);
        } catch (err) {
            Swal.fire({ title: '오류 발생', text: '수정 중 문제가 발생했습니다.', icon: 'error', background: '#161618', color: '#fff' });
        }
    };

    return (
        <div className="member-detail-wrapper">
            <h2>기본 정보 수정</h2>
            <hr className="mb-4" style={{borderColor: '#333'}}/>
            
            <label className="mb-2"><FaCakeCandles className="me-2 text-info" /> 생년월일</label>
            <div className="datepicker-container mb-4">
                <DatePicker
                    selected={member.memberBirth ? new Date(member.memberBirth) : null}
                    onChange={handleDateChange}
                    onBlur={handleBlur}
                    dateFormat="yyyy-MM-dd"
                    locale={ko}
                    placeholderText="날짜를 선택하세요"
                    className={`member form-control ${memberClass.memberBirth}`}
                    maxDate={new Date()}
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                />
            </div>

            <label className="mb-2"><FaPhone className="me-2 text-info" /> 연락처</label>
            <input name="memberContact" value={member.memberContact} onChange={e => setMember({...member, memberContact: e.target.value})} onBlur={handleBlur} className={`member form-control mb-4 ${memberClass.memberContact}`} placeholder="01012345678" />

            <label className="mb-2">주소</label>
            <div className="d-flex gap-2 mb-2">
                <input readOnly value={member.memberPost} className={`member form-control w-50 ${memberClass.memberPost}`} placeholder="우편번호" />
                <button type="button" onClick={handleAddressSearch} className="btn-address-tool"><FaMagnifyingGlass /></button>
            </div>
            <input readOnly value={member.memberAddress1} className={`member form-control mb-2 ${memberClass.memberAddress1}`} placeholder="기본주소" />
            <input ref={memberAddress2Ref} name="memberAddress2" value={member.memberAddress2} onChange={e => setMember({...member, memberAddress2: e.target.value})} onBlur={handleBlur} className={`member form-control ${memberClass.memberAddress2}`} placeholder="상세주소" />

            <button className="btn-member-edit mt-5" disabled={!memberValid} onClick={sendData}>
                <FaUser className="me-2"/> 정보 수정 완료
            </button>
            <Link to={`/member/mypage/myinfo/${loginId}`} className="btn-cancel">
                <FaXmark className="me-2"/> 취소하고 돌아가기
            </Link>
        </div>
    );
}
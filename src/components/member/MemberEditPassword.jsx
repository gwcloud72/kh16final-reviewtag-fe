import { FaAsterisk, FaEye, FaEyeSlash, FaUser, FaLock, FaXmark } from "react-icons/fa6";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; 
import "./MemberDetail.css"; 

const pwRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$])[A-Za-z0-9!@#$]{8,16}$/;

export default function MemberEditPassword() {
    const { loginId } = useParams();
    const navigate = useNavigate();

    const [member, setMember] = useState({ memberPw: "", memberPwCheck: "" });
    const [memberClass, setMemberClass] = useState({ memberPw: "", memberPwCheck: "" });
    const [memberPwFeedback, setMemberPwFeedback] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const getValidation = useCallback((m) => {
        const isPwValid = m.memberPw === "" ? null : pwRegex.test(m.memberPw);
        let isCheckValid = null;
        let feedback = "";

        if (m.memberPwCheck.length > 0) {
            isCheckValid = m.memberPw === m.memberPwCheck;
            feedback = isCheckValid ? "" : "비밀번호가 일치하지 않습니다";
        } else if (m.memberPw.length > 0) {
            isCheckValid = false;
            feedback = "비밀번호 확인을 입력하세요";
        }
        return { isPwValid, isCheckValid, feedback };
    }, []);

    const memberValid = useMemo(() => {
        const { isPwValid, isCheckValid } = getValidation(member);
        return isPwValid === true && isCheckValid === true;
    }, [member, getValidation]);

    const handleBlur = useCallback(() => {
        const { isPwValid, isCheckValid, feedback } = getValidation(member);
        setMemberClass({
            memberPw: isPwValid === null ? "" : (isPwValid ? "is-valid" : "is-invalid"),
            memberPwCheck: isCheckValid === null ? "" : (isCheckValid ? "is-valid" : "is-invalid")
        });
        setMemberPwFeedback(feedback);
    }, [member, getValidation]);

    const changeStrValue = useCallback(e => {
        const { name, value } = e.target;
        setMember(prev => ({ ...prev, [name]: value }));
    }, []);

    const sendData = useCallback(async () => {
        if (!memberValid) return;
        try {
            await axios.put(`/member/password/${loginId}`, { memberPw: member.memberPw });
            await Swal.fire({ 
                title: '변경 완료', 
                text: '성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요.', 
                icon: 'success', 
                background: '#161618', 
                color: '#fff', 
                confirmButtonColor: '#00ffcc' 
            });
            navigate(`/member/mypage/myinfo/${loginId}`);
        } catch (err) {
            Swal.fire({ title: '변경 실패', icon: 'error', background: '#161618', color: '#fff' });
        }
    }, [member, memberValid, loginId, navigate]);

    return (
        <div className="member-detail-wrapper">
            <h2 className="d-flex align-items-center justify-content-center">
                <FaLock className="me-3" style={{color: '#ffd700'}}/>비밀번호 변경
            </h2>
            <p className="text-center text-secondary mb-5">보안을 위해 강력한 비밀번호를 설정해 주세요.</p>
            
            <div className="mb-4">
                <label className="d-flex align-items-center mb-2">
                    새 비밀번호 <FaAsterisk className="text-danger ms-1" style={{fontSize: '0.6rem'}}/>
                    <span className="ms-auto" onClick={() => setShowPassword(!showPassword)} style={{cursor:'pointer', color:'#666'}}>
                        {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                </label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    className={`member form-control ${memberClass.memberPw}`}
                    name="memberPw" value={member.memberPw}
                    onChange={changeStrValue} onBlur={handleBlur}
                    placeholder="대/소문자, 숫자, 특수문자 포함 8~16자"
                />
                <div className="invalid-feedback">형식에 맞지 않는 비밀번호입니다</div>
            </div>

            <div className="mb-4">
                <label className="mb-2">비밀번호 확인</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    className={`member form-control ${memberClass.memberPwCheck}`}
                    name="memberPwCheck" value={member.memberPwCheck}
                    onChange={changeStrValue} onBlur={handleBlur}
                    placeholder="비밀번호를 재입력하세요"
                />
                <div className="invalid-feedback">{memberPwFeedback}</div>
            </div>

            <button type="button" className="btn-member-edit mt-5" disabled={!memberValid} onClick={sendData}>
                <FaUser className="me-2"/> 비밀번호 변경하기
            </button>
            
            <Link to={`/member/mypage/myinfo/${loginId}`} className="btn-cancel">
                <FaXmark className="me-2"/> 취소하고 돌아가기
            </Link>
        </div>
    );
}
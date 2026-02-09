import { Link } from "react-router-dom";




export default function MemberJoinFinish(){

        return(<>
        <div className="row mt-4">
            <div className="col">
                <h1>회원가입 완료</h1>
            </div>
        </div>
        
        <div className="row mt-4">
            <div className="col">
                <Link to = "/member/login">로그인</Link> 화면으로 이동
            </div>
        </div>



    </>)
}
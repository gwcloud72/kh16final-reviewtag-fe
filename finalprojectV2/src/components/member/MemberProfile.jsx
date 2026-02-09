import { Link, Outlet, useParams } from "react-router-dom";
import "./Member.css"

export default function MemberProfile() {
    
    const {memberId} = useParams();

    return(<>
    <div className="row">
        
    <div className="col-lg-10 offset-lg-1 member-form">
        <div className="row">
            <div className="col d-flex justify-content-center flex-wrap">
                <Link to={`/member/profile/info/${memberId}`} className="btn btn-secondary me-2 mt-2">정보</Link>
                <Link to={`/member/profile/favorite/${memberId}`} className="btn btn-secondary me-2 mt-2">인생작</Link>
                <Link to={`/member/profile/review/${memberId}`} className="btn btn-secondary me-2 mt-2">리뷰</Link>
            </div>
        </div>
    
        {/* 중첩 라우팅이 되어있기때문에 해당 영역을 표시할 수 있도록 <Outlet/>을 생성해야함 */}
        <div className="row mt-4">
            <div className="col">
                <Outlet/>
            </div>
        </div>
     </div>
    </div>
    </>)
}
import { useAtom, useAtomValue } from "jotai"
import { Navigate } from "react-router-dom"
import { adminState, loginCompleteState, loginState } from "../../utils/jotai"
import { ClimbingBoxLoader } from "react-spinners";


//export default function Admin ( props ) {
export default function Admin ( { children } ) {
    const loginComplete = useAtomValue(loginCompleteState);
    //const isLogin = useAtomValue(loginState);
    const isAdmin = useAtomValue(adminState);

    if(loginComplete === false) {
        return <ClimbingBoxLoader/>
    }

    return isAdmin === true ? children : <Navigate to={"/error/403"}/>
    // return isAdmin === true   ? children   : <Navigate to="/error/403" replace />;
}
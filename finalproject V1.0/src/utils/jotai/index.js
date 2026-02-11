import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const loginIdState = atomWithStorage("loginIdState", "", sessionStorage);
export const loginLevelState = atomWithStorage("loginLevelState", "", sessionStorage);
export const loginNicknameState = atomWithStorage("loginNicknameStoreage","", sessionStorage);
export const accessTokenState = atomWithStorage("accessTokenState", "", sessionStorage);
export const refreshTokenState= atomWithStorage("refreshTokenState", "", sessionStorage);


//하트 개수
export const heartState = atomWithStorage("myHeart", 0, sessionStorage);

export const loginState = atom(get=>{
    const loginId = get(loginIdState);
    const loginLevel = get(loginLevelState);
    console.log("loginId", loginId, "loginLevel", loginLevel);
    return loginId?.length>0 && loginLevel?.length>0;
});
export const adminState = atom(get=>{
    const loginId = get(loginIdState);
    const loginLevel = get(loginLevelState);
    console.log("loginId", loginId, "loginLevel", loginLevel);
    return loginId?.length>0 && loginLevel==="관리자";
});

//로그인 관련 state 초기화 (쓰기함수)
export const clearLoginState = atom(
    null,
    (get, set)=>{
        set(loginIdState, "");
        set(loginLevelState, "");
        set(loginNicknameState, "");
        set(accessTokenState, "");
        set(refreshTokenState, "");
    }
)

//로그인 판정 확인용 데이터
export const loginCompleteState = atom(false);

//퀴즈 관련
//현재 풀고 있는 퀴즈 목록 (서버에서 받아온 5문제)
export const quizListAtom = atom([]);

//현재 문제 번호 (0 ~ 4)
export const currentQuizIndexAtom = atom(0);

//사용자 답안 저장소 { quizId: "정답값" }
export const userAnswersAtom = atom({});

//퀴즈 게임 모달 표시 여부
export const quizModalShowAtom = atom(false);

export const pointRefreshAtom = atom(0);
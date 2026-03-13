// Central place for API path definitions (WITHOUT '/api' prefix).
// Axios interceptor in `src/utils/axios/index.js` will prefix '/api' automatically.
//
// Use like:
//   import { ENDPOINTS } from "@/api/endpoints";
//   axios.get(ENDPOINTS.member.profileInfo(loginId));

export const ENDPOINTS = {
  member: {
    login: "/member/login",
    join: "/member/join",
    logout: "/member/logout",
    profileInfo: (memberId) => `/member/profile/info/${memberId}`,
    profileUpdate: "/member/profile/update",
    profilePassword: "/member/profile/password",
    myInfo: "/member/mypage/info",
  },

  review: {
    list: "/review",
    detail: (contentsId, reviewNo) => `/review/${contentsId}/${reviewNo}`,
    write: "/review/write",
    edit: (reviewNo) => `/review/${reviewNo}`,
    delete: (reviewNo) => `/review/${reviewNo}`,
  },

  board: {
    list: "/board",
    detail: (boardNo) => `/board/${boardNo}`,
    write: "/board",
    edit: (boardNo) => `/board/${boardNo}`,
    delete: (boardNo) => `/board/${boardNo}`,
    comment: (boardNo) => `/board/${boardNo}/comment`,
  },

  admin: {
    members: "/admin/members",
    giveEmoticon: "/admin/emoticon/give",
  },

  point: {
    rankingTotal: "/point/ranking/total",
  },
};

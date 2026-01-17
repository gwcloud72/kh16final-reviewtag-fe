import axios from "axios";

const token = sessionStorage.getItem('accessTokenState');

export const quizApi = {

  // 퀴즈 게임 데이터 조회 (랜덤 5문제)
  getQuizGame: async (contentsId) => {
    const response = await axios.get(`/quiz/game/${contentsId}`);
    return response.data; // List<QuizDto> 반환
  },

  // 퀴즈 결과 제출 (배열 형태)
  submitQuizLog: async (logList) => {
    const response = await axios.post('/quiz/log/submit', logList);
    return response.data; // 성공 시 int (1) 반환 예상
  },

  // 퀴즈 등록
  insertQuiz: async (quizDto) => {
    const response = await axios.post('/quiz/', quizDto);
    return response.data;
  },

  // 퀴즈 목록 조회 (해당 영화의 퀴즈 리스트)
  getQuizList: async (contentsId) => {
    const response = await axios.get(`/quiz/list/${contentsId}`);
    return response.data;
  },

  // 퀴즈 상세 정보 조회
  getQuizDetail: async (quizId) => {
    const response = await axios.get(`/quiz/${quizId}`);
    return response.data;
  },

  // 퀴즈 수정
  updateQuiz: async (quizDto) => {
    const response = await axios.patch('/quiz/', quizDto);
    return response.data;
  },

  // 퀴즈 상태 변경 (삭제 처리 등)
  changeQuizStatus: async (quizDto) => {
    const response = await axios.patch('/quiz/status', quizDto);
    return response.data;
  },

  // 퀴즈 완전 삭제
  deleteQuiz: async (quizId) => {
    const response = await axios.delete(`/quiz/${quizId}`);
    return response.data;
  },

  // 내 퀴즈 기록 조회
  getMyLogs: async () => {
    const response = await axios.get('/quiz/log/mypage');
    return response.data;
  },

  // 내 점수(랭킹용) 확인
  getMyScore: async () => {
    const response = await axios.get('/quiz/log/score');
    return response.data;
  },

  // 전체 랭킹 확인
  getRanking: async (contentsId) => {
    const response = await axios.get(`/quiz/log/list/ranking/${contentsId}`);
    return response.data;
  },

  // 퀴즈 신고하기
  reportQuiz: async (quizReportDto) => {
    const response = await axios.post('/quiz/report/', quizReportDto);
    return response.data;
  },

  //나의 통계 가져오기
  getMyStats: async (contentsId, memberId) => {
    const response = await axios.get(`/quiz/log/stats/${contentsId}/${memberId}`);
    return response.data;
  },

  //내 하트 개수 가져오기
  getMyHeart: async () => {
    try {
      const response = await axios.get(`/heart/`);

      return response.data.heartCount;

    } catch (error) {
      console.error("하트 조회 실패:", error);
      return 0;
    }
  },
};
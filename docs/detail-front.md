# 포인트 생태계 프론트엔드 상세 구현

> 이 문서는 프로젝트 프론트 전체를 설명하는 문서라기보다,
> 포인트 기반 보상 기능을 화면에서 어떻게 풀었는지 정리한 문서입니다.
> 사용자가 출석하고, 보상을 받고, 상점과 인벤토리를 이용하는 흐름이 자연스럽게 이어지도록
> 프론트에서 어떤 기준으로 구현했는지 중심으로 정리했습니다.

---

## 목차
1. 담당 범위와 구현 목표
2. 기술 스택과 인증 흐름
3. 구현하면서 중요하게 본 점
4. 사용자 기능 구현
5. 관리자 기능 구현
6. 트러블슈팅
7. 마무리

---

## 1. 담당 범위와 구현 목표

이번 프로젝트에서 프론트는 단순히 API를 붙이는 역할보다,
사용자가 포인트 기능을 사용할 때 흐름이 끊기지 않도록 만드는 데 집중했습니다.

제가 주로 정리한 범위는 아래와 같습니다.

- 출석, 일일 퀘스트, 퀴즈, 룰렛 화면
- 포인트 상점, 위시리스트, 인벤토리 화면
- 포인트 이력 조회 화면
- 관리자용 포인트 조정, 상품 관리, 자산 조회 화면
- 인증 처리와 공통 API 호출 구조
- 화면 상태 동기화와 갱신 패턴 정리

가장 중요하게 본 점은 두 가지였습니다.

첫째, **보상을 받았는데 화면이 늦게 바뀌면 실패처럼 느껴진다**는 점이었습니다.
그래서 포인트, 인벤토리, 재고처럼 사용자 체감이 큰 값은 부분 수정에 기대기보다
성공 후 재조회로 확정하는 쪽을 선택했습니다.

둘째, **인증 문제는 화면마다 따로 풀면 금방 꼬인다**는 점이었습니다.
토큰 주입, 401 처리, refresh 재요청을 한 군데로 모아두고,
개별 페이지는 기능 구현에만 집중할 수 있게 구조를 맞췄습니다.

---

## 2. 기술 스택과 인증 흐름

### 사용 기술 및 협업 도구
- ⚙️ **Frontend**: React (Vite)
- 🧭 **Routing**: React Router
- 🌐 **API Communication**: Axios
- 🧩 **State Management**: Jotai
- 🔐 **Authentication**: JWT
- 🤝 **Collaboration**: Git, GitHub

### 인증 처리 방식
클라이언트는 로그인 이후 발급받은 access token을 기준으로 요청하고,
Axios interceptor에서 `Authorization` 헤더를 공통으로 주입했습니다.

또한 access token이 만료되었을 때는 401 응답을 감지한 뒤,
refresh 요청으로 새 토큰을 받아 원래 요청을 다시 보내도록 구성했습니다.

이렇게 정리한 이유는 인증 관련 예외 처리를 페이지마다 흩어놓지 않고,
API 요청의 공통 규칙으로 묶기 위해서였습니다.

### 핵심 코드: axios instance + 토큰 재발급 처리

```js
import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshRes = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = refreshRes.data.accessToken;
      sessionStorage.setItem("accessToken", newToken);
      original.headers.Authorization = `Bearer ${newToken}`;

      return instance(original);
    }

    return Promise.reject(err);
  }
);

export default instance;
```

---

## 3. 구현하면서 중요하게 본 점

### 3-1) 성공 이후에는 화면을 다시 조회해서 상태를 맞춤
포인트, 인벤토리, 퀘스트, 상점 재고는 서로 엮여 있는 값이 많았습니다.
그래서 어떤 값을 한 군데서 바꾸면 다른 화면까지 영향을 받는 경우가 많았고,
로컬 상태만 부분 수정하면 누락이 생기기 쉬웠습니다.

그래서 핵심 기능은 성공 응답 이후 필요한 데이터를 다시 조회해서
화면 기준 상태를 확정하는 패턴으로 정리했습니다.

### 공통 갱신 패턴

```js
const refreshAll = async () => {
  await Promise.all([fetchBalance(), fetchInventory(), fetchQuestList()]);
};
```

### 3-2) 조건이 바뀌는 화면은 초기화 규칙을 둠
상점처럼 검색, 필터, 페이징이 함께 들어간 화면은
조건이 바뀔 때 이전 page 값이 남아 있으면 빈 목록처럼 보일 수 있습니다.

그래서 필터와 검색 조건이 바뀌는 순간 첫 페이지로 초기화하고 다시 조회하도록 맞췄습니다.

### 3-3) 프론트의 역할은 “보여주기”보다 “체감 일관성 유지”라고 생각함
백엔드가 트랜잭션으로 정합성을 보장한다면,
프론트는 언제 어떤 데이터를 다시 불러오고 어떤 예외를 막아줄지로
사용자가 느끼는 안정성을 만들 수 있다고 생각했습니다.

---

## 4. 사용자 기능 구현

아래 내용은 실제 사용자가 경험하는 흐름 순서대로 정리했습니다.

---

### 01) 출석

**관련 API**
- `GET  /point/main/attendance/status`
- `POST /point/main/attendance/check`
- `GET  /point/main/attendance/calendar`

출석 화면에서는 오늘 출석 여부, 연속 출석 상태, 월별 출석 기록이 같이 보이도록 구성했습니다.
출석 성공 이후에는 상태와 보유 포인트를 다시 조회해 화면이 바로 바뀌도록 처리했습니다.

```js
const fetchAttendanceStatus = async () => {
  const res = await instance.get("/point/main/attendance/status");
  setAttendance(res.data);
};

const handleCheckAttendance = async () => {
  await instance.post("/point/main/attendance/check");
  await fetchAttendanceStatus();
  await fetchBalance();
};

const fetchAttendanceCalendar = async (ym) => {
  const res = await instance.get("/point/main/attendance/calendar", {
    params: { ym },
  });
  setCalendar(res.data);
};
```

---

### 02) 일일 퀘스트 / 퀴즈

**관련 API**
- `GET  /point/quest/list`
- `POST /point/quest/claim`
- `GET  /point/quest/quiz/random`
- `POST /point/quest/quiz/check`

일일 퀘스트는 목록 조회, 보상 수령, 퀴즈 풀이가 한 흐름으로 이어져야 해서
보상 수령 이후 포인트와 퀘스트 목록을 함께 갱신하도록 구현했습니다.

```js
const fetchQuestList = async () => {
  const res = await instance.get("/point/quest/list");
  setQuestList(res.data);
};

const claimQuestReward = async (type) => {
  await instance.post("/point/quest/claim", { type });
  await Promise.all([fetchQuestList(), fetchBalance()]);
};

const fetchRandomQuiz = async () => {
  const res = await instance.get("/point/quest/quiz/random");
  setQuiz(res.data);
};

const submitQuiz = async ({ quizNo, userAnswer }) => {
  const res = await instance.post("/point/quest/quiz/check", {
    quizNo,
    userAnswer,
  });
  return res.data;
};
```

---

### 03) 룰렛

**관련 API**
- `POST /point/main/store/roulette`

룰렛은 티켓 사용, 보상 지급, 인벤토리 반영, 포인트 갱신이 함께 일어나기 때문에
한 번의 성공 이후 여러 상태를 같이 갱신하도록 처리했습니다.

```js
const playRoulette = async () => {
  const res = await instance.post("/point/main/store/roulette");
  await Promise.all([fetchInventory(), fetchBalance(), fetchQuestList()]);
  return res.data;
};
```

---

### 04) 상점

**관련 API**
- `GET  /point/main/store`
- `POST /point/main/store/buy`
- `POST /point/main/store/gift`
- `POST /point/main/store/wish/toggle`
- `GET  /point/main/store/wish/my`

상점 화면은 검색, 필터, 페이징, 구매, 선물, 위시리스트가 한 화면에 엮여 있어
상태가 꼬이기 쉬운 구간이었습니다.
특히 구매 이후에는 목록, 인벤토리, 잔액이 함께 바뀌기 때문에
관련 데이터를 묶어서 다시 조회하는 방식으로 처리했습니다.

```js
const fetchStoreList = async ({ page, itemType, keyword }) => {
  const res = await instance.get("/point/main/store", {
    params: { page, itemType, keyword },
  });
  setStore(res.data);
};

const buyItem = async (itemNo) => {
  await instance.post("/point/main/store/buy", { itemNo });
  await Promise.all([
    fetchStoreList({ page: 1, itemType: "ALL" }),
    fetchInventory(),
    fetchBalance(),
  ]);
};

const giftItem = async ({ targetId, itemNo }) => {
  await instance.post("/point/main/store/gift", { targetId, itemNo });
  await fetchBalance();
};

const toggleWish = async (itemNo) => {
  const res = await instance.post("/point/main/store/wish/toggle", { itemNo });
  return res.data;
};

const fetchMyWish = async () => {
  const res = await instance.get("/point/main/store/wish/my");
  setWish(res.data);
};
```

---

### 05) 인벤토리

**관련 API**
- `GET  /point/main/store/inventory/my`
- `POST /point/main/store/inventory/use`
- `POST /point/main/store/inventory/unequip`
- `POST /point/main/store/cancel`

인벤토리는 사용, 장착, 해제, 환불처럼 액션이 많고
사용 결과가 잔액이나 보유 상태에 바로 영향을 주는 화면이라
성공 후 재조회 패턴을 가장 많이 적용한 구간이었습니다.

```js
const fetchInventory = async () => {
  const res = await instance.get("/point/main/store/inventory/my");
  setInventory(res.data);
};

const useInventoryItem = async ({ inventoryNo, extraValue }) => {
  await instance.post("/point/main/store/inventory/use", {
    inventoryNo,
    extraValue,
  });
  await Promise.all([fetchInventory(), fetchBalance()]);
};

const unequip = async (inventoryNo) => {
  await instance.post("/point/main/store/inventory/unequip", { inventoryNo });
  await fetchInventory();
};

const cancelItem = async (inventoryNo) => {
  await instance.post("/point/main/store/cancel", { inventoryNo });
  await Promise.all([fetchInventory(), fetchBalance()]);
};
```

---

### 06) 포인트 이력

**관련 API**
- `GET /point/history`

포인트 이력은 사용자가 자신의 적립 / 차감 내역을 직접 확인하는 화면이라,
유형별 필터와 페이지 이동이 자연스럽게 이어지도록 조회 구조를 정리했습니다.

```js
const fetchHistory = async ({ page, type }) => {
  const res = await instance.get("/point/history", { params: { page, type } });
  setHistory(res.data);
};
```

---

## 5. 관리자 기능 구현

관리자 화면은 사용자 기능과 달리 “운영자가 빠르게 처리할 수 있느냐”가 중요해서,
단순히 보기 좋은 화면보다 검색과 수정 흐름이 끊기지 않도록 정리했습니다.

### 01) 회원 포인트 조정

```js
const adminAdjustPoint = async ({ memberId, amount, trxType, reason }) => {
  await instance.post("/admin/point/adjust", { memberId, amount, trxType, reason });
  await fetchAdminMembers();
};
```

### 02) 상점 상품 CRUD

```js
const adminCreateItem = async (formData) => {
  await instance.post("/admin/store", formData);
};

const adminUpdateItem = async (itemNo, formData) => {
  await instance.put(`/admin/store/${itemNo}`, formData);
};

const adminDeleteItem = async (itemNo) => {
  await instance.delete(`/admin/store/${itemNo}`);
};
```

### 03) 회원 자산 조회

```js
const adminSearchMemberAssets = async ({ keyword, page }) => {
  const res = await instance.get("/admin/inventory", { params: { keyword, page } });
  setAdminAssets(res.data);
};
```

---

## 6. 트러블슈팅

실제로 작업하면서 크게 신경 썼던 문제는 “에러가 났다”보다
"사용자 입장에서는 왜 실패했는지 잘 안 보이는데 화면이 이상하게 느껴지는 문제"였습니다.
그중 대표적인 다섯 가지를 정리하면 아래와 같습니다.

### 1) 특정 API만 401이 반복되던 문제

- **상황**: 로그인은 되어 있는데 일부 화면에서만 데이터가 계속 안 뜨고 401이 반복됐습니다.
- **확인**: Network 탭을 비교해보니 실패 요청만 `Authorization` 헤더가 빠져 있었습니다.
- **원인**: 페이지마다 axios를 따로 쓰거나 `axios.get(...)`을 직접 호출한 코드가 섞여 있어서 interceptor가 적용되지 않았습니다.
- **해결**: 모든 API 호출을 단일 instance로 통일하고, 토큰 주입과 예외 처리를 공통화했습니다.
- **정리**: 인증 흐름은 각 페이지에서 풀지 말고 공통 구조로 잡아야 유지보수가 편했습니다.

### 2) 토큰 만료 후 화면이 멈추던 문제

- **상황**: 토큰이 만료된 시점에 페이지를 이동하면 빈 화면처럼 보이거나 이전 값이 남아 있었습니다.
- **확인**: 401 이후 refresh는 되더라도 원래 요청이 다시 나가지 않는 흐름이었습니다.
- **원인**: 토큰만 새로 발급받고 실패한 요청을 재시도하지 않으면 화면은 복구되지 않습니다.
- **해결**: response interceptor에서 refresh 성공 시 원요청을 그대로 재호출하도록 수정했습니다.
- **정리**: 만료 자체보다 만료 후 복구 흐름을 어떻게 잡느냐가 더 중요했습니다.

### 3) 구매 / 사용 이후 값이 바로 반영되지 않던 문제

- **상황**: 구매 성공 알림은 뜨는데 잔액, 재고, 인벤토리가 그대로여서 사용자 입장에서는 실패처럼 느껴졌습니다.
- **확인**: 성공 응답 이후 화면 상태를 부분적으로만 수정하고 있었고, 페이지마다 갱신 방식도 달랐습니다.
- **원인**: 포인트와 재고, 인벤토리가 동시에 엮이는 화면에서 로컬 상태만 부분 갱신하면 누락이 생기기 쉬웠습니다.
- **해결**: 성공 후 `fetchInventory`, `fetchBalance`, `fetchStoreList`, `fetchQuestList`를 재호출하는 패턴으로 통일했습니다.
- **정리**: 재화 관련 데이터는 클라이언트 계산보다 서버 재조회가 훨씬 안전했습니다.

### 4) 이미지 값이 없을 때 카드 UI가 깨지던 문제

- **상황**: 장착 아이템이 없는 상태에서 카드가 깨지거나 이미지 영역이 어색하게 보였습니다.
- **확인**: 응답 데이터의 `src`가 null인 경우가 있었고, 이미지 컴포넌트가 그대로 렌더링되고 있었습니다.
- **원인**: 있을 수도 있고 없을 수도 있는 값을 예외 없이 렌더링한 것이 원인이었습니다.
- **해결**: 기본 이미지를 fallback으로 넣고, 조건부 렌더링으로 예외를 방어했습니다.
- **정리**: 프론트에서는 "없을 수 있는 값"을 기본값으로 바꿔주는 처리가 중요했습니다.

### 5) 검색 / 필터 변경 후 목록이 비어 보이던 문제

- **상황**: 상점 필터를 바꾸면 결과가 없는 것처럼 보이는 경우가 있었습니다.
- **확인**: 검색 조건이 바뀌어도 이전 페이지 번호가 그대로 유지되고 있었습니다.
- **원인**: 조건이 달라졌는데도 기존 page를 유지하면서 존재하지 않는 페이지를 요청하고 있었습니다.
- **해결**: 필터나 검색어가 바뀌는 순간 `page=1`로 초기화하고 다시 조회하도록 수정했습니다.
- **정리**: 페이징이 있는 화면은 조건 변경 시 첫 페이지로 리셋하는 규칙이 꼭 필요했습니다.

---

## 7. 마무리

이번 프로젝트를 하면서 프론트는 단순히 화면을 예쁘게 만드는 역할이 아니라,
사용자가 기능을 신뢰할 수 있도록 흐름과 상태를 정리하는 역할이라는 점을 더 크게 느꼈습니다.

특히 포인트 기능은 숫자 하나가 바뀌는 문제처럼 보여도,
실제로는 잔액, 보상, 인벤토리, 상점 재고, 사용자 행동 흐름이 모두 연결되어 있어서
작은 갱신 타이밍 차이도 사용성에 큰 영향을 줬습니다.

그래서 이번 구현에서는 아래 기준을 끝까지 유지하려고 했습니다.

1. 인증 흐름은 한 곳에서 관리한다.
2. 정합성이 중요한 값은 성공 후 재조회로 맞춘다.
3. 조건이 바뀌는 화면은 초기화 규칙을 둔다.

이 프로젝트를 통해 화면 단위 구현보다
사용자 흐름 단위로 생각하는 게 훨씬 중요하다는 점을 많이 배웠습니다.

# detail-front.md — Frontend 상세 구현

아래 코드는 “화면 → API → 상태 갱신” 흐름이 보이도록 핵심만 정리했습니다.

---

## 1) Axios 인증 처리

### axios instance + Authorization 주입 + 401 refresh 재요청

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

## 2) 공통 갱신 패턴

성공 후 “재조회”로 화면을 확정합니다.

```js
const refreshAll = async () => {
  await Promise.all([fetchBalance(), fetchInventory(), fetchQuestList()]);
};
```

---

## 3) 사용자 기능 (핵심 API 호출)

### 3-1. 출석

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

### 3-2. 일일 퀘스트/퀴즈

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

### 3-3. 룰렛

```js
const playRoulette = async () => {
  const res = await instance.post("/point/main/store/roulette");
  await Promise.all([fetchInventory(), fetchBalance(), fetchQuestList()]);
  return res.data;
};
```

### 3-4. 상점 (검색/필터/페이징 + 구매/선물 + 위시)

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

### 3-5. 인벤토리 (조회/사용/장착해제/환불)

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

### 3-6. 포인트 이력

```js
const fetchHistory = async ({ page, type }) => {
  const res = await instance.get("/point/history", { params: { page, type } });
  setHistory(res.data);
};
```

---

## 4) 관리자 기능 (운영)

### 4-1. 회원 포인트 조정

```js
const adminAdjustPoint = async ({ memberId, amount, trxType, reason }) => {
  await instance.post("/admin/point/adjust", { memberId, amount, trxType, reason });
  await fetchAdminMembers();
};
```

### 4-2. 상점 상품 CRUD

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

### 4-3. 자산(인벤) 조회

```js
const adminSearchMemberAssets = async ({ keyword, page }) => {
  const res = await instance.get("/admin/inventory", { params: { keyword, page } });
  setAdminAssets(res.data);
};
```

---

## 5) 트러블슈팅  5건 (프론트 기준)

아래 5건은 실제로 화면이 “이상하게 보이거나 / 유저가 바로 체감하는 문제”였고, 해결 과정에서 공통 패턴을 잡아 재발을 줄였습니다.

### 1. 특정 API만 401이 반복됨

- **상황**: 로그인은 정상인데, 몇몇 화면에서만 데이터가 계속 안 뜨고 401이 반복됐습니다.
- **확인**: Network 탭에서 성공하는 요청과 실패하는 요청을 비교해보니, 실패 요청만 `Authorization` 헤더가 비어 있었습니다.
- **원인**: 페이지별로 axios를 따로 만들거나 `axios.get(...)`을 직접 호출한 코드가 섞여 있어서, interceptor가 적용되지 않는 요청이 있었습니다.
- **수정**: 모든 API 호출을 단일 `axios instance`로 통일하고, interceptor에서 토큰 주입을 강제했습니다.
- **정리**: 인증 관련 코드는 흩어지기 시작하면 바로 문제가 나서, instance를 한 군데로 모았습니다.

### 2. 토큰 만료 이후 화면이 멈춤(재로그인해야만 복구)

- **상황**: 토큰 만료 타이밍에 페이지를 이동하면, 빈 화면 또는 이전 값이 그대로 남고 이후 요청이 실패했습니다.
- **확인**: 401 응답 이후 UI가 실패 상태로 고정되어 있고, 같은 요청을 다시 보내지 않는 흐름이었습니다.
- **원인**: 401을 받았을 때 refresh를 하더라도 원래 요청을 재시도하지 않으면 화면이 복구되지 않습니다.
- **수정**: response interceptor에서 refresh 성공 시 원요청을 그대로 재호출하도록 처리했습니다.
- **정리**: 만료는 피할 수 없어서, 만료 후 복구 루트를 앱이 책임지게 만들었습니다.

### 3. 구매/사용 이후 수량·잔액이 바로 반영되지 않음

- **상황**: 구매/사용 성공 알림은 뜨는데, 상점 재고·인벤 수량·잔액이 그대로여서 사용자 입장에선 실패처럼 보였습니다.
- **확인**: 성공 응답 이후 화면 상태를 부분 업데이트하는 코드가 페이지마다 다르게 들어가 있었고, 어떤 화면은 갱신이 빠졌습니다.
- **원인**: 로컬 상태를 부분 수정하면 누락이 생깁니다(특히 인벤/잔액/퀘스트가 한 번에 엮이는 케이스).
- **수정**: 성공 후에는 `fetchInventory / fetchBalance / fetchStoreList / fetchQuestList`처럼 재조회로 확정하는 패턴으로 통일했습니다.
- **정리**: 재화/재고처럼 정합성이 중요한 값은 로컬 계산보다 서버 재조회가 안전했습니다.

### 4. 장착 전 이미지(src)가 null이면 카드 UI가 깨짐

- **상황**: 꾸미기 아이템을 장착하지 않은 상태에서 카드가 깨지거나 이미지 영역이 비정상적으로 렌더링됐습니다.
- **확인**: 응답 데이터에서 `src`가 null인 상태가 있었고, 이미지 컴포넌트가 그대로 렌더링하고 있었습니다.
- **원인**: null src를 그대로 이미지 태그에 넘기면 브라우저가 예외 동작을 하거나 레이아웃이 흔들립니다.
- **수정**: `src`가 없으면 기본 이미지를 보여주도록 fallback을 적용하고, 조건부 렌더링으로 방어했습니다.
- **정리**: 없을 수 있는 값은 기본값을 보장해야 UI가 안정적입니다.

### 5. 검색/필터 변경 후 목록이 비어 보임

- **상황**: 상점 필터를 바꿨는데 갑자기 결과가 0개처럼 보이는 경우가 있었습니다(실제로는 데이터가 존재).
- **확인**: 필터 변경 시에도 이전 페이지 번호가 유지되고 있었고, 서버는 그 페이지 범위로 그대로 페이징을 잘라서 내려주고 있었습니다.
- **원인**: 조건이 바뀌면 전체 결과 수가 바뀌는데, 기존 page를 유지하면 존재하지 않는 페이지로 요청하게 됩니다.
- **수정**: 필터/검색 조건이 변경되는 순간 `page=1`로 초기화하고 다시 조회하도록 고정했습니다.
- **정리**: 페이징 화면은 조건 변경 시 첫 페이지로 리셋하는 게 가장 안정적이었습니다.


---

## 6) 마무리

프론트엔드는 단순히 API를 호출하는 역할에 그치지 않고,
사용자가 체감하는 안정성과 일관성을 만드는 역할을 담당합니다.

이번 프로젝트에서는 다음 기준을 중심으로 구조를 정리했습니다.

1. 인증 흐름은 한 곳에서 관리한다. (axios instance 단일화)
2. 재화/재고/포인트처럼 정합성이 중요한 값은 성공 후 재조회로 확정한다.
3. 검색/필터/페이징과 같이 조건이 바뀌는 화면은 항상 초기화 규칙을 둔다.

백엔드가 트랜잭션으로 데이터 정합성을 보장한다면,
프론트는 상태 관리와 갱신 타이밍으로 사용자 경험의 정합성을 보장한다고 생각하고 설계했습니다.

인증 문제, 상태 동기화 문제, UI 안정성 문제를 직접 겪고 정리하면서
화면 단위 구현보다 흐름 단위 설계가 더 중요하다는 것을 체감한 프로젝트였습니다.

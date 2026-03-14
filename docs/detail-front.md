# Review Tag | Frontend 상세 정리

## 1. 프로젝트 개요

Review Tag는 **영화·콘텐츠 기반 회원제 리뷰 플랫폼**입니다.  
리뷰/별점, 가격 평가, 신뢰도 시스템, 자유게시판/댓글, 콘텐츠 퀴즈, 포인트 기능을 통해 사용자의 참여가 이어지도록 설계했습니다.

저는 이 프로젝트에서 **포인트 관련 기능 프론트엔드 구현**을 맡았습니다.  
출석, 퀘스트, 퀴즈, 룰렛, 상점, 인벤토리, 포인트 이력, 관리자 화면을 하나의 사용자 흐름으로 연결하는 데 집중했습니다.

---

## 2. 맡은 역할

제가 담당한 프론트엔드 범위는 아래와 같습니다.

- 포인트 메인 화면 및 대시보드 구성
- 출석체크, 출석 캘린더 UI
- 일일 퀘스트, 데일리 퀴즈, 룰렛 연결
- 포인트 상점, 위시리스트, 선물하기 화면
- 인벤토리 조회, 사용, 장착, 해제, 환불 흐름
- 포인트 이력 조회
- 관리자 포인트 조정, 상품 관리, 자산 조회 화면

백엔드가 포인트 정합성을 책임졌다면, 프론트는 **그 흐름이 사용자 입장에서 자연스럽게 이어지도록 보여주는 역할**에 더 가까웠습니다.

---

## 3. 설계 및 구현 포인트

### 3-1. 인증 흐름은 axios instance 하나로 통일했습니다.

포인트 관련 화면은 대부분 로그인 사용자를 기준으로 동작하기 때문에, 인증 흐름이 흔들리면 거의 모든 화면이 영향을 받았습니다.  
그래서 API 호출을 여러 군데서 제각각 만들지 않고, axios instance를 공통으로 사용하도록 정리했습니다.

- 요청 시 access token 자동 주입
- 401 응답 시 refresh 요청
- refresh 성공 후 원래 요청 재시도

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
```

이 구조를 먼저 잡아두니, 출석이든 상점이든 화면마다 인증 코드를 따로 신경 쓰지 않아도 됐습니다.

---

### 3-2. 화면 상태는 부분 수정 대신 재조회로 맞췄습니다.

포인트, 재고, 인벤토리 수량, 퀘스트 보상 여부는 서로 연결돼 있어서, 화면에서 일부만 임의로 수정하면 쉽게 어긋날 수 있었습니다.  
그래서 구매나 사용이 끝난 뒤에는 관련 데이터를 다시 조회해 화면을 확정하는 방식을 기준으로 잡았습니다.

```js
const refreshAll = async () => {
  await Promise.all([fetchBalance(), fetchInventory(), fetchQuestList()]);
};
```

예를 들면,

- 출석 완료 후에는 출석 상태와 잔액 재조회
- 퀘스트 보상 수령 후에는 퀘스트 목록과 잔액 재조회
- 상품 구매 후에는 상점 목록, 인벤토리, 잔액 재조회
- 룰렛 실행 후에는 인벤토리, 잔액, 퀘스트 재조회

처럼 화면 갱신 기준을 통일했습니다.

---

### 3-3. 사용자 흐름이 끊기지 않도록 화면을 연결했습니다.

포인트 기능은 한 화면만 잘 만든다고 끝나지 않았습니다. 사용자 입장에서는 아래 흐름이 자연스럽게 이어져야 했습니다.

- 출석하고 포인트를 받는다.
- 퀘스트와 퀴즈로 추가 보상을 얻는다.
- 상점에서 아이템을 구매하거나 선물한다.
- 인벤토리에서 아이템을 사용하거나 장착한다.
- 결과가 잔액, 자산, 화면 상태에 바로 반영된다.

이 흐름을 기준으로 주요 API를 연결했습니다.

```js
const handleCheckAttendance = async () => {
  await instance.post("/point/main/attendance/check");
  await fetchAttendanceStatus();
  await fetchBalance();
};

const claimQuestReward = async (type) => {
  await instance.post("/point/quest/claim", { type });
  await Promise.all([fetchQuestList(), fetchBalance()]);
};

const buyItem = async (itemNo) => {
  await instance.post("/point/main/store/buy", { itemNo });
  await Promise.all([
    fetchStoreList({ page: 1, itemType: "ALL", keyword: "" }),
    fetchInventory(),
    fetchBalance(),
  ]);
};
```

결국 중요한 건 API 호출 자체보다, **사용자가 행동한 결과가 바로 다음 상태 변화로 이어지는 경험**이라고 생각했습니다.

---

### 3-4. 상점과 인벤토리는 상태 충돌을 줄이는 방향으로 구성했습니다.

상점과 인벤토리는 사용자 체감이 큰 화면이면서, 동시에 상태가 가장 쉽게 꼬이는 화면이기도 했습니다. 그래서 아래 부분을 특히 신경 썼습니다.

- 검색/필터가 바뀌면 페이지를 1로 초기화
- 위시리스트 토글은 서버 응답 기준으로 처리
- 아이템 사용 후 인벤토리와 잔액 동시 갱신
- 장착/해제는 현재 상태를 재조회해서 반영
- 이미지가 없는 경우 기본 UI가 깨지지 않도록 fallback 적용

```js
const fetchStoreList = async ({ page, itemType, keyword }) => {
  const res = await instance.get("/point/main/store", {
    params: { page, itemType, keyword },
  });
  setStore(res.data);
};

const useInventoryItem = async ({ inventoryNo, extraValue }) => {
  await instance.post("/point/main/store/inventory/use", {
    inventoryNo,
    extraValue,
  });
  await Promise.all([fetchInventory(), fetchBalance()]);
};
```

화려한 화면보다, **구매와 사용 이후 상태가 정확하게 보이는 것**에 더 집중했습니다.

---

### 3-5. 관리자 화면도 사용자 화면과 같은 기준으로 맞췄습니다.

운영 기능은 별도 프로젝트처럼 분리하지 않고, 같은 프론트엔드 흐름 안에서 정리했습니다.

- 회원 포인트 조정
- 상점 상품 등록, 수정, 삭제
- 회원 자산 조회

```js
const adminAdjustPoint = async ({ memberId, amount, trxType, reason }) => {
  await instance.post("/admin/point/adjust", { memberId, amount, trxType, reason });
  await fetchAdminMembers();
};

const adminCreateItem = async (formData) => {
  await instance.post("/admin/store", formData);
};

const adminUpdateItem = async (itemNo, formData) => {
  await instance.put(`/admin/store/${itemNo}`, formData);
};

const adminDeleteItem = async (itemNo) => {
  await instance.delete(`/admin/store/${itemNo}`);
};

const adminSearchMemberAssets = async ({ keyword, page }) => {
  const res = await instance.get("/admin/inventory", { params: { keyword, page } });
  setAdminAssets(res.data);
};
```

사용자 화면과 관리자 화면이 달라도, API 연결 방식과 상태 갱신 기준은 최대한 동일하게 가져가려고 했습니다.

---

## 4. 주요 화면 기준 기능 흐름

| 메인 대시보드 | 출석 |
|---|---|
| ![](screenshot/01-main-dashboard.png) | ![](screenshot/02-attendance.png) |

| 상점 | 인벤토리 |
|---|---|
| ![](screenshot/03-store.png) | ![](screenshot/04-inventory.png) |

| 포인트 이력 | 관리자 포인트 |
|---|---|
| ![](screenshot/05-history.png) | ![](screenshot/06-admin-point.png) |

| 관리자 상점 | 관리자 자산 |
|---|---|
| ![](screenshot/07-admin-store.png) | ![](screenshot/08-admin-inventory.png) |

이미지 기준으로도 확인할 수 있듯이, 프론트에서는 **대시보드 → 출석/보상 → 상점 → 인벤토리 → 이력/관리자 운영** 흐름이 한 화면 경험으로 이어지도록 정리했습니다.

---

## 5. 트러블슈팅

### 5-1. 특정 API만 401이 반복되던 문제
- **상황**: 로그인은 되어 있는데 몇몇 화면만 계속 401이 발생했습니다.
- **원인**: 일부 요청이 공통 axios instance를 거치지 않고 직접 호출돼 Authorization 헤더가 빠졌습니다.
- **해결**: 모든 API 호출을 단일 instance로 통일했습니다.

### 5-2. 토큰 만료 후 화면이 그대로 멈추던 문제
- **상황**: 만료 시점에 페이지를 이동하면 빈 화면처럼 보이거나 데이터가 갱신되지 않았습니다.
- **원인**: refresh는 수행했지만 실패한 원래 요청을 다시 보내지 않았습니다.
- **해결**: response interceptor에서 refresh 성공 후 원요청을 재호출하도록 수정했습니다.

### 5-3. 구매나 사용 이후 화면 값이 바로 바뀌지 않던 문제
- **상황**: 성공 알림은 떴는데 잔액, 수량, 재고가 이전 값으로 남아 있었습니다.
- **원인**: 로컬 상태를 부분 수정하는 방식이 화면마다 제각각이라 누락이 생겼습니다.
- **해결**: 성공 후 관련 데이터 재조회 패턴으로 통일했습니다.

### 5-4. 이미지가 없는 아이템에서 카드 UI가 깨지던 문제
- **상황**: 장착 전이거나 이미지가 없는 데이터에서 카드 레이아웃이 흔들렸습니다.
- **원인**: `src`가 null인데 그대로 이미지 컴포넌트에 넘기고 있었습니다.
- **해결**: fallback 이미지를 적용하고 조건부 렌더링으로 방어했습니다.

### 5-5. 검색 조건을 바꾸면 목록이 비어 보이던 문제
- **상황**: 분명 데이터가 있는데 필터를 바꾸면 0건처럼 보이는 경우가 있었습니다.
- **원인**: 필터가 바뀌어도 이전 페이지 번호가 유지돼, 실제 데이터가 없는 페이지를 요청하고 있었습니다.
- **해결**: 검색과 필터 변경 시 페이지를 1로 초기화하도록 수정했습니다.

---

## 6. 정리

이번 프로젝트에서 프론트엔드에서 가장 중요하게 본 것은 **포인트 기능을 각각의 화면이 아니라 하나의 흐름으로 보이게 만드는 것**이었습니다.

프론트에서는 아래 기준을 중심으로 구조를 정리했습니다.

1. 인증 흐름은 한 군데에서 관리한다.
2. 정합성이 중요한 값은 성공 후 재조회로 맞춘다.
3. 적립과 소비 흐름이 화면에서 자연스럽게 이어지게 만든다.
4. 사용자 화면과 관리자 화면을 비슷한 패턴으로 운영한다.

프로젝트 전체는 리뷰 플랫폼이지만, 제가 맡은 포인트 기능만 놓고 봐도 **대시보드, 출석, 퀘스트, 상점, 인벤토리, 이력, 관리자 기능이 하나의 사용자 경험으로 연결되도록 구성했다는 점**이 가장 큰 의미였습니다.

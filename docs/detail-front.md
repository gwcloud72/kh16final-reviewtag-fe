# Review Tag | Frontend 상세 정리

이 문서는 프론트 전체를 설명하기보다, 제가 맡았던 포인트 화면 쪽을 화면과 코드 기준으로 다시 정리한 기록입니다. 포인트 화면은 탭이 많아서 처음에는 컴포넌트 수가 더 크게 보였지만, 실제로는 한 화면에서 바뀐 결과가 다른 화면에도 바로 이어져 보이게 만드는 일이 더 중요했습니다.

그래서 포인트 화면을 붙일 때는 프로젝트에 이미 있던 공통 통신 구조를 그대로 사용하되, 포인트 화면 쪽에서 어떤 기준으로 다시 읽고 반영할지를 먼저 정리한 뒤 출석, 상점, 인벤토리, 이력, 운영 흐름을 올리는 방식으로 작업했습니다.

---

## 담당 역할

- 포인트 메인 대시보드와 탭 구조 구성
- 출석 체크 / 출석 캘린더 연결
- 일일 퀘스트, 룰렛, 포인트 선물하기 연동
- 상점, 위시리스트, 인벤토리, 아이콘, 이력 화면 구현
- 관리자 포인트 / 상품 / 자산 화면 연결
- 프로젝트 공통 axios / Jotai 구조 위에서 포인트 화면 갱신 패턴 정리

---

## 먼저 해결하려고 본 문제

- 출석이나 구매 뒤에 다른 탭 값이 늦게 바뀌는 문제
- 상점 목록과 내 보유 상태, 위시 상태가 따로 노는 문제
- 인벤토리 아이템은 버튼이 비슷해도 실제 처리 방식이 모두 다른 문제

이 세 가지를 먼저 잡아두지 않으면 화면을 아무리 늘려도 사용감이 어색해질 거라고 봤습니다. 그래서 기능을 추가하는 순서보다, 공통 갱신 기준을 먼저 정리한 뒤 세부 화면을 붙이는 쪽으로 갔습니다.

---

## 대시보드와 출석

<table>
<tr>
<td width="48%"><img src="screenshot/01-main-dashboard.png" width="100%" alt="포인트 메인 대시보드"></td>
<td width="48%"><img src="screenshot/02-attendance.png" width="100%" alt="출석 화면"></td>
</tr>
</table>

메인 대시보드와 출석 화면에서는 아래 값이 같이 바뀌어야 했습니다.

- 오늘 출석 여부
- 달력 도장 표시
- 프로필 카드 포인트
- 일일 퀘스트 진행도
- 하단 탭 상태

### Component

```js
const [pointRefreshTrigger, setPointRefreshTrigger] = useState(0);

const pointRefreshAll = useCallback(() => {
  setPointRefreshTrigger(prev => prev + 1);
}, []);

useEffect(() => {
  pointCheckAttendanceStatus();
}, [pointCheckAttendanceStatus, pointRefreshTrigger]);

const pointHandleAttendance = async () => {
  const pointResp = await axios.post("/point/main/attendance/check");
  if (pointResp.data && String(pointResp.data).startsWith("success")) {
    setPointShowStamp(true);
    setPointIsChecked(true);
    setPointCalendarRefreshKey(prev => prev + 1);
    pointRefreshAll();
  }
};
```

### Request

- `GET /point/main/attendance/status`
- `POST /point/main/attendance/check`
- `GET /point/main/store/my-info`

이 구간에서는 출석 성공 자체보다, 출석 직후 달력·카드·탭 상태가 같이 움직이게 만드는 일이 중요했습니다. 그래서 버튼 하나의 결과를 여러 컴포넌트가 같은 신호로 다시 읽도록 정리했습니다.

---

## 퀘스트와 프로필 카드 갱신

메인 대시보드 안에서는 일일 퀘스트와 퀴즈 보상도 같이 노출됐습니다. 이 구간은 출석처럼 한 번의 액션 뒤에 카드 포인트와 목록 상태가 동시에 바뀌어야 했습니다.

### Component

```js
const questHandleClaim = async (questType) => {
    const questClaimResp = await axios.post("/point/quest/claim", { type: questType });
    if (questClaimResp.data.startsWith("success")) {
        questLoadData();
        if (typeof questRefreshPoint === 'function') questRefreshPoint();
    }
};
```

```js
useEffect(() => {
    if (!prcardLoginId) return;
    axios.get("/point/main/store/my-info")
        .then(res => {
            if (res.data) setPrcardUserInfo(res.data);
        });
}, [prcardLoginId, prcardRefreshTrigger, prcardPointRefresh]);
```

### Request

- `GET /point/quest/list`
- `POST /point/quest/claim`
- `POST /point/quest/quiz/check`
- `GET /point/main/store/my-info`

여기서는 퀘스트 목록만 다시 읽는 것으로 끝나지 않고, 보상 수령 뒤 프로필 카드 포인트도 같이 갱신되도록 연결하는 일이 중요했습니다.

---

## 상점 화면

<table>
<tr>
<td width="100%"><img src="screenshot/03-store.png" width="100%" alt="상점 화면"></td>
</tr>
</table>

상점은 상품 목록만 보여주면 끝나는 화면이 아니었습니다.

- 내가 이미 가진 아이템인지
- 찜해둔 아이템인지
- 구매 뒤 포인트와 보유 수량이 어떻게 바뀌는지

이 세 가지가 같이 보여야 했기 때문에 목록만 조회하는 방식으로는 부족했습니다.

### Component

```js
const [storeResp, storeMyResp, storeWishResp] = await Promise.all([
  axios.get("/point/main/store", {
    params: { type: activeType, keyword, page: currentPage, size: pageSize }
  }),
  storeLoginLevel ? axios.get("/point/main/store/inventory/my") : Promise.resolve({ data: [] }),
  storeLoginLevel ? axios.get("/point/main/store/wish/check") : Promise.resolve({ data: [] })
]);
```

```js
const handleTypeChange = (type) => {
  setActiveType(type);
  setCurrentPage(1);
};

const handleSearch = (e) => {
  setKeyword(e.target.value);
  setCurrentPage(1);
};
```

### Request

- `GET /point/main/store`
- `GET /point/main/store/inventory/my`
- `GET /point/main/store/wish/check`
- `POST /point/main/store/buy`
- `POST /point/main/store/gift`

상점에서는 카드 한두 장만 부분 수정하기보다, 필요한 값을 같이 읽고 성공 뒤 다시 반영하는 방식이 훨씬 덜 흔들렸습니다. 검색 조건이 바뀔 때 페이지를 1로 돌리는 것도 같은 이유에서 먼저 정리했습니다.

---

## 인벤토리, 아이콘, 이력

<table>
<tr>
<td width="48%"><img src="screenshot/04-inventory.png" width="100%" alt="인벤토리 화면"></td>
<td width="48%"><img src="screenshot/05-history.png" width="100%" alt="포인트 이력 화면"></td>
</tr>
</table>

인벤토리에서는 버튼 모양은 비슷해도 실제 동작은 제각각이었습니다.

- 닉네임 변경권은 입력값이 필요했고
- 랜덤 아이콘은 별도 API를 탔고
- 꾸미기 아이템은 장착 상태까지 바꿔야 했습니다.

### Component

```js
const triggerAllRefresh = useCallback(() => {
  ivLoadItems();
  setGlobalRefresh((prev) => prev + 1);
  ivRefreshPoint && ivRefreshPoint();
}, [ivLoadItems, setGlobalRefresh, ivRefreshPoint]);
```

```js
const ivHandleUse = async (item) => {
  const type = item.pointItemType;
  let extraValue = null;

  if (type === "CHANGE_NICK") {
    extraValue = await itemHandlers.CHANGE_NICK();
    if (!extraValue) return;
  } else if (type === "RANDOM_ICON") {
    await itemHandlers.RANDOM_ICON(item, triggerAllRefresh);
    return;
  }

  const resp = await axios.post("/point/main/store/inventory/use", {
    inventoryNo: item.inventoryNo,
    extraValue,
  });

  if (resp.data === "success") {
    triggerAllRefresh();
  }
};
```

### Request

- `GET /point/main/store/inventory/my`
- `POST /point/main/store/inventory/use`
- `POST /point/icon/draw`
- `GET /point/history`

여기서는 인벤토리만 다시 읽는 것으로 끝나지 않고, 장착이나 사용 결과가 카드와 다른 탭에도 같이 보이게 만드는 일이 중요했습니다. 이력 화면은 그렇게 모인 결과를 마지막에 확인하는 역할로 붙였습니다.

---

## 관리자 화면

<table>
<tr>
<td width="32%"><img src="screenshot/06-admin-point.png" width="100%" alt="관리자 포인트 화면"></td>
<td width="32%"><img src="screenshot/07-admin-store.png" width="100%" alt="관리자 상점 화면"></td>
<td width="32%"><img src="screenshot/08-admin-inventory.png" width="100%" alt="관리자 자산 화면"></td>
</tr>
</table>

운영 화면도 사용자 화면과 완전히 다른 세계처럼 두고 싶지 않았습니다. 포인트 조정, 상품 관리, 자산 조회 결과가 사용자 화면에서 보는 값과 어긋나면 결국 운영 기능이 더 위험해질 수 있었기 때문입니다.

### Component

```js
// AdminPoint.jsx
const resp = await axios.post("/admin/point/update", {
    memberId: memberId,
    amount: amount
});
```

```js
// AdminStore.jsx
const res = await axios.get("/admin/store/list", {
    params: { itemType: filterType, page: page, size: size }
});
```

```js
// AdminInventory.jsx
const resp = await axios.get("/admin/inventory/list", { params: { keyword: keyword || null, page } });
```

### Request

- `POST /admin/point/update`
- `GET /admin/store/list`
- `GET /admin/inventory/list`
- `GET /admin/inventory/{memberId}`

관리자 화면은 보기에는 별도 화면이지만, 결국 사용자 화면과 같은 데이터 위에서 움직입니다. 그래서 저는 관리자 흐름도 사용자 포인트 화면과 어긋나지 않도록 연결하는 쪽을 더 신경 썼습니다.

---

## 트러블슈팅

### 일부 요청만 401로 떨어졌던 문제
- 문제: 로그인은 유지되는데 어떤 화면만 요청이 실패했습니다.
- 원인: 공통 axios를 타지 않는 요청이 섞이면 헤더 주입과 공통 예외 처리 기준이 빠질 수 있었습니다.
- 해결: 포인트 화면 요청을 공통 axios 기준으로 통일했습니다.

### 성공 뒤 다른 탭 값이 늦게 바뀌던 문제
- 문제: 출석 성공 뒤 카드 잔액이 그대로이거나, 구매 뒤 보관함이 이전 값으로 남는 경우가 있었습니다.
- 원인: 각 컴포넌트가 자기 데이터만 다시 읽고 공통 기준이 없었습니다.
- 해결: `pointRefreshTrigger`, `pointRefreshAtom`, `triggerAllRefresh()`를 같이 사용해 갱신 기준을 통일했습니다.

### 검색 조건을 바꾸면 빈 화면처럼 보이던 문제
- 문제: 필터나 검색어를 바꾼 뒤 이전 페이지 번호가 남아 실제 데이터가 있어도 비어 보였습니다.
- 원인: 검색 조건과 페이지 상태를 같이 초기화하지 않았습니다.
- 해결: 타입 변경과 검색 입력 시 `currentPage`를 1로 돌리도록 수정했습니다.

### 아이템 사용 버튼은 비슷한데 실제 처리 방식이 모두 다르던 문제
- 문제: 인벤토리에서는 같은 버튼처럼 보여도 아이템 타입마다 필요한 입력과 API가 달랐습니다.
- 원인: 타입별 예외를 한 흐름에 계속 덧붙이면 코드가 금방 복잡해졌습니다.
- 해결: 타입에 따라 먼저 분기하고, 마지막에는 같은 refresh 기준으로 다시 모으는 구조로 정리했습니다.

---

## 확인한 시나리오

- 출석 뒤 버튼 상태와 달력 도장이 함께 바뀌는지
- 출석, 구매, 사용 뒤 프로필 카드 포인트가 같이 갱신되는지
- 상점에서 구매하면 보유 상태와 위시 상태가 함께 바뀌는지
- 인벤토리에서 타입별 사용 분기가 맞게 동작하는지
- 검색 조건 변경 뒤 빈 목록처럼 보이지 않는지
- 관리자 화면 변경 내용이 사용자 화면에도 이어지는지

---

## 정리하며

포인트 서비스는 화면이 많은 것보다 여러 군데에 흩어진 데이터가 하나로 맞아떨어지는 것이 핵심이었습니다. 이번 파트에서는 컴포넌트를 잘게 쪼개는 기술적인 부분보다, 사용자가 포인트를 얻거나 썼을 때 그 결과가 전체 서비스 흐름에 어색함 없이 반영되도록 데이터의 중심 기준을 먼저 세우는 일에 더 집중했습니다.

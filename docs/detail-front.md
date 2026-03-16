# Review Tag | Frontend 상세 정리

이 문서는 프론트엔드 전체를 다루기보다는, 제가 담당했던 포인트 화면 부분을 중심으로, 실제 화면과 코드 흐름에 맞춰 다시 정리한 기록입니다. 포인트 화면은 탭이 많아 처음에는 컴포넌트 개수가 많아 보였지만, 실무에서는 한 화면에서 발생한 변화가 곧바로 다른 화면에도 자연스럽게 이어질 수 있도록 만드는 과정이 더 중요하게 느껴졌습니다.

작업을 진행할 때는 기존 프로젝트의 공통 통신 구조를 최대한 활용하되, 포인트 화면에서 어떤 기준으로 데이터를 읽고 화면에 반영할지 먼저 정리했습니다. 이후 출석, 상점, 인벤토리, 이력, 그리고 운영과 관련된 주요 흐름들을 순차적으로 반영하며 개발을 이어나갔습니다. 이런 방식을 통해 각 화면 간 데이터 연동을 자연스럽게 구현할 수 있었습니다.

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

이 구간에서는 단순히 출석에 성공하는 것보다, 출석 버튼을 눌렀을 때 달력, 카드, 탭 등 여러 컴포넌트가 동시에 반응하도록 만드는 데 더 중점을 두었습니다. 이를 위해 버튼 하나의 동작 결과를 여러 컴포넌트가 동일한 신호로 받아들이고, 각자 필요한 상태를 즉시 반영할 수 있도록 구조를 설계했습니다. 이러한 방식으로 유저가 출석을 완료한 직후 화면 전체에서 일관된 변화를 경험할 수 있게 했습니다.

---

## 퀘스트와 프로필 카드 갱신

메인 대시보드에서는 일일 퀘스트와 퀴즈 보상 또한 함께 확인할 수 있었습니다. 이 부분은 마치 출석을 하듯 한 번의 행동만으로 카드 포인트와 목록 상태가 동시에 변경되어야 했기에, 사용자가 더욱 직관적으로 변화된 결과를 체감할 수 있도록 신경 썼습니다.

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

이곳에서는 단순히 퀘스트 목록을 다시 불러오는 것에 만족하지 않았습니다. 보상을 받은 이후에는 프로필 카드 포인트까지 함께 자동으로 반영될 수 있도록 시스템을 연동하는 것이 중요한 과제였습니다. 이러한 연계 덕분에 사용자 경험이 한층 매끄러워졌으며, 실제로 유저 피드백에서도 긍정적인 반응을 확인할 수 있었습니다

---

## 상점 화면

<table>
<tr>
<td width="100%"><img src="screenshot/03-store.png" width="100%" alt="상점 화면"></td>
</tr>
</table>

상점 화면은 단순히 상품 목록만 나열하는 수준에서 머물지 않았습니다.

예를 들어, 사용자가 이미 소유한 아이템인지, 찜 목록에 담겨 있는지, 그리고 구매 이후에는 포인트와 보유 수량이 어떻게 변했는지까지 한눈에 확인할 수 있도록 신경 썼습니다. 이러한 다채로운 정보를 함께 보여주려면, 기존처럼 단순히 목록만 조회하는 방식으로는 이용자에게 기대 이상의 경험을 제공하기 어렵다고 판단했습니다. 이 때문에 상점 화면 자체를 유저의 니즈에 맞게 여러 요소를 직관적으로 볼 수 있도록 개선하는 데 집중했습니다.

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

상점 업무를 진행하면서 카드의 일부분만 따로 수정하기보다는, 필요한 모든 값을 한 번에 읽어온 후, 작업이 성공적으로 끝났을 때 그 결과를 반영하는 방식이 훨씬 더 안정적이라는 점을 경험했습니다. 특히, 검색 조건이 달라질 때마다 페이지를 1로 초기화하도록 설계한 것도 같은 이유에서 비롯된 선택이었습니다. 이러한 접근법 덕분에 데이터의 일관성을 확실하게 유지할 수 있었고, 예상하지 못했던 오류 발생도 크게 줄일 수 있었습니다.
---

## 인벤토리, 아이콘, 이력

<table>
<tr>
<td width="48%"><img src="screenshot/04-inventory.png" width="100%" alt="인벤토리 화면"></td>
<td width="48%"><img src="screenshot/05-history.png" width="100%" alt="포인트 이력 화면"></td>
</tr>
</table>

인벤토리에서 버튼들은 겉으로 보면 모두 비슷해 보이지만, 실제로 눌러보면 각각 다른 방식으로 작동했습니다.

예를 들어, 닉네임 변경권은 사용자가 새 닉네임을 입력하도록 추가 절차가 필요했습니다. 랜덤 아이콘 버튼은 누를 때마다 별도의 API를 호출해야 했고요. 꾸미기 아이템 버튼은 단순히 아이템을 선택하는 데 그치지 않고, 실제로 장착 상태로 바꿔주는 기능까지 구현해야 했습니다.
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
여기서는 인벤토리를 단순히 다시 불러오는 것에서 그치지 않았습니다. 아이템의 장착이나 사용 결과가 카드뿐만 아니라 다른 탭에서도 함께 확인될 수 있도록 구현하는 데 중점을 두었습니다. 이렇게 여러 곳에 결과를 보여주다 보니, 이력 화면은 모든 결과를 한눈에 최종적으로 점검할 수 있는 역할을 하도록 구성했습니다.

---

## 관리자 화면

<table>
<tr>
<td width="32%"><img src="screenshot/06-admin-point.png" width="100%" alt="관리자 포인트 화면"></td>
<td width="32%"><img src="screenshot/07-admin-store.png" width="100%" alt="관리자 상점 화면"></td>
<td width="32%"><img src="screenshot/08-admin-inventory.png" width="100%" alt="관리자 자산 화면"></td>
</tr>
</table>
운영 화면을 사용자 화면과 전혀 다른 세상처럼 분리해서 만들고 싶진 않았습니다. 만약 포인트 조정이나 상품 관리, 자산 조회 결과 등이 사용자 화면에서 보이는 값과 조금이라도 맞지 않는다면, 오히려 운영 기능의 신뢰성이 떨어지고 위험 요소가 커질 수 있다고 판단했습니다. 그래서 두 화면의 일관성을 유지하는 데 특히 신경을 썼습니다.

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

### 일부 요청이 401 오류로 처리된 문제
- 문제: 로그인이 정상 유지되는 상황에서도 특정 화면의 요청만 실패하는 현상이 발견되었습니다.
- 원인: 일부 요청이 공통적으로 사용하는 axios 객체를 통하지 않아, 헤더 주입이나 예외 처리 등 공통 기준이 적용되지 않은 것이 원인이었습니다.
- 해결: 포인트 관련 모든 요청에 공통 axios를 일괄 적용하여 일관성을 높였습니다.

### 출석 성공 후 다른 탭 정보가 늦게 갱신되는 문제
- 문제: 출석 체크를 완료해도 카드 잔액이 바로 반영되지 않거나, 상품 구매 후에도 보관함 정보가 이전 상태로 남아 있는 현상이 있었습니다.
- 원인: 각 컴포넌트가 개별적으로 데이터를 다시 불러왔으나, 전체를 통합하는 기준이 없어 데이터 동기화에 지연이 생겼습니다.
- 해결: `pointRefreshTrigger`, `pointRefreshAtom`, `triggerAllRefresh()`를 연동해 갱신 시점을 통일하고, 데이터의 일관성을 확보했습니다.

### 검색 조건 변경 시 화면이 빈 것처럼 보이던 문제
- 문제: 필터나 검색어 변경 시 이전에 사용하던 페이지 번호가 그대로 남아 있어, 실제 데이터가 있음에도 화면에 표시되지 않는 문제가 발생했습니다.
- 원인: 검색 조건과 페이지 상태를 한 번에 초기화하지 않아 생긴 문제였습니다.
- 해결: 타입 변경이나 검색 입력 시마다 `currentPage`를 1로 초기화하도록 로직을 수정했습니다.

### 아이템 사용 버튼은 비슷하지만 실제 처리 방식이 제각각이었던 문제
- 문제: 인벤토리 화면에서 동일한 버튼으로 보여도, 아이템 종류마다 입력 값이나 사용하는 API가 달라 혼란을 야기했습니다.
- 원인: 타입별 예외 처리가 점차 누적되면서 코드 구조가 복잡해졌습니다.
- 해결: 아이템 타입별로 로직을 먼저 분기하고, 마지막에는 공통된 refresh 기준으로 처리 결과를 통합하는 방식으로 구조를 재정비했습니다.

이런 과정을 통해 시스템의 안정성과 유지보수 편의성을 크게 향상시킬 수 있었습니다. 앞으로도 작은 문제들을 지속적으로 개선하며, 완성도 높은 서비스 제공을 목표로 할 예정입니다.

---

## 점검한 주요 시나리오

- 출석 체크 후 버튼 상태와 달력 도장이 동시에 변경되는지
- 출석, 구매, 사용 이후 프로필 카드의 포인트가 즉시 반영되는지
- 상점에서 아이템 구매 시 보유 상태와 위시 상태가 함께 갱신되는지
- 인벤토리에서 아이템 타입별로 사용 분기가 정확히 동작하는지
- 검색 조건 변경 후 빈 목록처럼 보여 혼동을 주지는 않는지
- 관리자 화면에서 변경한 내용이 사용자 화면에도 자연스럽게 반영되는지

---

## 마무리

포인트 서비스 운영에서 중요한 점은 화면의 개수보다, 흩어진 데이터가 어떻게 하나로 모여 자연스럽게 맞물리는가에 있었습니다. 이번 개선에서는 컴포넌트를 세분화하는 것보다는, 포인트 적립·사용 등 사용자의 주요 행동이 전체 서비스 흐름 안에서 이질감 없이 반영되도록 데이터 기준과 구조를 정립하는 데 중점을 뒀습니다. 숫자가 자연스럽게 움직이고 변화가 즉시 반영되는 모습을 확인할 때마다 적지 않은 만족감을 느꼈습니다. 앞으로도 사용자 경험을 가장 우선에 두고, 세부적인 데이터 흐름까지 꼼꼼히 관리하는 개발자가 되기 위해 노력하겠습니다.
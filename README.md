# 🎨 Frontend - Point Reward Platform

React 기반 사용자 인터페이스

---

# 📦 기술 스택

- React
- Axios
- React Router
- Context API

---

# 📂 구조

```
src/
 ├─ api/
 ├─ components/
 ├─ pages/
 ├─ context/
```

---

# 🌐 Axios 설정

api/axios.js

```javascript
import axios from "axios";

const instance = axios.create({
  baseURL: "/api",
  withCredentials: true
});

export default instance;
```

---

# 🎯 출석 요청

```javascript
const attend = async () => {
  try {
    await axios.post("/attendance");
    alert("출석 완료");
  } catch (e) {
    alert("이미 출석함");
  }
};
```

---

# 🎯 상점 구매

```javascript
const purchaseItem = async (itemId) => {
  try {
    await axios.post(`/shop/${itemId}`);
    alert("구매 완료");
  } catch (e) {
    alert("포인트 부족");
  }
};
```

---

# 🎯 랭킹 페이지

```javascript
useEffect(() => {
  axios.get("/ranking")
    .then(res => setRanking(res.data));
}, []);
```

---

# 🔐 로그인 상태 관리

LoginContext.js

```javascript
export const LoginContext = createContext();

export const LoginProvider = ({children}) => {

  const [loginId, setLoginId] = useState(null);

  useEffect(() => {
    axios.get("/member/session")
      .then(res => setLoginId(res.data));
  }, []);

  return (
    <LoginContext.Provider value={{loginId}}>
      {children}
    </LoginContext.Provider>
  );
};
```

---

# 🎯 보호 라우터

```javascript
if(!loginId){
  return <Navigate to="/login" />
}
```

---

# 📌 UI 특징

- 포인트 실시간 반영
- 인벤토리 장착 상태 표시
- 랭킹 순위 강조
- 관리자 메뉴 분리

import './App.css'
import { BrowserRouter } from "react-router-dom"
import Content from "./components/Content"
import Menu from './components/Menu'
import MenuForSearch from './components/MenuForSearch'
import { Bounce, ToastContainer } from "react-toastify"

function App() {

  return (
    <>
      {/* Router는 주소에 의한 화면 분할을 처리하는 도구이며 설정된 영역 내에서만 작동함 */}
      <BrowserRouter>
        <Menu/>
          <div className="container-fluid my-5 pt-5">
            <Content/>
          </div>
      </BrowserRouter>
      


      {/* 토스트 메세지 컨테이너 */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />

    </>
  )
}

export default App
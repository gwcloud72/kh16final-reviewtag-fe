import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig(({mode})=>{
  // mode에 맞는 환경 정보를 불러오도록 코드 작성
  const env = loadEnv(mode,process.cwd());
  const baseUrl = env.VITE_BASE_URL;
  return {
    SERVER : {
      host : "0.0.0.0",
      port : 5173
    },
    base:baseUrl,
    plugins: [react()],
    define : {
      global : "window",
    }



  };
})
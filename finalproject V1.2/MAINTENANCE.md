# Frontend maintenance guide

## 1) Keep API paths in one place
- API endpoint constants: `src/api/endpoints.js`
- Rule of thumb: **components should not hardcode URLs**.
  - If you need a new endpoint, add it to `endpoints.js` first.

## 2) Use a single Axios client
- Shared axios client: `src/utils/axios/index.js`
  - Auto prefixes `/api` when you pass a relative URL.
  - Adds `Authorization: Bearer <accessToken>` when available.
  - On `401`, it tries refresh once and retries the original request.
  - If refresh fails, it clears tokens and routes to `/member/login`.

### Configure API base URL for deploy
- Default is relative `/api` (works with Vite proxy / nginx).
- For different environments, set:
  - `VITE_API_BASE_URL=https://your-api.example.com`

## 3) Error pages
- Public error images: `public/errors/{400,401,403,404,500}.png`
- React pages: `src/components/error/*`

## 4) Recommended next step (optional refactor)
If you want even cleaner maintenance:
- Create `src/api/services/*.js` (per feature) that wraps axios calls.
- Components call `memberService.getProfile(id)` etc.


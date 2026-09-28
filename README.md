# eatomato-commerce

eatomato 커머스 모노레포. 서비스 주소: https://eatomato.kr

| 폴더 | 내용 |
|---|---|
| [`frontend/`](frontend) | Next.js 정적 export 프론트. Docker(nginx)로 서빙 |
| [`backend/`](backend) | Spring Boot API 서버 (Java 21, Azure MySQL). API 목록은 `backend/README.md` |
| [`deploy/`](deploy) | VM 호스트 nginx 설정 (HTTPS 종료, `/api`·`/uploads` → 백엔드, 나머지 → 프론트) |

## 배포 구조 (Azure VM)

```
인터넷 → 호스트 nginx (80 → 443, Let's Encrypt)
          ├─ /                → 127.0.0.1:3000  frontend 컨테이너
          └─ /api/, /uploads/ → 127.0.0.1:8080  backend 컨테이너 → Azure Database for MySQL
```

각 폴더에서 `docker compose up -d --build` 로 띄운다. 백엔드는 `backend/.env` 가 필요하다(`.env.example` 참고).

GitHub Pages 배포(`.github/workflows/deploy.yml`)는 `frontend/` 가 바뀐 커밋에서만 돈다.

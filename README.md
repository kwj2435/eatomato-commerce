# eatomato-commerce

eatomato 커머스 모노레포. 서비스 주소: https://eatomato.kr

| 폴더 | 내용 |
|---|---|
| [`frontend/`](frontend) | Next.js 정적 export 프론트. Docker(nginx)로 서빙 |
| [`backend/`](backend) | Spring Boot API 서버 (Java 21, Azure MySQL). API 목록은 `backend/README.md` |
| [`deploy/`](deploy) | VM 배포 스크립트(`deploy.sh`), 호스트 nginx 설정 (HTTPS 종료, `/api`·`/uploads` → 백엔드, 나머지 → 프론트) |

## 배포 구조 (Azure VM)

```
인터넷 → 호스트 nginx (80 → 443, Let's Encrypt)
          ├─ /                → 127.0.0.1:3000  frontend 컨테이너
          └─ /api/, /uploads/ → 127.0.0.1:8080  backend 컨테이너 → Azure Database for MySQL
```

VM 에서 저장소 루트에서 `./deploy/deploy.sh` 를 실행한다(git pull → 백엔드 → 프론트 순으로 빌드·기동).
프론트는 빌드 시점에 백엔드 API 에서 상품·공지를 받아 정적 페이지를 만들므로 백엔드가 먼저 떠 있어야 한다.
백엔드는 `backend/.env` 가 필요하다(`.env.example` 참고). 상품·공지 데이터만 바뀌었으면 `./deploy/deploy.sh frontend`.

GitHub Pages 배포(`.github/workflows/deploy.yml`)는 `frontend/` 가 바뀐 커밋에서만 돌고, API 는 `https://eatomato.kr` 을 쓴다.

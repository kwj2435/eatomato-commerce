# eatomato-commerce

eatomato 커머스 모노레포. 서비스 주소: https://eatomato.kr

| 폴더 | 내용 |
|---|---|
| [`frontend/`](frontend) | Next.js 프론트(스토어 + 관리자 `/admin`). 운영은 standalone Node 서버, GitHub Pages 는 정적 export |
| [`backend/`](backend) | Spring Boot API 서버 (Java 21, Azure MySQL). API 목록은 `backend/README.md` |
| [`deploy/`](deploy) | VM 배포 스크립트(`deploy.sh`), 호스트 nginx 설정 (HTTPS 종료, `/api`·`/uploads` → 백엔드, 나머지 → 프론트) |

## 배포 구조 (Azure VM)

```
인터넷 → 호스트 nginx (80 → 443, Let's Encrypt)
          ├─ /                → 127.0.0.1:3000  frontend 컨테이너 (Next.js 서버, 60초 ISR)
          └─ /api/, /uploads/ → 127.0.0.1:8080  backend 컨테이너 → Azure Database for MySQL
```

VM 에서 저장소 루트에서 `./deploy/deploy.sh` 를 실행한다(git pull → 백엔드 → 프론트 순으로 빌드·기동).
프론트는 빌드할 때 백엔드에서 상품·공지를 받아 미리 렌더하므로 백엔드가 먼저 떠 있어야 한다.
백엔드는 `backend/.env` 가 필요하다(`.env.example` 참고).

관리자 화면(`https://eatomato.kr/admin`)에서 바꾼 상품·배너·공지는 재배포 없이 최대 1분 안에 스토어에 반영된다
(프론트 서버가 60초마다 백엔드에서 다시 받는다).

GitHub Pages 배포(`.github/workflows/deploy.yml`)는 `frontend/` 가 바뀐 커밋에서만 돌고, API 는 `https://eatomato.kr` 을 쓴다.

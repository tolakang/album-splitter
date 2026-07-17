# Fix Plan: Full Stack Issues

## Phase A: Prisma Schema + Core Data Flow
1. Fix `GeneratedFile.size` from BigInt to Int
2. Fix `GeneratedFile.expiresAt` to have a default
3. Fix `Album` model to include `audioFilePath` for uploaded files
4. Add `Track` model or JSON field for track list data
5. Run `prisma generate` to validate

## Phase B: Backend Core Fixes
6. Fix `upload.service.ts` — actually write file to disk
7. Fix `split.service.ts` — implement FFmpeg extraction (remove stub)
8. Create `SplitController` — POST endpoint to trigger split with track data
9. Fix `split.processor.ts` — extend WorkerHost, fix BullMQ v11 API
10. Fix `worker.ts` — properly register and keep alive
11. Fix `download.controller.ts` — add `@Res({ passthrough: true })`
12. Fix `cleanup.service.ts` — add `include: { generatedFiles: true }`
13. Fix `cleanup.module.ts` — move ScheduleModule to AppModule
14. Fix `album.service.ts` — clean disk files on delete
15. Fix `upload.service.ts` — stop returning filesystem path
16. Fix error format — add global exception filter for consistent error responses
17. Fix `fetchAPI` — handle 204 void responses

## Phase C: Frontend Fixes
18. Fix error message parsing — handle `string[]` from NestJS
19. Fix `CreateAlbumRequest` — add `tracks` field
20. Send track list to backend when creating album
21. Add split trigger API call after upload
22. Fix upload progress UI
23. Add polling error backoff

## Phase D: Docker + Deployment
24. Fix CORS `FRONTEND_URL` for production
25. Fix `NEXT_PUBLIC_API_URL` — use Next.js rewrites for API proxy
26. Add `.dockerignore` files
27. Add `dotenv` to backend package.json

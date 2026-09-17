# Data Model & Architecture (Next.js)

Use this as the default schema when the project has no existing one; otherwise map these
concepts onto the existing schema instead of replacing it.

## Suggested Prisma models
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @relation(fields: [roleId], references: [id])
  roleId        String
  avatarUrl     String?
  bio           String?
  twoFAEnabled  Boolean  @default(false)
  twoFASecret   String?
  colorScheme   String   @default("default")
  createdAt     DateTime @default(now())
  posts         Post[]
  sessions      Session[]
  tokens        ApiToken[]
}

model Role {
  id           String   @id @default(cuid())
  name         String   @unique   // Administrator, Editor, Author, Contributor, Subscriber
  capabilities String[]           // e.g. ["edit_others_posts", "publish_posts", ...]
  users        User[]
}

model Post {
  id             String    @id @default(cuid())
  title          String
  slug           String    @unique
  content        String
  excerpt        String?
  type           PostType  @default(POST)   // POST | PAGE
  status         PostStatus @default(DRAFT) // DRAFT | PENDING | PUBLISHED | SCHEDULED | PRIVATE | TRASH
  visibility     Visibility @default(PUBLIC) // PUBLIC | PASSWORD | PRIVATE
  password       String?
  authorId       String
  author         User      @relation(fields: [authorId], references: [id])
  featuredImageId String?
  featuredImage  Media?    @relation(fields: [featuredImageId], references: [id])
  parentId       String?   // for Pages hierarchy
  menuOrder      Int?      @default(0)
  template       String?
  categories     Category[]
  tags           Tag[]
  comments       Comment[]
  publishedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  revisions      Revision[]
}

model Revision {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  title     String
  content   String
  editedBy  String
  createdAt DateTime @default(now())
}

model Category { id String @id @default(cuid()); name String @unique; slug String @unique; parentId String?; posts Post[] }
model Tag      { id String @id @default(cuid()); name String @unique; slug String @unique; posts Post[] }

model Comment {
  id         String   @id @default(cuid())
  postId     String
  post       Post     @relation(fields: [postId], references: [id])
  parentId   String?
  authorName String
  authorEmail String
  authorIp   String?
  content    String
  status     CommentStatus @default(PENDING) // PENDING | APPROVED | SPAM | TRASH
  createdAt  DateTime @default(now())
}

model Media {
  id           String   @id @default(cuid())
  url          String
  mimeType     String
  size         Int
  width        Int?
  height       Int?
  altText      String?
  caption      String?
  description  String?
  uploadedById String
  createdAt    DateTime @default(now())
  posts        Post[]
}

model Setting { key String @id; value Json }   // wp_options equivalent
model Menu     { id String @id @default(cuid()); name String; location String?; items MenuItem[] }
model MenuItem { id String @id @default(cuid()); menuId String; label String; url String?; postId String?; order Int; parentId String? }
model Widget   { id String @id @default(cuid()); area String; type String; order Int; config Json }

model Session  { id String @id @default(cuid()); userId String; user User @relation(fields:[userId],references:[id]); ip String?; userAgent String?; lastActiveAt DateTime @updatedAt; createdAt DateTime @default(now()) }
model ApiToken { id String @id @default(cuid()); userId String; user User @relation(fields:[userId],references:[id]); name String; tokenHash String; lastUsedAt DateTime?; createdAt DateTime @default(now()) }
model AuditLog { id String @id @default(cuid()); actorId String?; action String; targetType String?; targetId String?; meta Json?; ip String?; createdAt DateTime @default(now()) }

enum PostType   { POST PAGE }
enum PostStatus { DRAFT PENDING PUBLISHED SCHEDULED PRIVATE TRASH }
enum Visibility { PUBLIC PASSWORD PRIVATE }
enum CommentStatus { PENDING APPROVED SPAM TRASH }
```

## API layer
- Prefer **Server Actions** for form mutations inside the admin UI (co-located, typed,
  automatically CSRF-protected by Next.js); use **Route Handlers** (`/api/...`) for
  anything consumed by external clients (webhooks, the REST-style API behind Application
  Tokens, the public site's own fetches).
- Every list screen's data endpoint accepts `{page, perPage, sort, dir, filters, search}`
  and returns `{rows, totalCount}` — see `list-table-pattern.md`.
- Consider tRPC if the project wants end-to-end type safety without hand-rolled REST
  shapes.

## Storage & media
- Object storage (S3-compatible, Cloudinary, or UploadThing) for all `Media` files;
  `Media.url` points at the CDN, not local disk.

## Search
- Postgres full-text search (`tsvector`) is enough for the admin Cmd+K search across
  Posts/Pages/Users; move to Meilisearch/Algolia only if search needs grow beyond that.

## Caching & rendering
- Public-facing pages use ISR (`revalidatePath`/`revalidateTag`) triggered on
  publish/update from the admin Server Actions, so publishing shows up immediately without
  a full rebuild.
- Admin screens themselves are typically dynamic (`no-store`) since they show live,
  per-user, permission-gated data.

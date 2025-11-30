# Academy Hive - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Git (optional)

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   The `.env` file has been created with default values. Update it with your settings:
   
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/academy_hive"
   SESSION_SECRET="change-this-to-a-random-secret-key"
   STORAGE_TYPE="local"
   UPLOAD_DIR="./uploads"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Set Up Database**
   
   Create the database and run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed Demo Data (Optional)**
   
   Add demo users and content:
   ```bash
   npx prisma db seed
   ```
   
   This creates:
   - Admin: `admin@academyhive.com` / `admin123`
   - Teacher: `teacher@example.com` / `teacher123`
   - Student: `student@example.com` / `student123`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   
   Visit: http://localhost:3000

---

## 📁 Project Structure

```
academy-hive/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication
│   │   │   ├── academies/    # Academy management
│   │   │   ├── classes/      # Class management
│   │   │   ├── videos/       # Video CRUD
│   │   │   ├── video/        # Video streaming & progress
│   │   │   ├── memberships/  # Academy memberships
│   │   │   ├── enrollments/  # Class enrollments
│   │   │   └── session/      # Device session check
│   │   ├── dashboard/
│   │   │   ├── admin/        # Admin dashboard
│   │   │   ├── teacher/      # Teacher dashboard
│   │   │   └── student/      # Student dashboard
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── DashboardLayout.tsx       # Dashboard wrapper
│   │   └── ProtectedVideoPlayer.tsx # Custom video player
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client
│   │   ├── auth.ts                # Auth utilities
│   │   ├── device-fingerprint.ts  # Device tracking
│   │   ├── storage.ts             # File storage abstraction
│   │   ├── video-settings.ts      # Video config helpers
│   │   └── api-utils.ts           # API response helpers
│   └── middleware.ts          # Route protection
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🎯 Core Features

### 1. **Video Protection**
- ✅ Dynamic watermarking (student name + email)
- ✅ Play count limits (default: 2 plays)
- ✅ Seek-back restrictions (default: 10 minutes)
- ✅ Progress tracking and resume
- ✅ No direct download access

### 2. **Anti-Sharing**
- ✅ Single active session per student
- ✅ Device fingerprinting
- ✅ Automatic session termination on new login

### 3. **User Roles**
- **Admin**: Approve academies, view all data
- **Teacher**: Create academies & classes, upload content
- **Student**: Join academies, watch protected videos

### 4. **Multi-Academy Support**
- Teachers can create multiple academies
- Students can join multiple academies
- Each academy has independent classes

---

## 🔐 Security Features

1. **Session Management**
   - HttpOnly cookies
   - Automatic session validation
   - Device-based locking for students

2. **Video Streaming**
   - No direct URL exposure
   - Range request support for seeking
   - Enrollment-based access control

3. **Progress Enforcement**
   - Server-side validation
   - Seek-back limits enforced
   - Play count tracking

---

## 🎥 Video Upload & Streaming

### Upload Process
1. Teacher uploads MP4 file via dashboard
2. File stored in `./uploads/videos/` (or R2 in production)
3. Video metadata saved to database
4. Configurable limits per video

### Streaming
- Videos served via `/api/video/stream/[id]`
- Supports range requests for seeking
- Enrollment check before streaming
- Play state validation

---

## 📊 Database Models

### Core Models
- `User` - All platform users (Admin, Teacher, Student)
- `Academy` - Learning institutions
- `Class` - Courses within academies
- `Video` - Protected video content
- `VideoPlayState` - Track student progress
- `DeviceSession` - Enforce single login

### Relationships
```
User ─┬─ ownedAcademies (1:many)
      ├─ academyMemberships (many:many)
      ├─ classEnrollments (many:many)
      └─ videoPlayStates (1:many)

Academy ─┬─ classes (1:many)
         └─ memberships (1:many)

Class ─┬─ videos (1:many)
       └─ enrollments (many:many with Student)

Video ─── playStates (1:many)
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Academies
- `GET /api/academies` - List academies
- `POST /api/academies` - Create academy
- `PATCH /api/academies/[id]` - Update status (admin)

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class

### Videos
- `GET /api/videos?classId=...` - List videos in class
- `POST /api/videos` - Upload video
- `GET /api/video/stream/[id]` - Stream video
- `POST /api/video/progress` - Update watch progress
- `GET /api/video/progress?videoId=...` - Get progress

### Memberships & Enrollments
- `POST /api/memberships` - Request academy membership
- `PATCH /api/memberships/[id]` - Approve/reject
- `POST /api/enrollments` - Enroll student in class

### Session
- `POST /api/session/check` - Create/update device session
- `GET /api/session/check` - Validate current session

---

## 🎨 Customization

### Video Settings Hierarchy
Settings cascade from platform → academy → class → video:

```
Platform Defaults (admin sets)
  ↓
Academy Defaults (optional override)
  ↓
Class Defaults (optional override)
  ↓
Video Specific (optional override)
```

### Watermark Customization
Edit `src/components/ProtectedVideoPlayer.tsx`:
- Position intervals
- Display duration
- Styling and opacity

---

## 🚢 Deployment

### Cloudflare Pages/Workers
1. Update storage to use R2 in `src/lib/storage.ts`
2. Set environment variables in Cloudflare dashboard
3. Deploy via:
   ```bash
   npm run build
   npx wrangler pages deploy .next
   ```

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<generate-secure-key>
STORAGE_TYPE=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📝 Next Steps

### Immediate Improvements
1. Implement full R2 storage adapter
2. Add video transcoding pipeline
3. Build teacher academy management pages
4. Add student analytics dashboard
5. Implement document viewing

### Future Features
1. Stripe payment integration
2. Email notifications
3. Video quality selection
4. Subtitle support
5. Mobile app

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
npx prisma db pull  # Test connection
```

### Migration Errors
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Session Issues
- Clear browser cookies
- Check SESSION_SECRET is set
- Restart dev server

---

## 📚 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **Auth**: Custom session-based
- **Deployment**: Cloudflare Pages/Workers ready

---

## 👥 Default User Accounts (After Seeding)

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@academyhive.com    | admin123    |
| Teacher | teacher@example.com      | teacher123  |
| Student | student@example.com      | student123  |

---

## 📄 License

Proprietary - All Rights Reserved

---

**Built with ❤️ for Academy Hive**

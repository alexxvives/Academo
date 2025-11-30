# 🚀 Academy Hive - Getting Started

Welcome to **Academy Hive**! This guide will help you set up and run your secure learning platform.

---

## ⚡ Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

This installs all required packages including:
- Next.js 14 (App Router)
- React & TypeScript
- Prisma ORM
- Tailwind CSS
- bcryptjs for password hashing
- and more...

### Step 2: Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE academy_hive;
   ```

**Option B: Cloud Database (Recommended)**
- [Neon.tech](https://neon.tech) - Free PostgreSQL
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Easy deployment

Update `.env` with your database URL:
```env
DATABASE_URL="postgresql://username:password@host:5432/academy_hive"
```

### Step 3: Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This creates all necessary tables in your database.

### Step 4: Seed Demo Data (Optional but Recommended)
```bash
npx prisma db seed
```

This creates:
- ✅ Admin account: `admin@academyhive.com` / `admin123`
- ✅ Teacher account: `teacher@example.com` / `teacher123`
- ✅ Student account: `student@example.com` / `student123`
- ✅ Demo academy with a sample class

### Step 5: Start the Development Server
```bash
npm run dev
```

### Step 6: Open Your Browser
Visit: **http://localhost:3000**

---

## 🎯 What You Can Do Now

### As Admin (`admin@academyhive.com`)
1. Navigate to **Admin Dashboard**
2. View all academies and their status
3. Approve or reject teacher academy requests
4. Monitor platform-wide statistics

### As Teacher (`teacher@example.com`)
1. Navigate to **Teacher Dashboard**
2. View "Demo Academy" (pre-approved)
3. Create new classes
4. Upload video lessons (MP4 files)
5. Manage student enrollments
6. View student progress

### As Student (`student@example.com`)
1. Navigate to **Student Dashboard**
2. View enrolled classes
3. Watch protected video lessons with:
   - Dynamic watermarking (your name + email)
   - Play count limits (2 plays by default)
   - Seek-back restrictions (10 min limit)
   - Progress tracking
4. Request to join additional academies

---

## 🎥 Testing Video Protection

### Upload a Video (as Teacher)
1. Login as teacher
2. Go to Demo Academy → Classes → "Introduction to Programming"
3. Click "Upload Video"
4. Select an MP4 file
5. Set title and optional description
6. Configure:
   - Max plays (default: 2)
   - Max seek-back minutes (default: 10)
7. Click Upload

### Watch as Student
1. Login as student
2. Navigate to "Introduction to Programming" class
3. Click on your uploaded video
4. Notice the protection features:
   - **Watermark**: Your name + email appears at random positions
   - **Play Counter**: Shows "Plays: X/2" in top right
   - **Seek Restriction**: Try seeking backward more than 10 minutes
   - **Progress Saving**: Close and reopen - it resumes where you left off
   - **Session Lock**: Try logging in from another browser/device

---

## 🏗️ Architecture Overview

### Frontend (Next.js App Router)
```
src/app/
  ├── page.tsx              → Landing page
  ├── login/                → Login page
  ├── register/             → Registration
  └── dashboard/
      ├── admin/            → Admin dashboard
      ├── teacher/          → Teacher dashboard
      └── student/          → Student dashboard
```

### API Routes
```
src/app/api/
  ├── auth/                 → Login, register, logout
  ├── academies/            → Academy CRUD
  ├── classes/              → Class management
  ├── videos/               → Video upload & list
  ├── video/
  │   ├── stream/[id]       → Secure video streaming
  │   └── progress          → Track watch progress
  ├── memberships/          → Academy join requests
  ├── enrollments/          → Class enrollment
  └── session/check         → Device session validation
```

### Database Schema (Prisma)
- **User** (Admin, Teacher, Student)
- **Academy** (Learning institution)
- **AcademyMembership** (User-Academy relationship)
- **Class** (Courses within academies)
- **ClassEnrollment** (Student-Class relationship)
- **Video** (Protected video content)
- **VideoPlayState** (Progress tracking per student)
- **DeviceSession** (Single active login enforcement)
- **Upload** (File metadata)
- **Document** (PDF/doc files)

---

## 🔐 Security Features Explained

### 1. Dynamic Watermarking
**How it works:**
- Student's full name and email are overlaid on the video
- Position changes every 2-4 minutes randomly
- Appears for 10-15 seconds at a time
- Semi-transparent to not obstruct viewing
- Cannot be disabled by the user

**Implementation:** `src/components/ProtectedVideoPlayer.tsx`

### 2. Play Count Limits
**How it works:**
- Each video has a max plays setting (default: 2)
- A "play" counts when student reaches 90% of video duration
- Counter increments in database
- After max plays reached, video becomes unplayable
- Teacher can configure per video/class/academy

**Why:** Prevents unlimited sharing of paid content

### 3. Seek-Back Restrictions
**How it works:**
- Student can only rewind up to X minutes (default: 10) from their furthest watched point
- Server validates every progress update
- Attempts to seek beyond limit are blocked
- Error message shown to student

**Why:** Prevents easy copying by forcing linear viewing

### 4. Single Active Session
**How it works:**
- Device fingerprint generated from: browser + OS + IP
- Only ONE active session allowed per student
- New login automatically terminates previous session
- Checked every 30 seconds on client
- Alert shown when session terminated

**Why:** Prevents account sharing between multiple people

### 5. No Direct Downloads
**How it works:**
- Videos served via `/api/video/stream/[id]` (not direct URLs)
- Right-click disabled on video element
- Enrollment checked before streaming
- No download button provided

**Why:** Makes it harder to extract and share raw video files

---

## 📊 Video Settings Hierarchy

Settings cascade with priority:

```
1. Platform Defaults (Admin sets)
   ↓ (if not set, use above)
2. Academy Defaults (Teacher can override)
   ↓ (if not set, use above)
3. Class Defaults (Teacher can override)
   ↓ (if not set, use above)
4. Video Specific (Teacher can override)
```

**Example:**
- Platform: maxPlays = 2
- Academy "Math Academy": maxPlays = 3 (overrides platform)
- Class "Calculus 101": maxPlays = null (inherits from academy = 3)
- Video "Derivatives Intro": maxPlays = 5 (overrides everything)

Result: Student can watch "Derivatives Intro" 5 times.

---

## 🛠️ Common Tasks

### Add a New Admin
```bash
# In your database or using Prisma Studio
npx prisma studio

# Navigate to User table
# Create new user with role = "ADMIN"
```

### Reset a Student's Play Count
```bash
npx prisma studio

# Navigate to VideoPlayState table
# Find the record for (videoId + studentId)
# Set playsCompleted = 0
```

### Change Platform Defaults
Login as Admin → Settings (coming soon)

Or manually:
```bash
npx prisma studio

# Navigate to PlatformSettings table
# Edit defaultMaxPlays or defaultMaxSeekBackMinutes
```

### Approve Academy Manually
```bash
npx prisma studio

# Navigate to Academy table
# Find the academy
# Change status from "PENDING" to "APPROVED"
```

---

## 🌐 Deployment to Production

### Recommended: Cloudflare Pages + Workers

1. **Prepare Database**
   - Use Neon, Supabase, or another hosted PostgreSQL
   - Run migrations: `npx prisma migrate deploy`

2. **Configure R2 Storage (for videos)**
   - Create R2 bucket in Cloudflare
   - Update `.env` with R2 credentials
   - Set `STORAGE_TYPE=r2`

3. **Set Environment Variables**
   ```env
   DATABASE_URL=postgresql://...
   SESSION_SECRET=<random-32-char-string>
   STORAGE_TYPE=r2
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=...
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. **Build & Deploy**
   ```bash
   npm run build
   npx wrangler pages deploy .next
   ```

### Alternative: Vercel

1. Import repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

**Note:** For video streaming, consider using Vercel's Edge Functions or external storage like Cloudflare R2.

---

## 📱 Testing Scenarios

### Test Single Session Enforcement
1. Login as student in Chrome
2. Open Incognito/Private window
3. Login as same student
4. Original window should show "Session terminated" alert
5. You'll be logged out from first window

### Test Play Limits
1. Set video maxPlays to 1 (for testing)
2. Watch video to 90%+ completion
3. Try to watch again
4. Should see "Maximum plays reached" message

### Test Seek-Back Restriction
1. Watch video to 5:00 minute mark
2. Try to seek back to 0:00
3. Should be blocked if seek-back limit < 5 minutes
4. Error message displays

### Test Watermark
1. Watch any video as student
2. Watermark appears with your name + email
3. Position changes every few minutes
4. Fades in and out

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Test connection: `npx prisma db pull`

### "Module not found" errors
- Run: `npm install`
- Generate Prisma client: `npx prisma generate`

### Videos won't play
- Check file exists in `./uploads/videos/`
- Verify student is enrolled in the class
- Check browser console for errors

### Session keeps logging out
- Clear browser cookies
- Check `SESSION_SECRET` is set in `.env`
- Restart dev server

### Watermark not appearing
- Check video player component loaded
- Verify student name/email are set
- Check browser console for JavaScript errors

---

## 📚 Learn More

### Key Files to Understand
- `src/components/ProtectedVideoPlayer.tsx` - Custom video player
- `src/lib/auth.ts` - Authentication logic
- `src/lib/video-settings.ts` - Settings hierarchy
- `src/app/api/video/stream/[id]/route.ts` - Video streaming
- `src/app/api/video/progress/route.ts` - Progress tracking

### Database Queries
```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# View database schema
npx prisma db pull

# Reset everything (WARNING: deletes data)
npx prisma migrate reset
```

---

## 🎓 Next Steps

1. ✅ **Test all features** with demo accounts
2. ✅ **Upload real video** (MP4 format)
3. ✅ **Customize branding** (logo, colors in Tailwind)
4. ✅ **Set up production database**
5. ✅ **Configure R2 storage** for production
6. ✅ **Deploy to Cloudflare Pages**
7. 🚀 **Launch your academy!**

---

## 💡 Tips & Best Practices

### Video Upload
- Use MP4 format (H.264 codec)
- Keep files under 500MB for better streaming
- Compress videos before upload using HandBrake

### Security
- Change default passwords immediately
- Use strong SESSION_SECRET (32+ chars)
- Enable HTTPS in production
- Regularly backup database

### Performance
- Enable CDN for video delivery (R2 + Cloudflare)
- Compress images with next/image
- Monitor database query performance

### User Experience
- Set reasonable play limits (2-3 plays)
- Allow 10-15 minute seek-back for legitimate reviewing
- Provide clear error messages
- Send email notifications for approvals

---

## 🤝 Support

Having issues? Check:
- `SETUP.md` for detailed setup instructions
- Database schema in `prisma/schema.prisma`
- API documentation in `SETUP.md`

---

**Built for Academy Hive** 🎓
Secure, scalable, and student-friendly learning platform.

Happy teaching! 🎉

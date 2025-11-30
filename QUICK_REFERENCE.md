# 📋 Academy Hive - Quick Reference

## ⚡ Essential Commands

```bash
# Installation
npm install                              # Install all dependencies
npx prisma migrate dev --name init       # Create database tables
npx prisma db seed                       # Load demo data
npm run dev                             # Start dev server

# Development
npx prisma studio                       # Open database GUI
npx prisma generate                     # Regenerate Prisma client
npm run build                           # Build for production
npm run lint                            # Check code quality

# Database
npx prisma migrate reset                # Reset DB (deletes all data!)
npx prisma db pull                      # Pull schema from database
npx prisma db push                      # Push schema without migration
```

---

## 👤 Demo Accounts (after seeding)

| Role    | Email                    | Password   |
|---------|--------------------------|------------|
| Admin   | admin@academyhive.com    | admin123   |
| Teacher | teacher@example.com      | teacher123 |
| Student | student@example.com      | student123 |

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/components/ProtectedVideoPlayer.tsx` | Custom video player with protection |
| `src/lib/auth.ts` | Authentication & session management |
| `src/lib/video-settings.ts` | Video configuration cascade logic |
| `src/app/api/video/stream/[id]/route.ts` | Video streaming endpoint |
| `src/app/api/video/progress/route.ts` | Progress tracking |
| `src/middleware.ts` | Route protection |
| `prisma/schema.prisma` | Database schema |
| `.env` | Environment variables |

---

## 🔐 Video Protection Features

| Feature | Default | Location |
|---------|---------|----------|
| Max Plays | 2 | Configurable per video/class/academy |
| Seek-Back Limit | 10 minutes | Configurable per video/class/academy |
| Watermark | Always on | Student name + email overlay |
| Session Limit | 1 active | Device fingerprint enforcement |
| Progress Tracking | Every 5s | Server-side validation |

---

## 🛣️ Routes

### Public
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page

### Protected
- `/dashboard/admin` - Admin dashboard
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/student` - Student dashboard
- `/dashboard/student/class/[id]` - Class videos page

### API (all under `/api/`)
- `auth/register` - User registration
- `auth/login` - Authentication
- `auth/logout` - Sign out
- `auth/me` - Current user
- `academies` - Academy CRUD
- `classes` - Class CRUD
- `videos` - Video upload & list
- `video/stream/[id]` - Stream video
- `video/progress` - Track progress
- `memberships` - Join requests
- `enrollments` - Class enrollment
- `session/check` - Session validation

---

## 🗄️ Database Models

| Model | Description |
|-------|-------------|
| User | Platform users (Admin/Teacher/Student) |
| Academy | Learning institutions |
| AcademyMembership | User-academy relationships |
| Class | Courses within academies |
| ClassEnrollment | Student-class relationships |
| Video | Protected video content |
| VideoPlayState | Progress tracking per student |
| DeviceSession | Active session management |
| Upload | File metadata |
| Document | PDF/document files |
| PlatformSettings | Global defaults |
| BillingConfig | Future payment integration |

---

## 🎯 Common Workflows

### Create Academy (Teacher)
1. Register as teacher
2. Create academy (status: PENDING)
3. Wait for admin approval
4. Create classes
5. Upload videos

### Join Academy (Student)
1. Register as student
2. Request academy membership
3. Wait for teacher approval
4. Access enrolled classes
5. Watch videos

### Upload Video (Teacher)
1. Navigate to class
2. Click "Upload Video"
3. Select MP4 file
4. Configure settings
5. Upload

### Watch Video (Student)
1. Navigate to class
2. Click video
3. Protected player loads
4. Watermark appears
5. Progress tracked

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Authentication
SESSION_SECRET="random-32-character-string"

# File Storage
STORAGE_TYPE="local"          # or "r2" for production
UPLOAD_DIR="./uploads"

# Cloudflare R2 (production)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚨 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Cannot connect to database" | Check `DATABASE_URL` in `.env` |
| "Module not found" | Run `npm install` and `npx prisma generate` |
| Port 3000 in use | Run `npx kill-port 3000` or use `-p 3001` |
| Session expired | Clear cookies, restart server |
| Video won't play | Check enrollment, file exists, format is MP4 |
| Prisma errors | Run `npx prisma generate` |
| TypeScript errors | Run `npm run build` to check |

---

## 📊 Settings Hierarchy

```
Platform (Admin)
    ↓
Academy (Teacher)
    ↓
Class (Teacher)
    ↓
Video (Teacher)
```

Most specific setting wins. Null values inherit from parent level.

---

## 🎨 Customization

### Change Colors
Edit `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    },
  },
}
```

### Update Logo
Replace text "AH" in:
- `src/app/page.tsx`
- `src/components/DashboardLayout.tsx`

### Modify Watermark
Edit `src/components/ProtectedVideoPlayer.tsx`:
- Change position intervals
- Adjust opacity
- Modify display duration

---

## 🚀 Production Checklist

- [ ] Change all default passwords
- [ ] Set secure `SESSION_SECRET`
- [ ] Configure production database
- [ ] Set up R2 storage
- [ ] Enable HTTPS
- [ ] Test all video protection features
- [ ] Configure error monitoring
- [ ] Set up automated backups
- [ ] Test on multiple devices
- [ ] Review security settings

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Overview and quick reference |
| `INSTALL.md` | Step-by-step installation |
| `GETTING_STARTED.md` | Complete feature guide |
| `SETUP.md` | Technical documentation |
| `PROJECT_SUMMARY.md` | Full project overview |
| `QUICK_REFERENCE.md` | This file! |

---

## 💡 Pro Tips

1. **Use Prisma Studio** for quick database edits: `npx prisma studio`
2. **Test with seed data** before creating real content
3. **Set low play limits** during testing (easier to verify)
4. **Check browser console** for detailed error messages
5. **Use Incognito mode** to test different user sessions
6. **Monitor uploads folder size** - videos take space!
7. **Backup database** regularly in production
8. **Use environment-specific configs** for dev/staging/prod

---

## 🔗 Useful URLs (Development)

- **App:** http://localhost:3000
- **Prisma Studio:** Run `npx prisma studio`
- **API Docs:** See `SETUP.md`

---

## 🎯 Testing Checklist

- [ ] Register as each role (Admin, Teacher, Student)
- [ ] Create academy (Teacher)
- [ ] Approve academy (Admin)
- [ ] Create class (Teacher)
- [ ] Upload video (Teacher)
- [ ] Request membership (Student)
- [ ] Approve membership (Teacher)
- [ ] Enroll student (Teacher)
- [ ] Watch video with all protections (Student)
- [ ] Test session enforcement (login twice)
- [ ] Verify watermark appears
- [ ] Test play limit (watch to completion)
- [ ] Test seek-back restriction
- [ ] Check progress saves and resumes

---

**Keep this file handy for quick reference!** 📌

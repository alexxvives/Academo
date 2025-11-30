# ⚡ Academy Hive - Installation Instructions

## Step-by-Step Setup (5 minutes)

### 1️⃣ Install Node.js Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages. You should see output like:
```
added 345 packages in 45s
```

### 2️⃣ Set Up Your Database

**Option A: Use a Cloud Database (Easiest)**

I recommend [Neon.tech](https://neon.tech) - it's free and takes 2 minutes:

1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string
5. Paste it in your `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

**Option B: Use Local PostgreSQL**

If you have PostgreSQL installed locally:

1. Create a database:
   ```bash
   createdb academy_hive
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/academy_hive"
   ```

### 3️⃣ Run Database Migrations

This creates all the necessary tables:

```bash
npx prisma migrate dev --name init
```

You should see:
```
✔ Generated Prisma Client
✔ Your database is now in sync with your schema.
```

### 4️⃣ Seed Demo Data (Recommended)

This creates demo accounts so you can test immediately:

```bash
npx prisma db seed
```

You should see:
```
✅ Platform settings created
✅ Admin user created: admin@academyhive.com / admin123
✅ Teacher user created: teacher@example.com / teacher123
✅ Student user created: student@example.com / student123
✅ Demo academy created
✅ Demo class created
✅ Student enrolled in demo class
✅ Student membership approved

✨ Seeding completed!
```

### 5️⃣ Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

### 6️⃣ Open Your Browser

Visit: **http://localhost:3000**

You should see the Academy Hive landing page!

---

## 🎯 Test Your Installation

### Test as Admin
1. Click "Login" in the header
2. Use: `admin@academyhive.com` / `admin123`
3. You should see the Admin Dashboard
4. Check the "Pending Approval" section

### Test as Teacher
1. Logout (if logged in)
2. Login with: `teacher@example.com` / `teacher123`
3. You should see the Teacher Dashboard
4. Click on "Demo Academy" to manage it

### Test as Student
1. Logout (if logged in)
2. Login with: `student@example.com` / `student123`
3. You should see the Student Dashboard
4. Click on "Introduction to Programming" class

---

## 🎥 Upload Your First Video (as Teacher)

1. Login as teacher: `teacher@example.com` / `teacher123`
2. Navigate to "Demo Academy"
3. Click on "Introduction to Programming" class
4. Click "Upload Video" button
5. Select an MP4 file from your computer
6. Set:
   - Title: "My First Video"
   - Max Plays: 2
   - Max Seek-Back: 10 minutes
7. Click "Upload"
8. Wait for upload to complete

Now logout and login as student to watch it!

---

## 🔐 Watch Protected Video (as Student)

1. Login as student: `student@example.com` / `student123`
2. Click on "Introduction to Programming"
3. Click on your uploaded video
4. Notice:
   - ✅ Watermark with your name appears
   - ✅ "Plays: 0/2" counter in top right
   - ✅ Progress bar shows your position
   - ✅ Try seeking back more than 10 minutes → blocked!

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to database"

**Solution:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Test connection:
   ```bash
   npx prisma db pull
   ```
3. If error, verify your database credentials

### Problem: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma client
npx prisma generate
```

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Kill the process using port 3000 (Windows)
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Problem: Videos won't upload

**Solution:**
1. Check `./uploads` directory exists
2. Verify file is MP4 format
3. Check file size < 100MB
4. Check browser console for errors

### Problem: Session keeps expiring

**Solution:**
1. Clear browser cookies
2. Check `.env` has `SESSION_SECRET` set
3. Restart dev server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Installation Checklist

After setup, you should have:

- [ ] ✅ `node_modules/` folder with packages
- [ ] ✅ Database with tables created
- [ ] ✅ Demo users seeded (admin, teacher, student)
- [ ] ✅ Dev server running on http://localhost:3000
- [ ] ✅ Can login with demo accounts
- [ ] ✅ Can navigate to dashboards
- [ ] ✅ Can upload and watch videos

---

## 📚 Next Steps

Once installation is complete:

1. **Read:** `GETTING_STARTED.md` for detailed feature guide
2. **Explore:** Try all three user roles (Admin, Teacher, Student)
3. **Test:** Upload a video and test all protection features
4. **Customize:** Update branding and colors
5. **Deploy:** Follow `SETUP.md` for production deployment

---

## 🆘 Need Help?

### Check These Files:
- `GETTING_STARTED.md` - Detailed usage guide
- `SETUP.md` - Technical documentation
- `PROJECT_SUMMARY.md` - Complete overview
- `README.md` - Quick reference

### Common Commands:
```bash
# View database in GUI
npx prisma studio

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Update dependencies
npm update

# Check for errors
npm run build
```

---

## 🎉 You're All Set!

Your Academy Hive platform is now running!

**Default Credentials:**
- Admin: `admin@academyhive.com` / `admin123`
- Teacher: `teacher@example.com` / `teacher123`
- Student: `student@example.com` / `student123`

**Remember to:**
- Change default passwords in production
- Set a secure SESSION_SECRET
- Configure R2 storage for production
- Enable HTTPS when deploying

---

**Happy Learning! 🎓**

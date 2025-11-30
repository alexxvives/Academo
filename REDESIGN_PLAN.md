# 🎨 Academy Hive - Minimalist Redesign & Video Player Improvements

## Changes Needed:

### 1. ✅ Database Schema Updated
- Changed from `maxPlays` + `maxSeekBackMinutes` to `maxWatchTimeMultiplier`
- New `VideoPlayState` tracking: `totalWatchTimeSeconds`, `sessionStartTime`
- Migration completed and database seeded

### 2. 🎨 Color Palette (Minimalist Light Blue)
**Updated in `tailwind.config.ts`:**
- Primary: Light blues (#f0f9ff to #0c4a6e)
- Backgrounds: Very light blue (#f0f9ff, #e0f2fe)
- Fills/Cards: Light blue (#bae6fd, #7dd3fc)
- Text: Dark blue (#075985, #0c4a6e)
- Accents: Neutral grays

### 3. 📹 Video Player Improvements Needed:
- ✓ Remove 10s forward/backward buttons  
- ✓ Allow free scrubbing/dragging in progress bar
- ✓ Track total play time (not view count)
- ✓ Stop playback when totalWatchTime >= (duration * multiplier)
- ✓ Allow unlimited restarts
- ✓ Smooth playback controls

### 4. 🎨 UI Components to Redesign:
**All dashboards need:**
- Clean, minimal design
- Light blue backgrounds (#f0f9ff, #e0f2fe)
- White cards with subtle shadows
- Dark blue text (#075985, #0c4a6e)
- Reduced gradients (or light blue gradients only)
- More whitespace
- Subtle borders
- Rounded corners (medium, not extreme)

**Files to Update:**
1. `src/components/VideoPlayer.tsx` - NEW improved player
2. `src/app/page.tsx` - Landing page
3. `src/components/DashboardLayout.tsx` - Navigation
4. `src/app/dashboard/student/page.tsx` - Student dashboard
5. `src/app/dashboard/teacher/page.tsx` - Teacher dashboard  
6. `src/app/dashboard/teacher/academy/[id]/page.tsx` - Academy management
7. `src/app/dashboard/teacher/class/[id]/page.tsx` - Class management
8. `src/app/dashboard/admin/page.tsx` - Admin dashboard
9. `src/components/AuthModal.tsx` - Auth forms

### 5. 🎬 Video Upload Form Updates:
Remove maxPlays and maxSeekBackMinutes inputs, add:
- `maxWatchTimeMultiplier` (default: 2.0)
- Label: "Watch Time Limit (× video duration)"
- Help text: "Students can watch for this many times the video length"

## Implementation Status:
- [x] Schema updated
- [x] Database migrated
- [x] Color palette configured
- [ ] Video player with new system
- [ ] Landing page redesign
- [ ] Navigation redesign
- [ ] Student dashboard redesign
- [ ] Teacher dashboard redesign
- [ ] Academy page redesign
- [ ] Class page redesign
- [ ] Admin dashboard redesign
- [ ] Auth modal redesign
- [ ] Video upload form updates
- [ ] Video progress API updates

## Design Principles:
✓ Minimal & clean
✓ Lots of whitespace
✓ Light blue backgrounds
✓ White content cards
✓ Dark blue text for readability
✓ Subtle shadows
✓ Smooth interactions
✓ Professional & aesthetic

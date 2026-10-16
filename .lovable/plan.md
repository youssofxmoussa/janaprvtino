# Full Admin Panel + Hardened Security

Admin page gets the same iOS look as the rest of the app (Liquid Glass + clay cards, bottom sheets, confirm dialogs). Every admin action is checked again on the server, so hiding the page alone is never the protection.

## 1. Admin panel (same design as the app)

Top segmented tabs: Dashboard · Students · Courses & Files · Quiz Bank · Activity Log · Settings.

**Dashboard**
- Totals: students, active, paused, lectures, PDFs, questions, storage used.
- Recently joined students and recent sign-ins.

**Students**
- Searchable, filterable list: email, name, join date, last sign-in, status (active/paused).
- Add student (email + password, active right away, no confirmation email).
- Bulk add from a pasted list.
- Pause / resume (blocks sign-in and course access immediately).
- Set a new password.
- Choose which courses each student can open (per-student course access).
- Sign the student out of all devices.
- Delete permanently (with confirmation typed by the admin).
- Admin accounts are protected: cannot be paused, deleted, or edited from the list, and the admin cannot remove their own access.

**Courses & Files** (all 12 subjects)
- Edit subject description.
- Upload videos (MP4, WebM, MOV) and PDFs straight to private storage through one-time secure upload links, with progress bar, size and type checks.
- Rename, reorder (move up/down), hide/show, delete — deleted files are removed from storage too.
- Preview any file before publishing.

**Quiz Bank**
- Add / edit / delete multiple-choice questions per course, 4 options, tap to mark the correct one, written explanation shown after answering, reorder.

**Activity Log**
- Every admin action recorded (who, what, when) — create, pause, delete, upload, edit.

**Settings**
- Change own admin password, sign out everywhere.

## 2. Content and anti-piracy

- Remove the public Catbox links completely; the subject page loads content from the server only.
- Every file gets an expiring signed link (video 3h, PDF 1h); no storage paths ever reach students.
- Moving video watermark with the student's email, changing position every 5s.
- PDF: repeated faint student email across every page + centered, soft Jana Tahhan logo watermark in the viewer.
- Block right-click, download button, drag, text selection on media, picture-in-picture and remote playback.
- Students only get links for courses they are allowed to open.

## 3. Site and data security

- Server checks on every request: valid session, not paused, real role, admin-only actions double-checked.
- Roles stay in protected account metadata only students cannot change (never in editable profile data).
- All input validated and length-limited on the server (course IDs, file paths, file types, sizes, text).
- Rate limits on sign-in attempts and admin actions to stop brute force and abuse.
- Storage buckets kept private, with no public read/write; uploads only through server-issued links scoped to one file path.
- Service key read only inside server code, never shipped to the browser; move the hardcoded config to environment settings.
- Security headers on every page: strict Content-Security-Policy, no framing by other sites (clickjacking), no MIME sniffing, strict referrer policy, HTTPS only.
- Generic error messages to users; details logged on the server only.
- Admin and private pages marked no-index for search engines.
- Run the security scan and dependency scan, fix all findings.

## 4. Sign-in routing

- After sign-in: admins go to the admin panel, students to their courses; paused or role-less accounts are signed out with a clear message.

## Technical details

- New `src/routes/admin.tsx` UI using existing `components/ios` (ConfirmSheet, Field, press, clay classes); split into `src/components/admin/*` per tab.
- Extend `students.functions.ts`: `bulkCreateStudents`, `setStudentCourses` (stored in `app_metadata.courses`), `signOutStudent`, admin-self/other-admin guards; `getDashboardStats`.
- Extend `course-content.ts` schema: `hidden`, order; `getCourseContent` filters hidden items and enforces per-student course access in `requireMember`.
- Audit log appended as JSON lines in the private data bucket via `logAdminAction` helper (no database needed).
- Rate limiting: simple counter per user/IP stored in the private bucket or Supabase table if available; login throttle on client + server-side check.
- Security headers via a request middleware in `src/start.ts`.
- `subject.$courseId.tsx`: drop Catbox constants, use `getCourseContent`; `PdfViewer.tsx`: logo + email watermark layers; `Watermark.tsx` 5s movement.
- Add tests for: admin cannot be paused/deleted, students blocked from other courses, invalid paths rejected.

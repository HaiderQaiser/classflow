ClassFlow — Tuition Schedule Management Portal



1\. Project Overview

ClassFlow is a centralized, responsive web application designed for tuition institutes to replace daily manual WhatsApp schedule messages. Admins can easily manage, draft, and publish daily class schedules, while students can log in to view their specific class timetable for the current day.



2\. Technology Stack

\- Frontend: React.js, CSS

\- Backend: Python, FastAPI

\- Database: MySQL

\- ORM: SQLAlchemy

\- Communication: REST API, JSON

\- Authentication: JWT (JSON Web Tokens) with Password Hashing (bcrypt)



3\. Key Architecture \& Product Decisions (MVP Scope)



Authentication \& User Roles:

\- System supports two roles: Admin/Owner and Student.

\- Student accounts are created by the Admin using assigned Roll Numbers/Usernames + Passwords.

\- Admin can reset student passwords and toggle student status (Active/Inactive) upon promotion or leave.

\- Single 'users' table is used for both roles to maintain simplified authentication endpoints.



Academic Structure:

\- Strict uniqueness enforced on (class\_name, group\_name) combinations (e.g., Class 9 - Biology).

\- Foreign Key deletion on class groups is set to RESTRICT to prevent accidental deletion of classes with active students or schedules.



Schedule \& Draft Workflow:

\- Schedules are managed date-wise per class group.

\- Draft vs Published: Schedules support 'draft' and 'published' states.

\- Editing Published Schedules: When an admin edits a published schedule as a draft, students continue seeing the currently published schedule until the updated version is explicitly published.

\- Enforced composite UNIQUE constraint on (class\_group\_id, schedule\_date, status) allowing maximum 1 draft and 1 published schedule concurrently per group/date.

\- Lecture slot timing validation enforced at both DB level (CHECK constraint end\_time > start\_time) and API level.

\- Individual lecture slots can be marked as 'Cancelled' instead of being deleted.



Holiday Management:

\- Only Center-Wide Holidays are supported for the MVP.

\- Holidays take display priority over published schedules on the student dashboard without permanently deleting existing underlying schedules.



Student Access Scope:

\- Students can only view TODAY's schedule/holiday status for their assigned class group.

\- Previous-day and future-day schedule browsing is excluded from MVP scope to keep the interface simple and reliable.



4\. Database Schema Structure

\- class\_groups (id, class\_name, group\_name, created\_at)

\- users (id, username, first\_name, last\_name, password\_hash, role, class\_group\_id, is\_active, created\_at)

\- schedules (id, class\_group\_id, schedule\_date, status, updated\_at)

\- schedule\_slots (id, schedule\_id, subject, start\_time, end\_time, teacher\_name, is\_cancelled)

\- holidays (id, holiday\_date, reason, created\_at)



5\. Current Status

\- Database ERD finalized and schema.sql successfully created/verified.

\- Next Phase: Backend API foundation with Python \& FastAPI.


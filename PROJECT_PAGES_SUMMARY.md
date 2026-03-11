# College LMS - Comprehensive Application Summary

This document provides a complete page-by-page breakdown of the **College LMS** project. It outlines the structure of the application, describing what each page is, its associated route, and its core functionality.

## Core Application Structure
The application is built using **React** with **Vite** on the frontend, using **React Router v6** for navigation. The routing architecture is heavily dependent on user roles (`student`, `staff`, `hod`). 

A central `ProtectedRoute` acts as a security wrapper, validating users' JWT tokens and ensuring they can only access the routes allocated to their specific role. Upon successful login, users are automatically redirected to their respective role-based dashboards.

---

## 1. Authentication Module

### **Login Page**
- **Route:** `/login`
- **File:** `src/pages/auth/Login.jsx`
- **Description:** 
  The entry point of the application. Users log in with an ID and password. The system identifies the user's role upon successful authentication and redirects them appropriately. 
  *(Note: For students, this page includes advanced automated Face Verification when valid student IDs are entered).*

---

## 2. Student Portal

The student portal is designed for consumption of data. Students can track their academic progress, download resources, and stay updated.

### **Student Dashboard**
- **Route:** `/student/dashboard`
- **File:** `src/pages/student/Dashboard.jsx`
- **Description:** A high-level overview for the student. Displays quick stats, upcoming assignments, recent announcements, and a snapshot of current attendance numbers.

### **Attendance Logs**
- **Route:** `/student/attendance`
- **File:** `src/pages/student/Attendance.jsx`
- **Description:** Allows students to view their detailed attendance records, categorized by subject and percentage, helping them ensure they meet minimum requirements.

### **Assignments**
- **Route:** `/student/assignments`
- **File:** `src/pages/student/Assignments.jsx`
- **Description:** Students can view active, pending, and completed assignments. It provides functionality to upload and submit assignment documents before deadlines.

### **Marks & Grades**
- **Route:** `/student/marks`
- **File:** `src/pages/student/Marks.jsx`
- **Description:** A read-only report view where students can monitor their performance in internal exams, assignments, and practicals across different subjects.

### **Enrolled Subjects**
- **Route:** `/student/subjects`
- **File:** `src/pages/student/Subjects.jsx`
- **Description:** Displays the list of subjects the student is registered for during the current semester, along with staff contact information.

### **Learning Content**
- **Route:** `/student/content`
- **File:** `src/pages/student/Content.jsx`
- **Description:** A digital repository. Students can download lecture notes, PDFs, or media materials uploaded by their respective subject staff.

### **Announcements**
- **Route:** `/student/announcements`
- **File:** `src/pages/student/Announcements.jsx`
- **Description:** A bulletin board aggregating messages from the HOD and specific class staff.

---

## 3. Staff Portal

The staff portal focuses on data entry and classroom management. Staff members are responsible for updating student records.

### **Staff Dashboard**
- **Route:** `/staff/dashboard`
- **File:** `src/pages/staff/Dashboard.jsx`
- **Description:** A summary view highlighting today's classes, pending attendance logs to be filled, and quick jump links for immediate classroom operations.

### **My Subjects**
- **Route:** `/staff/subjects`
- **File:** `src/pages/staff/Subjects.jsx`
- **Description:** Displays the classes and subjects currently assigned to the staff member by the HOD.

### **Take Attendance**
- **Route:** `/staff/attendance`
- **File:** `src/pages/staff/Attendance.jsx`
- **Description:** Critical interface for marking daily/hourly presence or absence for students in registered classes. 

### **Manage Content**
- **Route:** `/staff/content`
- **File:** `src/pages/staff/Content.jsx`
- **Description:** Interface for uploading educational materials, organizing them by subject/topic for student retrieval.

### **Manage Assignments**
- **Route:** `/staff/assignments`
- **File:** `src/pages/staff/Assignments.jsx`
- **Description:** Allows staff to create new assignments, set deadlines, and review/grade submissions made by students.

### **Grade Book**
- **Route:** `/staff/grades`
- **File:** `src/pages/staff/GradeBook.jsx`
- **Description:** Staff use this to input marks for exams or tests. Calculates class averages and allows manual overriding.

### **Leave Requests**
- **Route:** `/staff/leave`
- **File:** `src/pages/staff/LeaveRequest.jsx`
- **Description:** Form to officially request leaves from the department. Tracks the status (Pending/Approved/Rejected) of past requests.

### **Post Announcements**
- **Route:** `/staff/announcements`
- **File:** `src/pages/staff/Announcements.jsx`
- **Description:** Send targeted communications directly to students enrolled in their subjects.

### **Course Plan Manager**
- **Route:** `/staff/course-plan`
- **File:** `src/pages/staff/CoursePlanManager.jsx`
- **Description:** Allows staff to construct a syllabus timeline, mapping topics to specific instructional hours.

### **Submit Hour Report**
- **Route:** `/staff/course-plan/submit/:topicId`
- **File:** `src/pages/staff/SubmitHourReport.jsx`
- **Description:** An auxiliary form page allowing staff to log that a specific topic block from the course plan has been completed.

---

## 4. HOD (Head of Department) Portal

The HOD acts as the department's super-user, handling administrative actions, overseeing reports, and managing system macro-logistics.

### **HOD Dashboard**
- **Route:** `/hod/dashboard`
- **File:** `src/pages/hod/Dashboard.jsx`
- **Description:** Department-wide bird's-eye view. Displays aggregate stats (total staff, total students, active subjects).

### **Manage Staff**
- **Route:** `/hod/staff`
- **File:** `src/pages/hod/ManageStaff.jsx`
- **Description:** CRUD (Create, Read, Update, Delete) operations for the department's teaching personnel.

### **Manage Students**
- **Route:** `/hod/students`
- **File:** `src/pages/hod/ManageStudents.jsx`
- **Description:** Similar CRUD interface for enrolling and tracking students inside the department.

### **Manage Subjects & Assignments**
- **Route:** `/hod/subjects`
- **File:** `src/pages/hod/ManageSubjects.jsx`
- **Description:** Allows the definition of new subjects and the critical task of mapping staff members to teach those subjects.

### **Attendance Reports**
- **Route:** `/hod/reports/attendance`
- **File:** `src/pages/hod/AttendanceReports.jsx`
- **Description:** Generates macro-level attendance compliance reports across various classes to identify systemic absenteeism.

### **Marks Reports**
- **Route:** `/hod/reports/marks`
- **File:** `src/pages/hod/MarksReports.jsx`
- **Description:** Generates analytics on internal marks. Used to monitor overall academic health and staff performance.

### **Leave Approvals**
- **Route:** `/hod/leaves`
- **File:** `src/pages/hod/LeaveApprovals.jsx`
- **Description:** Inbox for staff leave requests. HOD can review schedules and explicitly Approve/Reject them.

### **Announcements**
- **Route:** `/hod/announcements`
- **File:** `src/pages/hod/Announcements.jsx`
- **Description:** Used to broadcast department-wide notices that appear on both staff and student dashboards.

### **Overall Department Reports**
- **Route:** `/hod/reports/overall`
- **File:** `src/pages/hod/DeptReports.jsx`
- **Description:** Generates comprehensive PDF or analytical reports combining multiple metrics for university audits.

### **Course Plan Verification**
- **Route:** `/hod/course-plan-reports`
- **File:** `src/pages/hod/CoursePlanReports.jsx`
- **Description:** Allows the HOD to audit the course plans submitted by staff, checking syllabus progression against the actual academic calendar. Displays data in a user-friendly table format.

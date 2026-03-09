const db = require('../models/db');
const {
    validateAttendanceSession,
    validateAssignment,
    validateGrading,
    validateContent,
    validateAnnouncement,
    validateLeaveRequest,
    validateAssessment,
    validateAssessmentMarks,
} = require('../utils/validators');

/**
 * GET /api/staff/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const staffId = req.user.id;
        const stats = await db.getStaffDashboardStats(staffId);
        const subjects = await db.findSubjectsByStaff(staffId);
        const user = await db.findUserById(staffId);

        const announcements = await db.findAnnouncements({
            departmentId: user.department_id,
            role: 'staff',
        });

        return res.status(200).json({
            success: true,
            data: {
                stats,
                subjects,
                announcements: announcements.slice(0, 5),
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/subjects
 */
const getSubjects = async (req, res, next) => {
    try {
        const subjects = await db.findSubjectsByStaff(req.user.id);
        return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/subjects/:id/students
 */
const getSubjectStudents = async (req, res, next) => {
    try {
        const subject = await db.findSubjectById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found.' });
        }
        if (subject.staff_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this subject.' });
        }
        const students = await db.findEnrolledStudents(req.params.id);
        return res.status(200).json({ success: true, data: students });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/attendance
 * Body: { subjectId, sessionDate, sessionType, records: [{studentId, status}] }
 */
const createAttendance = async (req, res, next) => {
    try {
        const { subjectId, sessionDate, sessionType, records } = req.body;

        const { valid, errors } = validateAttendanceSession({ subjectId, sessionDate, sessionType, records });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        // Verify staff owns this subject
        const subject = await db.findSubjectById(subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found.' });
        }
        if (subject.staff_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this subject.' });
        }

        const result = await db.createAttendanceSession({
            subjectId,
            staffId: req.user.id,
            sessionDate,
            sessionType,
            records,
        });

        return res.status(201).json({
            success: true,
            message: 'Attendance session created.',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/attendance/:subjectId
 */
const getAttendanceBySubject = async (req, res, next) => {
    try {
        const sessions = await db.findAttendanceSessionsBySubject(req.params.subjectId);
        return res.status(200).json({ success: true, data: sessions });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/staff/attendance/session/:sessionId
 * Body: { records: [{studentId, status}] }
 */
const updateAttendanceSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { records } = req.body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ success: false, message: 'Records array is required.' });
        }

        const attendanceRecords = await db.updateAttendanceSession(sessionId, records);

        return res.status(200).json({
            success: true,
            message: 'Attendance session updated.',
            data: attendanceRecords,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/content
 * Body: { subjectId, title, description, contentType, fileUrl, weekNumber, topic }
 */
const uploadContent = async (req, res, next) => {
    try {
        const { subjectId, title, description, contentType, fileUrl, weekNumber, topic } = req.body;

        const { valid, errors } = validateContent({ title, subjectId, contentType });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const content = await db.createContent({
            subjectId,
            title,
            description,
            contentType,
            fileUrl,
            weekNumber,
            topic,
            uploadedBy: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: 'Content uploaded.',
            data: content,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/content/:subjectId
 */
const getContent = async (req, res, next) => {
    try {
        const content = await db.findContentBySubject(req.params.subjectId);
        return res.status(200).json({ success: true, data: content });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/staff/content/:id
 */
const deleteContent = async (req, res, next) => {
    try {
        const item = await db.findContentById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Content not found.' });
        }
        if (item.uploaded_by !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only delete your own content.' });
        }

        await db.deleteContent(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Content deleted.',
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/assignments
 * Body: { subjectId, title, description, dueDate, maxMarks, allowedFileTypes }
 */
const createAssignment = async (req, res, next) => {
    try {
        const { subjectId, title, description, dueDate, maxMarks, allowedFileTypes } = req.body;

        const { valid, errors } = validateAssignment({ title, subjectId, dueDate, maxMarks });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const assignment = await db.createAssignment({
            subjectId,
            title,
            description,
            dueDate,
            maxMarks,
            allowedFileTypes,
            createdBy: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: 'Assignment created.',
            data: assignment,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/assignments/:subjectId
 */
const getAssignments = async (req, res, next) => {
    try {
        const assignments = await db.findAssignmentsBySubject(req.params.subjectId);
        return res.status(200).json({ success: true, data: assignments });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/assignments/:id/submissions
 */
const getSubmissions = async (req, res, next) => {
    try {
        const assignment = await db.findAssignmentById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        const submissions = await db.findSubmissionsByAssignment(req.params.id);

        return res.status(200).json({
            success: true,
            data: {
                assignment,
                submissions,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/staff/assignments/:submissionId/grade
 * Body: { marksObtained, feedback }
 */
const gradeSubmission = async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const { marksObtained, feedback } = req.body;

        const { valid, errors } = validateGrading({ marksObtained, feedback });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const submission = await db.findSubmissionById(submissionId);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found.' });
        }

        const graded = await db.gradeSubmission(submissionId, {
            marksObtained,
            feedback,
            gradedBy: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: 'Submission graded.',
            data: graded,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/assessments
 * Body: { subjectId, name, maxMarks, assessmentType, conductedDate }
 */
const createAssessment = async (req, res, next) => {
    try {
        const { subjectId, name, maxMarks, assessmentType, conductedDate } = req.body;

        const { valid, errors } = validateAssessment({ subjectId, name, maxMarks, assessmentType });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const assessment = await db.createAssessment({
            subjectId,
            name,
            maxMarks,
            assessmentType,
            conductedDate,
            createdBy: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: 'Assessment created.',
            data: assessment,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/assessments/:subjectId
 */
const getAssessments = async (req, res, next) => {
    try {
        const assessments = await db.findAssessmentsBySubject(req.params.subjectId);
        return res.status(200).json({ success: true, data: assessments });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/marks
 * Body: { assessmentId, marks: [{ studentId, marksObtained }] }
 */
const enterMarks = async (req, res, next) => {
    try {
        const { assessmentId, marks } = req.body;

        if (!assessmentId) {
            return res.status(400).json({ success: false, message: 'Assessment ID is required.' });
        }

        const { valid, errors } = validateAssessmentMarks({ marks });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const assessment = await db.findAssessmentById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found.' });
        }

        const results = await db.upsertAssessmentMarks(assessmentId, marks, req.user.id);

        return res.status(200).json({
            success: true,
            message: `Marks entered for ${results.length} student(s).`,
            data: results,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/staff/marks/:assessmentId/publish
 */
const publishMarks = async (req, res, next) => {
    try {
        const { assessmentId } = req.params;

        const assessment = await db.findAssessmentById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found.' });
        }

        const published = await db.publishAssessmentMarks(assessmentId);

        return res.status(200).json({
            success: true,
            message: `Marks published for ${published.length} student(s).`,
            data: published,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/announcements
 * Body: { title, body, targetAudience, subjectId, isPinned, sendEmail }
 */
const createAnnouncement = async (req, res, next) => {
    try {
        const { title, body, targetAudience, subjectId, isPinned, sendEmail } = req.body;

        const { valid, errors } = validateAnnouncement({ title, body, targetAudience });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const user = await db.findUserById(req.user.id);

        const announcement = await db.createAnnouncement({
            title,
            body,
            targetAudience,
            postedBy: req.user.id,
            subjectId: subjectId || null,
            departmentId: user.department_id,
            isPinned: isPinned || false,
            sendEmail: sendEmail || false,
        });

        return res.status(201).json({
            success: true,
            message: 'Announcement posted.',
            data: announcement,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/staff/leave
 * Body: { leaveType, startDate, endDate, reason, documentUrl }
 */
const submitLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason, documentUrl } = req.body;

        const { valid, errors } = validateLeaveRequest({ leaveType, startDate, endDate, reason });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const leave = await db.createLeaveRequest({
            staffId: req.user.id,
            leaveType,
            startDate,
            endDate,
            reason,
            documentUrl,
        });

        return res.status(201).json({
            success: true,
            message: 'Leave request submitted.',
            data: leave,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/leave
 */
const getMyLeaves = async (req, res, next) => {
    try {
        const leaves = await db.findLeavesByStaff(req.user.id);
        return res.status(200).json({ success: true, data: leaves });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/staff/announcements
 * Get announcements visible to/created by this staff member
 */
const getAnnouncements = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        const announcements = await db.findAnnouncements({
            departmentId: user.department_id,
            role: 'staff',
        });
        return res.status(200).json({ success: true, data: announcements });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/staff/announcements/:id
 */
const deleteAnnouncement = async (req, res, next) => {
    try {
        const ann = await db.findAnnouncementById(req.params.id);
        if (!ann) {
            return res.status(404).json({ success: false, message: 'Announcement not found.' });
        }
        if (ann.posted_by !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the creator can delete.' });
        }
        await db.deleteAnnouncement(req.params.id);
        return res.status(200).json({ success: true, message: 'Announcement deleted.' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboard,
    getSubjects,
    getSubjectStudents,
    createAttendance,
    getAttendanceBySubject,
    updateAttendanceSession,
    uploadContent,
    getContent,
    deleteContent,
    createAssignment,
    getAssignments,
    getSubmissions,
    gradeSubmission,
    createAssessment,
    getAssessments,
    enterMarks,
    publishMarks,
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement,
    submitLeave,
    getMyLeaves,
};


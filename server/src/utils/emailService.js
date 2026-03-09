/**
 * Email Service — sends emails via nodemailer (SMTP).
 * Reads config from .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Fails gracefully — logs errors but never crashes the app.
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        console.warn('⚠️  Email service: SMTP not configured. Emails will be skipped.');
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });

    return transporter;
}

/**
 * Send "material released" notification email to a student.
 *
 * @param {string} studentEmail
 * @param {string} studentName
 * @param {string} facultyName
 * @param {string} topicName
 * @param {string} subjectName
 * @param {number} materialCount
 * @param {string} loginUrl
 */
async function sendMaterialReleasedEmail(
    studentEmail,
    studentName,
    facultyName,
    topicName,
    subjectName,
    materialCount,
    loginUrl
) {
    const transport = getTransporter();
    if (!transport) return; // SMTP not configured — silently skip

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto; padding:20px;">
      <div style="background: linear-gradient(135deg, #007AFF, #5856D6); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">📚 New Study Material Available</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 16px 16px; padding: 24px;">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p><strong>${facultyName}</strong> has completed the topic <strong>"${topicName}"</strong> and released <strong>${materialCount}</strong> study material(s) for <strong>${subjectName}</strong>.</p>
        <p>Login to the LMS to view and download the materials.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #007AFF; color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Open LMS
          </a>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">This is an automated notification from the College LMS.</p>
      </div>
    </body>
    </html>`;

    const textBody = `Dear ${studentName},\n\n${facultyName} has completed the topic "${topicName}" and released ${materialCount} study material(s) for ${subjectName}.\n\nLogin to view: ${loginUrl}\n\n— College LMS`;

    try {
        await transport.sendMail({
            from: `"College LMS" <${from}>`,
            to: studentEmail,
            subject: `New Study Material Available — ${topicName}`,
            text: textBody,
            html: htmlBody,
        });
        console.log(`📧 Email sent to ${studentEmail}`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${studentEmail}:`, error.message);
        // Do NOT throw — we never crash the app for email failures
    }
}

module.exports = { sendMaterialReleasedEmail };

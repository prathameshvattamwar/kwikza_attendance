const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Create or return the nodemailer transporter singleton
 * @returns {import('nodemailer').Transporter}
 */
const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an OTP email
 * @param {string} to - Recipient email
 * @param {string} otp - The OTP code
 * @param {string} purpose - e.g., 'email_verification', 'password_reset'
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (to, otp, purpose) => {
  const transport = createTransporter();

  const purposeText = purpose === 'password_reset'
    ? 'reset your password'
    : 'verify your email';

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Attendance System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: `Your OTP Code - ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verification Code</h2>
        <p>Use the following OTP to ${purposeText}:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
        </div>
        <p style="color: #666;">This code is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #666;">If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Attendance Management System</p>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`OTP email sent to ${to} (purpose: ${purpose})`);
  } catch (error) {
    logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send a welcome email with temporary password for a new employee
 * @param {string} to - Recipient email
 * @param {string} name - Employee's first name
 * @param {string} tempPassword - Temporary password
 * @returns {Promise<void>}
 */
const sendWelcomeEmail = async (to, name, tempPassword) => {
  const transport = createTransporter();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Attendance System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: 'Welcome to the Attendance Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome, ${name}!</h2>
        <p>Your account has been created in the Attendance Management System.</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Attendance Management System</p>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send leave application confirmation to employee
 * @param {string} to - Employee email
 * @param {string} name - Employee name
 * @param {object} leave - { leave_type, start_date, end_date, total_days }
 */
const sendLeaveAppliedEmail = async (to, name, leave) => {
  const transport = createTransporter();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Attendance System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: 'Leave Request Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Leave Request Submitted</h2>
        <p>Hi ${name},</p>
        <p>Your leave request has been submitted successfully and is pending approval.</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Type:</strong> ${leave.leave_type || 'N/A'}</p>
          <p><strong>From:</strong> ${leave.start_date}</p>
          <p><strong>To:</strong> ${leave.end_date}</p>
          <p><strong>Total Days:</strong> ${leave.total_days}</p>
        </div>
        <p style="color: #666;">You will be notified once your request is reviewed.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Attendance Management System</p>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`Leave applied email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send leave applied email to ${to}: ${error.message}`);
  }
};

/**
 * Send leave approval/rejection notification to employee
 * @param {string} to - Employee email
 * @param {string} name - Employee name
 * @param {string} status - 'approved' or 'rejected'
 * @param {object} leave - { leave_type, start_date, end_date, total_days }
 * @param {string} [remarks] - Review remarks (for rejections)
 */
const sendLeaveStatusEmail = async (to, name, status, leave, remarks) => {
  const transport = createTransporter();

  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#27ae60' : '#e74c3c';
  const statusText = isApproved ? 'Approved' : 'Rejected';

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Attendance System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: `Leave Request ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Leave Request ${statusText}</h2>
        <p>Hi ${name},</p>
        <p>Your leave request has been <span style="color: ${statusColor}; font-weight: bold;">${statusText.toLowerCase()}</span>.</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Type:</strong> ${leave.leave_type || 'N/A'}</p>
          <p><strong>From:</strong> ${leave.start_date}</p>
          <p><strong>To:</strong> ${leave.end_date}</p>
          <p><strong>Total Days:</strong> ${leave.total_days}</p>
          ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Attendance Management System</p>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`Leave ${status} email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send leave ${status} email to ${to}: ${error.message}`);
  }
};

module.exports = {
  createTransporter,
  sendOtpEmail,
  sendWelcomeEmail,
  sendLeaveAppliedEmail,
  sendLeaveStatusEmail,
};

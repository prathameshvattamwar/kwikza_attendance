const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const TABLE = 'otp_verifications';

/**
 * Generate a 6-digit random OTP
 * @returns {string}
 */
const generateOtp = () => {
  // Generate a cryptographically secure random number between 100000 and 999999
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
};

/**
 * Create and store a new OTP for a user
 * @param {string} userId - UUID
 * @param {string} email
 * @param {string} purpose - e.g., 'email_verification', 'password_reset'
 * @returns {Promise<string>} The plain-text OTP (to send via email)
 */
const createOtp = async (userId, email, purpose) => {
  // Invalidate any existing unused OTPs for this email + purpose
  await db(TABLE)
    .where('email', email.toLowerCase())
    .andWhere('purpose', purpose)
    .andWhere('is_used', false)
    .update({ is_used: true });

  // Generate and hash the OTP
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // Store in database
  await db(TABLE).insert({
    user_id: userId,
    email: email.toLowerCase(),
    otp_hash: otpHash,
    purpose,
    expires_at: expiresAt,
    attempts: 0,
    is_used: false,
  });

  logger.info(`OTP created for ${email} (purpose: ${purpose})`);

  return otp;
};

/**
 * Verify an OTP
 * @param {string} email
 * @param {string} otp - Plain-text OTP from user
 * @param {string} purpose
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const verifyOtp = async (email, otp, purpose) => {
  // Find the latest unused OTP for this email + purpose
  const otpRecord = await db(TABLE)
    .where('email', email.toLowerCase())
    .andWhere('purpose', purpose)
    .andWhere('is_used', false)
    .orderBy('created_at', 'desc')
    .first();

  if (!otpRecord) {
    return { success: false, message: 'No OTP found. Please request a new one.' };
  }

  // Check if expired
  if (new Date() > new Date(otpRecord.expires_at)) {
    await db(TABLE).where('id', otpRecord.id).update({ is_used: true });
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Check max attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await db(TABLE).where('id', otpRecord.id).update({ is_used: true });
    return { success: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  // Increment attempt count
  await db(TABLE)
    .where('id', otpRecord.id)
    .update({ attempts: otpRecord.attempts + 1 });

  // Verify OTP with bcrypt
  const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
  if (!isValid) {
    const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
    return {
      success: false,
      message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
    };
  }

  // Mark as used
  await db(TABLE)
    .where('id', otpRecord.id)
    .update({ is_used: true });

  logger.info(`OTP verified for ${email} (purpose: ${purpose})`);

  return { success: true, message: 'OTP verified successfully.' };
};

module.exports = {
  generateOtp,
  createOtp,
  verifyOtp,
};

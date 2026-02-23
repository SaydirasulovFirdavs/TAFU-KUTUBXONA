import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 12;

// Fallback secrets for production if env vars are not set
const JWT_SECRET = process.env.JWT_SECRET || 'web-kutubxona-jwt-secret-2026-production-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'web-kutubxona-refresh-secret-2026-production-key';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Generate random token for email verification or password reset
 */
export const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate secure random password
 */
export const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const randomValues = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }

    return password;
};

export default {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateRandomToken,
    generateRandomPassword
};

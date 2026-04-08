import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { hasuraQuery, hasuraMutation } from '@/lib/hasura';
import { getEmailService } from '@/lib/email/emailService';
import {
  CREATE_PASSWORD_RESET_TOKEN,
  UPDATE_PASSWORD_RESET_TOKEN,
  DELETE_PASSWORD_RESET_TOKEN,
  DELETE_EXPIRED_TOKENS,
  UPDATE_USER_PASSWORD,
} from '@/lib/graphql/mutations';
import {
  GET_PASSWORD_RESET_TOKEN,
  GET_OTP_CODE,
  GET_RECENT_OTP_ATTEMPTS,
  GET_USER_BY_EMAIL,
} from '@/lib/graphql/queries';

export interface PasswordResetToken {
  id: string;
  email: string;
  token?: string;
  otp_code?: string;
  type: 'otp' | 'reset';
  expires_at: string;
  attempts: number;
  created_at: string;
  used_at?: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  profile: {
    name: string;
    department?: string;
    phone?: string;
  };
}

export class PasswordResetService {
  // Rate limiting: max 3 OTP requests per email per hour
  private static readonly MAX_OTP_ATTEMPTS_PER_HOUR = 3;
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly RESET_TOKEN_EXPIRY_MINUTES = 30;
  private static readonly MAX_VERIFICATION_ATTEMPTS = 3;

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateTokenId(): string {
    return crypto.randomUUID();
  }

  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await hasuraMutation(DELETE_EXPIRED_TOKENS, { now });
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }

  static async checkRateLimit(email: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const result = await hasuraQuery<{ password_reset_tokens: PasswordResetToken[] }>(
        GET_RECENT_OTP_ATTEMPTS,
        { email, since: oneHourAgo }
      );

      return result.password_reset_tokens.length < this.MAX_OTP_ATTEMPTS_PER_HOUR;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await hasuraQuery<{ users: User[] }>(
        GET_USER_BY_EMAIL,
        { email: email.toLowerCase() }
      );

      return result.users[0] || null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  static async sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Cleanup expired tokens first
      await this.cleanupExpiredTokens();

      // Check rate limiting
      if (!(await this.checkRateLimit(email))) {
        return {
          success: false,
          error: 'Too many OTP requests. Please try again later.',
        };
      }

      // Check if user exists
      const user = await this.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'No account found with this email address.',
        };
      }

      // Generate OTP
      const otpCode = this.generateOTP();
      const tokenId = this.generateTokenId();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // Store OTP in database
      await hasuraMutation(CREATE_PASSWORD_RESET_TOKEN, {
        id: tokenId,
        email: email.toLowerCase(),
        otp_code: otpCode,
        type: 'otp',
        expires_at: expiresAt,
        attempts: 0,
      });

      // Send OTP email
      const emailService = getEmailService();
      const emailResult = await emailService.sendOTPEmail({
        to: email,
        otp: otpCode,
        expiryMinutes: this.OTP_EXPIRY_MINUTES,
      });

      if (!emailResult.success) {
        // Delete the token if email failed
        await hasuraMutation(DELETE_PASSWORD_RESET_TOKEN, { id: tokenId });
        return {
          success: false,
          error: 'Failed to send OTP email. Please try again.',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.',
      };
    }
  }

  static async verifyOTP(email: string, otpCode: string): Promise<{
    success: boolean;
    resetToken?: string;
    error?: string;
  }> {
    try {
      // Get OTP record
      const result = await hasuraQuery<{ password_reset_tokens: PasswordResetToken[] }>(
        GET_OTP_CODE,
        { email: email.toLowerCase(), otp_code: otpCode }
      );

      const otpRecord = result.password_reset_tokens[0];
      if (!otpRecord) {
        return {
          success: false,
          error: 'Invalid or expired OTP code.',
        };
      }

      // Check attempts
      if (otpRecord.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
        return {
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.',
        };
      }

      // OTP is valid, create reset token
      const resetToken = this.generateResetToken();
      const resetTokenId = this.generateTokenId();
      const resetExpiresAt = new Date(Date.now() + this.RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // Create reset token
      await hasuraMutation(CREATE_PASSWORD_RESET_TOKEN, {
        id: resetTokenId,
        email: email.toLowerCase(),
        token: resetToken,
        type: 'reset',
        expires_at: resetExpiresAt,
        attempts: 0,
      });

      // Mark OTP as used
      await hasuraMutation(UPDATE_PASSWORD_RESET_TOKEN, {
        id: otpRecord.id,
        used_at: new Date().toISOString(),
      });

      return {
        success: true,
        resetToken,
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate reset token
      const result = await hasuraQuery<{ password_reset_tokens: PasswordResetToken[] }>(
        GET_PASSWORD_RESET_TOKEN,
        { token, type: 'reset' }
      );

      const resetRecord = result.password_reset_tokens[0];
      if (!resetRecord) {
        return {
          success: false,
          error: 'Invalid or expired reset token.',
        };
      }

      // Get user
      const user = await this.getUserByEmail(resetRecord.email);
      if (!user) {
        return {
          success: false,
          error: 'User not found.',
        };
      }

      // Hash new password
      const passwordHash = await bcryptjs.hash(newPassword, 12);

      // Update user password
      await hasuraMutation(UPDATE_USER_PASSWORD, {
        id: user.id,
        passwordHash,
      });

      // Mark reset token as used
      await hasuraMutation(UPDATE_PASSWORD_RESET_TOKEN, {
        id: resetRecord.id,
        used_at: new Date().toISOString(),
      });

      // TODO: Invalidate all existing sessions for the user
      // This would require integration with NextAuth session management

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Failed to reset password. Please try again.',
      };
    }
  }

  static async incrementOTPAttempts(email: string, otpCode: string): Promise<void> {
    try {
      const result = await hasuraQuery<{ password_reset_tokens: PasswordResetToken[] }>(
        GET_OTP_CODE,
        { email: email.toLowerCase(), otp_code: otpCode }
      );

      const otpRecord = result.password_reset_tokens[0];
      if (otpRecord) {
        await hasuraMutation(UPDATE_PASSWORD_RESET_TOKEN, {
          id: otpRecord.id,
          attempts: otpRecord.attempts + 1,
        });
      }
    } catch (error) {
      console.error('Failed to increment OTP attempts:', error);
    }
  }

  static async createResetTokenForNewUser(email: string): Promise<string | null> {
    try {
      const resetToken = this.generateResetToken();
      const resetTokenId = this.generateTokenId();
      const resetExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days for new users

      await hasuraMutation(CREATE_PASSWORD_RESET_TOKEN, {
        id: resetTokenId,
        email: email.toLowerCase(),
        token: resetToken,
        type: 'reset',
        expires_at: resetExpiresAt,
        attempts: 0,
      });

      return resetToken;
    } catch (error) {
      console.error('Failed to create reset token for new user:', error);
      return null;
    }
  }
}
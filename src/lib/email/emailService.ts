import { createEmailProvider, type EmailProvider, type EmailResult } from './providers';
import { PasswordResetService } from '@/lib/auth/passwordReset';
import {
  generateCredentialsEmailHTML,
  generateCredentialsEmailText,
  getCredentialsEmailSubject,
  generateOTPEmailHTML,
  generateOTPEmailText,
  getOTPEmailSubject,
  type CredentialsData,
  type OTPData,
} from './templates';

export interface SendCredentialsOptions {
  to: string;
  credentials: {
    id: string;
    password: string;
  };
  userInfo: {
    name: string;
    email: string;
  };
  userType: 'mentor' | 'intern';
  includeResetLink?: boolean;
}

export interface SendOTPOptions {
  to: string;
  otp: string;
  expiryMinutes: number;
}

export class EmailService {
  private provider: EmailProvider;
  private baseUrl: string;

  constructor() {
    this.provider = createEmailProvider();
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  async sendCredentialsEmail(options: SendCredentialsOptions): Promise<EmailResult> {
    try {
      let resetPasswordUrl: string | undefined;

      // Generate reset password link if requested
      if (options.includeResetLink) {
        const resetToken = await PasswordResetService.createResetTokenForNewUser(options.userInfo.email);
        if (resetToken) {
          resetPasswordUrl = `${this.baseUrl}/auth/reset-password?token=${resetToken}`;
        }
      }

      const templateData: CredentialsData = {
        name: options.userInfo.name,
        email: options.userInfo.email,
        loginId: options.credentials.id,
        password: options.credentials.password,
        userType: options.userType,
        loginUrl: `${this.baseUrl}/auth/login`,
        resetPasswordUrl,
      };

      const subject = getCredentialsEmailSubject(options.userType);
      const html = generateCredentialsEmailHTML(templateData);
      const text = generateCredentialsEmailText(templateData);

      console.log(`Sending ${options.userType} credentials email to:`, options.to, options.includeResetLink ? '(with reset link)' : '');

      const result = await this.provider.send({
        to: options.to,
        subject,
        html,
        text,
      });

      if (result.success) {
        console.log(`Credentials email sent successfully to ${options.to}, messageId:`, result.messageId);
      } else {
        console.error(`Failed to send credentials email to ${options.to}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Error in sendCredentialsEmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while sending email',
      };
    }
  }

  async sendOTPEmail(options: SendOTPOptions): Promise<EmailResult> {
    try {
      const templateData: OTPData = {
        otp: options.otp,
        expiryMinutes: options.expiryMinutes,
      };

      const subject = getOTPEmailSubject();
      const html = generateOTPEmailHTML(templateData);
      const text = generateOTPEmailText(templateData);

      console.log(`Sending OTP email to:`, options.to);

      const result = await this.provider.send({
        to: options.to,
        subject,
        html,
        text,
      });

      if (result.success) {
        console.log(`OTP email sent successfully to ${options.to}, messageId:`, result.messageId);
      } else {
        console.error(`Failed to send OTP email to ${options.to}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Error in sendOTPEmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while sending OTP email',
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (this.provider instanceof (await import('./providers')).NodemailerProvider) {
        return await (this.provider as { verify: () => Promise<boolean> }).verify();
      }
      return true; // For other providers, assume they're configured correctly
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  async sendReminderEmail(to: string, name: string): Promise<EmailResult> {
    try {
      const subject = "📝 Reminder: Internship Daily Report Missing";
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #6366f1;">Hi ${name},</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            We noticed that your daily report for <strong>${new Date().toLocaleDateString()}</strong> hasn't been submitted yet.
          </p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Regular reporting is a key part of our internship program. Please take a few moments to log your activities.
          </p>
          <div style="margin-top: 30px;">
            <a href="${this.baseUrl}/dashboard/intern/submit-report" 
               style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Submit Report Now
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #f1f5f9;" />
          <p style="font-size: 12px; color: #94a3b8;">
            Sent by InternHub Automated Reminder System.
          </p>
        </div>
      `;
      const text = `Hi ${name},\n\nWe noticed that your daily report for ${new Date().toLocaleDateString()} hasn't been submitted yet.\n\nPlease log in to InternHub and submit it: ${this.baseUrl}/dashboard/intern/submit-report`;

      return await this.provider.send({ to, subject, html, text });
    } catch (error) {
      console.error('Error in sendReminderEmail:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTaskNotification(to: string, name: string, taskTitle: string, deadline: string, priority: string): Promise<EmailResult> {
    try {
      const subject = `🚀 New Task Assigned: ${taskTitle}`;
      const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); width: 60px; height: 60px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 30px; font-weight: bold; line-height: 60px;">IM</div>
          </div>
          <h2 style="color: #1e293b; margin-top: 0;">New Directive Received</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Hello <strong>${name}</strong>, a new technical directive has been published and assigned to your queue.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #6366f1; font-size: 18px;">${taskTitle}</h3>
            <div style="display: flex; gap: 20px; margin-top: 15px;">
              <div style="flex: 1;">
                <p style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Deadline</p>
                <p style="font-size: 14px; font-weight: bold; color: #334155; margin: 0;">📅 ${deadline}</p>
              </div>
              <div style="flex: 1;">
                <p style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Priority</p>
                <p style="font-size: 14px; font-weight: bold; color: ${priorityColor}; margin: 0; text-transform: capitalize;">● ${priority}</p>
              </div>
            </div>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Please review the full specifications in your dashboard to begin execution.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.baseUrl}/dashboard/intern/tasks" 
               style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">
               View Full Specifications
            </a>
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Sent by Intern Management System Automated Portal</p>
          </div>
        </div>
      `;
      const text = `Hi ${name},\n\nA new task has been assigned to you: "${taskTitle}"\nDeadline: ${deadline}\nPriority: ${priority}\n\nView it here: ${this.baseUrl}/dashboard/intern/tasks`;

      return await this.provider.send({ to, subject, html, text });
    } catch (error) {
      console.error('Error in sendTaskNotification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendFeedbackNotification(to: string, name: string, reportDate: string, mentorName: string): Promise<EmailResult> {
    try {
      const subject = `💬 New Evaluation Feedback for ${reportDate}`;
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
             <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 60px; height: 60px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 30px; font-weight: bold; line-height: 60px;">IM</div>
          </div>
          <h2 style="color: #1e293b; margin-top: 0;">Feedback Published</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Hello <strong>${name}</strong>, your mentor <strong>${mentorName}</strong> has provided an evaluation for your report dated <strong>${reportDate}</strong>.
          </p>
          <div style="background-color: #f0fdf4; border: 1px solid #d1fae5; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="font-size: 14px; color: #065f46; margin: 0;">Evaluation comments are now available for review.</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.baseUrl}/dashboard/intern/reports" 
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">
               Review Feedback
            </a>
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Sent by Intern Management System Evaluation Portal</p>
          </div>
        </div>
      `;
      const text = `Hi ${name},\n\nYour mentor ${mentorName} has provided feedback on your report from ${reportDate}.\n\nReview it here: ${this.baseUrl}/dashboard/intern/reports`;

      return await this.provider.send({ to, subject, html, text });
    } catch (error) {
      console.error('Error in sendFeedbackNotification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendTestEmail(to: string): Promise<EmailResult> {
    try {
      const subject = "🔧 InternHub System Test";
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; text-align: center;">
          <div style="background-color: #6366f1; width: 64px; height: 64px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-bottom: 24px; line-height: 64px;">IH</div>
          <h2 style="color: #1e293b; margin-top: 0;">System Verification Success</h2>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            This is a verification email from the InternHub platform. Your SMTP configuration is active and functioning correctly.
          </p>
          <div style="margin: 32px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #6366f1; text-align: left;">
            <p style="font-size: 14px; color: #64748b; margin: 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="font-size: 14px; color: #64748b; margin: 8px 0 0 0;"><strong>Status:</strong> Operational</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">
            You can safely ignore this email. It was triggered by an administrative test.
          </p>
        </div>
      `;
      const text = `InternHub System Test\n\nYour SMTP configuration is functioning correctly.\nTimestamp: ${new Date().toISOString()}`;

      return await this.provider.send({ to, subject, html, text });
    } catch (error) {
      console.error('Error in sendTestEmail:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

// Convenience function for sending credentials
export async function sendCredentialsEmail(options: SendCredentialsOptions): Promise<EmailResult> {
  const emailService = getEmailService();
  return await emailService.sendCredentialsEmail(options);
}
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NodemailerProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('Missing required SMTP configuration. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }
}

export class SendGridProvider implements EmailProvider {
  async send(_options: EmailOptions): Promise<EmailResult> {
    void _options;
    // Placeholder for SendGrid implementation
    // Could be implemented in the future if needed
    throw new Error('SendGrid provider not implemented yet');
  }
}

export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'nodemailer';

  switch (provider) {
    case 'nodemailer':
      return new NodemailerProvider();
    case 'sendgrid':
      return new SendGridProvider();
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

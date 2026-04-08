export interface CredentialsData {
  name: string;
  email: string;
  loginId: string;
  password: string;
  userType: 'mentor' | 'intern';
  loginUrl: string;
  resetPasswordUrl?: string;
}

export function generateCredentialsEmailHTML(data: CredentialsData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Intern Management System Credentials</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .credentials-box {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .credential-label {
            font-weight: bold;
            color: #4a5568;
            min-width: 80px;
        }
        .credential-value {
            font-family: monospace;
            background: #edf2f7;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #cbd5e0;
            flex: 1;
            margin-left: 15px;
        }
        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s ease;
        }
        .login-button:hover {
            transform: translateY(-2px);
        }
        .security-note {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .security-note strong {
            color: #dc2626;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .welcome-text {
            font-size: 16px;
            color: #2d3748;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Intern Management System</h1>
        </div>

        <div class="welcome-text">
            Hello <strong>${data.name}</strong>,
        </div>

        <p>Your ${data.userType} account has been created successfully! Below are your login credentials for the Intern Management System:</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0; color: #2d3748;">Your Login Credentials</h3>

            <div class="credential-item">
                <span class="credential-label">Name:</span>
                <span class="credential-value">${data.name}</span>
            </div>

            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${data.email}</span>
            </div>

            <div class="credential-item">
                <span class="credential-label">Login ID:</span>
                <span class="credential-value">${data.loginId}</span>
            </div>

            <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${data.password}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${data.loginUrl}" class="login-button">
                Login to Your Account
            </a>
        </div>

        ${data.resetPasswordUrl ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #2d3748; font-size: 18px;">Prefer to Set Your Own Password?</h3>
            <p style="color: #4a5568; margin-bottom: 15px;">
                You can use the temporary password above, or click the button below to create your own secure password.
            </p>
            <a href="${data.resetPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
                Set Custom Password
            </a>
        </div>
        ` : ''}

        <div class="security-note">
            <strong>Important Security Information:</strong>
            <ul style="margin: 10px 0 0 20px;">
                <li>Please change your password after your first login</li>
                <li>Do not share your credentials with anyone</li>
                <li>Contact your administrator if you have any issues accessing your account</li>
            </ul>
        </div>

        <p>If you have any questions or need assistance, please don't hesitate to contact your administrator.</p>

        <div class="footer">
            <p>This is an automated message from the Intern Management System.<br>
            Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export function generateCredentialsEmailText(data: CredentialsData): string {
  return `
Welcome to Intern Management System

Hello ${data.name},

Your ${data.userType} account has been created successfully! Below are your login credentials for the Intern Management System:

LOGIN CREDENTIALS
-----------------
Name: ${data.name}
Email: ${data.email}
Login ID: ${data.loginId}
Password: ${data.password}

Login URL: ${data.loginUrl}

${data.resetPasswordUrl ? `
PREFER TO SET YOUR OWN PASSWORD?
You can use the temporary password above, or visit the link below to create your own secure password:

Reset Password URL: ${data.resetPasswordUrl}
` : ''}

IMPORTANT SECURITY INFORMATION:
- Please change your password after your first login
- Do not share your credentials with anyone
- Contact your administrator if you have any issues accessing your account

If you have any questions or need assistance, please don't hesitate to contact your administrator.

---
This is an automated message from the Intern Management System.
Please do not reply to this email.
  `.trim();
}

export function getCredentialsEmailSubject(userType: 'mentor' | 'intern'): string {
  return `Your ${userType} account credentials - Intern Management System`;
}

export interface OTPData {
  otp: string;
  expiryMinutes: number;
}

export function generateOTPEmailHTML(data: OTPData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Password Reset Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .header h1 {
            color: #dc2626;
            margin: 0;
            font-size: 28px;
        }
        .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px;
            margin: 30px 0;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .otp-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .security-note {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .security-note strong {
            color: #dc2626;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .expiry-warning {
            background: #fbbf24;
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Code</h1>
        </div>

        <p>You requested to reset your password for the Intern Management System. Use the verification code below to continue:</p>

        <div class="otp-box">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${data.otp}</div>
        </div>

        <div class="expiry-warning">
            ⏰ This code expires in ${data.expiryMinutes} minutes
        </div>

        <div class="security-note">
            <strong>Security Information:</strong>
            <ul style="margin: 10px 0 0 20px;">
                <li>Do not share this code with anyone</li>
                <li>Our support team will never ask for this code</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>You have 3 attempts to enter the correct code</li>
            </ul>
        </div>

        <p>If you didn't request a password reset, please ignore this email. Your account remains secure.</p>

        <div class="footer">
            <p>This is an automated message from the Intern Management System.<br>
            Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export function generateOTPEmailText(data: OTPData): string {
  return `
Password Reset Code - Intern Management System

You requested to reset your password for the Intern Management System.

Your Verification Code: ${data.otp}

This code expires in ${data.expiryMinutes} minutes.

SECURITY INFORMATION:
- Do not share this code with anyone
- Our support team will never ask for this code
- If you didn't request this, please ignore this email
- You have 3 attempts to enter the correct code

If you didn't request a password reset, please ignore this email. Your account remains secure.

---
This is an automated message from the Intern Management System.
Please do not reply to this email.
  `.trim();
}

export function getOTPEmailSubject(): string {
  return 'Your Password Reset Code - Intern Management System';
}
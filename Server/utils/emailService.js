import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Replace placeholders in template
const replacePlaceholders = (text, replacements) => {
  let result = text;
  Object.keys(replacements).forEach((key) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), replacements[key] || '');
  });
  return result;
};

// Format date helper
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Send single email
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Event Management System'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails to multiple recipients
export const sendBulkEmails = async (recipients, subject, message, event) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  const transporter = createTransporter();

  for (const recipient of recipients) {
    try {
      // Replace placeholders with actual data
      const personalizedSubject = replacePlaceholders(subject, {
        participantName: recipient.name || 'Participant',
        eventName: event.title || event.name || '',
        eventDate: formatDate(event.startDate),
        venue: event.location || event.venue || '',
      });

      const personalizedMessage = replacePlaceholders(message, {
        participantName: recipient.name || 'Participant',
        eventName: event.title || event.name || '',
        eventDate: formatDate(event.startDate),
        venue: event.location || event.venue || '',
      });

      // Create HTML version
      const htmlMessage = personalizedMessage
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Event Management System'}" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject: personalizedSubject,
        text: personalizedMessage,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
              .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${event.title || event.name || 'Event Update'}</h1>
              </div>
              <div class="content">
                <p>Hello ${recipient.name || 'Participant'},</p>
                ${htmlMessage}
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    <strong>Event Details:</strong><br>
                    📅 ${formatDate(event.startDate)}<br>
                    📍 ${event.location || event.venue || 'TBA'}
                  </p>
                </div>
              </div>
              <div class="footer">
                <p>This email was sent by ${process.env.EMAIL_FROM_NAME || 'Event Management System'}</p>
                <p>© ${new Date().getFullYear()} All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      results.sent++;

      // Add small delay to avoid rate limiting (500 emails/day limit)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error.message);
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: error.message,
      });
    }
  }

  return results;
};

// Send certificate email with attachment
export const sendCertificateEmail = async (recipient, event, certificateUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Event Management System'}" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: `Your Certificate for ${event.title || event.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Certificate of Completion</h1>
            </div>
            <div class="content">
              <p>Dear ${recipient.name || 'Participant'},</p>
              <p>Congratulations on successfully completing <strong>${event.title || event.name}</strong>!</p>
              <p>Your certificate is attached to this email. You can also download it from the participant portal.</p>
              ${certificateUrl ? `<a href="${certificateUrl}" class="button">Download Certificate</a>` : ''}
              <p>Thank you for your participation. We hope to see you at our future events!</p>
              <p>Best regards,<br>The Organizing Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending certificate email:', error);
    return { success: false, error: error.message };
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  sendBulkEmails,
  sendCertificateEmail,
  testEmailConnection,
};

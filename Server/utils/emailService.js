import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if email is configured
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
};

// Create reusable transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email credentials not configured');
  }
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
    if (!isEmailConfigured()) {
      console.log('⚠️  Email not sent - service not configured');
      return { success: false, error: 'Email service not configured' };
    }
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
export const sendCertificateEmail = async (recipient, event, certificatePath, certificateUrl) => {
  try {
    const transporter = createTransporter();
    
    // Check if certificate URL exists (Cloudinary URL)
    if (!certificateUrl) {
      console.error('⚠️  No certificate URL provided for email');
      return { success: false, error: 'Certificate URL is required' };
    }
    
    console.log(`📧 Sending certificate email to ${recipient.email}`);
    console.log(`📎 Certificate URL: ${certificateUrl}`);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Event Management System'}" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: `🎓 Your Certificate for ${event.title || event.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .certificate-preview { text-align: center; margin: 20px 0; }
            .certificate-preview img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { background: #10b981; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: 600; }
            .button:hover { background: #059669; }
            .footer { text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px; }
            .info-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 15px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.95;">Your Certificate is Ready</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #374151;"><strong>Dear ${recipient.name || 'Participant'},</strong></p>
              
              <p style="font-size: 15px; color: #4b5563;">
                Congratulations on successfully completing <strong>${event.title || event.name}</strong>! 
                We are pleased to share your certificate of achievement.
              </p>
              
              <div class="certificate-preview">
                <img src="${certificateUrl}" alt="Certificate Preview" style="max-width: 500px;" />
              </div>
              
              <div style="text-align: center;">
                <a href="${certificateUrl}" class="button" target="_blank">📥 Download Certificate</a>
              </div>
              
              <div class="info-box">
                <p style="margin: 0; font-size: 14px; color: #065f46;">
                  <strong>💡 Tip:</strong> You can also access your certificate anytime from the participant portal.
                  Right-click the image above or use the download button to save your certificate.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
                Thank you for your participation. We hope to see you at our future events!
              </p>
              
              <p style="font-size: 14px; color: #374151; margin-top: 20px;">
                Best regards,<br>
                <strong>${process.env.EMAIL_FROM_NAME || 'The Organizing Team'}</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>If you have any questions, please contact the event organizers.</p>
            </div>
          </div>
        </body>
        </html>
      `
      // NOTE: Attachments removed - certificates are now stored on Cloudinary
      // Users can download directly from the URL provided in the email
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipient.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending certificate email:', error);
    return { success: false, error: error.message };
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    if (!isEmailConfigured()) {
      console.log('⚠️  Email service not configured (credentials missing)');
      console.log('   Email features will be disabled. Add EMAIL_USER and EMAIL_PASSWORD to .env to enable.');
      return { success: false, error: 'Email not configured', disabled: true };
    }
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  sendBulkEmails,
  sendCertificateEmail,
  testEmailConnection,
};

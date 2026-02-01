# Email Setup Instructions for AlphaByte Event Management

## 📧 Gmail SMTP Configuration Guide

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", click on **2-Step Verification**
4. Follow the prompts to enable 2-Step Verification

### Step 2: Generate App Password

1. After enabling 2-Step Verification, go back to **Security**
2. Under "How you sign in to Google", click on **App passwords**
3. You might need to sign in again
4. Under "Select app", choose **Mail**
5. Under "Select device", choose **Other (Custom name)**
6. Type: "AlphaByte Event Management"
7. Click **Generate**
8. Google will show you a 16-character password - **COPY THIS**

### Step 3: Update .env File

Open `Server/.env` and update these lines:

```env
EMAIL_USER=thalkarruturaj175@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
EMAIL_FROM_NAME=AlphaByte Events
```

**Important:** 
- Remove all spaces from the app password
- Keep it as one continuous string of 16 characters
- Do NOT use your regular Gmail password

### Step 4: Test the Configuration

1. Start your server:
   ```bash
   cd Server
   npm run dev
   ```

2. The server will automatically test the email configuration on startup
3. Look for this message in the console:
   - ✅ "Email server is ready to send messages" - Configuration successful
   - ❌ "Email configuration error" - Check your credentials

### Step 5: Test from Frontend

1. Start your client:
   ```bash
   cd Client
   npm run dev
   ```

2. Login as an organizer
3. Go to **Communication** page
4. You should see a green banner: "Email Service Configured"
5. If you see a red banner, click the settings icon to recheck

---

## 📝 How to Send Emails

### From Communication Page:

1. **Select Event**: Choose the event from dropdown
2. **Select Recipients**: 
   - All Participants
   - Registered Only
   - Attended Only
   - Certified participants, etc.
3. **Compose Email**:
   - Add Subject
   - Write Message
   - Use placeholders: {{participantName}}, {{eventName}}, {{eventDate}}, {{venue}}
4. **Send**: Click "Send Email" button

### Email Features:

✅ Automatic HTML formatting
✅ Professional email templates
✅ Personalized with participant names
✅ Event details included
✅ Beautiful responsive design
✅ Bulk sending (up to 500/day with Gmail)

---

## 🚨 Troubleshooting

### Error: "Invalid login credentials"
**Solution:** Make sure you're using an App Password, not your regular Gmail password

### Error: "Username and Password not accepted"
**Solution:** 
1. Double-check 2-Step Verification is enabled
2. Generate a new App Password
3. Make sure there are no spaces in the password

### Error: "Connection timeout"
**Solution:**
1. Check your internet connection
2. Make sure port 587 is not blocked by firewall
3. Try again after a few minutes

### Emails going to spam
**Solution:**
1. Ask recipients to mark as "Not Spam"
2. Consider upgrading to Brevo (300 emails/day free) for better deliverability
3. Avoid spam trigger words in subject/message

### Daily limit reached (500 emails)
**Solution:**
1. Wait 24 hours for limit to reset
2. Consider upgrading to:
   - **Brevo**: 300 emails/day free (forever)
   - **SendGrid**: 100 emails/day free, $19.95/month for 50,000
   - **AWS SES**: $0.10 per 1000 emails

---

## 📊 Email Limits

| Service | Free Tier | Cost | Recommended For |
|---------|-----------|------|-----------------|
| **Gmail** | 500/day | Free | Testing, Small events |
| **Brevo** | 300/day | Free forever | Student projects |
| **SendGrid** | 100/day | $19.95/month | Production |

---

## 🔒 Security Best Practices

1. ✅ **Never commit .env file** to Git (already in .gitignore)
2. ✅ **Use App Passwords** instead of regular passwords
3. ✅ **Rotate passwords** periodically
4. ✅ **Monitor email logs** in Communication History
5. ❌ **Don't share** your app password

---

## 📧 Email Templates Available

1. **Event Reminder**: Reminds participants about upcoming event
2. **Venue Update**: Notifies about venue/location changes
3. **Certificate Delivery**: Sends certificates to participants
4. **Thank You Note**: Post-event appreciation message

All templates support placeholders for personalization!

---

## 🎯 Next Steps

### For Development:
- Continue using Gmail SMTP (free, 500 emails/day)
- Perfect for testing and small events

### For Production:
Consider upgrading to:
- **Brevo** (best free tier - 300/day)
- **SendGrid** (professional - better deliverability)
- **AWS SES** (high volume - most cost-effective)

---

## 📞 Support

If you encounter issues:
1. Check server console for error messages
2. Verify .env configuration
3. Test email configuration from Communication page
4. Check Gmail's "Less secure app access" settings

---

**Created for AlphaByte Event Management System**
*Last Updated: February 1, 2026*

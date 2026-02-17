/**
 * Generate certificate template preview images
 * Usage: node scripts/generate-previews.js
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, '../templates/certificates');
const clientPreviewDir = path.join(__dirname, '../../Client/public/previews');
const serverPreviewDir = path.join(__dirname, '../public/previews');

const templates = ['default', 'professional', 'modern', 'minimal'];

// Sample data matching what certificates would actually display
const sampleData = {
  participantName: 'Priya Sharma',
  eventName: 'National AI Innovation Challenge 2026',
  eventDate: 'February 15, 2026',
  organizationName: "PCET's Pimpri Chinchwad College of Engineering",
  departmentName: 'Department of Computer Science & Engineering',
  associationText: 'In association with',
  competitionName: 'National AI Innovation Challenge 2026',
  achievement: 'PARTICIPATION',
  achievementDescription: 'has successfully participated in',
  organizerName: 'Team AiMSA',
  certificateTitle: 'CERTIFICATE OF PARTICIPATION',
  mainBodyText: `This is to certify that <span class="participant-name">Priya Sharma</span> has actively participated in the <span class="event-name">National AI Innovation Challenge 2026</span>, conducted on February 15, 2026.<br><br>The event was organized by the Department of Computer Science &amp; Engineering, PCET's Pimpri Chinchwad College of Engineering.<br><br>We appreciate the enthusiasm, commitment, and sincere effort demonstrated during the course of the event.`,
  signature1Name: 'Shruti Mahajik',
  signature1Title: 'Vice President',
  signature2Name: 'Tuturaj Pandharkar',
  signature2Title: 'President',
  signature3Name: 'Prof. Pallavi Nikumbh',
  signature3Title: 'AiMSA SDW Coordinator',
  signature4Name: 'Dr. Anuradha Thakare',
  signature4Title: 'HOD CSE[AIML]',
  verificationId: 'PREVIEW-SAMPLE',
  certificateId: 'CERT-2026-PREVIEW',
};

async function generatePreviews() {
  // Ensure output directories exist
  await fs.mkdir(clientPreviewDir, { recursive: true });
  await fs.mkdir(serverPreviewDir, { recursive: true });

  // Generate QR with tamper-proof verification text (same format as actual certificates)
  const qrText = [
    `CERTIFICATE VERIFICATION`,
    `========================`,
    `Name: Priya Sharma`,
    `Email: priya.sharma@example.com`,
    `Event: National AI Innovation Challenge 2026`,
    `Achievement: PARTICIPATION`,
    `Organizer: Team AiMSA`,
    `Issued: ${new Date().toISOString()}`,
    `Certificate ID: CERT-2026-PREVIEW`,
    `Verification ID: PREVIEW-SAMPLE`,
    `========================`,
    `Verify online: https://eventsync-protocol.vercel.app/verify/preview-sample`,
  ].join('\n');

  const qrCodeDataUri = await QRCode.toDataURL(qrText, {
    width: 280,
    margin: 1,
    color: { dark: '#1a202c', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  const dataWithQR = { ...sampleData, qrCodeDataUri };

  console.log('🚀 Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const templateName of templates) {
    console.log(`\n📄 Generating preview for: ${templateName}`);

    // Load template
    const templatePath = path.join(templatesDir, `${templateName}.html`);
    let html = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders
    for (const [key, value] of Object.entries(dataWithQR)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || '');
    }

    const page = await browser.newPage();
    await page.setViewport({
      width: 3508,
      height: 2480,
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const filename = `${templateName}_preview.jpg`;

    // Save to Client/public/previews/
    const clientPath = path.join(clientPreviewDir, filename);
    await page.screenshot({
      path: clientPath,
      type: 'jpeg',
      quality: 95,
      fullPage: false,
      clip: { x: 0, y: 0, width: 3508, height: 2480 },
    });
    console.log(`  ✅ Saved: Client/public/previews/${filename}`);

    // Also save to Server/public/previews/
    const serverPath = path.join(serverPreviewDir, filename);
    await fs.copyFile(clientPath, serverPath);
    console.log(`  ✅ Copied: Server/public/previews/${filename}`);

    await page.close();
  }

  await browser.close();
  console.log('\n🎉 All preview images regenerated successfully!');
}

generatePreviews().catch((err) => {
  console.error('❌ Error generating previews:', err);
  process.exit(1);
});

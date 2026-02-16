// Certificate generator - Puppeteer removed for Vercel compatibility
// For production, consider using an external PDF service or Cloudinary transformations
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Certificate Generator Service
 * Generates JPG certificate images from HTML templates using Puppeteer
 */
class CertificateGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates/certificates');
    this.outputDir = path.join(__dirname, '../public/certificates');
    this.ensureOutputDirectory();
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  /**
   * Load and populate HTML template
   */
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      console.log('\ud83d\udcc2 Loading template from:', templatePath);
      
      let html = await fs.readFile(templatePath, 'utf-8');
      console.log('\u2705 Template file read successfully, size:', html.length);

      // Replace all placeholders with actual data
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value || '');
      }
      console.log('\u2705 Placeholders replaced');

      return html;
    } catch (error) {
      console.error('\u274c Error loading template:', error.message);
      console.error('Template path attempted:', path.join(this.templatesDir, `${templateName}.html`));
      console.error('Stack:', error.stack);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Generate PDF certificate
   */
  async generateCertificate(certificateData) {
    const {
      template = 'default',
      participantName,
      eventName,
      eventDate,
      certificateId,
      organizationName = 'PCET\'s Pimpri Chinchwad College of Engineering',
      departmentName = 'Department of Computer Science & Engineering',
      associationText = 'In association with',
      competitionName = eventName,
      achievement = 'Participation',
      organizerName = 'Team AiMSA',
      signature1Name = 'Shruti Mahajik',
      signature1Title = 'Vice President',
      signature2Name = 'Tuturaj Pandharkar',
      signature2Title = 'President',
      signature3Name = 'Prof. Pallavi Nikumbh',
      signature3Title = 'AiMSA SDW Coordinator',
      signature4Name = 'Dr. Anuradha Thakare',
      signature4Title = 'HOD CSE[AIML]'
    } = certificateData;

    console.log('\ud83d\udcdd Certificate Generation Started:');
    console.log('  - Template:', template);
    console.log('  - Participant:', participantName);
    console.log('  - Event:', eventName);
    console.log('  - Certificate ID:', certificateId);

    try {
      // Prepare template data
      const templateData = {
        participantName,
        eventName,
        eventDate: this.formatDate(eventDate),
        organizationName,
        departmentName,
        associationText,
        competitionName,
        achievement,
        organizerName,
        signature1Name,
        signature1Title,
        signature2Name,
        signature2Title,
        signature3Name,
        signature3Title,
        signature4Name,
        signature4Title
      };

      console.log('\u2705 Template data prepared');

      // Load and populate template
      console.log('\ud83d\udcc4 Loading template:', template);
      const html = await this.loadTemplate(template, templateData);
      console.log('\u2705 Template loaded successfully');

      // Generate PDF using Puppeteer
      console.log('\ud83d\ude80 Launching Puppeteer...');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('\u2705 Browser launched');

      const page = await browser.newPage();
      
      // Set viewport for high-quality image (A4 landscape dimensions)
      await page.setViewport({
        width: 1754,  // A4 landscape width at 150 DPI
        height: 1240, // A4 landscape height at 150 DPI
        deviceScaleFactor: 2 // Retina display for better quality
      });
      
      console.log('\ud83d\udcc4 Setting content...');
      await page.setContent(html, { waitUntil: 'networkidle0' });
      console.log('\u2705 Content set');

      // Generate filename with .jpg extension
      const filename = `${certificateId}_${Date.now()}.jpg`;
      const filepath = path.join(this.outputDir, filename);
      console.log('\ud83d\udcbe Saving JPG to:', filepath);

      // Generate JPG Screenshot
      await page.screenshot({
        path: filepath,
        type: 'jpeg',
        quality: 95,
        fullPage: true
      });
      console.log('✅ JPG generated successfully');

      await browser.close();
      console.log('✅ Browser closed');

      // Upload to Cloudinary as image
      console.log('☁️ Uploading to Cloudinary...');
      const cloudinaryResult = await cloudinary.uploader.upload(filepath, {
        resource_type: 'image',
        folder: 'alphabyte/certificates',
        public_id: `cert_${certificateId}_${Date.now()}`,
        format: 'jpg',
        quality: 95
      });
      console.log('✅ Uploaded to Cloudinary:', cloudinaryResult.secure_url);

      // Delete local file after successful upload (optional)
      try {
        await fs.unlink(filepath);
        console.log('🗑️ Local file deleted');
      } catch (unlinkError) {
        console.log('⚠️ Could not delete local file:', unlinkError.message);
      }

      return {
        success: true,
        filename: filename,
        filepath: filepath,
        url: cloudinaryResult.secure_url,
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id
      };

    } catch (error) {
      console.error('❌ Certificate Generation Failed:');
      console.error('  Error:', error.message);
      console.error('  Stack:', error.stack);

      // Write error to a file so we can read it
      try {
        await fs.writeFile('certificate_error.log', `Error: ${error.message}\nStack: ${error.stack}\nTime: ${new Date().toISOString()}\n\n`);
      } catch (e) {
        console.error('Failed to write error log:', e);
      }

      throw error;
    }
  }

  /**
   * Generate certificates in batch
   */
  async generateBatch(certificatesData) {
    const results = [];
    for (const certData of certificatesData) {
      try {
        const result = await this.generateCertificate(certData);
        results.push({ ...certData, ...result, status: 'SUCCESS' });
      } catch (error) {
        results.push({
          ...certData,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Delete certificate file
   */
  async deleteCertificate(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      await fs.unlink(filepath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting certificate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format date helper
   */
  formatDate(date) {
    if (!date) return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Export singleton instance
const certificateGenerator = new CertificateGenerator();
export default certificateGenerator;

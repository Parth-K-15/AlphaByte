// Certificate generator - Puppeteer removed for Vercel compatibility
// For production, consider using an external PDF service or Cloudinary transformations
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Certificate Generator Service
 * Note: PDF generation temporarily disabled for Vercel deployment
 * Consider using external services like PDFShift, CloudConvert, or Cloudinary
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

      // TODO: PDF generation disabled for Vercel deployment
      // For production, integrate with external PDF service:
      // - PDFShift API (https://pdfshift.io/)
      // - CloudConvert API (https://cloudconvert.com/)
      // - Cloudinary Transformations
      // - Or deploy a separate PDF service
      
      console.warn('⚠️ PDF generation is disabled. Puppeteer removed for Vercel compatibility.');
      console.warn('📄 HTML certificate generated, but PDF conversion skipped.');
      
      // For now, return a mock certificate URL
      // In production, replace this with actual PDF service integration
      return {
        success: false,
        message: 'Certificate generation temporarily disabled. Please configure PDF service.',
        certificateUrl: null,
        cloudinaryUrl: null,
        html: html // Return HTML for debugging/alternative use
      };

    } catch (error) {
      console.error('❌ Certificate Generation Failed:');
      console.error('  Error:', error.message);
      console.error('  Stack:', error.stack);
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

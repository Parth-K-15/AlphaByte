import Tesseract from 'tesseract.js';

/**
 * OCR Service for Receipt Processing
 * Extracts text from receipt images and parses key information
 */

/**
 * Preprocess image to enhance OCR accuracy
 */
const preprocessImage = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Increase contrast (simple thresholding)
        const enhanced = gray > 128 ? 255 : gray < 80 ? 0 : gray;
        
        data[i] = enhanced;     // red
        data[i + 1] = enhanced; // green
        data[i + 2] = enhanced; // blue
      }
      
      // Put processed image back
      ctx.putImageData(imageData, 0, 0);
      
      // Return processed image as data URL
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
};

/**
 * Extract text from receipt image using OCR
 * @param {File|string} image - Image file or URL
 * @returns {Promise<Object>} - Extracted text and parsed data
 */
export const processReceipt = async (image) => {
  try {
    console.log('🔍 Starting OCR processing...');
    
    // Preprocess image for better OCR
    console.log('🖼️ Preprocessing image...');
    const processedImage = await preprocessImage(image);
    
    // Perform OCR with optimized settings for receipts
    const result = await Tesseract.recognize(
      processedImage,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    const extractedText = result.data.text;
    console.log('✅ OCR completed');
    console.log('📄 Raw extracted text:', extractedText);
    console.log('📄 Length:', extractedText.length, 'characters');
    
    // Parse the extracted text
    const parsedData = parseReceiptText(extractedText);
    
    // Calculate confidence based on what we extracted
    let confidence = Math.round(result.data.confidence);
    
    // Adjust confidence based on what was successfully extracted
    if (parsedData.amount) confidence = Math.min(confidence + 10, 100);
    if (parsedData.vendor) confidence = Math.min(confidence + 5, 100);
    if (parsedData.date) confidence = Math.min(confidence + 5, 100);
    
    return {
      success: true,
      rawText: extractedText,
      parsedData,
      confidence: Math.max(40, confidence) // Minimum 40% confidence
    };
  } catch (error) {
    console.error('❌ OCR processing failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to process receipt'
    };
  }
};

/**
 * Preprocess OCR text to fix common errors
 */
const preprocessOCRText = (text) => {
  let cleaned = text;
  
  // Fix common OCR mistakes
  cleaned = cleaned.replace(/[|]/g, 'I'); // Vertical bar to I
  cleaned = cleaned.replace(/[О]/g, '0'); // Cyrillic O to zero
  cleaned = cleaned.replace(/[l]/g, '1'); // lowercase L to 1 (in numbers context)
  
  return cleaned;
};

/**
 * Parse extracted text to find key information
 * @param {string} text - Raw extracted text from OCR
 * @returns {Object} - Parsed receipt data
 */
const parseReceiptText = (text) => {
  console.log('🔎 Parsing OCR text...');
  
  // Clean up common OCR errors
  text = preprocessOCRText(text);
  
  const lines = text.split('\n').filter(line => line.trim());
  
  const data = {
    amount: null,
    date: null,
    vendor: null,
    description: null,
    items: []
  };
  
  // ==================== AMOUNT EXTRACTION ====================
  console.log('💰 Searching for amount...');
  
  // Extract all numbers that look like money amounts
  const allNumbers = [];
  
  // Match any number (with optional commas, spaces, decimals)
  const numberPattern = /(\d+(?:[,\s]\d+)*(?:\.\d{1,2})?)/g;
  let match;
  
  while ((match = numberPattern.exec(text)) !== null) {
    const numStr = match[1].replace(/[\s,]/g, '');
    const num = parseFloat(numStr);
    
    // Get context around the number (20 chars before and after)
    const start = Math.max(0, match.index - 20);
    const end = Math.min(text.length, match.index + match[0].length + 30);
    const context = text.substring(start, end).toLowerCase();
    
    if (num >= 10 && num <= 1000000) { // Reasonable receipt range
      // Calculate relevance score
      let score = 0;
      
      // Check for money-related keywords near the number
      if (/total|amount|sum|bill|grand|net|payable|paid/i.test(context)) score += 100;
      if (/₹|rs\.?|inr|rupee/i.test(context)) score += 50;
      if (/only|\/\s*-/i.test(context)) score += 30;
      
      // Higher numbers are more likely to be totals
      score += Math.min(num / 100, 20);
      
      // Numbers at the end of text are more likely to be totals
      if (match.index > text.length * 0.6) score += 20;
      
      allNumbers.push({
        amount: num,
        score: score,
        context: context
      });
      
      console.log(`Found number: ₹${num} (score: ${score}) - context: "${context.trim()}"`);
    }
  }
  
  // Sort by score (highest first) and then by amount (highest first)
  allNumbers.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 10) {
      return b.amount - a.amount; // If scores similar, pick larger amount
    }
    return b.score - a.score;
  });
  
  // Pick the best candidate
  if (allNumbers.length > 0) {
    data.amount = allNumbers[0].amount;
    console.log(`✅ Selected amount: ₹${data.amount}`);
  } else {
    console.log('❌ No amount found');
  }
  
  // ==================== DATE EXTRACTION ====================
  console.log('📅 Searching for date...');
  
  const datePatterns = [
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/g,
    /(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4})/gi,
    /(?:date|dt|dated)[\s:]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/gi
  ];
  
  for (const pattern of datePatterns) {
    pattern.lastIndex = 0;
    const dateMatch = pattern.exec(text);
    if (dateMatch) {
      data.date = dateMatch[1];
      console.log(`✅ Found date: ${data.date}`);
      break;
    }
  }
  
  if (!data.date) {
    console.log('❌ No date found');
  }
  
  // ==================== VENDOR EXTRACTION ====================
  console.log('🏪 Searching for vendor...');
  
  // Strategy: First meaningful text is usually the business name
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    
    // Skip empty or very short lines
    if (line.length < 2) continue;
    
    // Skip if it's just numbers
    if (/^\d+$/.test(line)) continue;
    
    // Skip if it's a date
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(line)) continue;
    
    // Skip common non-vendor words
    if (/^(receipt|bill|invoice|tax|gst|total|amount|date|dt|time)$/i.test(line)) continue;
    
    // Skip lines that are just symbols
    if (!/[a-zA-Z]{2,}/.test(line)) continue;
    
    // This looks like a vendor name
    if (line.length >= 2 && line.length <= 60) {
      data.vendor = line.replace(/[^\w\s&.'()-]/g, '').trim();
      console.log(`✅ Found vendor: ${data.vendor}`);
      break;
    }
  }
  
  if (!data.vendor) {
    console.log('❌ No vendor found');
  }
  
  // ==================== ITEMS EXTRACTION ====================
  console.log('📝 Searching for line items...');
  
  const itemPattern = /([A-Za-z][A-Za-z\s]{2,30}?)\s+(?:₹|rs\.?|inr)?\s*(\d+(?:[,\s]\d+)*(?:\.\d{1,2})?)/gi;
  let itemMatch;
  let itemCount = 0;
  
  while ((itemMatch = itemPattern.exec(text)) !== null) {
    const itemName = itemMatch[1].trim();
    const itemPrice = parseFloat(itemMatch[2].replace(/[,\s]/g, ''));
    
    if (itemName.length >= 3 && itemPrice > 0 && itemPrice < 100000) {
      if (!/^\d+$/.test(itemName) && !/total|amount|bill|sum|grand/i.test(itemName)) {
        data.items.push({
          description: itemName,
          price: itemPrice
        });
        itemCount++;
      }
    }
  }
  
  console.log(`✅ Found ${itemCount} line items`);
  
  // ==================== DESCRIPTION GENERATION ====================
  if (data.items.length > 0) {
    data.description = data.items.map(item => item.description).slice(0, 3).join(', ');
  } else if (data.vendor) {
    data.description = `Purchase from ${data.vendor}`;
  } else if (data.amount) {
    data.description = `Receipt for ₹${data.amount}`;
  }
  
  console.log('📊 Final parsed data:', {
    amount: data.amount,
    vendor: data.vendor,
    date: data.date,
    itemCount: data.items.length
  });
  
  return data;
};

/**
 * Validate extracted data quality
 * @param {Object} parsedData - Parsed receipt data
 * @returns {Object} - Validation result with confidence score
 */
export const validateExtractedData = (parsedData) => {
  let confidence = 0;
  const issues = [];
  
  if (parsedData.amount && parsedData.amount > 0) {
    confidence += 40;
  } else {
    issues.push('Amount not detected or invalid');
  }
  
  if (parsedData.date) {
    confidence += 20;
  } else {
    issues.push('Date not detected');
  }
  
  if (parsedData.vendor) {
    confidence += 20;
  } else {
    issues.push('Vendor/Merchant name not detected');
  }
  
  if (parsedData.description || parsedData.items.length > 0) {
    confidence += 20;
  } else {
    issues.push('No item descriptions found');
  }
  
  return {
    confidence,
    quality: confidence >= 60 ? 'GOOD' : confidence >= 40 ? 'FAIR' : 'POOR',
    issues,
    canUse: confidence >= 40
  };
};

/**
 * Smart category suggestion based on extracted text and vendor
 * @param {Object} parsedData - Parsed receipt data
 * @returns {string} - Suggested category
 */
export const suggestCategory = (parsedData) => {
  const text = `${parsedData.vendor || ''} ${parsedData.description || ''} ${parsedData.items.map(i => i.description).join(' ')}`.toLowerCase();
  
  // Category keywords mapping
  const categoryKeywords = {
    Food: ['restaurant', 'cafe', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'snacks', 'catering', 'pizza', 'burger', 'swiggy', 'zomato'],
    Printing: ['print', 'xerox', 'copy', 'banner', 'poster', 'flex', 'stationery', 'paper'],
    Travel: ['taxi', 'uber', 'ola', 'cab', 'transport', 'bus', 'train', 'ticket', 'fuel', 'petrol'],
    Marketing: ['advertising', 'promotion', 'social media', 'poster', 'flyer', 'marketing', 'campaign'],
    Logistics: ['courier', 'delivery', 'shipping', 'dtdc', 'bluedart', 'fedex', 'packaging'],
    Prizes: ['trophy', 'medal', 'certificate', 'prize', 'gift', 'reward', 'award'],
    Equipment: ['laptop', 'projector', 'mic', 'microphone', 'speaker', 'camera', 'equipment', 'rental', 'hire'],
    Other: []
  };
  
  // Score each category
  const scores = {};
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = keywords.filter(keyword => text.includes(keyword)).length;
  }
  
  // Find category with highest score
  let bestCategory = 'Other';
  let bestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
};

export default {
  processReceipt,
  validateExtractedData,
  suggestCategory
};

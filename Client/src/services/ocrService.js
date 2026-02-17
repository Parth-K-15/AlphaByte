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
  
  // Fix malformed Indian number formats (common OCR errors)
  // "17.24, 200" or "17. 21, 200" → "17,21,200"
  // Pattern: digits + period/space + 2-3 digits + comma + space? + 3 digits
  cleaned = cleaned.replace(/(\d{1,3})[.\s]+(\d{2,3})\s*,\s*(\d{3})/g, '$1,$2,$3');
  
  // "1, 31, 180" → "1,31,180" (remove spaces after commas in numbers)
  cleaned = cleaned.replace(/(\d),\s+(\d)/g, '$1,$2');
  
  // "17, 21,200" → "17,21,200" (spaces before commas in numbers)
  cleaned = cleaned.replace(/(\d)\s+,\s*(\d)/g, '$1,$2');
  
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
  
  // Enhanced pattern for Indian number format with commas (e.g., 17,21,200)
  // Matches: 200, 1,200, 12,300, 1,23,456, 12,34,567 etc.
  const numberPattern = /(\d{1,3}(?:,\d{2,3})+|\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/g;
  let match;
  
  while ((match = numberPattern.exec(text)) !== null) {
    // Remove commas and parse the number
    const numStr = match[1].replace(/,/g, '');
    const num = parseFloat(numStr);
    
    // Get context around the number (40 chars before and after for better keyword detection)
    const start = Math.max(0, match.index - 40);
    const end = Math.min(text.length, match.index + match[0].length + 50);
    const context = text.substring(start, end).toLowerCase();
    
    if (num >= 10 && num <= 100000000) { // Extended range for larger invoices
      // Calculate relevance score
      let score = 0;
      
      // Highest priority: Grand Total, Total Amount
      if (/grand[\s\n]*total|total[\s\n]*amount|net[\s\n]*amount|amount[\s\n]*payable|final[\s\n]*amount/i.test(context)) {
        score += 250;
      }
      // High priority: Total (standalone)
      else if (/\btotal\b/i.test(context)) {
        score += 150;
      }
      // Medium priority: Amount, Sum, Bill
      else if (/amount|sum|bill|payable|paid/i.test(context)) {
        score += 80;
      }
      
      // Currency indicators
      if (/₹|rs\.?\s*|inr|rupee/i.test(context)) score += 60;
      
      // "Only" keyword often follows total (e.g., "17,21,200 INR Only")
      if (/only|\/\s*-|\/-/i.test(context)) score += 45;
      
      // "Rs" or "INR" at end
      if (/rs\s*$/i.test(context) || /inr\s*only/i.test(context)) score += 35;
      
      // Higher numbers are more likely to be totals (scaled)
      score += Math.min(num / 1000, 40);
      
      // Numbers at the bottom/end of receipt are more likely to be totals
      if (match.index > text.length * 0.65) score += 35;
      
      // Format bonus: Indian comma format (e.g., 17,21,200) is more likely the total
      if (/\d{1,2},\d{2},\d{3}/.test(match[1])) score += 30;
      
      // Larger numbers (>1000) more likely to be totals
      if (num > 10000) score += 25;
      if (num > 100000) score += 20;
      
      allNumbers.push({
        amount: num,
        score: score,
        context: context.trim(),
        original: match[1] // Keep original format for debugging
      });
      
      console.log(`Found number: ${match[1]} = ₹${num} (score: ${score})`);
      console.log(`  Context: "${context.trim().substring(0, 80)}..."`);
    }
  }
  
  // Sort by score (highest first) and then by amount (highest first)
  allNumbers.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 15) {
      return b.amount - a.amount; // If scores similar, pick larger amount
    }
    return b.score - a.score;
  });
  
  // Pick the best candidate
  if (allNumbers.length > 0) {
    data.amount = allNumbers[0].amount;
    console.log(`✅ Selected amount: ₹${data.amount} (from "${allNumbers[0].original}")`);
    console.log(`   Top 5 candidates:`, allNumbers.slice(0, 5).map(n => `₹${n.amount.toLocaleString('en-IN')} (score: ${n.score})`));
  } else {
    console.log('❌ No amount found');
  }
  
  // ==================== DATE EXTRACTION ====================
  console.log('📅 Searching for date...');
  
  const datePatterns = [
    // Standard formats: 01-Mar-21, 1-March-2021, etc.
    /(\d{1,2}[-/\s](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-/\s]\d{2,4})/gi,
    // Numeric: 01-01-2021, 1/1/21, etc.
    /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/g,
    // With labels: Date: 01-Mar-21
    /(?:date|dt|dated)[\s:]*(\d{1,2}[-/\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]\d{2,4})/gi,
    /(?:date|dt|dated)[\s:]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/gi,
    // Month-first format: March 1, 2021
    /((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/gi
  ];
  
  for (const pattern of datePatterns) {
    pattern.lastIndex = 0;
    const dateMatch = pattern.exec(text);
    if (dateMatch) {
      data.date = dateMatch[1].trim();
      console.log(`✅ Found date: ${data.date}`);
      break;
    }
  }
  
  if (!data.date) {
    console.log('❌ No date found');
  }
  
  // ==================== VENDOR EXTRACTION ====================
  console.log('🏪 Searching for vendor...');
  
  // Common food/menu item words to skip when detecting vendor
  const foodMenuWords = /^(eggs?|boiled eggs?|fried eggs?|chicken|paneer|rice|roti|naan|dal|soup|salad|pizza|burger|sandwich|omelette|tea|coffee|juice|coke|pepsi|sprite|fanta|water|beer|wine|cocktail|mocktail|dessert|ice cream|cake|pastry|biryani|curry|masala|tikka|kebab|noodles|pasta|fries|combo|meal|thali|veg|non.?veg|mutton|fish|prawn|steak|bacon|sausage|toast|bread|butter|cheese|milk|lassi|shake|diet coke|coke zero|mineral water|soda|aerated beverage|food|beverage|cold drink|hot drink|starter|main course|side dish|appetizer|cgst|sgst|igst|cess|subtotal|sub total|service charge|delivery charge|packing|discount|round off)$/i;
  
  // Strategy 1: First meaningful text lines (usually restaurant/business name at top)
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    
    // Skip empty or very short lines
    if (line.length < 3) continue;
    
    // Skip if it's just numbers or symbols
    if (/^[\d\s\-=*#.]+$/.test(line)) continue;
    
    // Skip if it's a date
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(line)) continue;
    
    // Skip common header/label words
    if (/^(receipt|bill|invoice|tax|gst|gstin|pan|date|dt|time|original|duplicate|copy|sr|s\.?no|qty|rate|item|description|amount|total|table|order|check|tab|prato)$/i.test(line)) continue;
    
    // Skip lines that are just symbols or special chars
    if (!/[a-zA-Z]{3,}/.test(line)) continue;
    
    // Skip phone numbers, emails, websites
    if (/^\+?\d{10}|@|www\.|\.com|\.in/i.test(line)) continue;
    
    // Skip food/menu item names
    if (foodMenuWords.test(line.trim())) continue;
    
    // This looks like a vendor name
    if (line.length >= 5 && line.length <= 60) {
      data.vendor = line.replace(/[^\w\s&.'()-]/g, '').trim();
      console.log(`✅ Found vendor (top line): ${data.vendor}`);
      break;
    }
  }
  
  // Strategy 2: Look for company name patterns with legal suffixes (only if top-line failed)
  if (!data.vendor) {
    const companyPatterns = [
      /([A-Z][A-Za-z\s&.'\-()]{4,50}(?:PVT|LTD|PRIVATE|LIMITED|LLP|COMPANY|CORP|INC|ENTERPRISES?|AUTOMATION|SOLUTIONS?|HOTEL|RESTAURANT|CAFE|KITCHEN|BAKERY|FOODS?)[A-Za-z\s.]*)/gi,
    ];
    
    for (const pattern of companyPatterns) {
      pattern.lastIndex = 0;
      const companyMatch = pattern.exec(text);
      if (companyMatch) {
        const vendor = companyMatch[1].trim();
        if (vendor.length >= 5 && !foodMenuWords.test(vendor) && !/^(INVOICE|RECEIPT|BILL|TAX|GSTIN|TOTAL)$/i.test(vendor)) {
          data.vendor = vendor.replace(/[^\w\s&.'()-]/g, '').trim();
          console.log(`✅ Found vendor (pattern): ${data.vendor}`);
        }
      }
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
  // Build a smart, context-aware description from the full bill text
  console.log('📝 Generating description from bill...');
  
  const lowerText = text.toLowerCase();
  const descParts = [];
  
  // 1. Detect bill/invoice type
  let billType = '';
  if (/tax\s*invoice/i.test(text)) billType = 'Tax Invoice';
  else if (/proforma\s*invoice/i.test(text)) billType = 'Proforma Invoice';
  else if (/quotation|estimate/i.test(text)) billType = 'Quotation';
  else if (/purchase\s*order|p\.?\s*o\.?/i.test(text)) billType = 'Purchase Order';
  else if (/delivery\s*challan/i.test(text)) billType = 'Delivery Challan';
  else if (/credit\s*note/i.test(text)) billType = 'Credit Note';
  else if (/debit\s*note/i.test(text)) billType = 'Debit Note';
  else if (/receipt/i.test(text)) billType = 'Receipt';
  else if (/invoice/i.test(text)) billType = 'Invoice';
  else if (/bill/i.test(text)) billType = 'Bill';
  
  // 2. Detect what the bill is about by scanning for product/service keywords
  const subjectKeywords = {
    // Food & Catering
    'catering': 'catering services',
    'food order': 'food order',
    'meal': 'meals',
    'lunch': 'lunch',
    'dinner': 'dinner',
    'breakfast': 'breakfast',
    'refreshment': 'refreshments',
    'snack': 'snacks & beverages',
    'beverage': 'beverages',
    // Printing & Stationery
    'banner': 'banners & printing',
    'flex': 'flex printing',
    'poster': 'posters',
    'brochure': 'brochure printing',
    'stationery': 'stationery supplies',
    'visiting card': 'visiting cards',
    'id card': 'ID cards',
    'certificate print': 'certificate printing',
    'pamphlet': 'pamphlets',
    // Travel & Transport
    'taxi': 'taxi/cab fare',
    'cab fare': 'cab fare',
    'bus ticket': 'bus tickets',
    'train ticket': 'train tickets',
    'flight': 'flight tickets',
    'fuel': 'fuel expenses',
    'petrol': 'petrol/fuel',
    'toll': 'toll charges',
    'parking': 'parking charges',
    // Equipment & Hardware
    'projector': 'projector rental',
    'microphone': 'microphone/audio equipment',
    'sound system': 'sound system',
    'speaker': 'speaker/audio equipment',
    'laptop': 'laptop/computer',
    'led screen': 'LED screen',
    'camera': 'camera equipment',
    'generator': 'generator rental',
    'extension board': 'extension boards',
    'cable': 'cables & wiring',
    // Industrial / Technical
    'motor': 'motors & machinery',
    'sensor': 'sensors & components',
    'automation': 'automation equipment',
    'plc': 'PLC/industrial controls',
    'hmi': 'HMI displays',
    'machine': 'machinery',
    'panel': 'control panels',
    'drive': 'drives & VFDs',
    'encoder': 'encoders',
    'switch': 'switches & controls',
    // Logistics
    'courier': 'courier/shipping charges',
    'delivery': 'delivery charges',
    'packaging': 'packaging material',
    'shipping': 'shipping charges',
    // Venue & Décor
    'venue': 'venue booking',
    'hall': 'hall booking',
    'tent': 'tent/canopy rental',
    'decoration': 'decoration',
    'flower': 'floral decoration',
    'stage': 'stage setup',
    'lighting': 'lighting setup',
    'chair': 'chairs & furniture rental',
    'table': 'table & furniture rental',
    // Marketing & Promotion
    'advertisement': 'advertising',
    'social media': 'social media promotion',
    'google ad': 'Google Ads',
    'promotion': 'promotional material',
    'branding': 'branding material',
    // Prizes & Awards
    'trophy': 'trophies',
    'medal': 'medals',
    'prize': 'prizes',
    'gift': 'gifts/goodies',
    'memento': 'mementos',
    'shield': 'shields/plaques',
    // Services
    'photography': 'photography services',
    'videography': 'videography services',
    'design': 'design services',
    'consulting': 'consulting services',
    'training': 'training services',
    'maintenance': 'maintenance services',
    'repair': 'repair & services',
    'installation': 'installation services',
    'rental': 'rental charges',
    'subscription': 'subscription charges',
  };
  
  const detectedSubjects = [];
  for (const [keyword, label] of Object.entries(subjectKeywords)) {
    if (lowerText.includes(keyword) && !detectedSubjects.includes(label)) {
      detectedSubjects.push(label);
    }
  }
  
  // 3. Also pick up meaningful line items
  const itemSummary = data.items
    .map(item => item.description)
    .filter(d => d.length >= 3 && !/^(sr|s\.?no|qty|rate|hsn|sac|gst|cgst|sgst|igst|cess|total|amount|tax)/i.test(d))
    .slice(0, 4);
  
  // 4. Build the final description
  // Start with bill type + vendor
  if (billType && data.vendor) {
    descParts.push(`${billType} from ${data.vendor}`);
  } else if (data.vendor) {
    descParts.push(`Payment to ${data.vendor}`);
  } else if (billType) {
    descParts.push(billType);
  }
  
  // Add what the bill is for
  if (detectedSubjects.length > 0) {
    const subjectStr = detectedSubjects.slice(0, 3).join(', ');
    descParts.push(`for ${subjectStr}`);
  } else if (itemSummary.length > 0) {
    const itemStr = itemSummary.join(', ');
    descParts.push(`for ${itemStr}`);
    if (data.items.length > 4) {
      descParts.push(`& ${data.items.length - 4} more`);
    }
  }
  
  // Add amount context
  if (data.amount && descParts.length > 0) {
    descParts.push(`— ₹${data.amount.toLocaleString('en-IN')}`);
  }
  
  // Fallback descriptions
  if (descParts.length > 0) {
    data.description = descParts.join(' ');
  } else if (data.amount && data.vendor) {
    data.description = `Bill of ₹${data.amount.toLocaleString('en-IN')} from ${data.vendor}`;
  } else if (data.amount) {
    data.description = `Expense of ₹${data.amount.toLocaleString('en-IN')} from uploaded bill`;
  } else {
    data.description = 'Expense from uploaded receipt';
  }
  
  console.log(`✅ Generated description: "${data.description}"`);
  console.log(`   Detected subjects:`, detectedSubjects);
  console.log(`   Bill type: ${billType || 'unknown'}`);
  
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
  const text = `${parsedData.vendor || ''} ${parsedData.description || ''} ${parsedData.items.map(i => i.description).join(' ')} ${parsedData.rawTextHint || ''}`.toLowerCase();
  
  // Category keywords mapping — expanded for better accuracy
  const categoryKeywords = {
    Food: ['restaurant', 'cafe', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'snacks', 'catering',
           'pizza', 'burger', 'swiggy', 'zomato', 'biryani', 'chicken', 'tea', 'coffee', 'juice',
           'bakery', 'sweet', 'beverage', 'water', 'canteen', 'mess', 'kitchen', 'refreshment',
           'snack', 'tiffin', 'dine', 'eat', 'hotel', 'dhaba', 'omelette', 'eggs', 'coke',
           'pepsi', 'sprite', 'noodles', 'pasta', 'rice', 'roti', 'paneer', 'dal', 'soup',
           'salad', 'dessert', 'cake', 'ice cream', 'sandwich', 'thali', 'cgst', 'sgst',
           'aerated', 'four seasons', 'taj', 'marriott', 'oberoi', 'itc'],
    Printing: ['print', 'xerox', 'copy', 'banner', 'poster', 'flex', 'stationery', 'paper',
              'brochure', 'flyer', 'lamination', 'binding', 'visiting card', 'pamphlet', 'id card',
              'badge', 'certificate', 'letterhead', 'offset'],
    Travel: ['taxi', 'uber', 'ola', 'cab', 'transport', 'bus', 'train', 'ticket', 'fuel', 'petrol',
            'diesel', 'flight', 'airfare', 'booking', 'travel', 'hotel stay', 'accommodation',
            'auto', 'rickshaw', 'toll', 'parking', 'metro', 'railway'],
    Marketing: ['advertising', 'promotion', 'social media', 'marketing', 'campaign', 'google ads',
               'facebook', 'instagram', 'influencer', 'sponsor', 'branding', 'seo', 'digital',
               'media', 'publicity', 'advertisement', 'ad', 'brand'],
    Logistics: ['courier', 'delivery', 'shipping', 'dtdc', 'bluedart', 'fedex', 'packaging',
               'dhl', 'ecom', 'amazon', 'pack', 'box', 'cargo', 'warehouse',
               'storage', 'dispatch', 'supply'],
    Prizes: ['trophy', 'medal', 'certificate', 'prize', 'gift', 'reward', 'award', 'memento',
            'shield', 'plaque', 'winner', 'champion', 'goodies', 'hamper', 'voucher', 'coupon'],
    Equipment: ['laptop', 'projector', 'mic', 'microphone', 'camera', 'equipment',
               'rental', 'hire', 'sound', 'light', 'led', 'screen', 'monitor', 'cable', 'wire',
               'extension', 'adapter', 'charger', 'tripod', 'stand',
               'canopy', 'generator', 'inverter', 'battery', 'electronics', 'hardware',
               'automation', 'machine', 'device', 'tool', 'motor', 'sensor', 'plc', 'hmi'],
    Other: []
  };
  
  // Score each category — count matching keywords
  const scores = {};
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category] += 1;
        // Bonus for exact vendor name match
        if (parsedData.vendor && parsedData.vendor.toLowerCase().includes(keyword)) {
          scores[category] += 2;
        }
      }
    }
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
  
  console.log(`🏷️ Category suggestion: ${bestCategory} (score: ${bestScore})`, scores);
  return bestCategory;
};

export default {
  processReceipt,
  validateExtractedData,
  suggestCategory
};

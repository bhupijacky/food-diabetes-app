// 🧠 NUTRITION LOGIC ENGINE

/**
 * Robustly finds and parses a JSON block within a larger string.
 */
const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { 
    return JSON.parse(match[0]); 
  } catch (e) { 
    return null; 
  }
};

/**
 * Splits and cleans a string into paragraphs.
 */
const parseParagraphs = (text) => {
  if (!text) return [];
  if (Array.isArray(text)) {
    return text.map(item => String(item).trim()).filter(l => l.length > 3);
  }
  if (typeof text !== 'string') return [String(text)];

  return text.split(/\n\s*\n|\n(?=[A-Z•\*])/)
    .map(l => l.trim().replace(/^[•\*\-\s]+/, ""))
    .filter(l => l.length > 3);
};

/**
 * Standardizes nutritional values for the "Level (Range)" format.
 */
const formatHealthValue = (val) => {
  if (val === null || val === undefined || val === "") return "N/A";
  let str = String(val).trim();
  if (str.length > 20) return str.substring(0, 17) + "...";
  return str;
};

/**
 * Standardizes calorie value for the main display.
 */
const formatCalorieValue = (val) => {
  if (val === null || val === undefined || val === "") return "0";
  let str = String(val).replace(/[^0-9-]/g, '').split('-')[0]; 
  return str || "0";
};

/**
 * Validates the result structure.
 */
const validateResult = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (data.name && data.verdict && data.advice) return true;
  if (data.type === 'menu' && Array.isArray(data.items)) return true;
  return false;
};

module.exports = { 
  extractJsonFromText, 
  parseParagraphs, 
  formatHealthValue, 
  formatCalorieValue,
  validateResult
};

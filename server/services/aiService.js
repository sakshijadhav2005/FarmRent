const axios = require('axios');

// AI Provider Configuration
const GEMINI_API_KEY = 'AIzaSyCs3tXLYyCv5eJrlZ7jZW9j7MIm0WOc8C4';
console.log('Loaded GEMINI_API_KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
// Using v1beta for reliable free tier access
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// System prompt for the AI Crop Assistant
const SYSTEM_PROMPT = `You are FarmRent AI Assistant - an expert agricultural advisor helping Indian farmers with detailed, comprehensive advice:

1. **Equipment Recommendations**: Provide detailed suggestions with:
   - Specific equipment models and specifications
   - Price ranges in Indian Rupees (₹)
   - Suitable farm sizes and terrain types
   - Seasonal considerations and weather impact
   - Maintenance tips and operational guidance
   - Local dealer information when relevant

2. **Comprehensive Farming Knowledge**: Give detailed guidance on:
   - Step-by-step best practices for various crops
   - Complete seasonal farming calendar with timing
   - Detailed soil preparation techniques with equipment needed
   - Comprehensive irrigation methods and water management
   - In-depth pest and disease management with treatment options
   - Fertilizer recommendations with application schedules
   - Market trends and crop pricing insights

3. **Weather-Based Detailed Advice**: Provide thorough analysis of:
   - Optimal timing for specific farming activities
   - Detailed weather impact on different operations
   - Rain forecasts with actionable farming plans
   - Seasonal planning with month-by-month guidance
   - Risk mitigation strategies for weather challenges

4. **Equipment Operation & Maintenance**: Explain comprehensively:
   - Detailed operation procedures for different equipment
   - Complete maintenance schedules and checklists
   - Safety guidelines with precautions
   - Troubleshooting common issues
   - Cost-benefit analysis for equipment purchases

**Response Guidelines:**
- Provide DETAILED, COMPREHENSIVE responses (minimum 150-200 words)
- Include specific examples, numbers, and actionable steps
- Use simple but thorough language (farmer-friendly but complete)
- Include multiple equipment recommendations when relevant
- Mention weather considerations and seasonal timing
- Provide step-by-step instructions when applicable
- Include cost estimates in Indian Rupees (₹)
- Add safety tips and best practices
- Use emojis to make responses engaging (🌾 🚜 ☀️ 🌧️ 💰 ⚠️)
- If asked about booking, provide detailed guidance on using FarmRent platform
- Focus on crops common in India with regional variations
- Include both traditional and modern farming techniques

**Equipment Types Available on FarmRent:**
- Tractors (various HP: 25HP-75HP, ₹15,000-50,000/month)
- Harvesters (combine, rice, wheat: ₹2,000-5,000/day)
- Tillers and Cultivators (₹500-1,500/day)
- Drones (for spraying/monitoring: ₹1,000-3,000/day)
- Seeders and Planters (₹800-2,000/day)
- Irrigation Equipment (₹300-1,000/day)
- Sprayers (₹200-800/day)`;

const VISION_PROMPT = `You are the "FarmRent Crop Doctor". Analyze the provided image of a crop, plant, or field and provide:
1. **Identification**: Identify the crop and its current growth stage.
2. **Health Assessment**: Detect any visible diseases, pests, or nutrient deficiencies.
3. **Actionable Advice**: Suggest specific treatments, pesticides, or organic remedies.
4. **Prevention**: How to prevent this issue in the future.
5. **Equipment**: Suggest any equipment from FarmRent (sprayers, drones, etc.) that could help.

Keep the advice practical for Indian farmers. Use emojis. If you can't see a plant, politely ask for a clearer photo of the crop.`;

// Fallback responses when AI is unavailable
const fallbackResponses = {
    greeting: "🌾 Namaste! I'm your FarmRent AI Assistant. I can help you with:\n\n" +
        "1️⃣ Equipment recommendations for your crops\n" +
        "2️⃣ Weather-based farming advice\n" +
        "3️⃣ Crop cultivation tips\n" +
        "4️⃣ Equipment usage guidance\n\n" +
        "What would you like to know?",

    equipment: "🚜 **Equipment Recommendation:**\n\n" +
        "For general farming, you'll typically need:\n" +
        "- **Tractor (35-50 HP)**: Field preparation, hauling\n" +
        "- **Cultivator/Tiller**: Soil preparation\n" +
        "- **Seeder/Planter**: Sowing seeds\n" +
        "- **Sprayer**: Pest control\n\n" +
        "Tell me your crop type for specific recommendations!",

    rice: "🌾 **Rice Cultivation Equipment:**\n\n" +
        "1. **Puddler + Tractor**: Field preparation\n" +
        "2. **Rice Transplanter**: Efficient planting\n" +
        "3. **Paddy Harvester**: For harvesting\n\n" +
        "Best time: Kharif season (June-July planting)\n" +
        "⚠️ Ensure field is well-flooded before transplanting.",

    wheat: "🌾 **Wheat Cultivation Equipment:**\n\n" +
        "1. **Tractor with Rotavator**: Soil preparation\n" +
        "2. **Seed Drill**: Precision sowing\n" +
        "3. **Combine Harvester**: Harvesting\n\n" +
        "Best time: Rabi season (Nov sowing)\n" +
        "💡 Ensure 2-3 irrigations during growth.",

    weather: "🌤️ **Weather-Smart Farming Tips:**\n\n" +
        "☀️ **Clear Days**: Ideal for ploughing, spraying\n" +
        "🌧️ **Rainy Days**: Avoid spraying, good for sowing\n" +
        "💨 **Windy Days**: Avoid drone spraying\n\n" +
        "Check the weather widget on equipment pages for accurate forecasts!",

    default: "I understand you're asking about farming. Let me help!\n\n" +
        "Could you specify:\n" +
        "- The crop you're growing?\n" +
        "- What activity you need help with?\n" +
        "- Your location for weather advice?\n\n" +
        "This helps me give better recommendations! 🌾"
};

/**
 * Generate text-based AI response
 */
const generateAIResponse = async (userMessage, context = {}) => {
    if (!GEMINI_API_KEY) return generateFallbackResponse(userMessage);

    const tryModels = [GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of tryModels) {
        try {
            // Try v1 first, fall back to v1beta if needed
            const apiVersion = model.includes('latest') ? 'v1beta' : 'v1beta';
            const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

            let contextInfo = context.weather
                ? `\n\nCurrent context:\n- Location: ${context.location || 'India'}\n- Weather: ${JSON.stringify(context.weather)}`
                : '';

            if (context.equipment) {
                contextInfo += `\n\n**Available Equipment in Database:**\n${context.equipment}`;
            }

            const response = await axios.post(
                url,
                {
                    contents: [{
                        parts: [{
                            text: `${SYSTEM_PROMPT}${contextInfo}\n\nUser: ${userMessage}\n\nAssistant:`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000, // Increased for longer responses
                        topP: 0.8
                    }
                },
                { 
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-goog-api-key': GEMINI_API_KEY
                    }, 
                    timeout: 20000 
                }
            );

            return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || generateFallbackResponse(userMessage);
        } catch (error) {
            lastError = error;
            // Only retry if it's a 404 (model not found)
            if (error.response?.status !== 404) break;
            console.warn(`Model ${model} not found, trying next...`);
        }
    }

    console.error('AI Service Error:', lastError.response?.data || lastError.message);
    return generateFallbackResponse(userMessage);
};

/**
 * Analyze image using Gemini Vision
 */
const analyzeImage = async (base64Image, mimeType = 'image/jpeg', userPrompt = '') => {
    if (!GEMINI_API_KEY) return "AI Vision service is temporarily unavailable. Please check your API key.";

    const tryModels = [GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of tryModels) {
        try {
            // Try v1 for stable models, v1beta for -latest versions
            const apiVersion = model.includes('latest') ? 'v1beta' : 'v1beta';
            const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
            
            console.log(`Trying vision model: ${model}, URL: ${url}`);
            console.log(`API Key (first 10 chars): ${GEMINI_API_KEY.substring(0, 10)}...`);

            const response = await axios.post(
                url,
                {
                    contents: [{
                        parts: [
                            { text: userPrompt ? `${VISION_PROMPT}\n\nUser Question: ${userPrompt}` : VISION_PROMPT },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 1000,
                        topP: 0.8
                    }
                },
                { 
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-goog-api-key': GEMINI_API_KEY
                    }, 
                    timeout: 30000 
                }
            );

            return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't analyze the image. Please try a clearer photo.";
        } catch (error) {
            lastError = error;
            console.error(`Vision Model ${model} error:`, error.response?.data || error.message);
            // Only retry if it's a 404 (model not found)
            if (error.response?.status !== 404) break;
            console.warn(`Vision Model ${model} not found, trying next...`);
        }
    }

    console.error('Gemini Vision Error:', lastError.response?.data || lastError.message);
    return "Sorry, I had trouble analyzing the image. The AI model might be temporarily unavailable or your API key settings might need checking.";
};


const generateFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('namaste')) return fallbackResponses.greeting;
    if (lowerMessage.includes('rice') || lowerMessage.includes('paddy')) return fallbackResponses.rice;
    if (lowerMessage.includes('wheat')) return fallbackResponses.wheat;
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain')) return fallbackResponses.weather;
    if (lowerMessage.includes('equipment') || lowerMessage.includes('tractor')) return fallbackResponses.equipment;
    return fallbackResponses.default;
};

const getEquipmentForCrop = (crop) => {
    const recommendations = {
        rice: ['Puddler', 'Rice Transplanter', 'Paddy Harvester', 'Leveler'],
        wheat: ['Rotavator', 'Seed Drill', 'Combine Harvester', 'Straw Reaper'],
        sugarcane: ['Sugarcane Planter', 'Ratoon Manager', 'Sugarcane Harvester'],
        cotton: ['Seed Drill', 'Sprayer', 'Cotton Picker'],
        vegetables: ['Mini Tiller', 'Sprayer', 'Mulch Layer'],
        default: ['Tractor', 'Cultivator', 'Sprayer', 'Trailer']
    };
    return recommendations[crop.toLowerCase()] || recommendations.default;
};

module.exports = {
    generateAIResponse,
    analyzeImage,
    generateFallbackResponse,
    getEquipmentForCrop,
    SYSTEM_PROMPT
};


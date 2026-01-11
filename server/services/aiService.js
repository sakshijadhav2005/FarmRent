const axios = require('axios');

// AI Provider Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// System prompt for the AI Crop Assistant
const SYSTEM_PROMPT = `You are FarmRent AI Assistant - an expert agricultural advisor helping Indian farmers with:

1. **Equipment Recommendations**: Suggest appropriate farming equipment based on:
   - Crop type (rice, wheat, sugarcane, cotton, vegetables, etc.)
   - Farm size and terrain
   - Season and weather conditions
   - Budget constraints

2. **Farming Knowledge**: Provide guidance on:
   - Best practices for various crops
   - Seasonal farming calendar
   - Soil preparation techniques
   - Irrigation methods
   - Pest and disease management

3. **Weather-Based Advice**: Help farmers understand:
   - Best times for specific activities
   - Weather impact on operations
   - Rain forecasts and planning

4. **Equipment Operation**: Explain:
   - How to use different equipment
   - Maintenance tips
   - Safety guidelines

**Response Guidelines:**
- Keep responses concise and practical
- Use simple language (farmer-friendly)
- Include specific equipment recommendations when relevant
- Mention weather considerations when applicable
- Use emojis to make responses engaging (🌾 🚜 ☀️ 🌧️)
- If asked about booking, guide them to use the FarmRent platform
- Prices are in Indian Rupees (₹)
- Focus on crops common in India

**Equipment Types Available on FarmRent:**
- Tractors (various HP)
- Harvesters (combine, rice, wheat)
- Tillers and Cultivators
- Drones (for spraying/monitoring)
- Seeders and Planters
- Irrigation Equipment
- Sprayers`;

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

// Generate response using Gemini AI
const generateAIResponse = async (userMessage, context = {}) => {
    // If no API key, use fallback
    if (!GEMINI_API_KEY) {
        return generateFallbackResponse(userMessage);
    }

    try {
        let contextInfo = context.weather
            ? `\n\nCurrent context:\n- Location: ${context.location || 'India'}\n- Weather: ${JSON.stringify(context.weather)}`
            : '';

        if (context.equipment) {
            contextInfo += `\n\n**Available Equipment in Database:**\n${context.equipment}\n(Recommend these specific items if relevant to the user request. Use the format [Equipment Name](ID) or just mention them details)`;
        }

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `${SYSTEM_PROMPT}${contextInfo}\n\nUser: ${userMessage}\n\nAssistant:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                    topP: 0.8
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            }
        );

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.data.candidates[0].content.parts[0].text;
        }

        return generateFallbackResponse(userMessage);
    } catch (error) {
        console.error('AI Service Error:', error.message);
        return generateFallbackResponse(userMessage);
    }
};

// Generate fallback response based on keywords
const generateFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('namaste')) {
        return fallbackResponses.greeting;
    }
    if (lowerMessage.includes('rice') || lowerMessage.includes('paddy') || lowerMessage.includes('धान')) {
        return fallbackResponses.rice;
    }
    if (lowerMessage.includes('wheat') || lowerMessage.includes('गेहूं')) {
        return fallbackResponses.wheat;
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('मौसम')) {
        return fallbackResponses.weather;
    }
    if (lowerMessage.includes('equipment') || lowerMessage.includes('tractor') || lowerMessage.includes('harvester')) {
        return fallbackResponses.equipment;
    }

    return fallbackResponses.default;
};

// Get equipment recommendations for crop
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
    generateFallbackResponse,
    getEquipmentForCrop,
    SYSTEM_PROMPT
};

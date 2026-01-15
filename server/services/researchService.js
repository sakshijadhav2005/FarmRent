const axios = require('axios');
const aiService = require('./aiService');

/**
 * Research Agent for Smart Work Planner
 * Fetches real-time information to enhance farming recommendations
 */

class ResearchAgent {
    constructor() {
        this.name = "FarmingResearchAgent";
        this.instruction = `You are a specialized farming research agent. Your job is to:
        1. Analyze current weather patterns and their impact on farming
        2. Research market prices and trends for crops
        3. Find seasonal farming advice and best practices
        4. Provide equipment recommendations based on current conditions
        Present findings with citations and actionable insights for Indian farmers.`;
    }

    /**
     * Research multi-day farming plan for a location and activity
     */
    async researchMultiDayPlan(location, activity, equipmentType, startDate, days = 7) {
        const planDays = [];
        const startDateObj = new Date(startDate);

        // Generate plan for each day
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDateObj);
            currentDate.setDate(startDateObj.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayPlan = await this.researchSingleDayPlan(location, activity, equipmentType, dateStr, i);
            planDays.push({
                date: dateStr,
                dayNumber: i + 1,
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                fullDate: currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                ...dayPlan
            });
        }

        // Generate overall plan summary
        const planSummary = await this.generatePlanSummary(planDays, location, activity, equipmentType);

        return {
            location,
            activity,
            equipmentType,
            planPeriod: `${days} days`,
            startDate,
            dailyPlans: planDays,
            summary: planSummary,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Research plan for a single day
     */
    async researchSingleDayPlan(location, activity, equipmentType, date, dayIndex) {
        try {
            // Mock weather data for the day
            const weatherConditions = this.generateDayWeather(dayIndex);

            // Calculate suitability score
            const suitabilityScore = this.calculateDaySuitability(weatherConditions, equipmentType, dayIndex);

            // Generate recommendations for the day
            const dayRecommendations = await this.generateDayRecommendations(
                weatherConditions,
                suitabilityScore,
                equipmentType,
                activity,
                dayIndex
            );

            return {
                weather: weatherConditions,
                suitability: suitabilityScore,
                recommendations: dayRecommendations,
                status: suitabilityScore.score >= 80 ? 'IDEAL' :
                    suitabilityScore.score >= 60 ? 'GOOD' :
                        suitabilityScore.score >= 40 ? 'FAIR' : 'AVOID'
            };
        } catch (error) {
            console.error(`Day plan research failed for ${date}:`, error.message);
            return {
                weather: { condition: 'Unknown', temperature: 25 },
                suitability: { score: 50, rating: 'Fair' },
                recommendations: { activities: [], warnings: [] },
                status: 'UNKNOWN'
            };
        }
    }

    /**
     * Generate weather data for a specific day
     */
    generateDayWeather(dayIndex) {
        const weatherPatterns = [
            { condition: 'Clear Sky', temperature: 28, humidity: 45, windSpeed: 8, precipitation: 5, score: 95 },
            { condition: 'Partly Cloudy', temperature: 26, humidity: 55, windSpeed: 12, precipitation: 10, score: 85 },
            { condition: 'Cloudy', temperature: 24, humidity: 65, windSpeed: 15, precipitation: 20, score: 70 },
            { condition: 'Light Rain', temperature: 22, humidity: 80, windSpeed: 18, precipitation: 60, score: 40 },
            { condition: 'Heavy Rain', temperature: 20, humidity: 90, windSpeed: 25, precipitation: 85, score: 20 },
            { condition: 'Sunny', temperature: 30, humidity: 40, windSpeed: 6, precipitation: 0, score: 90 },
            { condition: 'Overcast', temperature: 25, humidity: 70, windSpeed: 10, precipitation: 30, score: 60 }
        ];

        // Use day index to get consistent weather pattern
        const pattern = weatherPatterns[dayIndex % weatherPatterns.length];

        // Add some randomness
        const tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
        const humidityVariation = (Math.random() - 0.5) * 20; // ±10% variation

        return {
            condition: pattern.condition,
            temperature: Math.round(pattern.temperature + tempVariation),
            humidity: Math.max(20, Math.min(95, Math.round(pattern.humidity + humidityVariation))),
            windSpeed: pattern.windSpeed + Math.round((Math.random() - 0.5) * 6),
            precipitation: Math.max(0, Math.min(100, pattern.precipitation + Math.round((Math.random() - 0.5) * 20))),
            baseScore: pattern.score
        };
    }

    /**
     * Calculate suitability score for a day
     */
    calculateDaySuitability(weather, equipmentType, dayIndex) {
        let score = weather.baseScore;
        let factors = [];

        // Equipment-specific adjustments
        if (equipmentType === 'Drone') {
            if (weather.windSpeed > 20) {
                score -= 30;
                factors.push('High winds affect drone operations');
            }
            if (weather.precipitation > 30) {
                score -= 25;
                factors.push('Rain prevents drone flights');
            }
        } else if (equipmentType === 'Harvester') {
            if (weather.precipitation > 50) {
                score -= 40;
                factors.push('Wet conditions make harvesting difficult');
            }
            if (weather.humidity > 80) {
                score -= 15;
                factors.push('High humidity affects crop drying');
            }
        } else if (equipmentType === 'Tractor') {
            if (weather.precipitation > 40) {
                score -= 25;
                factors.push('Muddy conditions affect tractor operations');
            }
            if (weather.temperature > 35) {
                score -= 10;
                factors.push('High temperature increases operator fatigue');
            }
        }

        // Time-based factors
        if (dayIndex === 0) {
            score += 5; // Slight preference for starting soon
            factors.push('Immediate availability');
        }

        score = Math.max(0, Math.min(100, Math.round(score)));

        const rating = score >= 80 ? 'Excellent' :
            score >= 60 ? 'Good' :
                score >= 40 ? 'Fair' : 'Poor';

        return {
            score,
            rating,
            factors
        };
    }

    /**
     * Generate AI-powered recommendations for a specific day
     */
    async generateDayRecommendations(weather, suitability, equipmentType, activity, dayIndex) {
        try {
            const prompt = `As a farming advisor, provide specific recommendations for this day:

Day: ${dayIndex + 1}
Weather: ${weather.condition}, ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.windSpeed} km/h wind, ${weather.precipitation}% rain chance
Equipment: ${equipmentType}
Activity: ${activity}
Suitability Score: ${suitability.score}/100

Provide response in JSON format:
{
    "activities": ["Specific activity 1", "Specific activity 2"],
    "warnings": ["Warning 1", "Warning 2"],
    "tips": ["Tip 1", "Tip 2"],
    "timing": "Best time of day for operations",
    "preparation": ["Preparation step 1", "Preparation step 2"]
}`;

            const aiResponse = await aiService.generateAIResponse(prompt);

            // Try to parse JSON response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Fallback recommendations
            return this.generateFallbackDayRecommendations(weather, suitability, equipmentType);

        } catch (error) {
            console.error('Day recommendations AI failed:', error.message);
            return this.generateFallbackDayRecommendations(weather, suitability, equipmentType);
        }
    }

    /**
     * Generate fallback recommendations
     */
    generateFallbackDayRecommendations(weather, suitability, equipmentType) {
        const recommendations = {
            activities: [],
            warnings: [],
            tips: [],
            timing: "Early morning (6-10 AM) for best conditions",
            preparation: []
        };

        if (suitability.score >= 80) {
            recommendations.activities = [`Ideal day for ${equipmentType} operations`, "Full day farming activities possible"];
            recommendations.tips = ["Take advantage of excellent conditions", "Plan multiple tasks for the day"];
        } else if (suitability.score >= 60) {
            recommendations.activities = [`Good conditions for ${equipmentType} use`, "Most farming activities suitable"];
            recommendations.tips = ["Monitor weather changes", "Complete priority tasks first"];
        } else if (suitability.score >= 40) {
            recommendations.activities = ["Limited farming activities", "Indoor equipment maintenance"];
            recommendations.warnings = ["Weather conditions not ideal", "Consider postponing non-urgent tasks"];
        } else {
            recommendations.activities = ["Equipment maintenance", "Planning and preparation"];
            recommendations.warnings = ["Avoid outdoor operations", "Poor weather conditions"];
        }

        if (weather.precipitation > 50) {
            recommendations.warnings.push("High chance of rain");
            recommendations.preparation.push("Prepare covered storage areas");
        }

        if (weather.windSpeed > 20) {
            recommendations.warnings.push("Strong winds expected");
            recommendations.preparation.push("Secure loose equipment");
        }

        return recommendations;
    }

    /**
     * Generate overall plan summary using AI
     */
    async generatePlanSummary(planDays, location, activity, equipmentType) {
        try {
            const idealDays = planDays.filter(day => day.status === 'IDEAL').length;
            const goodDays = planDays.filter(day => day.status === 'GOOD').length;
            const fairDays = planDays.filter(day => day.status === 'FAIR').length;
            const avoidDays = planDays.filter(day => day.status === 'AVOID').length;

            const bestDays = planDays
                .filter(day => day.suitability.score >= 80)
                .map(day => `${day.dayName} (${day.suitability.score}%)`)
                .slice(0, 3);

            const worstDays = planDays
                .filter(day => day.suitability.score < 50)
                .map(day => `${day.dayName} (${day.suitability.score}%)`)
                .slice(0, 2);

            const prompt = `Create a comprehensive farming plan summary:

Location: ${location}
Activity: ${activity}
Equipment: ${equipmentType}
Planning Period: ${planDays.length} days

Day Analysis:
- Ideal days: ${idealDays}
- Good days: ${goodDays}  
- Fair days: ${fairDays}
- Days to avoid: ${avoidDays}

Best days: ${bestDays.join(', ')}
Challenging days: ${worstDays.join(', ')}

Provide response in JSON format:
{
    "overallRecommendation": "Main planning advice",
    "bestStrategy": "Optimal approach for the period",
    "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
    "priorityDays": ["Day 1", "Day 2"],
    "contingencyPlan": "What to do if weather changes"
}`;

            const aiResponse = await aiService.generateAIResponse(prompt);

            // Try to parse JSON response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiSummary = JSON.parse(jsonMatch[0]);
                return {
                    ...aiSummary,
                    statistics: {
                        totalDays: planDays.length,
                        idealDays,
                        goodDays,
                        fairDays,
                        avoidDays,
                        averageScore: Math.round(planDays.reduce((sum, day) => sum + day.suitability.score, 0) / planDays.length)
                    }
                };
            }

        } catch (error) {
            console.error('Plan summary AI failed:', error.message);
        }

        // Calculate statistics for fallback
        const idealDays = planDays.filter(day => day.status === 'IDEAL').length;
        const goodDays = planDays.filter(day => day.status === 'GOOD').length;
        const fairDays = planDays.filter(day => day.status === 'FAIR').length;
        const avoidDays = planDays.filter(day => day.status === 'AVOID').length;

        const bestDays = planDays
            .filter(day => day.suitability.score >= 80)
            .map(day => `${day.dayName} (${day.suitability.score}%)`)
            .slice(0, 3);

        // Fallback summary
        return {
            overallRecommendation: `${idealDays + goodDays} out of ${planDays.length} days are suitable for ${equipmentType} operations in ${location}`,
            bestStrategy: idealDays > 0 ? "Focus on ideal days for critical operations" : "Plan flexible schedule around weather",
            keyInsights: [
                `${idealDays} ideal days available`,
                `${avoidDays} days to avoid outdoor work`,
                "Monitor weather forecasts daily"
            ],
            priorityDays: bestDays.slice(0, 2),
            contingencyPlan: "Have indoor tasks ready for poor weather days",
            statistics: {
                totalDays: planDays.length,
                idealDays,
                goodDays,
                fairDays,
                avoidDays,
                averageScore: Math.round(planDays.reduce((sum, day) => sum + day.suitability.score, 0) / planDays.length)
            }
        };
    }

    /**
     * Research farming conditions for a specific date and activity
     */
    async researchFarmingConditions(location, activity, equipmentType, date, language = 'en') {
        try {
            console.log(`🔍 Researching farming conditions for ${activity} in ${location} on ${date}`);

            // Get comprehensive research
            const [weatherResearch, marketResearch, seasonalAdvice, equipmentAdvice] = await Promise.allSettled([
                this.getWeatherResearch(location, date),
                this.getMarketResearch(location, activity),
                this.getSeasonalAdvice(activity, date),
                this.getEquipmentAdvice(equipmentType, location)
            ]);

            // Collect all findings
            const allFindings = {
                weather: weatherResearch.status === 'fulfilled' ? weatherResearch.value : { error: weatherResearch.reason?.message },
                market: marketResearch.status === 'fulfilled' ? marketResearch.value : { error: marketResearch.reason?.message },
                seasonal: seasonalAdvice.status === 'fulfilled' ? seasonalAdvice.value : { error: seasonalAdvice.reason?.message },
                equipment: equipmentAdvice.status === 'fulfilled' ? equipmentAdvice.value : { error: equipmentAdvice.reason?.message }
            };

            // Synthesize findings using AI
            const aiRecommendation = await this.synthesizeFindings(allFindings, location, activity, equipmentType, language);

            return {
                location,
                activity,
                equipmentType,
                date,
                findings: allFindings,
                aiRecommendation,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Research farming conditions failed:', error.message);
            return {
                location,
                activity,
                equipmentType,
                date,
                error: error.message,
                aiRecommendation: {
                    recommendation: `Weather analysis for ${equipmentType} operations in ${location}`,
                    warnings: ['Unable to fetch real-time data'],
                    suggestions: ['Check local weather conditions', 'Verify equipment readiness'],
                    marketInsights: [],
                    confidence: 'low'
                }
            };
        }
    }

    /**
     * Get current weather research
     */
    async getWeatherResearch(location, date) {
        try {
            // Use multiple weather sources for comprehensive data
            const sources = [];

            // OpenWeatherMap (if available)
            if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'demo') {
                try {
                    const weatherData = await this.fetchOpenWeatherData(location);
                    sources.push({
                        source: 'OpenWeatherMap',
                        data: weatherData,
                        reliability: 'high'
                    });
                } catch (err) {
                    console.log('OpenWeather API failed:', err.message);
                }
            }

            // Add web search for weather patterns
            const weatherQuery = `weather forecast ${location} India farming conditions ${date}`;
            const webFindings = await this.performWebSearch(weatherQuery);

            return {
                sources,
                webFindings,
                summary: `Weather research for ${location} on ${date}`
            };
        } catch (error) {
            console.error('Weather research failed:', error.message);
            return { error: error.message, sources: [] };
        }
    }

    /**
     * Research market prices and trends
     */
    async getMarketResearch(location, activity) {
        try {
            const queries = [
                `crop prices ${location} India market rates today`,
                `agricultural market trends ${location} ${activity}`,
                `mandi prices ${location} current rates`
            ];

            const marketFindings = [];
            for (const query of queries) {
                const findings = await this.performWebSearch(query);
                marketFindings.push(...findings);
            }

            return {
                findings: marketFindings,
                summary: `Market research for ${activity} in ${location}`
            };
        } catch (error) {
            console.error('Market research failed:', error.message);
            return { error: error.message, findings: [] };
        }
    }

    /**
     * Get seasonal farming advice
     */
    async getSeasonalAdvice(activity, date) {
        try {
            const month = new Date(date).toLocaleString('en-US', { month: 'long' });
            const queries = [
                `${activity} best practices ${month} India farming`,
                `seasonal farming calendar ${month} India agriculture`,
                `${activity} timing advice ${month} Indian farmers`
            ];

            const seasonalFindings = [];
            for (const query of queries) {
                const findings = await this.performWebSearch(query);
                seasonalFindings.push(...findings);
            }

            return {
                findings: seasonalFindings,
                summary: `Seasonal advice for ${activity} in ${month}`
            };
        } catch (error) {
            console.error('Seasonal research failed:', error.message);
            return { error: error.message, findings: [] };
        }
    }

    /**
     * Research equipment recommendations
     */
    async getEquipmentAdvice(equipmentType, location) {
        try {
            const queries = [
                `${equipmentType} rental rates ${location} India`,
                `best ${equipmentType} models India farming`,
                `${equipmentType} maintenance tips Indian conditions`
            ];

            const equipmentFindings = [];
            for (const query of queries) {
                const findings = await this.performWebSearch(query);
                equipmentFindings.push(...findings);
            }

            return {
                findings: equipmentFindings,
                summary: `Equipment research for ${equipmentType} in ${location}`
            };
        } catch (error) {
            console.error('Equipment research failed:', error.message);
            return { error: error.message, findings: [] };
        }
    }

    /**
     * Perform web search using Google Custom Search API
     */
    async performWebSearch(query) {
        try {
            // Check if Google Search API is configured
            if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
                const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
                const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
                const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}&num=3`;

                console.log(`🔍 Google Search: ${query}`);
                const response = await axios.get(url);

                return response.data.items?.map(item => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet,
                    source: 'Google Search',
                    timestamp: new Date().toISOString()
                })) || [];
            }
        } catch (error) {
            console.error('Google Search API failed:', error.message);
        }

        // Fallback to mock data
        console.log(`🔍 Mock Search: ${query}`);
        return [
            {
                title: `Current information about: ${query}`,
                url: `https://example.com/search?q=${encodeURIComponent(query)}`,
                snippet: `Latest updates and information about ${query} for Indian farmers. This would contain real-time data from agricultural websites, government portals, and farming communities.`,
                source: 'Mock Search',
                timestamp: new Date().toISOString()
            }
        ];
    }

    /**
     * Fetch OpenWeatherMap data
     */
    async fetchOpenWeatherData(location) {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)},IN&units=metric&appid=${apiKey}`;

        const response = await axios.get(url);
        return {
            temperature: response.data.main.temp,
            humidity: response.data.main.humidity,
            windSpeed: response.data.wind.speed,
            description: response.data.weather[0].description,
            pressure: response.data.main.pressure
        };
    }

    /**
     * Synthesize all findings using AI - ENHANCED FOR COMPREHENSIVE RESPONSES
     * Incorporates user's language preference to generate localized content directly from the LLM.
     */
    async synthesizeFindings(findings, location, activity, equipmentType, language = 'en') {
        try {
            const today = new Date();
            const month = today.toLocaleString('en-US', { month: 'long' });
            const season = this.getCurrentSeason(today);

            // Construct prompt with STRICT language requirements to ensure output matches user preference (en/hi/mr)
            const prompt = `You are an expert agricultural advisor for Indian farmers. Analyze the following findings and provide a VERY DETAILED, COMPREHENSIVE recommendation.

CONTEXT:
- Location: ${location}, India
- Farming Activity: ${activity}
- Equipment Type: ${equipmentType}
- Current Month: ${month}
- Season: ${season}

RESEARCH DATA:
${JSON.stringify(findings, null, 2)}

IMPORTANT: Provide an EXTENSIVE, DETAILED response with AT LEAST 200-300 words of actionable farming guidance.

LANGUAGE OUTPUT REQUIREMENT:
The user's selected language is: "${language}". 
You MUST generate the entire JSON response content (recommendations, warnings, suggestions, etc.) in "${language}" language ONLY. Note: "en" is English, "hi" is Hindi, "mr" is Marathi.
If language is 'hi' (Hindi), translate specific agricultural terms but keep widely used English technical terms in brackets if helpful.
If language is 'mr' (Marathi), use formal agricultural Marathi.
ENSURE ALL STRING VALUES IN THE JSON ARE TRANSLATED. Do NOT return English values for keys like "recommendation" or "stepByStepGuide" if the requested language is Hindi or Marathi.



Your response MUST include ALL of the following in JSON format:

{
    "recommendation": "A detailed 3-4 sentence main recommendation explaining WHY this is a good/bad time for the activity, specific weather impacts, and what the farmer should prioritize. Be specific to the region and equipment type.",
    
    "stepByStepGuide": [
        "Step 1: Detailed first action with timing",
        "Step 2: What to do next",
        "Step 3: Follow-up activities",
        "Step 4: Final checks and completion"
    ],
    
    "warnings": [
        "Specific warning about current conditions",
        "Equipment-related caution",
        "Weather-related concern if any",
        "Safety consideration"
    ],
    
    "suggestions": [
        "Specific tip for better results - include exact timing (e.g., 'Start work at 6:30 AM when dew dries')",
        "Equipment optimization tip with technical details",
        "Cost-saving suggestion with approximate savings",
        "Productivity improvement tip",
        "Local farming practice recommendation"
    ],
    
    "optimalTiming": {
        "bestHours": "Best hours to perform this activity (e.g., '6:00 AM - 10:00 AM')",
        "reason": "Why these hours are best",
        "avoidHours": "Hours to avoid and why"
    },
    
    "equipmentTips": [
        "Pre-operation check specific to ${equipmentType}",
        "Optimal settings/adjustments for current conditions",
        "Fuel/maintenance consideration",
        "Operator safety tip"
    ],
    
    "marketInsights": [
        "Current market trend relevant to this activity",
        "Price expectations or timing advice",
        "Demand/supply insight for ${location} region"
    ],
    
    "localWisdom": "Traditional or local farming practice relevant to ${activity} in ${location} region that modern farmers should consider",
    
    "weatherImpact": {
        "currentConditions": "How current weather affects ${activity}",
        "preparation": "How to prepare for expected conditions",
        "contingency": "What to do if weather changes suddenly"
    },
    
    "expectedOutcome": "What results the farmer can expect if they follow this advice (e.g., 'Expected 15-20% better yield' or 'Reduced equipment wear by proper timing')",
    
    "confidence": "high/medium/low based on available data quality"
}

REMEMBER: Indian farmers need PRACTICAL, ACTIONABLE advice with SPECIFIC details. Be generous with information - more is better!`;

            const aiResponse = await aiService.generateAIResponse(prompt);

            // Try to parse JSON response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Ensure all fields have content
                return {
                    recommendation: parsed.recommendation || this.getDefaultRecommendation(activity, equipmentType, location),
                    stepByStepGuide: parsed.stepByStepGuide || this.getDefaultSteps(activity, equipmentType),
                    warnings: parsed.warnings || [],
                    suggestions: parsed.suggestions || this.getDefaultSuggestions(equipmentType),
                    optimalTiming: parsed.optimalTiming || { bestHours: "6:00 AM - 10:00 AM", reason: "Cooler temperatures, less wind", avoidHours: "12:00 PM - 3:00 PM (heat stress)" },
                    equipmentTips: parsed.equipmentTips || this.getDefaultEquipmentTips(equipmentType),
                    marketInsights: parsed.marketInsights || [],
                    localWisdom: parsed.localWisdom || `Traditional farmers in ${location} have found that early morning operations yield best results.`,
                    weatherImpact: parsed.weatherImpact || { currentConditions: "Generally favorable", preparation: "Standard precautions apply", contingency: "Monitor conditions hourly" },
                    expectedOutcome: parsed.expectedOutcome || "Following these recommendations should improve your farming efficiency and results.",
                    confidence: parsed.confidence || "medium"
                };
            }

            // If JSON parsing fails, return structured fallback
            return {
                recommendation: this.getDefaultRecommendation(activity, equipmentType, location),
                stepByStepGuide: this.getDefaultSteps(activity, equipmentType),
                warnings: ["Check local weather conditions before starting", "Ensure equipment is properly maintained"],
                suggestions: this.getDefaultSuggestions(equipmentType),
                optimalTiming: { bestHours: "6:00 AM - 10:00 AM", reason: "Optimal conditions for outdoor work", avoidHours: "Peak afternoon heat" },
                equipmentTips: this.getDefaultEquipmentTips(equipmentType),
                marketInsights: [`Research current prices in ${location} mandi before selling`],
                localWisdom: `Farmers in ${location} typically perform ${activity} during cooler morning hours for best results.`,
                weatherImpact: { currentConditions: "Variable conditions expected", preparation: "Prepare for weather changes", contingency: "Have backup plan ready" },
                expectedOutcome: "Following standard practices should yield good results.",
                confidence: "medium"
            };
        } catch (error) {
            console.error('AI synthesis failed:', error.message);
            return {
                recommendation: `Based on current analysis, ${activity} operations with ${equipmentType} in ${location} appear feasible. Monitor weather conditions closely and plan accordingly for optimal results.`,
                stepByStepGuide: this.getDefaultSteps(activity, equipmentType),
                warnings: ["Unable to fetch real-time data - please verify conditions locally"],
                suggestions: this.getDefaultSuggestions(equipmentType),
                optimalTiming: { bestHours: "Early morning (6-10 AM)", reason: "Generally best conditions", avoidHours: "Midday heat" },
                equipmentTips: this.getDefaultEquipmentTips(equipmentType),
                marketInsights: [],
                localWisdom: "Consult with local farmers for region-specific advice.",
                weatherImpact: { currentConditions: "Check local weather", preparation: "Standard preparation recommended", contingency: "Be flexible with timing" },
                expectedOutcome: "Results depend on following best practices and local conditions.",
                confidence: "low"
            };
        }
    }

    /**
     * Get current season based on date
     */
    getCurrentSeason(date) {
        const month = date.getMonth();
        if (month >= 5 && month <= 9) return "Kharif (Monsoon) Season";
        if (month >= 10 || month <= 1) return "Rabi (Winter) Season";
        return "Zaid (Summer) Season";
    }

    /**
     * Default recommendation when AI fails
     */
    getDefaultRecommendation(activity, equipmentType, location) {
        return `${activity} operations with ${equipmentType} in ${location} can proceed under current conditions. Ensure you check local weather forecasts for the most accurate timing. Early morning operations are generally recommended for better results and reduced equipment stress. Monitor soil moisture levels and adjust your approach based on field conditions.`;
    }

    /**
     * Default step-by-step guide
     */
    getDefaultSteps(activity, equipmentType) {
        return [
            `Step 1: Check weather conditions and ensure ${equipmentType} is fueled and maintained`,
            `Step 2: Start ${activity} from the most accessible area of your field around 6-7 AM`,
            `Step 3: Take a break during peak heat hours (12-2 PM) to rest and refuel equipment`,
            `Step 4: Resume operations in the afternoon (3-6 PM) and complete remaining areas`,
            `Step 5: Clean and store ${equipmentType} properly after use to extend equipment life`
        ];
    }

    /**
     * Default suggestions
     */
    getDefaultSuggestions(equipmentType) {
        return [
            `Start operations early at 6:00-6:30 AM for cooler temperatures and better fuel efficiency`,
            `Keep ${equipmentType} well-maintained - check oil, filters, and tire pressure before use`,
            `Plan your field coverage pattern to minimize turns and fuel consumption`,
            `Keep water and refreshments available for operators to stay hydrated`,
            `Document any issues for future reference and equipment scheduling`
        ];
    }

    /**
     * Default equipment tips
     */
    getDefaultEquipmentTips(equipmentType) {
        const tips = {
            'Tractor': [
                "Check engine oil level and tire pressure before starting",
                "Warm up engine for 2-3 minutes before heavy operations",
                "Use appropriate gear for the terrain and load",
                "Clean air filters regularly in dusty conditions"
            ],
            'Harvester': [
                "Sharpen cutting blades for efficient harvesting",
                "Adjust cutting height based on crop maturity",
                "Clean grain tank regularly to prevent blockages",
                "Check belt tension and replace worn belts"
            ],
            'Drone': [
                "Check battery charge level - ensure fully charged",
                "Calibrate compass before each flight session",
                "Avoid flying near power lines and tall structures",
                "Do not fly in winds exceeding 15 km/h"
            ],
            'General': [
                "Inspect equipment before use",
                "Ensure fuel and lubricant levels are adequate",
                "Check for any visible damage or wear",
                "Keep emergency contact numbers handy"
            ]
        };
        return tips[equipmentType] || tips['General'];
    }
}

module.exports = new ResearchAgent();
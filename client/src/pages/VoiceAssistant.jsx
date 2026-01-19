/**
 * Voice Assistant Page
 * ====================
 * 
 * PURPOSE: AI-powered voice interaction for general farming queries.
 * 
 * THIS IS A SEPARATE FEATURE FROM WORK PLANNER:
 * - Voice Assistant: Conversational AI for answering any farming questions
 *                    using speech recognition and text-to-speech
 * - Work Planner: Weather-based suitability analysis for specific activities
 * 
 * FEATURES:
 * - Speech-to-text: Speak your question in Hindi, Marathi, or English
 * - AI Response: Get detailed farming advice from Google Gemini AI
 * - Text-to-speech: Hear the response in your selected language
 * - Quick Actions: Pre-built common farming questions
 * - Conversation History: View all past questions and answers
 * 
 * HOW IT WORKS:
 * 1. User taps the microphone button
 * 2. User speaks their question in any supported language
 * 3. Speech is converted to text
 * 4. Question is sent to Google Gemini AI
 * 5. AI response is displayed and spoken aloud
 * 
 * SUPPORTED LANGUAGES:
 * - English (en-IN)
 * - Hindi (hi-IN)
 * - Marathi (mr-IN)
 * 
 * ROUTE: /voice-assistant
 * 
 * @author FarmLink Development Team
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, StopCircle, Globe, Sparkles, Tractor, CloudRain, Bug, Leaf, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage } from '../api';
import { useTranslation } from 'react-i18next';

const VoiceAssistant = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('mr-IN'); // en-IN, hi-IN, mr-IN (default: Marathi)
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "🌾 स्वागत आहे! Welcome! मी लवकरच बोलेन... I'll speak shortly...\n\n🎙️ Google Gemini AI Farming Assistant" }
    ]);
    const [loading, setLoading] = useState(false);
    const [voiceInterrupted, setVoiceInterrupted] = useState(false);
    const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
    const messagesEndRef = useRef(null);

    // Language options with better descriptions
    const languages = [
        { code: 'en-IN', label: 'English', flag: '🇬🇧', desc: 'English (India)' },
        { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳', desc: 'Hindi (भारत)' },
        { code: 'mr-IN', label: 'मराठी', flag: '🚩', desc: 'Marathi (महाराष्ट्र)' },
    ];

    // Quick action suggestions
    const quickActions = [
        { icon: Tractor, text: language === 'mr-IN' ? 'ट्रॅक्टर शिफारस' : language === 'hi-IN' ? 'ट्रैक्टर सुझाव' : 'Recommend a tractor', query: 'Recommend a tractor for my 5 acre farm' },
        { icon: CloudRain, text: language === 'mr-IN' ? 'हवामान सल्ला' : language === 'hi-IN' ? 'मौसम सलाह' : 'Weather advice', query: 'What farming activities should I do based on weather?' },
        { icon: Bug, text: language === 'mr-IN' ? 'कीड नियंत्रण' : language === 'hi-IN' ? 'कीट नियंत्रण' : 'Pest control', query: 'How to control pests in my crop?' },
        { icon: Leaf, text: language === 'mr-IN' ? 'पीक मार्गदर्शन' : language === 'hi-IN' ? 'फसल मार्गदर्शन' : 'Crop guidance', query: 'Best practices for growing wheat' },
    ];

    // Refs for speech synthesis and recognition
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const transcriptRef = useRef('');
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    // Single consolidated welcome speech effect - prevents multiple overlapping attempts
    useEffect(() => {
        let welcomeTimer = null;
        let hasSpoken = false;

        const speakWelcome = () => {
            if (hasSpoken || hasSpokenWelcome || isSpeaking || isListening) return;

            hasSpoken = true;
            const welcomeMessage = language === 'mr-IN'
                ? 'नमस्कार! मी तुमचा शेती सल्लागार आहे. माईकवर टॅप करा आणि मला काहीही विचारा!'
                : language === 'hi-IN'
                    ? 'नमस्ते! मैं आपका खेती सलाहकार हूं. माइक पर टैप करें और मुझसे कुछ भी पूछें!'
                    : 'Hello! I am your farming advisor. Tap the microphone and ask me anything!';

            speak(welcomeMessage);
            setHasSpokenWelcome(true);
        };

        // Wait for voices to load, or use fallback timer
        if (voicesLoaded && !hasSpokenWelcome) {
            welcomeTimer = setTimeout(speakWelcome, 1500);
        } else if (!hasSpokenWelcome) {
            // Fallback: speak after 3 seconds even if voices not loaded
            welcomeTimer = setTimeout(speakWelcome, 3000);
        }

        return () => {
            if (welcomeTimer) clearTimeout(welcomeTimer);
        };
    }, [voicesLoaded, language]); // Removed hasSpokenWelcome from deps to prevent re-triggering

    // Reset welcome spoken flag when language changes
    useEffect(() => {
        // Cancel any ongoing speech when language changes
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setHasSpokenWelcome(false);
    }, [language]);

    // Update transcriptRef when transcript changes
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Check if speech synthesis is supported
        if (!window.speechSynthesis) {
            console.error('Speech synthesis not supported in this browser');
            alert(language === 'mr-IN' ?
                'तुमचा ब्राउझर आवाज संश्लेषणाचे समर्थन करत नाही. कृपया Chrome किंवा Edge वापरा.' :
                language === 'hi-IN' ?
                    'आपका ब्राउज़र आवाज़ संश्लेषण का समर्थन नहीं करता. कृपया Chrome या Edge का उपयोग करें.' :
                    'Your browser does not support speech synthesis. Please use Chrome or Edge.'
            );
            return;
        }

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                console.log(`Speech recognition started for ${language}`);
            };

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
                console.log('Transcript:', transcriptText);
            };

            recognition.onend = () => {
                setIsListening(false);
                console.log('Speech recognition ended');
                // Use ref to get latest transcript value
                if (transcriptRef.current.trim().length > 0) {
                    handleSendMessage(transcriptRef.current);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);

                let errorMsg = 'Speech recognition error occurred.';
                if (language === 'mr-IN') {
                    errorMsg = 'आवाज ओळखण्यात समस्या आली. कृपया पुन्हा प्रयत्न करा.';
                } else if (language === 'hi-IN') {
                    errorMsg = 'आवाज़ पहचानने में समस्या हुई. कृपया फिर से कोशिश करें.';
                }

                // Show error message briefly
                setTranscript(errorMsg);
                setTimeout(() => setTranscript(''), 3000);
            };

            recognitionRef.current = recognition;
        } else {
            console.error("Speech Recognition not supported in this browser.");
            alert(language === 'mr-IN' ?
                'तुमचा ब्राउझर आवाज ओळखण्याचे समर्थन करत नाही.' :
                language === 'hi-IN' ?
                    'आपका ब्राउज़र आवाज़ पहचान का समर्थन नहीं करता.' :
                    'Your browser does not support speech recognition.'
            );
        }

        // Load voices for speech synthesis
        const loadVoices = () => {
            const voices = synthRef.current.getVoices();
            console.log('Loading voices, found:', voices.length);
            if (voices.length > 0) {
                setVoicesLoaded(true);
                console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
            }
        };

        // Load voices when they become available
        if (synthRef.current) {
            synthRef.current.onvoiceschanged = loadVoices;
            loadVoices(); // Try loading immediately

            // Fallback: try loading voices after a delay
            setTimeout(loadVoices, 1000);

            // Note: Welcome speech is now handled by the consolidated useEffect above
            // Removed duplicate speech attempt to prevent "interrupted" errors
        }

        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, [language]); // Re-initialize when language changes

    // Simple test speech function
    const testSpeech = () => {
        console.log('Testing speech synthesis...');
        const testText = language === 'mr-IN'
            ? 'नमस्कार! मी तुमचा आवाज असिस्टंट आहे.'
            : language === 'hi-IN'
                ? 'नमस्ते! मैं आपका आवाज़ सहायक हूं.'
                : 'Hello! I am your voice assistant.';

        if (synthRef.current) {
            const utterance = new SpeechSynthesisUtterance(testText);
            utterance.lang = language;
            utterance.onstart = () => {
                console.log('Test speech started');
                setIsSpeaking(true);
            };
            utterance.onend = () => {
                console.log('Test speech ended');
                setIsSpeaking(false);
            };
            utterance.onerror = (event) => {
                console.error('Test speech error:', event);
                setIsSpeaking(false);
            };
            synthRef.current.speak(utterance);
        } else {
            console.error('Speech synthesis not available');
            alert('Speech synthesis is not available in your browser');
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            // Stop any current speech when user wants to speak
            if (isSpeaking) {
                console.log('Interrupting speech to listen to user');
                stopSpeaking();
                setVoiceInterrupted(true);
            }

            setTranscript('');
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const handleSendMessage = async (text) => {
        if (!text) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setTranscript('');
        setLoading(true);

        try {
            // Enhanced language instruction for better AI responses
            let langInstruction = '';
            if (language === 'mr-IN') {
                langInstruction = '[Please provide a DETAILED, COMPREHENSIVE response in Marathi (मराठी) language. Use Devanagari script. Give step-by-step guidance, specific equipment recommendations with prices, seasonal timing, and practical farming advice for Maharashtra region. Minimum 150-200 words with actionable information.] ';
            } else if (language === 'hi-IN') {
                langInstruction = '[Please provide a DETAILED, COMPREHENSIVE response in Hindi (हिंदी) language. Use Devanagari script. Give step-by-step guidance, specific equipment recommendations with prices, seasonal timing, and practical farming advice for Indian farmers. Minimum 150-200 words with actionable information.] ';
            } else {
                langInstruction = '[Please provide a DETAILED, COMPREHENSIVE response in English. Give step-by-step guidance, specific equipment recommendations with prices, seasonal timing, and practical farming advice for Indian agriculture. Minimum 150-200 words with actionable information.] ';
            }

            const response = await sendChatMessage(langInstruction + text);
            const aiText = response.data.data.response;

            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

            // Reset voice interruption flag and speak the response
            setVoiceInterrupted(false);
            speak(aiText);

        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = language === 'mr-IN'
                ? "माफ करा, मला समजले नाही. कृपया पुन्हा प्रयत्न करा. मी तुम्हाला तपशीलवार माहिती देण्याचा प्रयत्न करतो."
                : language === 'hi-IN'
                    ? "माफ़ करें, मुझे समझने में परेशानी हुई. कृपया फिर से कोशिश करें. मैं आपको विस्तृत जानकारी देने की कोशिश करता हूं."
                    : "Sorry, I had trouble understanding that. Please try again. I aim to provide detailed, comprehensive information.";
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
            speak(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text) => {
        if (!synthRef.current) {
            console.error('Speech synthesis not available');
            return;
        }

        // Stop any current speech
        synthRef.current.cancel();

        // Reset interruption flag when starting new speech
        setVoiceInterrupted(false);

        const utterance = new SpeechSynthesisUtterance(text);

        // Set language and voice preferences
        utterance.lang = language;
        utterance.rate = 0.85; // Slightly slower for better clarity in Indian languages
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            setIsSpeaking(true);
            console.log('Started speaking:', text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setVoiceInterrupted(false);
            console.log('Finished speaking');
        };

        utterance.onerror = (event) => {
            // "interrupted" is normal when speech is cancelled, not an error
            if (event.error !== 'interrupted') {
                console.error('Speech synthesis error:', event.error);
            }
            setIsSpeaking(false);
            setVoiceInterrupted(false);
        };

        // Enhanced voice selection for Indian languages
        const voices = synthRef.current.getVoices();
        console.log('Available voices:', voices.length);

        let selectedVoice = null;

        if (language === 'hi-IN') {
            // Prefer Hindi voices
            selectedVoice = voices.find(v =>
                v.lang === 'hi-IN' ||
                v.lang === 'hi' ||
                v.name.toLowerCase().includes('hindi') ||
                v.name.toLowerCase().includes('lekha') ||
                v.name.toLowerCase().includes('kalpana')
            );
        } else if (language === 'mr-IN') {
            // Prefer Marathi voices (fallback to Hindi if not available)
            selectedVoice = voices.find(v =>
                v.lang === 'mr-IN' ||
                v.lang === 'mr' ||
                v.name.toLowerCase().includes('marathi')
            ) || voices.find(v =>
                v.lang === 'hi-IN' ||
                v.lang === 'hi'
            );
        } else {
            // English voices
            selectedVoice = voices.find(v =>
                v.lang === 'en-IN' ||
                v.lang === 'en-US' ||
                v.lang.startsWith('en')
            );
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            console.warn(`No suitable voice found for ${language}, using default`);
        }

        // Always speak, don't check voiceInterrupted here
        console.log('Starting speech synthesis...');
        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            console.log('Speech interrupted by user');
        }
    };

    const getPlaceholderText = () => {
        switch (language) {
            case 'mr-IN': return 'बोलण्यासाठी माईकवर टॅप करा';
            case 'hi-IN': return 'बोलने के लिए माइक पर टैप करें';
            default: return 'Tap mic to speak';
        }
    };

    const getListeningText = () => {
        switch (language) {
            case 'mr-IN': return 'ऐकत आहे...';
            case 'hi-IN': return 'सुन रहा हूं...';
            default: return 'Listening...';
        }
    };

    // Waveform animation bars
    const WaveformAnimation = () => (
        <div className="flex items-center justify-center gap-1 h-12">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-green-500 to-blue-500 rounded-full animate-pulse"
                    style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.5s'
                    }}
                />
            ))}
        </div>
    );

    return (
        <div className="h-[calc(100vh-100px)] flex p-4 gap-4">
            {/* Left Panel - Text Conversation */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/80 to-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-xl">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {language === 'mr-IN' ? 'संवाद इतिहास' : language === 'hi-IN' ? 'बातचीत का इतिहास' : 'Conversation History'}
                            </h2>
                            <p className="text-xs text-brand-text-muted">
                                {language === 'mr-IN' ? 'Google Gemini AI सह' : language === 'hi-IN' ? 'Google Gemini AI के साथ' : 'with Google Gemini AI'}
                            </p>
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div className="flex gap-2">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${language === lang.code
                                    ? 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white'
                                    : 'bg-slate-800/80 text-brand-text-muted hover:bg-slate-700 border border-white/10'
                                    }`}
                            >
                                {lang.flag} {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                {messages.length <= 1 && (
                    <div className="p-4 border-b border-white/10">
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(action.query)}
                                    className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all transform hover:scale-105 hover:border-green-500/50"
                                >
                                    <action.icon className="w-4 h-4 text-green-400" />
                                    <span className="text-xs text-brand-text-muted text-left">{action.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`p-3 rounded-2xl max-w-[85%] ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-none shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800/90 border border-white/10 text-brand-text-light rounded-bl-none shadow-lg'
                                }`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                            <Sparkles className="w-2 h-2 text-white" />
                                        </div>
                                        <span className="text-xs text-blue-400 font-medium">Gemini AI</span>
                                    </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800/90 p-3 rounded-2xl rounded-bl-none border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                                        <Sparkles className="w-2 h-2 text-white" />
                                    </div>
                                    <span className="text-xs text-blue-400">Thinking...</span>
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Right Panel - Voice Bot Interface */}
            <div className="w-96 flex flex-col bg-gradient-to-b from-slate-900/80 to-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-xl relative">
                {/* Voice Bot Header */}
                <div className="p-4 text-center border-b border-white/10">
                    {/* Powered by Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full border border-white/10 mb-2">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span className="text-xs font-medium text-white">Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Google Gemini AI</span></span>
                    </div>

                    <h2 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 mb-1">
                        🎙️ Voice Assistant
                    </h2>
                    <p className="text-brand-text-muted text-xs">
                        {language === 'mr-IN' ? 'तुमचा शेती सल्लागार' : language === 'hi-IN' ? 'आपका खेती सलाहकार' : 'Your farming advisor'}
                    </p>

                    {/* Voice Status */}
                    <div className="mt-2">
                        {voicesLoaded ? (
                            <span className="text-xs text-green-400 flex items-center justify-center gap-1">
                                ✅ {language === 'mr-IN' ? 'आवाज तयार आहे' : language === 'hi-IN' ? 'आवाज़ तैयार है' : 'Voice ready'}
                                {!hasSpokenWelcome && (
                                    <span className="ml-2 text-yellow-300">
                                        {language === 'mr-IN' ? '• येत आहे...' : language === 'hi-IN' ? '• आ रहा है...' : '• coming...'}
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="text-xs text-yellow-400 flex items-center justify-center gap-1">
                                ⏳ {language === 'mr-IN' ? 'आवाज लोड होत आहे...' : language === 'hi-IN' ? 'आवाज़ लोड हो रही है...' : 'Loading voices...'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Voice Interface */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    {/* Live Transcript / Waveform */}
                    <div className="min-h-20 flex items-center justify-center w-full text-center mb-8">
                        {isListening ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-end justify-center gap-1 h-10">
                                    {[...Array(7)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 bg-gradient-to-t from-green-400 to-blue-400 rounded-full"
                                            style={{
                                                animation: 'waveform 0.5s ease-in-out infinite',
                                                animationDelay: `${i * 0.1}s`,
                                                height: '10px'
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-lg text-green-400 font-medium">
                                    {transcript || getListeningText()}
                                </p>
                                {voiceInterrupted && (
                                    <p className="text-xs text-yellow-400">
                                        {language === 'mr-IN' ? '🔇 आवाज थांबवला, आता ऐकत आहे...' :
                                            language === 'hi-IN' ? '🔇 आवाज़ रोका, अब सुन रहा हूं...' :
                                                '🔇 Speech stopped, now listening...'}
                                    </p>
                                )}
                            </div>
                        ) : isSpeaking ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="w-6 h-6 text-purple-400 animate-pulse" />
                                    <span className="text-purple-300 text-center">
                                        {language === 'mr-IN' ? 'तपशीलवार उत्तर देत आहे...' :
                                            language === 'hi-IN' ? 'विस्तृत उत्तर दे रहा है...' :
                                                'Giving detailed response...'}
                                    </span>
                                </div>
                                <p className="text-xs text-purple-300/70 text-center">
                                    {language === 'mr-IN' ? 'बोलण्यासाठी माईकवर टॅप करा' :
                                        language === 'hi-IN' ? 'बोलने के लिए माइक पर टैप करें' :
                                            'Tap mic to interrupt and speak'}
                                </p>
                            </div>
                        ) : (
                            <p className="text-brand-text-muted text-center">{getPlaceholderText()}</p>
                        )}
                    </div>

                    {/* Main Mic Button */}
                    <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={loading}
                        className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none disabled:opacity-50 mb-6 ${isListening
                            ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-[0_0_50px_rgba(239,68,68,0.5)]'
                            : 'bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]'
                            }`}
                    >
                        {/* Outer ring animation */}
                        {isListening && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                                <div className="absolute inset-[-10px] rounded-full border-2 border-red-400/50 animate-pulse" />
                            </>
                        )}

                        {/* Inner glow */}
                        <div className="absolute inset-3 rounded-full bg-white/10 backdrop-blur-sm" />

                        {isListening ? (
                            <StopCircle className="w-12 h-12 text-white relative z-10" />
                        ) : (
                            <Mic className="w-12 h-12 text-white relative z-10" />
                        )}
                    </button>

                    {/* Help tip */}
                    <p className="text-xs text-brand-text-muted/60 flex items-center gap-1 text-center">
                        <HelpCircle className="w-3 h-3" />
                        {language === 'mr-IN' ? 'मराठी, हिंदी किंवा इंग्रजीमध्ये बोला' :
                            language === 'hi-IN' ? 'मराठी, हिंदी या अंग्रेज़ी में बोलें' :
                                'Speak in Marathi, Hindi or English'}
                    </p>
                </div>

                {/* Control Buttons */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex justify-center gap-3">
                        {/* Stop Speaking Button */}
                        {isSpeaking && (
                            <button
                                onClick={stopSpeaking}
                                className="p-3 rounded-full bg-purple-600/80 text-white hover:bg-purple-500 transition-colors flex items-center gap-2 border border-purple-400/30"
                            >
                                <VolumeX className="w-4 h-4" />
                                <span className="text-sm">
                                    {language === 'mr-IN' ? 'थांबा' : language === 'hi-IN' ? 'रुको' : 'Stop'}
                                </span>
                            </button>
                        )}

                        {/* Voice Test Button */}
                        {!isListening && !isSpeaking && (
                            <button
                                onClick={testSpeech}
                                className="p-3 rounded-full bg-blue-600/80 text-white hover:bg-blue-500 transition-colors flex items-center gap-2 border border-blue-400/30"
                            >
                                <Volume2 className="w-4 h-4" />
                                <span className="text-sm">
                                    {language === 'mr-IN' ? 'आवाज तपासा' : language === 'hi-IN' ? 'आवाज़ जांचें' : 'Test Voice'}
                                </span>
                            </button>
                        )}

                        {/* Welcome Speech Button */}
                        {!isListening && !isSpeaking && voicesLoaded && (
                            <button
                                onClick={() => {
                                    const welcomeMessage = language === 'mr-IN'
                                        ? 'नमस्कार! मी तुमचा शेती सल्लागार आहे. मी Google Gemini AI वापरून तुम्हाला तपशीलवार शेतीविषयक सल्ला देतो. तुम्ही मराठी, हिंदी किंवा इंग्रजीमध्ये बोलू शकता. माईकवर टॅप करा आणि मला काहीही विचारा!'
                                        : language === 'hi-IN'
                                            ? 'नमस्ते! मैं आपका खेती सलाहकार हूं. मैं Google Gemini AI का उपयोग करके आपको विस्तृत कृषि सलाह देता हूं. आप मराठी, हिंदी या अंग्रेजी में बोल सकते हैं. माइक पर टैप करें और मुझसे कुछ भी पूछें!'
                                            : 'Hello! I am your farming advisor. I use Google Gemini AI to provide detailed agricultural advice. You can speak in Marathi, Hindi, or English. Tap the microphone and ask me anything about farming!';
                                    speak(welcomeMessage);
                                }}
                                className="p-3 rounded-full bg-green-600/80 text-white hover:bg-green-500 transition-colors flex items-center gap-2 border border-green-400/30"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm">
                                    {language === 'mr-IN' ? 'स्वागत संदेश' : language === 'hi-IN' ? 'स्वागत संदेश' : 'Welcome'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS for waveform animation */}
            <style>{`
                @keyframes waveform {
                    0%, 100% { height: 10px; }
                    50% { height: 35px; }
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistant;

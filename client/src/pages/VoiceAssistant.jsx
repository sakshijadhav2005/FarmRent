
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, StopCircle, Globe } from 'lucide-react';
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
        { role: 'assistant', content: "नमस्कार! मी तुमचा AI सहाय्यक आहे. माईकवर टॅप करा आणि मला काहीही विचारा! / Hello! I am your AI Assistant." }
    ]);
    const [loading, setLoading] = useState(false);

    // Language options
    const languages = [
        { code: 'en-IN', label: 'English', flag: '🇬🇧' },
        { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' },
        { code: 'mr-IN', label: 'मराठी', flag: '🇮🇳' },
    ];

    // Refs for speech synthesis and recognition
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const transcriptRef = useRef('');

    // Update transcriptRef when transcript changes
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onstart = () => setIsListening(true);

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognition.onend = () => {
                setIsListening(false);
                // Use ref to get latest transcript value
                if (transcriptRef.current.trim().length > 0) {
                    handleSendMessage(transcriptRef.current);
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.error("Speech Recognition not supported in this browser.");
        }

        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, [language]); // Re-initialize when language changes

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
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
            // Add language instruction to the message for AI
            const langInstruction = language === 'mr-IN'
                ? '[Respond in Marathi (मराठी)] '
                : language === 'hi-IN'
                    ? '[Respond in Hindi (हिंदी)] '
                    : '';

            const response = await sendChatMessage(langInstruction + text);
            const aiText = response.data.data.response;

            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

            // Speak the response
            speak(aiText);

        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg = language === 'mr-IN'
                ? "माफ करा, मला समजले नाही. कृपया पुन्हा प्रयत्न करा."
                : "Sorry, I had trouble understanding that. Please try again.";
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
            speak(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const speak = (text) => {
        if (!synthRef.current) return;

        // Stop any current speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        // Try to find a voice matching the language
        const voices = synthRef.current.getVoices();
        const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
        if (langVoice) utterance.voice = langVoice;

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
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

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col p-4">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                    🎙️ Voice Assistant
                </h1>
                <p className="text-brand-text-muted">
                    {language === 'mr-IN' ? 'मला काहीही विचारा - मी तुम्हाला मदत करेन!' :
                        language === 'hi-IN' ? 'मुझसे कुछ भी पूछें - मैं आपकी मदद करूंगा!' :
                            'Ask me anything - I\'m here to help!'}
                </p>

                {/* Language Selector */}
                <div className="flex justify-center gap-2 mt-4">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${language === lang.code
                                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                                : 'bg-slate-800 text-brand-text-muted hover:bg-slate-700'
                                }`}
                        >
                            {lang.flag} {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm custom-scrollbar">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                            : 'bg-slate-800 border border-white/10 text-brand-text-light rounded-bl-none shadow-lg'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-none flex gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}

                <div id="scroll-bottom" />
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center justify-center gap-6 py-6 bg-slate-900/50 rounded-3xl border border-white/5 relative">

                {/* Live Transcript */}
                <div className="h-12 flex items-center justify-center w-full px-4 text-center">
                    {isListening ? (
                        <p className="text-xl text-green-400 font-medium animate-pulse">
                            {transcript || getListeningText()}
                        </p>
                    ) : (
                        <p className="text-brand-text-muted">{getPlaceholderText()}</p>
                    )}
                </div>

                {/* Main Mic Button */}
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 focus:outline-none ${isListening
                        ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-br from-brand-primary to-green-600 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                        }`}
                >
                    {isListening ? (
                        <>
                            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                            <StopCircle className="w-8 h-8 text-white relative z-10" />
                        </>
                    ) : (
                        <Mic className="w-8 h-8 text-white relative z-10" />
                    )}
                </button>

                {/* Audio Controls */}
                {isSpeaking && (
                    <button
                        onClick={stopSpeaking}
                        className="absolute right-4 bottom-4 p-3 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <VolumeX className="w-5 h-5" />
                        <span className="text-sm hidden sm:inline">
                            {language === 'mr-IN' ? 'थांबा' : 'Stop'}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default VoiceAssistant;

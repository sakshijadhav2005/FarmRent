import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader, Sparkles, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage, getChatSuggestions } from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * AI Crop Assistant Chat Widget
 * Floating chat bubble with AI-powered farming assistance
 */
const ChatWidget = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Load suggestions
        getChatSuggestions()
            .then(res => setSuggestions(res.data?.data || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        // Scroll to bottom on new messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add welcome message when first opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: t('chat.welcome')
            }]);
        }
    }, [isOpen, user, t]);

    const handleSend = async (text = input) => {
        if (!text.trim() || loading) return;

        const userMessage = { role: 'user', content: text.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await sendChatMessage(text.trim(), sessionId);
            if (response.data?.success) {
                setSessionId(response.data.data.sessionId);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.data.data.response
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen
                    ? 'bottom-[480px] right-6 w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full border border-white/20'
                    : 'bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full hover:scale-110'
                    }`}
                style={{ boxShadow: isOpen ? 'none' : '0 0 30px rgba(34, 197, 94, 0.4)' }}
            >
                {isOpen ? (
                    <X className="w-5 h-5 text-white" />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-secondary rounded-full flex items-center justify-center">
                            <Sparkles className="w-2.5 h-2.5 text-brand-background" />
                        </span>
                    </>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-40 w-[380px] h-[450px] bg-brand-background/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                    style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-sm">{t('chat.title')}</h3>
                            <p className="text-white/80 text-xs">{t('chat.subtitle')} 🌾</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                    ? 'bg-brand-primary text-white rounded-br-md'
                                    : 'bg-white/10 text-brand-text-light rounded-bl-md'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                                    <Loader className="w-5 h-5 text-brand-primary animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {messages.length <= 1 && suggestions.length > 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {suggestions.slice(0, 3).map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(s.text)}
                                    className="text-xs bg-white/5 hover:bg-white/10 text-brand-text-muted px-3 py-1.5 rounded-full border border-white/10 transition-colors"
                                >
                                    {s.icon} {s.text.slice(0, 30)}...
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={t('chat.placeholder')}
                                className="flex-1 bg-transparent text-white text-sm placeholder-brand-text-muted outline-none"
                                disabled={loading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 bg-brand-primary hover:bg-brand-primary-dark rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                            >
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;

/**
 * Direct Chat Component
 * =====================
 * This file contains the P2P (peer-to-peer) messaging system for FarmLink.
 * 
 * COMPONENTS:
 * 1. DirectMessageChat   - Individual chat window with a specific user
 * 2. ConversationList    - Shows all active conversations
 * 3. DirectChatInterface - Main component (floating button + modals)
 * 
 * FEATURES:
 * - Real-time message updates via polling (every 3 seconds)
 * - Message grouping by date (Today, Yesterday, actual dates)
 * - Read receipts (✓ sent, ✓✓ read)
 * - Context-aware messaging (can be linked to equipment)
 * - Responsive design for all devices
 * 
 * USAGE:
 * Import and add <DirectChatInterface /> to your main layout.
 * It renders a floating chat button in the bottom-right corner.
 * 
 * EXAMPLE:
 * ```jsx
 * import DirectChatInterface from './components/DirectChat';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <YourContent />
 *       <DirectChatInterface />  // Floating chat button
 *     </div>
 *   );
 * }
 * ```
 * 
 * @author FarmLink Development Team
 */

import React, { useState, useEffect, useRef } from 'react';

// Icons from Lucide React - a modern icon library
import { MessageCircle, X, Send, Loader2, User, Search, ArrowLeft, Check, CheckCheck } from 'lucide-react';

// i18n hook for internationalization (multi-language support)
import { useTranslation } from 'react-i18next';

// Auth context to get current user and auth token
import { useAuth } from '../context/AuthContext';

// Backend API base URL
const API_BASE = 'http://localhost:5001/api';

/**
 * DirectMessageChat Component
 * ===========================
 * Displays the chat window for messaging with a specific user.
 * 
 * @param {string} recipientId   - The MongoDB ID of the user you're chatting with
 * @param {string} recipientName - Display name of the recipient
 * @param {string} equipmentId   - Optional: Links the conversation to specific equipment
 * @param {function} onClose     - Callback to close the chat window
 */
const DirectMessageChat = ({ recipientId, recipientName, equipmentId, onClose }) => {
    const { user, token } = useAuth();
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const pollInterval = useRef(null);

    // Fetch conversation messages
    const fetchMessages = async () => {
        if (!recipientId || !token) return;

        try {
            const res = await fetch(`${API_BASE}/messages/conversation/${recipientId}?equipmentId=${equipmentId || ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 3 seconds
        pollInterval.current = setInterval(fetchMessages, 3000);

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [recipientId, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`${API_BASE}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId,
                    content: input.trim(),
                    equipmentId
                })
            });

            const data = await res.json();
            if (data.success) {
                setInput('');
                fetchMessages(); // Refresh messages
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return t('common.today', 'Today');
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return t('common.yesterday', 'Yesterday');
        return d.toLocaleDateString();
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = formatDate(msg.createdAt);
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg h-[600px] max-h-[90vh] bg-brand-surface rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-4 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-sm">{recipientName}</h3>
                        <p className="text-white/80 text-xs">{t('chat.directMessage', 'Direct Message')}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-background/50">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            {/* Date Divider */}
                            <div className="flex items-center justify-center my-4">
                                <div className="bg-brand-surface px-3 py-1 rounded-full text-xs text-brand-text-muted">
                                    {date}
                                </div>
                            </div>

                            {/* Messages for this date */}
                            {msgs.map((msg, index) => {
                                const isOwn = msg.sender._id === user?.id || msg.sender === user?.id;
                                return (
                                    <div key={msg._id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn
                                            ? 'bg-brand-primary text-white rounded-br-md'
                                            : 'bg-white/10 text-brand-text-light rounded-bl-md'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[10px] opacity-70">{formatTime(msg.createdAt)}</span>
                                                {isOwn && (
                                                    msg.read
                                                        ? <CheckCheck className="w-3 h-3 text-blue-400" />
                                                        : <Check className="w-3 h-3 opacity-70" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {messages.length === 0 && (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <div className="text-center text-brand-text-muted">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{t('chat.startConversation', 'Start a conversation')}</p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-brand-surface">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('chat.typeMessage', 'Type a message...')}
                            className="flex-1 bg-transparent text-white text-sm placeholder-brand-text-muted outline-none"
                            disabled={sending}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="w-10 h-10 bg-brand-primary hover:bg-brand-primary-dark rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Conversation List Component
 * Shows all active conversations for the user
 */
const ConversationList = ({ onSelectConversation }) => {
    const { user, token } = useAuth();
    const { t } = useTranslation();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchConversations = async () => {
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE}/messages/conversations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setConversations(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        // Poll for new conversations
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [token]);

    const filteredConversations = conversations.filter(conv =>
        conv.participant?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('chat.searchConversations', 'Search conversations...')}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-brand-text-muted focus:outline-none focus:border-brand-primary"
                />
            </div>

            {/* Conversation List */}
            <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-brand-text-muted">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{t('chat.noConversations', 'No conversations yet')}</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => (
                        <button
                            key={conv._id}
                            onClick={() => onSelectConversation(conv)}
                            className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">
                                    {conv.participant?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-brand-text-light truncate">
                                        {conv.participant?.name || 'Unknown User'}
                                    </h4>
                                    <span className="text-xs text-brand-text-muted">
                                        {formatTime(conv.lastMessage?.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-brand-text-muted truncate">
                                    {conv.lastMessage?.content || t('chat.noMessages', 'No messages')}
                                </p>
                            </div>
                            {conv.unreadCount > 0 && (
                                <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-white font-bold">{conv.unreadCount}</span>
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

/**
 * Main Chat Interface Component
 * Combines conversation list and direct messaging
 */
const DirectChatInterface = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    if (!user) return null;

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed z-40 bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
                style={{ boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}
            >
                <MessageCircle className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Modal */}
            {isOpen && !activeConversation && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md max-h-[80vh] bg-brand-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-white text-lg">{t('chat.messages', 'Messages')}</h2>
                                <p className="text-white/80 text-sm">{t('chat.yourConversations', 'Your conversations')}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <ConversationList
                                onSelectConversation={(conv) => setActiveConversation(conv)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Active Conversation */}
            {activeConversation && (
                <DirectMessageChat
                    recipientId={activeConversation.participant?._id}
                    recipientName={activeConversation.participant?.name}
                    equipmentId={activeConversation.equipment?._id}
                    onClose={() => {
                        setActiveConversation(null);
                        setIsOpen(false);
                    }}
                />
            )}
        </>
    );
};

export { DirectMessageChat, ConversationList, DirectChatInterface };
export default DirectChatInterface;

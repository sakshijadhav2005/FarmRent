# Software Requirements Specification (SRS)
# FarmRent Platform Enhancement

**Version:** 2.0  
**Date:** January 9, 2026  
**Project:** Farm Equipment Rental Platform Enhancement

---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for enhancing the FarmRent platform with new features to differentiate it from competitors and provide more value to users.

### 1.2 Scope
The enhancement covers:
- Quick Win Features (Email notifications, Reviews, Search filters, etc.)
- AI Crop Assistant Chatbot
- Partner Integration API

### 1.3 Definitions
| Term | Definition |
|------|------------|
| Farmer | User who rents equipment |
| Owner | User who lists equipment for rent |
| Worker | User who provides labor services |
| Booking | Equipment rental transaction |

---

## 2. System Overview

### 2.1 Current System
- MERN Stack (MongoDB, Express, React, Node.js)
- JWT Authentication with role-based access
- Stripe Payment Integration
- Weather API Integration
- Equipment booking and management

### 2.2 Enhancement Goals
1. Improve user engagement through notifications and reviews
2. Add AI-powered crop assistance
3. Create APIs for third-party integrations
4. Enhance search and discovery features

---

## 3. Feature Requirements

## 3.1 Quick Win Features

### 3.1.1 Email Notifications
**Priority:** High | **Effort:** Low

**Requirements:**
- FR-3.1.1.1: System SHALL send email on successful booking
- FR-3.1.1.2: System SHALL notify owner when equipment is booked
- FR-3.1.1.3: System SHALL send booking reminder 24 hours before start
- FR-3.1.1.4: System SHALL send payment confirmation emails
- FR-3.1.1.5: Users SHALL be able to configure notification preferences

**Technical Approach:**
- Use Nodemailer with Gmail/SendGrid SMTP
- Create email templates with handlebars
- Add notification preferences to User model

### 3.1.2 Review & Rating System
**Priority:** High | **Effort:** Medium

**Requirements:**
- FR-3.1.2.1: Farmers SHALL rate equipment after booking completion
- FR-3.1.2.2: Owners SHALL rate farmers after rental
- FR-3.1.2.3: Reviews SHALL include star rating (1-5) and text comment
- FR-3.1.2.4: System SHALL display average rating on equipment cards
- FR-3.1.2.5: Reviews SHALL be editable within 48 hours of submission

**Data Model:**
```javascript
Review = {
  booking: ObjectId (ref: Booking),
  reviewer: ObjectId (ref: User),
  reviewee: ObjectId (ref: User),
  equipment: ObjectId (ref: Equipment),
  rating: Number (1-5),
  comment: String,
  reviewType: 'equipment' | 'farmer' | 'owner',
  createdAt: Date,
  updatedAt: Date
}
```

### 3.1.3 Equipment Comparison Tool
**Priority:** Medium | **Effort:** Medium

**Requirements:**
- FR-3.1.3.1: Users SHALL add up to 4 equipment to comparison
- FR-3.1.3.2: Comparison SHALL show side-by-side specs
- FR-3.1.3.3: System SHALL highlight differences
- FR-3.1.3.4: Comparison data SHALL persist in session

### 3.1.4 Wishlist/Favorites
**Priority:** Medium | **Effort:** Low

**Requirements:**
- FR-3.1.4.1: Users SHALL add equipment to wishlist
- FR-3.1.4.2: System SHALL show wishlist count on navbar
- FR-3.1.4.3: Users SHALL view all wishlist items in dashboard
- FR-3.1.4.4: System SHALL notify when wishlist item becomes available

### 3.1.5 Invoice PDF Generation
**Priority:** Medium | **Effort:** Low

**Requirements:**
- FR-3.1.5.1: System SHALL generate PDF invoice for completed bookings
- FR-3.1.5.2: Invoice SHALL include booking details, pricing, taxes
- FR-3.1.5.3: Users SHALL download invoice from booking history
- FR-3.1.5.4: Invoice SHALL have unique invoice number

**Technical Approach:**
- Use PDFKit or puppeteer for PDF generation
- Store invoice number in Booking model

### 3.1.6 Advanced Search Filters
**Priority:** High | **Effort:** Low

**Requirements:**
- FR-3.1.6.1: Users SHALL filter by equipment type
- FR-3.1.6.2: Users SHALL filter by price range (min-max)
- FR-3.1.6.3: Users SHALL filter by location/distance
- FR-3.1.6.4: Users SHALL filter by availability dates
- FR-3.1.6.5: Users SHALL sort by price, rating, distance
- FR-3.1.6.6: Filters SHALL persist in URL for sharing

### 3.1.7 Admin Panel
**Priority:** High | **Effort:** Medium

**Requirements:**
- FR-3.1.7.1: Admins SHALL view all users, equipment, bookings
- FR-3.1.7.2: Admins SHALL approve/reject new equipment listings
- FR-3.1.7.3: Admins SHALL view platform analytics
- FR-3.1.7.4: Admins SHALL manage reported reviews
- FR-3.1.7.5: Admins SHALL export data to CSV

### 3.1.8 Multi-Language Support
**Priority:** Medium | **Effort:** Medium

**Requirements:**
- FR-3.1.8.1: System SHALL support English and Hindi
- FR-3.1.8.2: Users SHALL switch language from settings
- FR-3.1.8.3: Language preference SHALL persist

**Technical Approach:**
- Use i18next for React
- Create translation JSON files
- Store preference in localStorage and User model

---

## 3.2 AI Crop Assistant

### 3.2.1 Overview
An AI-powered chatbot that helps farmers make informed decisions about equipment rental based on their crop type, season, and weather conditions.

### 3.2.2 Functional Requirements

**Core Chat Features:**
- FR-3.2.2.1: System SHALL provide chat interface accessible from all pages
- FR-3.2.2.2: Assistant SHALL respond to natural language queries
- FR-3.2.2.3: Chat history SHALL persist for logged-in users
- FR-3.2.2.4: System SHALL support voice input (optional)

**Equipment Recommendations:**
- FR-3.2.2.5: Assistant SHALL recommend equipment based on crop type
- FR-3.2.2.6: Assistant SHALL consider weather when recommending
- FR-3.2.2.7: Assistant SHALL suggest optimal booking times
- FR-3.2.2.8: Assistant SHALL provide equipment comparison

**Farming Intelligence:**
- FR-3.2.2.9: Assistant SHALL answer farming-related queries
- FR-3.2.2.10: Assistant SHALL provide seasonal crop advice
- FR-3.2.2.11: Assistant SHALL suggest soil preparation tips
- FR-3.2.2.12: Assistant SHALL integrate with weather forecast

### 3.2.3 Data Model
```javascript
ChatSession = {
  user: ObjectId (ref: User),
  messages: [{
    role: 'user' | 'assistant',
    content: String,
    timestamp: Date,
    context: {
      crop: String,
      location: String,
      weather: Object
    }
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2.4 Technical Approach
- Use Google Gemini API or OpenAI API
- Create system prompts with farming knowledge
- Integrate with existing weather API
- Cache common responses

### 3.2.5 Sample Interactions
```
User: "What equipment do I need for rice cultivation?"
AI: "For rice cultivation, you'll need:
    1. Tractor with Puddler - for field preparation
    2. Rice Transplanter - for planting
    3. Harvester - for harvesting
    Based on weather forecast showing clear skies next week,
    I recommend booking the tractor for field prep now."

User: "Best time to use harvester this week?"
AI: "Looking at the 7-day forecast for your location (Pune):
    - Wednesday & Thursday show IDEAL conditions ☀️
    - Avoid Friday due to expected rain 🌧️
    Shall I check harvester availability for Wednesday?"
```

---

## 3.3 Partner Integration API

### 3.3.1 Overview
RESTful APIs allowing third-party systems to integrate with FarmRent for research, government programs, and business partnerships.

### 3.3.2 API Categories

**3.3.2.1 Public APIs (No Auth Required):**
- GET /api/public/equipment - List available equipment
- GET /api/public/stats - Platform statistics
- GET /api/public/types - Equipment types

**3.3.2.2 Partner APIs (API Key Required):**
- GET /api/partner/equipment - Detailed equipment data
- GET /api/partner/availability - Check availability
- POST /api/partner/booking - Create booking
- GET /api/partner/analytics - Usage analytics

**3.3.2.3 Government APIs (Special Auth):**
- GET /api/gov/farmers - Anonymized farmer data
- GET /api/gov/usage-stats - Regional usage statistics
- POST /api/gov/subsidies - Apply subsidy to bookings

### 3.3.3 Data Models
```javascript
APIPartner = {
  name: String,
  email: String,
  organization: String,
  apiKey: String (hashed),
  tier: 'free' | 'basic' | 'premium' | 'government',
  rateLimit: Number,
  permissions: [String],
  webhookUrl: String,
  isActive: Boolean,
  createdAt: Date
}

APILog = {
  partner: ObjectId (ref: APIPartner),
  endpoint: String,
  method: String,
  statusCode: Number,
  responseTime: Number,
  timestamp: Date
}
```

### 3.3.4 Rate Limits
| Tier | Requests/Hour | Endpoints |
|------|---------------|-----------|
| Free | 100 | Public only |
| Basic | 1,000 | Public + Partner |
| Premium | 10,000 | All endpoints |
| Government | Unlimited | All + Special |

### 3.3.5 Webhook Events
Partners can subscribe to:
- `booking.created`
- `booking.completed`
- `equipment.listed`
- `review.submitted`

---

## 4. Non-Functional Requirements

### 4.1 Performance
- NFR-4.1.1: API response time < 500ms for 95% of requests
- NFR-4.1.2: Page load time < 3 seconds
- NFR-4.1.3: Support 1000 concurrent users

### 4.2 Security
- NFR-4.2.1: All API keys must be hashed
- NFR-4.2.2: Rate limiting on all endpoints
- NFR-4.2.3: Input validation on all forms
- NFR-4.2.4: SQL injection prevention
- NFR-4.2.5: XSS protection

### 4.3 Reliability
- NFR-4.3.1: 99.5% uptime target
- NFR-4.3.2: Automated database backups
- NFR-4.3.3: Error logging and monitoring

---

## 5. Implementation Phases

### Phase 1: Quick Wins (Week 1-2)
1. Email Notifications
2. Advanced Search Filters
3. Wishlist/Favorites
4. Invoice PDF Generation

### Phase 2: Engagement (Week 3-4)
5. Review & Rating System
6. Equipment Comparison Tool
7. Multi-Language Support (English + Hindi)

### Phase 3: AI Integration (Week 5-6)
8. AI Crop Assistant Backend
9. AI Crop Assistant Frontend Chat UI
10. Weather + AI Integration

### Phase 4: Platform Growth (Week 7-8)
11. Admin Panel
12. Partner Integration API
13. API Documentation
14. Webhook System

---

## 6. Database Schema Updates

### 6.1 New Collections
```javascript
// Reviews Collection
reviews: {
  booking, reviewer, reviewee, equipment,
  rating, comment, reviewType, createdAt
}

// Wishlists Collection
wishlists: {
  user, equipment, addedAt
}

// Chat Sessions Collection
chatSessions: {
  user, messages[], createdAt
}

// API Partners Collection
apiPartners: {
  name, email, organization, apiKey,
  tier, rateLimit, permissions[], webhookUrl
}

// Notifications Collection
notifications: {
  user, type, title, message, read, createdAt
}
```

### 6.2 Schema Modifications
```javascript
// User Model Additions
User: {
  ...existing,
  language: { type: String, default: 'en' },
  notificationPrefs: {
    email: Boolean,
    booking: Boolean,
    marketing: Boolean
  },
  avgRating: Number,
  totalReviews: Number
}

// Equipment Model Additions
Equipment: {
  ...existing,
  avgRating: Number,
  totalReviews: Number,
  isApproved: Boolean,
  approvedBy: ObjectId
}

// Booking Model Additions
Booking: {
  ...existing,
  invoiceNumber: String,
  isReviewed: Boolean
}
```

---

## 7. API Endpoints Summary

### 7.1 New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reviews | Create review |
| GET | /api/reviews/equipment/:id | Get equipment reviews |
| GET | /api/reviews/user/:id | Get user reviews |
| POST | /api/wishlist | Add to wishlist |
| DELETE | /api/wishlist/:id | Remove from wishlist |
| GET | /api/wishlist | Get user wishlist |
| GET | /api/equipment/compare | Compare equipment |
| GET | /api/bookings/:id/invoice | Download invoice |
| POST | /api/chat | Send message to AI |
| GET | /api/chat/history | Get chat history |
| POST | /api/notifications/send | Send notification |
| GET | /api/notifications | Get user notifications |
| POST | /api/partner/register | Register API partner |
| GET | /api/admin/users | Admin: Get all users |
| GET | /api/admin/analytics | Admin: Get analytics |

---

## 8. UI/UX Requirements

### 8.1 New Components
1. **ReviewCard** - Display individual review
2. **RatingStars** - Star rating input/display
3. **CompareDrawer** - Equipment comparison sidebar
4. **ChatWidget** - Floating AI chat bubble
5. **FilterPanel** - Advanced search filters
6. **InvoiceView** - Invoice preview/download
7. **NotificationBell** - Notification dropdown
8. **AdminSidebar** - Admin panel navigation
9. **LanguageSwitcher** - Language toggle

### 8.2 Page Updates
- **Search Page**: Add filter panel, sort options
- **Equipment Details**: Add reviews section, wishlist button
- **Dashboard**: Add notifications, wishlist section
- **Profile**: Add language preference, notification settings

---

## 9. Third-Party Services

| Service | Purpose | Provider |
|---------|---------|----------|
| Email | Notifications | SendGrid / Nodemailer |
| AI Chat | Crop Assistant | Google Gemini API |
| PDF | Invoice Generation | PDFKit |
| Translations | Multi-language | i18next |

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Email open rate | > 40% |
| Review submission rate | > 30% of completed bookings |
| AI chat engagement | > 20% of active users |
| API partner signups | 10+ in first quarter |
| Search filter usage | > 50% of searches |

---

## 11. Appendix

### 11.1 Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API
- **Email**: Nodemailer + SendGrid
- **PDF**: PDFKit
- **i18n**: i18next

### 11.2 File Structure (New)
```
client/src/
├── components/
│   ├── reviews/
│   ├── chat/
│   ├── comparison/
│   └── notifications/
├── pages/
│   └── admin/
├── i18n/
│   ├── en.json
│   └── hi.json
└── hooks/
    ├── useChat.js
    └── useNotifications.js

server/
├── controllers/
│   ├── reviewController.js
│   ├── chatController.js
│   ├── notificationController.js
│   └── adminController.js
├── models/
│   ├── Review.js
│   ├── ChatSession.js
│   ├── APIPartner.js
│   └── Notification.js
├── routes/
│   ├── reviews.js
│   ├── chat.js
│   ├── admin.js
│   └── partner.js
├── services/
│   ├── emailService.js
│   ├── aiService.js
│   └── pdfService.js
└── middleware/
    ├── apiAuth.js
    └── rateLimit.js
```

---

**Document End**

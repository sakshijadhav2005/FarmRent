# 🚜 FarmLink - Smart Agriculture & Rental Platform

**FarmLink** is a comprehensive digital platform designed to bridge the gap between farmers and equipment owners in India. It empowers farmers with AI-driven insights, smart rental solutions, and localized tools to optimize their farming operations.

## 🌟 Key Features

### 🧠 AI Smart Work Planner
- **Intelligent Analysis**: Analyzes local weather, soil conditions, and crop requirements to recommend the best time for farming activities (Harvesting, Sowing, Spraying).
- **Multilingual Support**: Fully localized recommendations in **English, Hindi (हिंदी), and Marathi (मराठी)**.
- **Detailed Reports**: Generates comprehensive PDF reports with step-by-step guides, risk assessments, and market insights.
- **Voice Assistance**: Reads out recommendations in the selected local language for accessibility.

### 🚜 Equipment Rental Marketplace
- **Easy Booking**: Farmers can browse and book equipment (Tractors, Harvesters, Drones) from local owners.
- **Smart Search**: Geo-location based search to find nearest available equipment.
- **Availability Calendar**: Real-time checking of equipment availability.

### 🌤️ Weather Integration
- **Real-time Forecasts**: Integrated hyper-local weather data for precise planning.
- **Impact Analysis**: AI evaluates how current weather conditions affect specific farming tasks.

### 💳 Secure Payments
- Integrated with **Stripe** for secure online transactions.
- Supports UPI and other local payment methods.

## 🛠️ Technology Stack

### Frontend
- **React.js (Vite)**: Fast, modern UI library.
- **Tailwind CSS**: Responsive and beautiful styling.
- **i18next**: Robust internationalization (English, Hindi, Marathi).
- **html2pdf.js**: Client-side PDF generation.
- **Lucide React**: Modern iconography.

### Backend
- **Node.js & Express**: Scalable REST API.
- **MongoDB**: Flexible database for users, bookings, and equipment.
- **Google Gemini AI**: Powering the advanced research and recommendation engine.
- **Passport.js**: Secure authentication (Local + Google OAuth).
- **PDFKit**: Server-side document handling.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud API Key (for Gemini AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/farmlink.git
   cd farmlink
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration
Create a `.env` file in the `server` directory with the following keys:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_key
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
GOOGLE_SEARCH_API_KEY=your_search_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Running the App

1. **Start the Server**
   ```bash
   cd server
   npm run dev
    # Runs on http://localhost:5000
   ```

2. **Start the Client**
   ```bash
   cd client
   npm run dev
    # Runs on http://localhost:5173
   ```

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.

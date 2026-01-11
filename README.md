# Farm Equipment Rental Platform - Project Structure

## Client (Frontend)
```
client/
├── src/
│   ├── api.js                    # Axios API utility
│   ├── App.jsx                   # Main app with routing
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Tailwind imports
│   ├── components/
│   │   └── EquipmentCard.jsx     # Equipment display card
│   ├── pages/
│   │   ├── Home.jsx              # Landing page
│   │   ├── Login.jsx             # Login form
│   │   ├── Register.jsx          # Registration with role selection
│   │   ├── Dashboard.jsx         # User dashboard
│   │   ├── Search.jsx            # Equipment search
│   │   ├── AddEquipment.jsx      # Add equipment form
│   │   └── EquipmentDetails.jsx  # Equipment detail view
│   ├── layouts/
│   │   └── MainLayout.jsx        # Main layout with nav
│   └── context/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Server (Backend)
```
server/
├── index.js                      # Express server entry
├── .env                          # Environment variables
├── package.json
├── db/
│   └── db.js                     # MongoDB connection
├── models/
│   ├── User.js                   # User schema (farmer/owner/admin)
│   ├── Equipment.js              # Equipment schema
│   └── Booking.js                # Booking schema
├── controllers/
│   ├── authController.js         # Auth logic (register/login)
│   ├── equipmentController.js    # Equipment CRUD
│   └── bookingController.js      # Booking management
├── middleware/
│   └── auth.js                   # JWT auth & role authorization
└── routes/
    ├── auth.js                   # Auth routes
    ├── equipment.js              # Equipment routes
    └── bookings.js               # Booking routes
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Equipment
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get single equipment
- `POST /api/equipment` - Create equipment (owner only)
- `PUT /api/equipment/:id` - Update equipment (owner only)
- `DELETE /api/equipment/:id` - Delete equipment (owner only)

### Bookings
- `GET /api/bookings` - Get bookings (role-based)
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking (farmer only)
- `PUT /api/bookings/:id` - Update booking (owner/admin)
- `DELETE /api/bookings/:id` - Delete booking

## Technologies Used

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- dotenv

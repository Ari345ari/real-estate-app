ReEaalEstate CS425 Project 
Built with React and Node.js/PostgreSQL

Frontend (React, React Router, Axios, CSS)
Backend (Node.js, Express, PostgreSQL, JWT Authentication)

Features of the app

Renters
- Browse properties (apartments, houses, vacation rentals, commercial, and land)
- Search and filter (filter by city, property type, listing type(sale/rent), bedrooms, and price)
- Neighborhood Info (crime rate, nearby schools)
- Book properties (with date selection and card payment)
- Rewards program (earn points on bookings and redeem for discounts (10pts = 1$ off))
- Manage bookings (view and cancel bookings with automatic points/payment refund)

Agents
- List properties (Create listings)
- Manage listings (edit and update property details and images)
- View bookings (see all bookings for your properties)

Installation
NEED
Node.js 
PostgreSQL
npm

To set the BACKEND

cd backend

install dependencies

npm install

Create .env file

PORT=5000
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=realestate
JWT_SECRET=your_jwt_secret

Start the server in the frontend, but to check if your server is running do (node server.js) 

npm start

The app will run on http://localhost:3000


Author
Developed as a project for CS425 IIT 
By Ariunjargal Ariubnbold 

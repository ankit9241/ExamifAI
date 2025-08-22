# ExamifAI - Online Examination System

ExamifAI is a modern, secure, and user-friendly online examination platform built with React.js and Node.js. It provides a comprehensive solution for conducting online exams with features like secure authentication, proctoring, and real-time monitoring.

## Features

- **User Authentication**: Secure login and registration system
- **Exam Management**: Create and manage exams with various question types
- **Real-time Proctoring**: AI-powered proctoring using face detection
- **Responsive Design**: Works on desktop and mobile devices
- **Secure**: Built with security best practices in mind
- **Easy to Use**: Intuitive user interface for both students and administrators

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- MongoDB (v5.0 or higher)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ExamifAI.git
cd ExamifAI
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   ```

4. Start the backend server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with the following variable:
   ```
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
ExamifAI/
├── backend/               # Backend server
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── index.js      # Entry point
│   └── package.json
│
└── frontend/             # Frontend React application
    ├── public/          # Static files
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/      # Page components
    │   ├── services/   # API services
    │   └── App.jsx     # Main component
    └── package.json
```

## Available Scripts

### Backend
- `npm run dev`: Start the development server with nodemon
- `npm start`: Start the production server

### Frontend
- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build

## Environment Variables

### Backend
- `PORT`: Port on which the backend server will run
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRE`: JWT token expiration time
- `JWT_COOKIE_EXPIRE`: Cookie expiration time in days

### Frontend
- `VITE_API_URL`: Base URL for API requests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Vite](https://vitejs.dev/)
- [Face-API.js](https://github.com/justadudewhohacks/face-api.js/)

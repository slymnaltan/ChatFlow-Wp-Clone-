# 🚀 ChatFlow - Modern Chat Application

A modern, real-time chat application built with React, Node.js, Socket.io, MongoDB Atlas, Redis, and RabbitMQ.

## ✨ Features

-  **User Authentication** - Secure login/register system
-  **Real-time Messaging** - Instant message delivery
-  **User Management** - Online/offline status tracking
-  **User Search** - Find and connect with other users
-  **Responsive Design** - Works on all devices
-  **Microservices Architecture** - Scalable and maintainable
-  **Message Queuing** - RabbitMQ for reliable message delivery
-  **Caching** - Redis for performance optimization
-  **Cloud Database** - MongoDB Atlas for data persistence

## 🏗️ Architecture

```
Frontend (React) → Nginx → Backend (Node.js) → MongoDB Atlas
                                    ↓
                              Redis + RabbitMQ
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Socket.io Client** - Real-time communication
- **CSS3** - Styling and animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **MongoDB Atlas** - Cloud database
- **Redis** - In-memory caching
- **RabbitMQ** - Message queuing

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- MongoDB Atlas account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/chatflow.git
cd chatflow
```

### 2. Environment Setup
Create environment files:

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatflow
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
JWT_SECRET=your-super-secret-jwt-key-here
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start the Application
```bash
# Start all services
docker-compose up -d

# Check status
docker ps
```

### 4. Access the Application
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000
- **RabbitMQ Management:** http://localhost:15672 (admin/admin123)
- **Redis:** localhost:6379

## 📁 Project Structure

```
chatflow/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS files
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── Dockerfile         # Frontend container
├── backend/                # Node.js backend
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   ├── rabbitmq.js        # RabbitMQ configuration
│   ├── redis.js           # Redis configuration
│   └── Dockerfile         # Backend container
├── docker-compose.yml     # Multi-container setup
└── README.md             # This file
```

## 🔧 Development

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Development
```bash
# Build and start
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```


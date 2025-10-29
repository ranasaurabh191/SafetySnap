# 🦺 SafetySnap - AI-Powered PPE Detection System

![SafetySnap Banner](https://img.shields.io/badge/SafetySnap-PPE%20Detection-orange?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

> **Real-time Personal Protective Equipment (PPE) detection system using YOLOv11 and YOLOv8 for workplace safety compliance monitoring.**

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots) 
- [Contributing](#contributing)
- [Contact](#contact)

---

## 🎯 Overview

SafetySnap is an intelligent workplace safety monitoring system that leverages cutting-edge computer vision technology to detect PPE compliance in real-time. Built as a BTech CSE capstone project, it provides automated detection of:

- ✅ Hard hats / Safety helmets
- ✅ Safety vests
- ✅ Face masks
- ❌ PPE violations (NO-Hardhat, NO-Mask, NO-Safety Vest)
- 🚧 Safety cones, machinery, vehicles, and personnel

This project integrates AI-powered Personal Protective Equipment (PPE) detection and CCTV-based Anomaly Surveillance into a single real-time system. It is designed to improve Workplace Safety, Regulatory Compliance, and Operational Efficiency in industrial environments.
Using advanced Deep Learning models and Computer Vision, the system ensures that workers adhere to safety protocols and that unusual or unsafe activities are promptly flagged.
The system supports **live camera feeds, image uploads, live image capture, image analysis, and CCTV RTSP IP camera streams** for comprehensive workplace monitoring.

---

## ✨ Features

### Core Functionality
- **Real-time Detection**: Live webcam monitoring with instant PPE detection
- **Multi-Source Support**: 
  - Browser webcam capture
  - Video file upload (MP4, AVI, MOV)
  - Image upload (JPG, PNG, BMP, WebP, TIFF)
  - RTSP IP camera streams
  - Local OpenCV webcam
- **Smart Violation Detection**: Automatic logging of PPE non-compliance
- **Advanced Analytics**: 
  - Detection history with filtering
  - Violation statistics and trends
  - Confidence scoring
  - Processing time metrics
- **User Management**: 
  - JWT authentication
  - Role-based access control
  - User profiles and activity tracking

### Technical Features
- **YOLOv11 Model**: State-of-the-art object detection with custom PPE training
- **RESTful API**: Comprehensive Django REST Framework backend
- **WebSocket Streaming**: Real-time video annotation via Django Channels
- **Responsive UI**: Modern React + TypeScript frontend with dark mode
- **Database**: PostgreSQL for robust data persistence
- **Deployment Ready**: Docker support with production configurations

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 5.1 + Django REST Framework
- **Database**: PostgreSQL 16
- **ML Model**: Ultralytics YOLOv11n
- **Real-time**: Django Channels + Daphne (WebSocket)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Image Processing**: OpenCV, Pillow
- **Task Queue**: Celery + Redis (optional)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Context API + Hooks
- **UI Components**: Custom components with Tailwind CSS
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast


---

## 🏗️ Architecture

```
SafetySnap/
├── backend/                    # Django Backend
│   ├── safetysnap_api/        # Project settings
│   ├── ppe_detection/         # Core detection app
│   │   ├── models.py          # Detection, Violation, PPEPolicy models
│   │   ├── views.py           # REST API views
│   │   ├── serializers.py     # DRF serializers
│   │   ├── yolo_service.py    # YOLO detection logic
│   │   ├── consumers.py       # WebSocket consumers
│   │   ├── routing.py         # WebSocket URL routing
│   │   └── live_camera_monitor.py
│   ├── users/                 # User management app
│   ├── reports/               # PDF report generation
│   ├── analytics/             # Analytics & statistics
│   ├── media/                 # Uploaded files & results
│   ├── YOLO11n.pt            # YOLOv11 model weights
│   └── manage.py
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── VideoMonitor.tsx
│   │   │   ├── DetectionHistory.tsx
│   │   │   └── Analytics.tsx
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── utils/             # Helpers & utilities
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml         # Docker orchestration
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## 🚀 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 14+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/safetysnap.git
cd safetysnap
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download YOLO model (if not included)
# Place YOLO11n.pt or best.pt in backend/ directory

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run development server
python manage.py runserver
```



### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000

# Run development server
npm run dev
```

### 4. Database Setup

```sql
-- Create PostgreSQL database
CREATE DATABASE safetysnap_db;
CREATE USER safetysnap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE safetysnap_db TO safetysnap_user;
```

---

## 💻 Usage

### Starting the Application

**Development:**
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```



### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/


### Basic Workflow

1. **Register/Login**: Create account or login at `/login`
2. **Upload Detection**: 
   - Go to "Live Monitor" page
   - Choose source (webcam, video, image)
   - Start detection
3. **View Results**: Check "Detection History" for past detections
4. **Analytics**: View compliance trends in "Analytics" dashboard
5. **Reports**: Generate CSV reports from detection history

---

## 📡 API Documentation

### Authentication
```http
POST /api/users/register/
POST /api/users/login/
POST /api/users/logout/
GET  /api/users/profile/
```

### PPE Detection
```http
GET    /api/ppe/detections/              # List detections
POST   /api/ppe/detections/              # Create detection
GET    /api/ppe/detections/{id}/         # Get detail
DELETE /api/ppe/detections/{id}/         # Delete detection
GET    /api/ppe/detections/statistics/   # Get stats
```

### Violations
```http
GET  /api/ppe/violations/                # List violations
POST /api/ppe/violations/{id}/acknowledge/
POST /api/ppe/violations/{id}/resolve/
```

### Live Camera
```http
GET /api/ppe/camera/feed/                # WebSocket stream
POST /api/ppe/camera/stop/
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/ppe/detections/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "original_image=@safety_site.jpg"
```

---

## 📸 Screenshots

### Home
![Home](https://github.com/ranasaurabh191/SafetySnap/blob/main/screenshots/Screenshot%202025-10-29%20141615.png)

### Dashboard
![Dashboard](https://github.com/ranasaurabh191/SafetySnap/blob/main/screenshots/Screenshot%202025-10-29%20141652.png)

### CCTV Monitor
![CCTV Monitor](https://github.com/ranasaurabh191/SafetySnap/blob/main/screenshots/Screenshot%202025-10-29%20141703.png)

### Live Detection
![Live Detection](https://github.com/ranasaurabh191/SafetySnap/blob/main/screenshots/Screenshot%202025-10-29%20141809.png)

### Detection History
![Detection History](https://github.com/ranasaurabh191/SafetySnap/blob/main/screenshots/Screenshot%202025-10-29%20141836.png)

---

## 🌐 Deployment

### Environment Variables

**Backend (.env):**
```env
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
MEDIA_ROOT=/app/media
```

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Deployment Platforms

**Backend:**
- Render (Recommended)
- Railway
- Heroku
- AWS EC2

**Frontend:**
- Vercel (Recommended)
- Netlify
- Firebase Hosting

**Database:**
- Supabase (PostgreSQL)
- Neon
- Railway PostgreSQL

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---



## 👨‍💻 Authors

**[Saurabh Rana]** - B.Tech Computer Science Engineering Student  


- GitHub: [@ranasaurabh191](https://github.com/ranasaurabh191))
- LinkedIn: [Saurabh Rana](https://www.linkedin.com/in/-rana-saurabh)
- Email: ranasaurabh191@gmail.com

---

## 🙏 Acknowledgments

- Ultralytics for YOLOv11 framework
- Django & React communities
- OpenCV contributors
- PPE dataset sources (Roboflow, Kaggle)

---


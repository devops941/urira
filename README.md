# 🩺 Smart Health Monitoring System

### An Intelligent Platform for Personalized Health and Wellness Management

![Project Status](https://img.shields.io/badge/Project-Development-blue)
![Frontend](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)
![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

## 📌 Project Overview

The **Smart Health Monitoring System** is a modern web-based health and wellness management application designed to help users monitor, analyze, and improve their daily health activities.

The application provides a centralized platform for tracking personal health information, Body Mass Index (BMI), daily calorie requirements, nutritional intake, physical activities, water consumption, sleep patterns, and wellness goals.

By analyzing user-provided health information and daily activity records, the system provides personalized wellness suggestions, interactive health dashboards, progress reports, and intelligent reminders.

The system also incorporates advanced features such as AI-powered health assistance, personalized meal planning, medication reminders, vital signs monitoring, and health trend analysis.

The primary objective of this project is to encourage healthy lifestyle habits through intelligent health tracking, personalized recommendations, and data-driven wellness insights.

> **Project Goal:** To develop an intelligent, secure, and user-friendly health monitoring platform that enables individuals to manage their daily wellness activities through a single application.

---

## 🎯 Problem Statement

Maintaining a healthy lifestyle requires consistent monitoring of daily food consumption, physical activity, hydration, sleep, and other health-related activities.

However, many individuals struggle to maintain proper records of their daily health information and understand whether their lifestyle habits align with their personal wellness goals.

Existing health applications may require users to manage different activities across multiple platforms.

The proposed Smart Health Monitoring System addresses these challenges by providing a centralized platform that integrates health tracking, nutritional analysis, activity monitoring, personalized recommendations, and progress reporting.

The system aims to improve health awareness, encourage healthy habits, and provide users with a convenient way to monitor their wellness activities.

---

## 🎯 Project Objectives

- Develop a secure user registration and authentication system.
- Maintain personalized health profiles.
- Calculate and monitor Body Mass Index (BMI).
- Estimate daily calorie requirements.
- Track food consumption and nutritional intake.
- Provide personalized diet and meal suggestions.
- Monitor daily physical activities and step counts.
- Track water consumption and hydration goals.
- Record and analyze sleep patterns.
- Provide interactive health dashboards.
- Generate daily, weekly, and monthly health reports.
- Implement intelligent reminders and notifications.
- Analyze historical health data and identify trends.
- Integrate AI-based wellness assistance and meal planning.
- Maintain secure and private health records.

---

# 🚀 Features and Modules

The application is divided into functional modules to ensure maintainability, scalability, and a better user experience.

## 1. User Authentication and Authorization

Provides secure access to the application.

**Features:**
- User registration.
- Secure login and logout.
- Email-based account management.
- Password hashing.
- JWT-based authentication.
- Forgot password and reset password.
- Protected routes.
- Role-based access control.
- Session and token management.

## 2. Personal Health Profile Management

Allows users to manage their personal and physical health information.

**Features:**
- Personal information management.
- Age and date of birth.
- Height and weight.
- Gender.
- Activity level.
- Health goals.
- Dietary preferences.
- Profile update functionality.
- Health measurement history.

## 3. BMI Calculation and Monitoring

Calculates the user's Body Mass Index based on height and weight.

**Features:**
- BMI calculation.
- BMI classification.
- BMI history.
- Weight tracking.
- BMI visualization.
- Historical weight progress.

**Formula:**

BMI = Weight (kg) / Height (m)²

The system uses general adult BMI categories for informational purposes. BMI is not a medical diagnosis.

## 4. Daily Calorie Requirement Calculation

Estimates the user's daily energy requirements.

**Features:**
- Basal Metabolic Rate (BMR) calculation.
- Estimated Total Daily Energy Expenditure (TDEE).
- Activity-level-based estimation.
- Daily calorie target.
- Calorie consumption monitoring.
- Remaining calorie target visualization.

The system uses established estimation equations and user-provided information.

## 5. Food and Nutrition Monitoring

Allows users to record and analyze their daily food consumption.

**Features:**
- Food database.
- Food search.
- Food quantity and serving selection.
- Breakfast, lunch, dinner, and snack tracking.
- Calorie calculation.
- Protein tracking.
- Carbohydrate tracking.
- Fat tracking.
- Daily nutrition summary.
- Food consumption history.

## 6. Diet Suggestion System

Provides personalized food recommendations based on nutritional requirements and user preferences.

**Features:**
- Personalized food suggestions.
- Meal recommendations.
- Nutritional balance analysis.
- Vegetarian and non-vegetarian preferences.
- Dietary preference management.
- Food allergy considerations.
- Daily nutritional target analysis.

## 7. Physical Activity and Step Monitoring

Tracks daily physical activity and movement.

**Features:**
- Daily step count.
- Walking distance estimation.
- Activity duration.
- Estimated calories burned.
- Daily activity goals.
- Activity history.
- Weekly activity reports.
- Optional integration with supported health platforms.

Manual activity entry is supported in the initial implementation. Automatic background step tracking may require a mobile application or compatible device integration.

## 8. Water Intake Monitoring

Helps users track daily water consumption.

**Features:**
- Daily water intake goal.
- Add water consumption.
- Custom serving sizes.
- Total water consumption.
- Remaining water target.
- Water intake history.
- Hydration reminders.

## 9. Sleep Monitoring and Suggestions

Allows users to record and analyze their sleeping habits.

**Features:**
- Sleep start time.
- Wake-up time.
- Sleep duration calculation.
- Sleep quality rating.
- Sleep history.
- Sleep schedule tracking.
- Sleep habit suggestions.

## 10. Personal Health Goal Management

Allows users to define and monitor personal wellness goals.

**Features:**
- Weight goals.
- Daily calorie goals.
- Step goals.
- Water intake goals.
- Sleep duration goals.
- Goal completion percentage.
- Goal progress visualization.
- Achievement history.

## 11. Medication Reminder and Tracking

Allows users to manage medication schedules.

**Features:**
- Add medication details.
- Medication name and dosage.
- Medication schedule.
- Start and end dates.
- Medication reminders.
- Mark medication as taken or skipped.
- Medication history.

This module is intended for medication schedule management and does not provide prescriptions.

## 12. Vital Signs Monitoring

Allows users to record selected health measurements.

**Features:**
- Heart rate.
- Blood pressure.
- Blood oxygen saturation (SpO₂).
- Body temperature.
- Blood glucose (optional).
- Measurement history.
- Historical visualization.

Measurements must be entered manually or obtained through supported devices. The application does not independently measure vital signs using a standard web browser.

## 13. Symptom and Health Journal

Provides a personal health diary for recording health-related observations.

**Features:**
- Symptom recording.
- Symptom severity.
- Date and time tracking.
- Personal health notes.
- Symptom history.
- Historical pattern visualization.

The journal is intended for personal record keeping and does not diagnose medical conditions.

## 14. AI Health Assistant

Provides AI-powered general wellness assistance.

**Features:**
- General health and wellness questions.
- Explain BMI and nutrition information.
- Interpret personal health tracking summaries.
- Suggest healthy lifestyle habits.
- Explain weekly reports.
- General fitness and wellness guidance.

AI-generated responses are informational and should not replace professional medical advice.

## 15. AI-Based Personalized Meal Planner

Generates suggested meal plans based on user preferences and nutritional targets.

**Features:**
- Personalized meal planning.
- Breakfast, lunch, and dinner suggestions.
- Vegetarian and non-vegetarian preferences.
- Regional food preferences.
- Nutritional target analysis.
- Weekly meal planning.
- Food allergy considerations.

## 16. Health Habit and Achievement System

Encourages users to maintain healthy daily habits.

**Features:**
- Daily health challenges.
- Habit completion tracking.
- Achievement badges.
- Daily and weekly streaks.
- Goal completion rewards.
- Progress milestones.

## 17. Health Trend Analysis

Analyzes historical health information to identify patterns.

**Features:**
- Weight trend analysis.
- Activity trend analysis.
- Sleep pattern analysis.
- Nutrition trend analysis.
- Goal completion trends.
- Historical health visualization.
- Personalized wellness insights.

## 18. Health Dashboard

Provides a centralized overview of the user's health activities.

**Dashboard Components:**
- BMI summary.
- Daily calorie consumption.
- Nutrition summary.
- Step count.
- Water intake progress.
- Sleep duration.
- Health goal completion.
- Weekly progress charts.
- Health trend visualization.

## 19. Reports and Analytics

Provides historical health reports and visual analytics.

**Features:**
- Daily health reports.
- Weekly health reports.
- Monthly health reports.
- Weight progress charts.
- Calorie consumption charts.
- Water intake charts.
- Activity reports.
- Sleep analysis.
- PDF and CSV export.

## 20. Smart Notifications and Reminders

Provides reminders to help users maintain their daily wellness routines.

**Features:**
- Water intake reminders.
- Meal logging reminders.
- Medication reminders.
- Sleep schedule reminders.
- Daily goal reminders.
- Achievement notifications.
- Custom notification preferences.
- Notification history.

## 21. Admin Dashboard

Provides administrative management functionality.

**Features:**
- User management.
- Food database management.
- Nutrition information management.
- Exercise library management.
- Notification management.
- Application configuration.
- User activity monitoring.
- Feedback management.

---

# 🛠️ Technology Stack

The project follows the MERN stack architecture with TypeScript and modern frontend development tools.

## Frontend Technologies

| Technology | Purpose |
|---|---|
| React.js | Component-based user interface |
| TypeScript | Type-safe application development |
| Vite | Frontend development and build tool |
| Tailwind CSS | Responsive styling |
| shadcn/ui | Reusable UI components |
| Lucide React | Icon library |
| React Router | Client-side routing |
| React Hook Form | Form management |
| Zod | Form and data validation |
| TanStack Query | API data fetching and caching |
| Axios | HTTP requests |
| Recharts | Data visualization |

## Backend Technologies

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Type-safe backend development |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcrypt | Password hashing |
| Zod | Request validation |
| Helmet | HTTP security headers |
| Express Rate Limit | API rate limiting |

## Additional Technologies

| Technology | Purpose |
|---|---|
| AI API | AI-powered wellness assistance |
| Web Push API | Browser notifications |
| Firebase Cloud Messaging | Optional push notifications |
| jsPDF | PDF report generation |
| CSV Export | Health report export |
| Vitest | Frontend and unit testing |
| Supertest | API testing |
| Swagger / OpenAPI | API documentation |
| Git | Version control |
| GitHub | Source code management |
| Vercel | Frontend deployment |
| Render | Backend deployment |

> The initial implementation does not require a separate Python AI service. A Python-based service can be introduced later if advanced machine learning models are required.

---

# 🏗️ System Architecture

The application follows a client-server architecture with a layered backend structure.

```text
                    SMART HEALTH MONITORING SYSTEM
                                |
                +---------------+---------------+
                |                               |
          FRONTEND LAYER                  BACKEND LAYER
                |                               |
        React + TypeScript                 Node.js
                |                               |
        React Router                       Express.js
                |                               |
        UI Components                 Authentication Middleware
                |                               |
        TanStack Query                    Controllers
                |                               |
             Axios                          Services
                |                               |
                +------------ REST APIs --------+
                                                |
                                         Business Logic
                                                |
                                  Health Calculation Engine
                                                |
                                  Recommendation Engine
                                                |
                                           Mongoose
                                                |
                                           MongoDB
```

### Backend Architecture

The backend follows a modular layered architecture:

```text
Route
  |
Middleware
  |
Validation
  |
Controller
  |
Service
  |
Repository
  |
Mongoose
  |
MongoDB
```

Controllers handle HTTP requests and responses. Services contain business logic, while repositories manage database operations.

---

# 🗄️ Database Design

The application uses MongoDB as its primary database.

The proposed collections include:

| Collection | Description |
|---|---|
| users | User account information |
| healthProfiles | Personal health information |
| foods | Food database and nutritional information |
| foodLogs | Daily food consumption |
| waterLogs | Water intake records |
| sleepLogs | Sleep records |
| activityLogs | Physical activity records |
| healthHistory | Historical health measurements |
| healthGoals | Personalized health goals |
| medications | Medication information and schedules |
| medicationLogs | Medication tracking history |
| vitalSigns | Recorded vital sign measurements |
| symptomLogs | Personal health journal |
| notifications | Notification history |
| appointments | Health appointment records |

All user-specific records should include a user reference to ensure secure data access.

Historical health measurements should be stored as separate records to support progress analysis.

---

# 📁 Project Structure

```text
smart-health-monitoring/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── charts/
│   │   │   └── health/
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── profile/
│   │   │   ├── bmi/
│   │   │   ├── nutrition/
│   │   │   ├── diet/
│   │   │   ├── activity/
│   │   │   ├── water/
│   │   │   ├── sleep/
│   │   │   ├── goals/
│   │   │   ├── medication/
│   │   │   ├── vitals/
│   │   │   ├── journal/
│   │   │   ├── ai-assistant/
│   │   │   ├── reports/
│   │   │   └── admin/
│   │   │
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── providers/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── project-overview.md
│   ├── system-architecture.md
│   ├── database-design.md
│   └── api-documentation.md
│
├── .gitignore
└── README.md
```

---

# 🔌 API Structure

The backend exposes RESTful APIs for the application's modules.

### Authentication

```http
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Health Profile

```http
GET    /api/profile
PUT    /api/profile
GET    /api/health/bmi
GET    /api/health/calories
GET    /api/health/history
POST   /api/health/history
```

### Nutrition and Diet

```http
GET    /api/foods
GET    /api/foods/:id
POST   /api/foods
POST   /api/food-logs
GET    /api/food-logs/today
GET    /api/nutrition/summary
GET    /api/diet/suggestions
```

### Activity, Water, and Sleep

```http
POST   /api/activity-logs
GET    /api/activity-logs/today

POST   /api/water-logs
GET    /api/water-logs/today

POST   /api/sleep-logs
GET    /api/sleep-logs/history
```

### Goals and Reports

```http
GET    /api/goals
PUT    /api/goals

GET    /api/reports/daily
GET    /api/reports/weekly
GET    /api/reports/monthly
```

### Advanced Modules

```http
POST   /api/medications
GET    /api/medications
POST   /api/medication-logs

POST   /api/vital-signs
GET    /api/vital-signs/history

POST   /api/symptoms
GET    /api/symptoms/history

POST   /api/ai/assistant
POST   /api/ai/meal-plan

GET    /api/notifications
PATCH  /api/notifications/:id/read
```

---

# ⚙️ Installation and Setup

## Prerequisites

Ensure the following software is installed:

- Node.js (LTS version)
- npm
- MongoDB Community Server or MongoDB Atlas
- Git
- Visual Studio Code

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-health-monitoring.git
```

Navigate to the project directory:

```bash
cd smart-health-monitoring
```

## 2. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

The frontend application will run at:

```text
http://localhost:5173
```

## 3. Backend Setup

Open another terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/smart_health_monitoring

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLIENT_URL=http://localhost:5173

AI_API_KEY=your_ai_api_key
```

The AI API key is optional unless AI-powered features are enabled.

Start the backend:

```bash
npm run dev
```

The backend API will run at:

```text
http://localhost:5000
```

> Replace the example secrets with secure values. Never commit `.env` files or API keys to GitHub.

---

# 🔐 Security Features

The application follows security best practices to protect personal health information.

- JWT-based authentication.
- Secure password hashing.
- Protected API endpoints.
- Input validation.
- Role-based authorization.
- User-specific data access.
- API rate limiting.
- Secure HTTP headers.
- Environment-based configuration.
- Secure password reset flow.
- HTTPS in production.
- Sensitive information protection.
- Secure error handling.
- Health data privacy controls.

The application should collect only the personal information necessary for its functionality and provide appropriate privacy controls.

---

# 🧪 Testing

The application should be tested at different levels.

| Testing Type | Technology |
|---|---|
| Unit Testing | Vitest |
| API Testing | Supertest |
| Frontend Component Testing | React Testing Library |
| API Documentation Testing | Swagger |
| Manual Testing | Browser and mobile testing |

Important test cases include authentication, BMI calculation, nutrition calculation, activity tracking, water tracking, sleep tracking, report generation, and user data authorization.

---

# 📈 Development Roadmap

The project is developed in multiple phases.

### Phase 1 – Project Setup and Authentication

- Frontend and backend setup.
- MongoDB configuration.
- Registration and login.
- Authentication middleware.
- User profile.

### Phase 2 – Core Health Modules

- BMI calculation.
- Calorie estimation.
- Health profile.
- Health history.
- Personal health goals.

### Phase 3 – Nutrition and Diet

- Food database.
- Food logging.
- Nutrition calculations.
- Diet suggestions.
- Meal planner.

### Phase 4 – Activity and Wellness Tracking

- Step monitoring.
- Water intake tracking.
- Sleep monitoring.
- Medication reminders.
- Vital signs monitoring.




### Phase 6 – Advanced Features

- AI Health Assistant.
- AI Meal Planner.
- Health Trend Analysis.
- Habit and Achievement System.
- Admin Dashboard.

### Phase 7 – Testing and Deployment

- Application testing.
- Security testing.
- Performance optimization.
- Production deployment.
- Documentation.

---

# 🌟 Future Enhancements

The following features can be introduced in future versions:

- AI-powered food image recognition.
- Barcode-based food scanning.
- Smart wearable integration.
- Automatic step tracking.
- Apple Health integration.
- Android Health Connect integration.
- Advanced wellness trend analysis.
- Personalized exercise recommendations.
- Voice-based health assistant.
- Multilingual support.
- Family health profiles.
- Advanced health analytics.

---

# ⚠️ Medical Disclaimer

The Smart Health Monitoring System is designed for general health and wellness tracking.

The application provides informational estimates, activity tracking, and general wellness suggestions. It is not intended to diagnose, treat, cure, or prevent any disease.

BMI, calorie requirements, hydration targets, and other health estimates may not be suitable for every individual.

Users should consult qualified healthcare professionals for medical advice, diagnosis, treatment, and personalized medical recommendations.

AI-generated information may be inaccurate and should not be used as a substitute for professional medical advice.

---

## 👨‍💻 Project Information

- **Project Name:** UYIRA – Smart Health Monitoring System
- **Project Category:** Health and Wellness Technology
- **Project Type:** Cross-Platform Mobile Application
- **Platforms:** Android and iOS
- **Mobile Application:** React Native + Expo + TypeScript
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** MongoDB + Mongoose
- **Navigation:** Expo Router
- **State Management:** Zustand + TanStack Query
- **Authentication:** JWT + Expo SecureStore
- **AI Integration:** AI API + Recommendation Engine
- **Notifications:** Expo Notifications
- **Build Tool:** Expo Application Services (EAS)
- **Primary Objective:** Intelligent health monitoring and personalized wellness management.


---

# 📄 License

This project is licensed under the MIT License.

You are free to use, modify, and distribute the project according to the terms of the license.

---

## 💡 Acknowledgements

This project is developed as an educational and technological initiative to explore modern web development, health data management, personalized wellness recommendations, and AI-assisted application development.

**Smart Health Monitoring System — Monitor Your Health. Understand Your Habits. Improve Your Wellness.**

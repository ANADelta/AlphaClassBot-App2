# 🎓 AlphaClassBot - AI Academic Scheduling Assistant

**An intelligent, multi-role academic scheduling system built with modern web technologies**

## 🌟 Project Overview

AlphaClassBot is a comprehensive AI-powered academic scheduling assistant designed for educational institutions. It provides intelligent scheduling, automated reminders, and natural language chat assistance for students, teachers, and administrators.

### 🎯 Key Features

- **🤖 AI-Powered Chat Assistant**: Natural language scheduling and academic support using Cloudflare AI
- **📅 Smart Scheduling**: Intelligent class scheduling and calendar management
- **🔔 Automated Reminders**: Never miss classes, exams, or assignment deadlines
- **👥 Multi-Role Support**: Customized interfaces for students, teachers, and administrators
- **📱 Responsive Design**: Modern, mobile-friendly interface with TailwindCSS
- **🔐 Secure Authentication**: JWT-based authentication with role-based access control
- **☁️ Cloud-Native**: Built for Cloudflare Workers/Pages with edge deployment

## 🌐 Live URLs

- **Production**: `https://alphaclassbot-app2.pages.dev` (will be set after deployment)
- **API Documentation**: Available at `/api/health` endpoint
- **GitHub Repository**: https://github.com/ANADelta/AlphaClassBot-App2

## 🏗️ Technology Stack

### Backend
- **Framework**: Hono.js (lightweight, fast web framework)
- **Runtime**: Cloudflare Workers (edge computing)
- **Database**: Cloudflare D1 (SQLite-based, globally distributed)
- **AI**: Cloudflare AI (for chat assistant functionality)
- **Authentication**: JWT tokens with role-based access

### Frontend
- **Styling**: TailwindCSS (utility-first CSS framework)
- **Icons**: Font Awesome
- **HTTP Client**: Axios
- **Architecture**: Vanilla JavaScript with class-based organization

### Development & Deployment
- **Build Tool**: Vite
- **Package Manager**: npm
- **Deployment**: Cloudflare Pages
- **Process Manager**: PM2 (for local development)
- **TypeScript**: Full type safety

## 📊 Data Architecture

### Core Data Models

1. **Users** - Students, teachers, and administrators with role-based permissions
2. **Institutions** - Schools and educational organizations
3. **Subjects/Courses** - Academic subjects with metadata
4. **Classes/Sections** - Individual class sections with schedules
5. **Enrollments** - Student-class relationships
6. **Schedule Events** - Classes, exams, assignments, meetings
7. **Reminders** - Automated notification system
8. **Chat Conversations** - AI assistant interactions
9. **Notifications** - System-wide notification management

### Storage Services
- **Cloudflare D1**: Primary relational database for all structured data
- **Local SQLite**: Development database (auto-synced with production schema)

### Database Features
- **Multi-tenant architecture** with institution-based data isolation
- **Comprehensive indexing** for optimal query performance
- **JSON fields** for flexible metadata storage
- **Audit trails** with created_at/updated_at timestamps
- **Soft deletes** and status tracking

## 👤 User Guide

### 🎓 For Students
1. **Login** with your student credentials
2. **View Dashboard** to see today's schedule and upcoming events
3. **Check Classes** to see enrolled courses and teacher information
4. **Use AI Assistant** to ask about schedules, deadlines, and academic planning
5. **Manage Notifications** and set up custom reminders

### 👨‍🏫 For Teachers
1. **Access Teacher Dashboard** after login
2. **Manage Classes** you're teaching
3. **Create Schedule Events** (classes, exams, assignments)
4. **View Student Enrollments** in your classes
5. **Use AI Assistant** for curriculum planning and schedule optimization

### 👨‍💼 For Administrators
1. **Admin Panel Access** with full system control
2. **Manage Users** across the institution
3. **Create and Configure** subjects, classes, and schedules
4. **Monitor System Activity** and user engagement
5. **Configure Institution Settings** and academic calendars

### 🤖 AI Assistant Features
- **Natural Language Processing** for scheduling queries
- **Context-Aware Responses** based on user role and data
- **Smart Suggestions** for schedule optimization
- **Academic Planning Assistance** for course selection and time management
- **Automated Reminder Setup** through conversational interface

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Git for version control

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ANADelta/AlphaClassBot-App2.git
   cd AlphaClassBot-App2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up local database**:
   ```bash
   # Apply database migrations locally
   npm run db:migrate:local
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Start development server**:
   ```bash
   # Clean any existing processes on port 3000
   npm run clean-port
   
   # Start with PM2 (recommended for development)
   pm2 start ecosystem.config.cjs
   
   # Test the service
   npm run test
   ```

6. **Access the application**:
   - Open http://localhost:3000 in your browser
   - Use demo accounts (see login modal for credentials)

### Demo Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Student | `student1@student.techuniversity.edu` | `password123` | Sample student account |
| Teacher | `john.teacher@techuniversity.edu` | `password123` | Sample teacher account |
| Admin | `admin@techuniversity.edu` | `password123` | Sample admin account |

## 📁 Project Structure

```
AlphaClassBot-App2/
├── src/
│   ├── index.tsx              # Main Hono application
│   └── renderer.tsx           # JSX renderer (auto-generated)
├── public/
│   └── static/
│       └── app.js             # Frontend JavaScript application
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── backup/                    # Original repository files
├── dist/                      # Built application (auto-generated)
├── node_modules/              # Dependencies (auto-generated)
├── .wrangler/                 # Cloudflare local state (auto-generated)
├── ecosystem.config.cjs       # PM2 configuration
├── seed.sql                   # Sample data for development
├── package.json               # Node.js project configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── wrangler.jsonc             # Cloudflare Workers configuration
└── README.md                  # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with email/password
- `GET /api/auth/me` - Get current user profile (requires auth)

### Schedule Management
- `GET /api/schedule` - Get user's schedule events with date filtering
- `GET /api/classes` - Get user's enrolled/teaching classes

### AI Chat Assistant
- `POST /api/chat` - Send message to AI assistant (requires auth)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### System
- `GET /api/health` - Health check endpoint

All authenticated endpoints require `Authorization: Bearer <token>` header.

## 🚀 Deployment

### Prerequisites
1. **Cloudflare Account** with Workers/Pages access
2. **Cloudflare API Token** with appropriate permissions
3. **GitHub Repository** access

### Production Deployment Steps

1. **Set up Cloudflare API authentication**:
   ```bash
   # This will be handled by setup_cloudflare_api_key tool
   npx wrangler whoami  # Verify authentication
   ```

2. **Create production database**:
   ```bash
   # Create D1 database
   npx wrangler d1 create alphaclassbot-production
   # Copy the database_id to wrangler.jsonc
   
   # Apply migrations to production
   npm run db:migrate:prod
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   # Build project
   npm run build
   
   # Create Pages project
   npx wrangler pages project create alphaclassbot-app2 \
     --production-branch main \
     --compatibility-date 2024-01-01
   
   # Deploy
   npm run deploy:prod
   ```

4. **Configure environment variables** (if needed):
   ```bash
   npx wrangler pages secret put JWT_SECRET --project-name alphaclassbot-app2
   ```

### Database Management Commands

```bash
# Local database operations
npm run db:migrate:local    # Apply migrations locally
npm run db:seed            # Seed with sample data
npm run db:reset           # Reset local database
npm run db:console:local   # Access local database console

# Production database operations
npm run db:migrate:prod    # Apply migrations to production
npm run db:console:prod    # Access production database console
```

## 🛠️ Development Commands

```bash
# Development
npm run dev                # Vite development server (local only)
npm run dev:sandbox        # Wrangler pages dev (sandbox)
npm run dev:d1             # Wrangler with D1 database (recommended)

# Building
npm run build              # Build for production

# Database
npm run db:migrate:local   # Apply local migrations
npm run db:seed            # Seed local database
npm run db:reset           # Reset local database

# Deployment
npm run deploy             # Deploy to Cloudflare Pages
npm run deploy:prod        # Deploy with specific project name

# Utilities
npm run clean-port         # Clean port 3000
npm run test               # Test local service
npm run git:status         # Git status
npm run git:commit "msg"   # Git commit with message
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: JWT signing secret (change in production)

### Cloudflare Bindings
- `DB`: D1 database binding
- `AI`: Cloudflare AI binding for chat functionality

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**:
   ```bash
   npm run clean-port
   ```

2. **Database migration errors**:
   ```bash
   rm -rf .wrangler/state/v3/d1
   npm run db:migrate:local
   ```

3. **Build errors**:
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

4. **PM2 service issues**:
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.cjs
   ```

## 📈 Current Status

### ✅ Completed Features
- Multi-role authentication system (students, teachers, admins)
- Comprehensive database schema with all academic entities
- RESTful API with JWT authentication
- AI-powered chat assistant integration
- Responsive frontend with role-based dashboards
- Smart reminder and notification system
- Local development environment with PM2
- Database migrations and seed data
- Comprehensive documentation

### 🚧 Features In Development
- Email/SMS notification delivery
- Advanced AI scheduling algorithms
- Mobile app (React Native)
- Calendar import/export (iCal, Google Calendar)
- Advanced analytics and reporting
- Multi-language support

### 🎯 Recommended Next Steps
1. **Deploy to production** and test with real users
2. **Add email/SMS integrations** for external notifications
3. **Implement advanced AI features** like schedule optimization
4. **Add calendar synchronization** with external services
5. **Create mobile application** for better accessibility
6. **Set up monitoring and analytics** for production usage
7. **Add comprehensive testing suite** (unit, integration, E2E)
8. **Implement CI/CD pipeline** for automated deployments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For support, please contact:
- **Email**: support@alphaclassbot.com
- **GitHub Issues**: [Create an issue](https://github.com/ANADelta/AlphaClassBot-App2/issues)
- **Documentation**: This README and inline code comments

---

**Built with ❤️ using modern web technologies and AI**

*Last Updated: August 14, 2025*
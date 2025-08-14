import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { serveStatic } from 'hono/cloudflare-workers'

// Type definitions for Cloudflare bindings
type Bindings = {
  DB: D1Database
  AI: Ai
}

// User role types
type UserRole = 'student' | 'teacher' | 'admin'

// JWT payload interface
interface JWTPayload {
  userId: number
  email: string
  role: UserRole
  institutionId?: number
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware for API routes
app.use('/api/*', cors())

// Static file serving
app.use('/static/*', serveStatic({ root: './public' }))

// JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-jwt-secret-key-change-in-production'

// Authentication middleware
const authMiddleware = jwt({
  secret: JWT_SECRET,
})

// API Routes

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AlphaClassBot API'
  })
})

// User authentication
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // In production, use proper password hashing (bcrypt)
    const user = await c.env.DB.prepare(`
      SELECT u.*, ui.institution_id, ui.role_in_institution 
      FROM users u 
      LEFT JOIN user_institutions ui ON u.id = ui.user_id 
      WHERE u.email = ? AND u.is_active = 1
      LIMIT 1
    `).bind(email).first()

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Create JWT token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institution_id
    }

    const token = await c.jwt.sign(payload, JWT_SECRET)

    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institution_id
      }
    })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Get current user profile
app.get('/api/auth/me', authMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    
    const user = await c.env.DB.prepare(`
      SELECT u.*, ui.institution_id, ui.student_id, ui.employee_id, ui.department
      FROM users u 
      LEFT JOIN user_institutions ui ON u.id = ui.user_id 
      WHERE u.id = ? AND u.is_active = 1
    `).bind(payload.userId).first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      timezone: user.timezone,
      institutionId: user.institution_id,
      studentId: user.student_id,
      employeeId: user.employee_id,
      department: user.department
    })
  } catch (error) {
    return c.json({ error: 'Failed to get user profile' }, 500)
  }
})

// Get user's schedule
app.get('/api/schedule', authMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const { startDate, endDate } = c.req.query()

    let query = `
      SELECT 
        se.id,
        se.title,
        se.description,
        se.event_type,
        se.start_datetime,
        se.end_datetime,
        se.location,
        se.is_cancelled,
        c.section_name,
        s.code as subject_code,
        s.name as subject_name
      FROM schedule_events se
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE 1=1
    `

    const params = []
    
    if (payload.role === 'student') {
      query += ` AND se.class_id IN (
        SELECT e.class_id FROM enrollments e WHERE e.student_id = ? AND e.status = 'active'
      )`
      params.push(payload.userId)
    } else if (payload.role === 'teacher') {
      query += ` AND (se.creator_id = ? OR se.class_id IN (
        SELECT id FROM classes WHERE teacher_id = ?
      ))`
      params.push(payload.userId, payload.userId)
    }

    if (startDate) {
      query += ` AND se.start_datetime >= ?`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND se.start_datetime <= ?`
      params.push(endDate)
    }

    query += ` ORDER BY se.start_datetime ASC`

    const events = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ events: events.results })
  } catch (error) {
    return c.json({ error: 'Failed to get schedule' }, 500)
  }
})

// Get user's classes (for students and teachers)
app.get('/api/classes', authMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload

    let query = `
      SELECT 
        c.id,
        c.section_name,
        c.room,
        c.schedule_pattern,
        c.max_students,
        s.code as subject_code,
        s.name as subject_name,
        s.credits,
        s.department,
        u.name as teacher_name,
        u.email as teacher_email
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.is_active = 1
    `

    const params = []

    if (payload.role === 'student') {
      query += ` AND c.id IN (
        SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'
      )`
      params.push(payload.userId)
    } else if (payload.role === 'teacher') {
      query += ` AND c.teacher_id = ?`
      params.push(payload.userId)
    }

    const classes = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ classes: classes.results })
  } catch (error) {
    return c.json({ error: 'Failed to get classes' }, 500)
  }
})

// AI Chat endpoint
app.post('/api/chat', authMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const { message, conversationId } = await c.req.json()

    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }

    // Get user context for AI
    const userContext = await c.env.DB.prepare(`
      SELECT 
        u.name, u.role, u.timezone,
        COUNT(DISTINCT e.class_id) as enrolled_classes,
        COUNT(DISTINCT se.id) as upcoming_events
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id AND e.status = 'active'
      LEFT JOIN schedule_events se ON se.start_datetime > datetime('now')
      WHERE u.id = ?
      GROUP BY u.id
    `).bind(payload.userId).first()

    // Prepare AI prompt with context
    const systemPrompt = `You are AlphaClassBot, an AI assistant for academic scheduling. 
    User: ${userContext?.name} (${userContext?.role})
    Enrolled Classes: ${userContext?.enrolled_classes || 0}
    Upcoming Events: ${userContext?.upcoming_events || 0}
    
    Help with scheduling, reminders, class information, and academic planning. 
    Be helpful, concise, and educational-focused.`

    // Use Cloudflare AI to generate response
    const aiResponse = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })

    // Save conversation and messages to database
    let convId = conversationId
    if (!convId) {
      const newConv = await c.env.DB.prepare(`
        INSERT INTO chat_conversations (user_id, title, context) 
        VALUES (?, ?, ?) 
        RETURNING id
      `).bind(
        payload.userId,
        message.substring(0, 50) + '...',
        JSON.stringify({ timestamp: new Date().toISOString() })
      ).first()
      convId = newConv?.id
    }

    // Save user message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (conversation_id, sender_type, message, message_type) 
      VALUES (?, 'user', ?, 'text')
    `).bind(convId, message).run()

    // Save AI response
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (conversation_id, sender_type, message, message_type) 
      VALUES (?, 'assistant', ?, 'text')
    `).bind(convId, aiResponse.response).run()

    return c.json({
      response: aiResponse.response,
      conversationId: convId
    })
  } catch (error) {
    return c.json({ error: 'Chat failed' }, 500)
  }
})

// Get user notifications
app.get('/api/notifications', authMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const { limit = 20, unreadOnly = 'false' } = c.req.query()

    let query = `
      SELECT id, title, message, type, priority, is_read, action_url, created_at
      FROM notifications 
      WHERE user_id = ?
    `
    
    if (unreadOnly === 'true') {
      query += ` AND is_read = 0`
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`

    const notifications = await c.env.DB.prepare(query)
      .bind(payload.userId, parseInt(limit.toString()))
      .all()

    return c.json({ notifications: notifications.results })
  } catch (error) {
    return c.json({ error: 'Failed to get notifications' }, 500)
  }
})

// Mark notification as read
app.put('/api/notifications/:id/read', authMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const notificationId = c.req.param('id')

    await c.env.DB.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = datetime('now') 
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, payload.userId).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to mark notification as read' }, 500)
  }
})

// Main application page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎓 AlphaClassBot - AI Academic Assistant</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3B82F6',
                  secondary: '#1E40AF',
                  accent: '#F59E0B'
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg border-b border-blue-100">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 class="text-2xl font-bold text-primary">
                                <i class="fas fa-graduation-cap mr-2"></i>
                                AlphaClassBot
                            </h1>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div id="auth-section" class="hidden">
                            <span id="user-name" class="text-gray-700 mr-4"></span>
                            <button id="logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-sign-out-alt mr-2"></i>Logout
                            </button>
                        </div>
                        <div id="login-section">
                            <button id="login-btn" class="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg transition-colors">
                                <i class="fas fa-sign-in-alt mr-2"></i>Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Welcome Section -->
            <div id="welcome-section" class="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div class="text-center">
                    <div class="mb-6">
                        <i class="fas fa-robot text-6xl text-primary mb-4"></i>
                        <h2 class="text-4xl font-bold text-gray-900 mb-4">Welcome to AlphaClassBot</h2>
                        <p class="text-xl text-gray-600 mb-6">Your AI-powered academic scheduling assistant</p>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-blue-50 p-6 rounded-lg">
                            <i class="fas fa-calendar-alt text-3xl text-primary mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
                            <p class="text-gray-600">AI-powered class scheduling and calendar management</p>
                        </div>
                        <div class="bg-green-50 p-6 rounded-lg">
                            <i class="fas fa-bell text-3xl text-green-600 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Smart Reminders</h3>
                            <p class="text-gray-600">Never miss a class, exam, or assignment deadline</p>
                        </div>
                        <div class="bg-purple-50 p-6 rounded-lg">
                            <i class="fas fa-comments text-3xl text-purple-600 mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Chat Assistant</h3>
                            <p class="text-gray-600">Natural language scheduling and academic support</p>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Multi-Role Support</h3>
                        <div class="flex justify-center space-x-8">
                            <div class="text-center">
                                <i class="fas fa-user-graduate text-2xl text-blue-600 mb-2"></i>
                                <p class="font-medium">Students</p>
                            </div>
                            <div class="text-center">
                                <i class="fas fa-chalkboard-teacher text-2xl text-green-600 mb-2"></i>
                                <p class="font-medium">Teachers</p>
                            </div>
                            <div class="text-center">
                                <i class="fas fa-user-shield text-2xl text-purple-600 mb-2"></i>
                                <p class="font-medium">Admins</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dashboard Section (Hidden by default) -->
            <div id="dashboard-section" class="hidden">
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Schedule Card -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                <i class="fas fa-calendar text-primary mr-2"></i>Today's Schedule
                            </h3>
                        </div>
                        <div id="today-schedule" class="space-y-2">
                            <p class="text-gray-500">Loading schedule...</p>
                        </div>
                    </div>

                    <!-- Classes Card -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                <i class="fas fa-book text-green-600 mr-2"></i>My Classes
                            </h3>
                        </div>
                        <div id="user-classes" class="space-y-2">
                            <p class="text-gray-500">Loading classes...</p>
                        </div>
                    </div>

                    <!-- Notifications Card -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                <i class="fas fa-bell text-red-600 mr-2"></i>Notifications
                            </h3>
                        </div>
                        <div id="user-notifications" class="space-y-2">
                            <p class="text-gray-500">Loading notifications...</p>
                        </div>
                    </div>
                </div>

                <!-- Chat Section -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">
                            <i class="fas fa-robot text-purple-600 mr-2"></i>AI Assistant
                        </h3>
                    </div>
                    <div id="chat-messages" class="h-64 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-comments text-2xl mb-2"></i>
                            <p>Start a conversation with your AI assistant!</p>
                        </div>
                    </div>
                    <div class="flex">
                        <input 
                            type="text" 
                            id="chat-input" 
                            placeholder="Ask me about your schedule, classes, or academic planning..."
                            class="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                        <button 
                            id="chat-send" 
                            class="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-r-lg transition-colors"
                        >
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Login Modal -->
            <div id="login-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">Login to AlphaClassBot</h3>
                            <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="login-form">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter your email"
                                >
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter your password"
                                >
                            </div>
                            <div class="mb-4">
                                <p class="text-sm text-gray-600">
                                    <strong>Demo Accounts:</strong><br>
                                    Student: student1@student.techuniversity.edu<br>
                                    Teacher: john.teacher@techuniversity.edu<br>
                                    Admin: admin@techuniversity.edu<br>
                                    Password: <em>password123</em>
                                </p>
                            </div>
                            <button 
                                type="submit" 
                                class="w-full bg-primary hover:bg-secondary text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                <i class="fas fa-sign-in-alt mr-2"></i>Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app

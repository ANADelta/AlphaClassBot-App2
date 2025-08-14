// AlphaClassBot Frontend Application
class AlphaClassBot {
    constructor() {
        this.authToken = localStorage.getItem('authToken');
        this.currentUser = null;
        this.currentConversationId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login modal controls
        document.getElementById('login-btn').addEventListener('click', () => {
            document.getElementById('login-modal').classList.remove('hidden');
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('login-modal').classList.add('hidden');
        });

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Chat functionality
        document.getElementById('chat-send').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Close modal when clicking outside
        document.getElementById('login-modal').addEventListener('click', (e) => {
            if (e.target.id === 'login-modal') {
                document.getElementById('login-modal').classList.add('hidden');
            }
        });
    }

    async checkAuthStatus() {
        if (this.authToken) {
            try {
                const response = await axios.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${this.authToken}` }
                });
                
                this.currentUser = response.data;
                this.showDashboard();
                this.loadDashboardData();
            } catch (error) {
                console.error('Auth check failed:', error);
                this.handleLogout();
            }
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password
            });

            this.authToken = response.data.token;
            this.currentUser = response.data.user;
            
            localStorage.setItem('authToken', this.authToken);
            
            document.getElementById('login-modal').classList.add('hidden');
            this.showDashboard();
            this.loadDashboardData();
            
            this.showNotification('Login successful!', 'success');
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Login failed. Please check your credentials.', 'error');
        }
    }

    handleLogout() {
        this.authToken = null;
        this.currentUser = null;
        this.currentConversationId = null;
        
        localStorage.removeItem('authToken');
        
        this.showWelcome();
        this.showNotification('Logged out successfully!', 'success');
    }

    showWelcome() {
        document.getElementById('welcome-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
    }

    showDashboard() {
        document.getElementById('welcome-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('login-section').classList.add('hidden');
        
        // Update user name in nav
        document.getElementById('user-name').textContent = `Welcome, ${this.currentUser.name}`;
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadTodaySchedule(),
            this.loadClasses(),
            this.loadNotifications()
        ]);
    }

    async loadTodaySchedule() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const response = await axios.get(`/api/schedule?startDate=${today}&endDate=${tomorrow}`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            const scheduleContainer = document.getElementById('today-schedule');
            const events = response.data.events;

            if (events.length === 0) {
                scheduleContainer.innerHTML = '<p class="text-gray-500">No events today</p>';
                return;
            }

            scheduleContainer.innerHTML = events.map(event => {
                const startTime = new Date(event.start_datetime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const eventTypeIcon = this.getEventTypeIcon(event.event_type);
                const eventTypeColor = this.getEventTypeColor(event.event_type);
                
                return `
                    <div class="flex items-center p-2 ${eventTypeColor} rounded">
                        <i class="${eventTypeIcon} mr-2"></i>
                        <div class="flex-1">
                            <div class="font-medium">${event.title}</div>
                            <div class="text-sm opacity-75">${startTime} • ${event.location || 'TBA'}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load schedule:', error);
            document.getElementById('today-schedule').innerHTML = 
                '<p class="text-red-500">Failed to load schedule</p>';
        }
    }

    async loadClasses() {
        try {
            const response = await axios.get('/api/classes', {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            const classesContainer = document.getElementById('user-classes');
            const classes = response.data.classes;

            if (classes.length === 0) {
                classesContainer.innerHTML = '<p class="text-gray-500">No classes found</p>';
                return;
            }

            classesContainer.innerHTML = classes.map(cls => `
                <div class="p-2 bg-blue-50 rounded">
                    <div class="font-medium">${cls.subject_code}</div>
                    <div class="text-sm text-gray-600">${cls.subject_name}</div>
                    <div class="text-xs text-gray-500">
                        ${cls.section_name} • ${cls.teacher_name}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load classes:', error);
            document.getElementById('user-classes').innerHTML = 
                '<p class="text-red-500">Failed to load classes</p>';
        }
    }

    async loadNotifications() {
        try {
            const response = await axios.get('/api/notifications?limit=5', {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            const notificationsContainer = document.getElementById('user-notifications');
            const notifications = response.data.notifications;

            if (notifications.length === 0) {
                notificationsContainer.innerHTML = '<p class="text-gray-500">No notifications</p>';
                return;
            }

            notificationsContainer.innerHTML = notifications.map(notification => {
                const priorityColor = this.getPriorityColor(notification.priority);
                const isUnread = !notification.is_read;
                
                return `
                    <div class="p-2 ${priorityColor} rounded ${isUnread ? 'border-l-4 border-blue-500' : ''}" 
                         onclick="app.markNotificationAsRead(${notification.id})">
                        <div class="font-medium text-sm">${notification.title}</div>
                        <div class="text-xs text-gray-600">${notification.message.substring(0, 80)}...</div>
                        <div class="text-xs text-gray-400 mt-1">
                            ${new Date(notification.created_at).toLocaleDateString()}
                            ${isUnread ? '• Unread' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load notifications:', error);
            document.getElementById('user-notifications').innerHTML = 
                '<p class="text-red-500">Failed to load notifications</p>';
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            await axios.put(`/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            this.loadNotifications(); // Reload notifications
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = '';
        
        // Add user message to chat
        this.addChatMessage('user', message);
        
        // Show loading message
        const loadingId = this.addChatMessage('assistant', 'Thinking...', true);
        
        try {
            const response = await axios.post('/api/chat', {
                message,
                conversationId: this.currentConversationId
            }, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            // Remove loading message
            document.getElementById(loadingId).remove();
            
            // Add AI response
            this.addChatMessage('assistant', response.data.response);
            this.currentConversationId = response.data.conversationId;
            
        } catch (error) {
            console.error('Chat failed:', error);
            document.getElementById(loadingId).remove();
            this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addChatMessage(sender, message, isLoading = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const isUser = sender === 'user';
        const messageHtml = `
            <div id="${messageId}" class="mb-4 ${isUser ? 'text-right' : 'text-left'}">
                <div class="${isUser ? 'bg-primary text-white ml-8' : 'bg-gray-200 text-gray-800 mr-8'} 
                           inline-block px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                    ${isUser ? '' : '<i class="fas fa-robot mr-2"></i>'}
                    ${message}
                    ${isLoading ? '<i class="fas fa-spinner fa-spin ml-2"></i>' : ''}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    ${isUser ? 'You' : 'AlphaClassBot'} • ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;
        
        chatMessages.innerHTML += messageHtml;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageId;
    }

    getEventTypeIcon(eventType) {
        const icons = {
            'class': 'fas fa-chalkboard-teacher',
            'exam': 'fas fa-clipboard-check',
            'assignment': 'fas fa-file-alt',
            'meeting': 'fas fa-users',
            'holiday': 'fas fa-calendar-day',
            'custom': 'fas fa-star'
        };
        return icons[eventType] || 'fas fa-calendar';
    }

    getEventTypeColor(eventType) {
        const colors = {
            'class': 'bg-blue-100 text-blue-800',
            'exam': 'bg-red-100 text-red-800',
            'assignment': 'bg-yellow-100 text-yellow-800',
            'meeting': 'bg-green-100 text-green-800',
            'holiday': 'bg-purple-100 text-purple-800',
            'custom': 'bg-gray-100 text-gray-800'
        };
        return colors[eventType] || 'bg-gray-100 text-gray-800';
    }

    getPriorityColor(priority) {
        const colors = {
            'urgent': 'bg-red-100 text-red-800',
            'high': 'bg-orange-100 text-orange-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-green-100 text-green-800'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    'fa-info-circle'
                } mr-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application
const app = new AlphaClassBot();
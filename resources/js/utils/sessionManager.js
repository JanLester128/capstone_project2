/**
 * Session Management Utility
 * Ensures consistent authentication state across browser tabs
 */

class SessionManager {
    constructor() {
        this.storageKey = 'app_session_state';
        this.checkInterval = null;
        this.lastKnownState = null;
        
        // Listen for storage changes from other tabs
        window.addEventListener('storage', this.handleStorageChange.bind(this));
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Initialize session monitoring
     */
    init(currentUser = null) {
        if (currentUser) {
            this.updateSessionState({
                isAuthenticated: true,
                user: currentUser,
                timestamp: Date.now()
            });
        }
        
        this.startMonitoring();
    }

    /**
     * Update session state in localStorage
     */
    updateSessionState(state) {
        localStorage.setItem(this.storageKey, JSON.stringify(state));
        this.lastKnownState = state;
    }

    /**
     * Get current session state
     */
    getSessionState() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error reading session state:', error);
            return null;
        }
    }

    /**
     * Clear session state
     */
    clearSessionState() {
        localStorage.removeItem(this.storageKey);
        this.lastKnownState = null;
    }

    /**
     * Handle storage changes from other tabs
     */
    handleStorageChange(event) {
        if (event.key === this.storageKey) {
            const newState = event.newValue ? JSON.parse(event.newValue) : null;
            
            // If user logged out in another tab, redirect to login
            if (!newState || !newState.isAuthenticated) {
                this.handleLogout();
            }
            // If user logged in with different account in another tab
            else if (this.lastKnownState && 
                     this.lastKnownState.user && 
                     newState.user && 
                     this.lastKnownState.user.id !== newState.user.id) {
                this.handleAccountSwitch(newState);
            }
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (!document.hidden) {
            // Page became visible, check session state
            this.checkSessionConsistency();
        }
    }

    /**
     * Check session consistency across tabs
     */
    checkSessionConsistency() {
        const storedState = this.getSessionState();
        const currentPath = window.location.pathname;
        
        // If no stored session but user appears to be on protected route
        if (!storedState || !storedState.isAuthenticated) {
            if (this.isProtectedRoute(currentPath)) {
                window.location.href = '/login';
            }
        }
        // If stored session exists but user is on login page
        else if (storedState.isAuthenticated && this.isLoginRoute(currentPath)) {
            this.redirectToUserDashboard(storedState.user);
        }
    }

    /**
     * Check if current route is protected
     */
    isProtectedRoute(path) {
        const protectedPrefixes = ['/registrar', '/faculty', '/student'];
        return protectedPrefixes.some(prefix => path.startsWith(prefix));
    }

    /**
     * Check if current route is login
     */
    isLoginRoute(path) {
        return path === '/' || path === '/login';
    }

    /**
     * Redirect to appropriate dashboard based on user role
     */
    redirectToUserDashboard(user) {
        if (!user || !user.Role) return;
        
        const dashboards = {
            'Registrar': '/registrar',
            'Faculty': '/faculty',
            'Student': '/student'
        };
        
        const dashboard = dashboards[user.Role];
        if (dashboard && window.location.pathname !== dashboard) {
            window.location.href = dashboard;
        }
    }

    /**
     * Handle logout from another tab
     */
    handleLogout() {
        this.clearSessionState();
        if (this.isProtectedRoute(window.location.pathname)) {
            window.location.href = '/login';
        }
    }

    /**
     * Handle account switch from another tab
     */
    handleAccountSwitch(newState) {
        // Update local state
        this.lastKnownState = newState;
        
        // Redirect to appropriate dashboard
        this.redirectToUserDashboard(newState.user);
    }

    /**
     * Start monitoring session state
     */
    startMonitoring() {
        // Check every 5 seconds
        this.checkInterval = setInterval(() => {
            this.checkSessionConsistency();
        }, 5000);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Handle user login
     */
    handleLogin(user) {
        this.updateSessionState({
            isAuthenticated: true,
            user: user,
            timestamp: Date.now()
        });
    }

    /**
     * Handle user logout
     */
    handleUserLogout() {
        this.clearSessionState();
    }
}

// Create global instance
const sessionManager = new SessionManager();

export default sessionManager;

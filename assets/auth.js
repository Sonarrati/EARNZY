// Supabase configuration
const SUPABASE_URL = 'https://qwoqpwyjugfsiwlwvmlf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b3Fwd3lqdWdmc2l3bHd2bWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzkzNDAsImV4cCI6MjA3NTA1NTM0MH0.36cfavBebNeF4SLuar3jUTRORYnhaOhc6A5xuF4HvLw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Auth state management
let currentUser = null;

// Check authentication state
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Redirect if not authenticated
async function requireAuth(redirectTo = 'login.html') {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

// Redirect if already authenticated
async function redirectIfAuthenticated(redirectTo = 'dashboard.html') {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        window.location.href = redirectTo;
        return true;
    }
    return false;
}

// Sign out function
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        } else {
            console.error('Sign out error:', error);
        }
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Generate referral code
function generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

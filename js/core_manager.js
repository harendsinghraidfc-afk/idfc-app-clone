/**
 * Core Manager to handle global data for the frontend app
 * Synchronized with Admin Panel data
 */

const APP_USER_KEY = 'idfc_app_user_data';
const ADMIN_USERS_KEY = 'idfc_users_data';
const ADMIN_TXN_KEY = 'idfc_transactions_data';

function logout() {
    console.log('Logging out...');
    localStorage.removeItem('idfc_app_user_data');
    window.location.href = 'auth.html';
}

// Proactive data loading
function getActiveUser() {
    // Check Admin's user list first (Source of Truth)
    const adminUsers = localStorage.getItem(ADMIN_USERS_KEY);
    if (adminUsers) {
        const users = JSON.parse(adminUsers);
        if (users.length > 0) {
            // Automatically track the first user in the list
            return users[0];
        }
    }

    // Fallback to app-specific key
    const appUser = localStorage.getItem(APP_USER_KEY);
    return appUser ? JSON.parse(appUser) : null;
}

async function loadAppData() {
    const user = getActiveUser();
    if (!user) {
        try {
            const response = await fetch('server_backend/users.json');
            if (response.ok) {
                const users = await response.json();
                if (users && users.length > 0) {
                    localStorage.setItem(APP_USER_KEY, JSON.stringify(users[0]));
                    return users[0];
                }
            }
        } catch (e) { console.warn('JSON fetch failed'); }
    }
    return user;
}

function getTransactionsForActiveUser() {
    const user = getActiveUser();
    if (!user) return [];

    const allTxnsData = localStorage.getItem(ADMIN_TXN_KEY);
    if (!allTxnsData) return [];

    const allTxns = JSON.parse(allTxnsData);
    // Fetch transactions using the exact Customer ID of the active user
    const userTxns = allTxns[user.customerId] || [];

    // Return sorted (latest first)
    return [...userTxns].reverse();
}

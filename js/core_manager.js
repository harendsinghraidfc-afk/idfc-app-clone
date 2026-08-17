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
    let user = getActiveUser();
    if (!user) {
        try {
            const response = await fetch('server_backend/users.json?t=' + new Date().getTime());
            if (response.ok) {
                const users = await response.json();
                if (users && users.length > 0) {
                    user = users[0];
                    localStorage.setItem(APP_USER_KEY, JSON.stringify(user));
                    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users)); // Sync admin key too
                }
            }
        } catch (e) { console.warn('Users JSON fetch failed'); }
    }

    // Also proactively fetch transactions if not in local storage
    if (!localStorage.getItem(ADMIN_TXN_KEY)) {
        try {
            const response = await fetch('server_backend/transactions.json?t=' + new Date().getTime());
            if (response.ok) {
                const txns = await response.json();
                localStorage.setItem(ADMIN_TXN_KEY, JSON.stringify(txns));
            }
        } catch (e) { console.warn('Transactions JSON fetch failed'); }
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

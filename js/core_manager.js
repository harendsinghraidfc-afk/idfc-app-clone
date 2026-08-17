/**
 * Core Manager: Handles Multiple Users and Default Profile logic
 */

const APP_USER_KEY = 'idfc_app_user_data';
const ADMIN_USERS_KEY = 'idfc_users_data';
const ADMIN_TXN_KEY = 'idfc_transactions_data';

function logout() {
    localStorage.removeItem(APP_USER_KEY);
    window.location.href = 'auth.html';
}

function getActiveUser() {
    const appUser = localStorage.getItem(APP_USER_KEY);
    return appUser ? JSON.parse(appUser) : null;
}

/**
 * Logic: Fetch Users from server. The first user (index 0) is ALWAYS the default.
 */
async function loadAppData() {
    try {
        const response = await fetch('server_backend/users.json?t=' + Date.now());
        if (response.ok) {
            const users = await response.json();
            if (users && users.length > 0) {
                // IMPORTANT: Always sync the first user from server as the current session user
                const defaultUser = users[0];
                localStorage.setItem(APP_USER_KEY, JSON.stringify(defaultUser));
                localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));

                // Fetch transactions for this specific user
                await fetchTransactions(defaultUser.customerId);
                return defaultUser;
            }
        }
    } catch (e) {
        console.warn('Sync failed, using local fallback');
        return getActiveUser();
    }
}

async function fetchTransactions(customerId) {
    try {
        const response = await fetch('server_backend/transactions.json?t=' + Date.now());
        if (response.ok) {
            const allTxns = await response.json();
            localStorage.setItem(ADMIN_TXN_KEY, JSON.stringify(allTxns));
        }
    } catch (e) { console.error('Txn fetch failed'); }
}

function getTransactionsForActiveUser() {
    const user = getActiveUser();
    if (!user) return [];

    const allTxnsData = localStorage.getItem(ADMIN_TXN_KEY);
    if (!allTxnsData) return [];

    const allTxns = JSON.parse(allTxnsData);
    const userTxns = allTxns[user.customerId] || [];

    // Robust Chronological Sorting (Newest First)
    return [...userTxns].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();

        if (timeB !== timeA) return timeB - timeA;

        // If dates are exactly same, sort by ID to maintain entry order
        return (b.id || 0) - (a.id || 0);
    });
}

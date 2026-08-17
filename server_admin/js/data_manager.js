// Data Manager to handle User and Transaction Storage (Simulating Backend)

const STORAGE_KEY = 'idfc_users_data';
const TXN_STORAGE_KEY = 'idfc_transactions_data';

// Initialize data if not present
async function initializeData() {
    // Attempt to fetch from server first if localStorage is empty
    if (!localStorage.getItem(STORAGE_KEY)) {
        try {
            const res = await fetch('../server_backend/users.json?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                console.log('Users initialized from server');
            }
        } catch (e) { console.warn('Users init from server failed'); }
    }

    if (!localStorage.getItem(TXN_STORAGE_KEY)) {
        try {
            const res = await fetch('../server_backend/transactions.json?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem(TXN_STORAGE_KEY, JSON.stringify(data));
                console.log('Transactions initialized from server');
            }
        } catch (e) { console.warn('Transactions init from server failed'); }
    }

    // Hard fallback if still empty
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultUsers = [{
            welcomeName: "Lokesh",
            fullName: "Lokesh Chouhan",
            customerId: "6910097017",
            accountNumber: "102 9516 8767",
            availableBalance: "₹ 5,00,000.00",
            mpin: "1234"
        }];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    }
}

function getUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function getUserByIndex(index) {
    const users = getUsers();
    return users[index] || null;
}

function saveUser(user, index = null) {
    const users = getUsers();
    if (index !== null && index >= 0) {
        users[index] = user;
    } else {
        users.push(user);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return true;
}

function getAllTransactions() {
    const data = localStorage.getItem(TXN_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function getTransactionsForUser(customerId) {
    const allTxns = getAllTransactions();
    return allTxns[customerId] || [];
}

function saveTransaction(customerId, txn, txnId = null) {
    const allTxns = getAllTransactions();
    if (!allTxns[customerId]) allTxns[customerId] = [];

    if (txnId) {
        const index = allTxns[customerId].findIndex(t => t.id == txnId);
        if (index !== -1) {
            allTxns[customerId][index] = { ...txn, id: parseInt(txnId) };
        }
    } else {
        txn.id = Date.now();
        allTxns[customerId].push(txn);
    }

    localStorage.setItem(TXN_STORAGE_KEY, JSON.stringify(allTxns));
    return true;
}

function getTransactionById(customerId, txnId) {
    const txns = getTransactionsForUser(customerId);
    return txns.find(t => t.id == txnId) || null;
}

function deleteTransaction(customerId, txnId) {
    const allTxns = getAllTransactions();
    if (!allTxns[customerId]) return false;

    const initialLength = allTxns[customerId].length;
    allTxns[customerId] = allTxns[customerId].filter(t => t.id != txnId);

    if (allTxns[customerId].length !== initialLength) {
        localStorage.setItem(TXN_STORAGE_KEY, JSON.stringify(allTxns));
        return true;
    }
    return false;
}

initializeData();

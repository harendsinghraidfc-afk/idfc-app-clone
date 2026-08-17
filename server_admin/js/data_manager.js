// Data Manager to handle User and Transaction Storage (Simulating Backend)

const STORAGE_KEY = 'idfc_users_data';
const TXN_STORAGE_KEY = 'idfc_transactions_data';

// Initialize data if not present
function initializeData() {
    // 1. Initial Users
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultUsers = [
            {
                welcomeName: "Anit",
                fullName: "Lokesh Chouhan",
                customerId: "6910097017",
                accountNumber: "102 9516 8767",
                ifscCode: "IDFB0042142",
                swiftCode: "IDFB IN BB MUM",
                bankName: "IDFC FIRST",
                branchName: "Sejawata Branch",
                mpin: "1234",
                availableBalance: "₹ 5,00,000.00"
            }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
        console.log('Default users initialized');
    }

    // 2. Initial Transactions
    if (!localStorage.getItem(TXN_STORAGE_KEY)) {
        const defaultTxns = {
            "6910097017": [
                { id: 1001, date: "07 Aug, 2026", desc: "UPICC/DR/702456126437/Ishwarl/YESB/paytm.s/Payment...", amount: "₹2,000.00", status: "unbilled" },
                { id: 1002, date: "07 Aug, 2026", desc: "Domestic Cash Advance Fee", amount: "₹199.00", status: "unbilled" },
                { id: 1003, date: "07 Aug, 2026", desc: "IGST", amount: "₹35.82", status: "unbilled" }
            ]
        };
        localStorage.setItem(TXN_STORAGE_KEY, JSON.stringify(defaultTxns));
        console.log('Default transactions initialized');
    }
}

// --- USER FUNCTIONS ---

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
        users[index] = user; // Update existing
    } else {
        users.push(user); // Add new
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return true;
}

// --- TRANSACTION FUNCTIONS ---

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
        // Update existing
        const index = allTxns[customerId].findIndex(t => t.id == txnId);
        if (index !== -1) {
            allTxns[customerId][index] = { ...txn, id: parseInt(txnId) };
        }
    } else {
        // Add new
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

// Run initialization immediately
initializeData();

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

    const filtered = userTxns.filter(t => {
        const cat = (t.category || 'savings').toLowerCase();
        const status = String(t.status || 'approved').toLowerCase();
        if (cat === 'savings') {
            return status === 'approved';
        }
        return true;
    });

    return [...filtered].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();

        if (timeB !== timeA) return timeB - timeA;

        return (b.id || 0) - (a.id || 0);
    });
}

/**
 * Dynamically calculate balance based on transaction history
 * Start from 0, add credits, subtract debits
 */
function _isTxnCredit(txn) {
    if (!txn) return false;
    const legOk = txn.leg && String(txn.leg).toUpperCase() === 'CREDIT';
    const typeOk = txn.type && String(txn.type).toLowerCase() === 'credit';
    const signOk = String(txn.amount || '').indexOf('+') !== -1;
    return legOk || typeOk || signOk;
}
function _num(txn) { return parseFloat(String(txn.amount || '0').replace(/[^\d.]/g, '')) || 0; }

function getCalculatedBalance() {
    const txns = getTransactionsForActiveUser();
    let balance = 0;

    const chronologicalTxns = [...txns].sort((a, b) => {
        const ta = new Date(a.timestamp || a.date).getTime() || (a.id || 0);
        const tb = new Date(b.timestamp || b.date).getTime() || (b.id || 0);
        if (ta !== tb) return ta - tb;
        return (a.id || 0) - (b.id || 0);
    });

    chronologicalTxns.forEach(txn => {
        const cat = (txn.category || 'savings').toLowerCase();
        const status = String(txn.status || 'approved').toLowerCase();
        if (cat === 'savings' && status !== 'approved') return;
        const amount = _num(txn);
        if (_isTxnCredit(txn)) {
            balance += amount;
        } else {
            balance -= amount;
        }
    });

    return balance;
}

function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ===============================================================
   SIMPLIFIED TRANSACTION ENGINE (DEMO, MISTAKE-PROOF CALCULATION)
   =============================================================== */

function _pad2(n) { return String(n).padStart(2, '0'); }

function _todayStr() {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${_pad2(d.getDate())} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function _timeStampStr() {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${_pad2(d.getDate())} ${months[d.getMonth()]}, ${d.getFullYear()} ${_pad2(d.getHours())}:${_pad2(d.getMinutes())}:${_pad2(d.getSeconds())}`;
}

function generateUTR(mode = 'TXN') {
    const d = new Date();
    const stamp = `${d.getFullYear()}${_pad2(d.getMonth()+1)}${_pad2(d.getDate())}${_pad2(d.getHours())}${_pad2(d.getMinutes())}${_pad2(d.getSeconds())}`;
    const rand  = Math.floor(1000 + Math.random() * 9000);
    return `${String(mode).toUpperCase()}${stamp}${rand}`;
}

function _getAllTxnsObj() {
    const raw = localStorage.getItem(ADMIN_TXN_KEY);
    try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}

function _saveAllTxnsObj(obj) {
    localStorage.setItem(ADMIN_TXN_KEY, JSON.stringify(obj));
    const event = new Event('txnsUpdated');
    window.dispatchEvent(event);
}

function _getAllUsersArr() {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

function getCustomerById(customerId) {
    return _getAllUsersArr().find(u => String(u.customerId) === String(customerId));
}

function getCalculatedBalanceForUser(customerId) {
    const allTxns = _getAllTxnsObj();
    const txns = allTxns[customerId] || [];
    let balance = 0;
    const sorted = [...txns].sort((a, b) => {
        const ta = new Date(a.timestamp || a.date).getTime() || (a.id || 0);
        const tb = new Date(b.timestamp || b.date).getTime() || (b.id || 0);
        if (ta !== tb) return ta - tb;
        return (a.id || 0) - (b.id || 0);
    });
    sorted.forEach(txn => {
        const cat = (txn.category || 'savings').toLowerCase();
        const status = String(txn.status || 'approved').toLowerCase();
        if (cat === 'savings' && status !== 'approved') return;
        const amount = _num(txn);
        if (_isTxnCredit(txn)) balance += amount;
        else balance -= amount;
    });
    return balance;
}

function _nextTxnId() {
    let maxId = 0;
    const all = _getAllTxnsObj();
    Object.values(all).forEach(list => list.forEach(t => { if (t.id > maxId) maxId = t.id; }));
    return (maxId || 1000) + 1;
}

/* --------------------- BALANCE CHECK (ZERO MISTAKE) --------------------- */
function hasSufficientBalance(customerId, amountNum) {
    const bal = getCalculatedBalanceForUser(customerId);
    return bal >= Number(amountNum);
}

/* --------------------- MPIN VERIFY (USER GATE) --------------------- */
function verifyMpinForUser(customerId, mpinEntered) {
    const user = getCustomerById(customerId);
    if (!user) return { ok: false, reason: 'User not found' };
    const expected = String(user.mpin || user.loginPin || user.pin || '');
    if (!expected) return { ok: false, reason: 'MPIN not set for user' };
    if (String(mpinEntered) === expected) return { ok: true };
    return { ok: false, reason: 'Incorrect MPIN' };
}

/* --------------------- SINGLE LEG ADD (Admin / Standalone / External) --------------------- */
function addSingleTransaction(customerId, opts) {
    const customerIdStr = String(customerId);
    const type = (opts.type || 'credit').toLowerCase();
    const amountNum = Number(opts.amountNum);
    if (!customerIdStr || !amountNum || amountNum <= 0) {
        return { ok: false, reason: 'Invalid customer/amount' };
    }
    if (type === 'debit' && !opts.skipBalanceCheck && !hasSufficientBalance(customerIdStr, amountNum)) {
        return { ok: false, reason: 'Insufficient balance for debit' };
    }
    const all = _getAllTxnsObj();
    if (!all[customerIdStr]) all[customerIdStr] = [];

    const dateStr = opts.date || _todayStr();
    const tsStr   = opts.timestamp || _timeStampStr();

    const txn = {
        id: opts.id || _nextTxnId(),
        date: dateStr,
        timestamp: tsStr,
        utr: opts.utr || generateUTR(type === 'credit' ? 'CR' : 'DR'),
        leg: type.toUpperCase(),
        pair_of: opts.pairOf || null,
        category: opts.category || 'savings',
        mode: opts.mode || 'MANUAL',
        amount: formatCurrency(amountNum),
        amount_num: amountNum,
        type: type,
        desc: opts.desc || (type === 'credit' ? 'Credit' : 'Debit'),
        remarks: opts.remarks || '',
        from_customer_id: opts.fromCustomerId || null,
        to_customer_id:   opts.toCustomerId   || null,
        status: opts.status || 'approved',
        initiated_by: opts.initiatedBy || (type === 'credit' ? 'SYSTEM' : 'USER'),
        mpin_verified: !!opts.mpinVerified,
        standalone: !!opts.standalone,
        standalone_reason: opts.standaloneReason || null,
        reconciled: !!opts.reconciled,
        linked_utr: opts.linkedUtr || null,
        balance_check_pass: type === 'debit' ? hasSufficientBalance(customerIdStr, amountNum) : true
    };
    all[customerIdStr].push(txn);
    _saveAllTxnsObj(all);
    return { ok: true, txn };
}

/* --------------------- TRANSFER (DEBIT A + CREDIT B) — ZERO MISTAKE MATCHING --------------------- */
function transferBetweenUsers(opts) {
    const fromId = String(opts.fromCustomerId);
    const toId   = String(opts.toCustomerId);
    const amountNum = Number(opts.amountNum);
    const mode = opts.mode || 'UPI';
    const desc = opts.desc || '';
    const remarks = opts.remarks || '';
    const initiatedBy = opts.initiatedBy || 'USER';

    if (!fromId || !toId || fromId === toId) return { ok: false, reason: 'Invalid source/destination user' };
    if (!amountNum || amountNum <= 0) return { ok: false, reason: 'Invalid amount' };

    const fromUser = getCustomerById(fromId);
    const toUser   = getCustomerById(toId);
    if (!fromUser) return { ok: false, reason: 'Source user not found' };
    if (!toUser)   return { ok: false, reason: 'Destination user not found' };

    if (initiatedBy === 'USER') {
        if (!opts.mpinVerified) return { ok: false, reason: 'MPIN verification required' };
    }
    if (!opts.skipBalanceCheck && !hasSufficientBalance(fromId, amountNum)) {
        return { ok: false, reason: 'Insufficient balance' };
    }

    const sharedUtr = opts.utr || generateUTR(mode);
    const dateToday = _todayStr();
    const tsNow     = _timeStampStr();
    const fromMask  = fromUser.accountNumber ? `1${String(fromUser.accountNumber).slice(0,3)} **** ${String(fromUser.accountNumber).slice(-4)}` : '';
    const toMask    = toUser.accountNumber   ? `1${String(toUser.accountNumber).slice(0,3)} **** ${String(toUser.accountNumber).slice(-4)}`   : '';
    const debitDesc  = desc || `${mode}/Sent To/${toUser.fullName || toUser.name || toId}`;
    const creditDesc = desc || `${mode}/Received From/${fromUser.fullName || fromUser.name || fromId}`;

    const all = _getAllTxnsObj();
    if (!all[fromId]) all[fromId] = [];
    if (!all[toId])   all[toId]   = [];

    const debitId  = _nextTxnId();
    const creditId = debitId + 1;

    const debitTxn = {
        id: debitId,
        date: dateToday,
        timestamp: tsNow,
        utr: sharedUtr,
        leg: 'DEBIT',
        pair_of: creditId,
        category: 'savings',
        mode: mode,
        amount: formatCurrency(amountNum),
        amount_num: amountNum,
        type: 'debit',
        desc: debitDesc,
        remarks: remarks,
        from_customer_id: fromId,
        to_customer_id: toId,
        from_account_mask: fromMask,
        to_account_mask: toMask,
        status: 'approved',
        initiated_by: initiatedBy,
        mpin_verified: initiatedBy === 'USER' ? !!opts.mpinVerified : true,
        balance_check_pass: true,
        standalone: false,
        reconciled: true,
        linked_utr: sharedUtr
    };

    const creditTxn = {
        id: creditId,
        date: dateToday,
        timestamp: tsNow,
        utr: sharedUtr,
        leg: 'CREDIT',
        pair_of: debitId,
        category: 'savings',
        mode: mode,
        amount: formatCurrency(amountNum),
        amount_num: amountNum,
        type: 'credit',
        desc: creditDesc,
        remarks: remarks,
        from_customer_id: fromId,
        to_customer_id: toId,
        from_account_mask: fromMask,
        to_account_mask: toMask,
        status: 'approved',
        initiated_by: initiatedBy,
        mpin_verified: false,
        balance_check_pass: true,
        standalone: false,
        reconciled: true,
        linked_utr: sharedUtr
    };

    all[fromId].push(debitTxn);
    all[toId].push(creditTxn);
    _saveAllTxnsObj(all);

    return {
        ok: true,
        utr: sharedUtr,
        amount: amountNum,
        debit: debitTxn,
        credit: creditTxn,
        from_balance_after: getCalculatedBalanceForUser(fromId),
        to_balance_after:   getCalculatedBalanceForUser(toId)
    };
}

/* --------------------- ADMIN: Force add Debit/Credit with optional override --------------------- */
function adminAddTxn(customerId, opts) {
    const type = (opts.type || 'credit').toLowerCase();
    const amountNum = Number(opts.amountNum);
    if (!opts.adminAuthorised) return { ok: false, reason: 'Admin auth required' };
    if (type === 'debit') {
        const fromUser = getCustomerById(customerId);
        if (!fromUser) return { ok: false, reason: 'User not found' };
        if (!opts.skipBalanceCheck && !hasSufficientBalance(customerId, amountNum)) {
            if (opts.allowOverdraw) { /* admin override allowed */ }
            else return { ok: false, reason: 'Insufficient balance (use allowOverdraw flag)' };
        }
        if (opts.toCustomerId && String(opts.toCustomerId) !== customerId) {
            return transferBetweenUsers({
                fromCustomerId: customerId,
                toCustomerId: opts.toCustomerId,
                amountNum: amountNum,
                mode: opts.mode || 'ADMIN_TRANSFER',
                desc: opts.desc,
                remarks: opts.remarks,
                initiatedBy: 'ADMIN',
                mpinVerified: true,
                skipBalanceCheck: !!opts.allowOverdraw || !!opts.skipBalanceCheck,
                utr: opts.utr
            });
        }
    }
    return addSingleTransaction(customerId, {
        ...opts,
        initiatedBy: 'ADMIN',
        reconciled: true,
        skipBalanceCheck: !!opts.allowOverdraw || !!opts.skipBalanceCheck
    });
}

/* --------------------- REVERSE A TXN (Admin only — pair-reverse for transfers) --------------------- */
function adminReverseTxn(customerId, txnId, opts) {
    if (!opts || !opts.adminAuthorised) return { ok: false, reason: 'Admin auth required' };
    const all = _getAllTxnsObj();
    const list = all[customerId] || [];
    const txn = list.find(t => String(t.id) === String(txnId));
    if (!txn) return { ok: false, reason: 'Txn not found' };

    const origAmount = txn.amount_num || parseFloat((txn.amount || '0').replace(/[₹, ]/g, '')) || 0;
    if (txn.pair_of && txn.utr) {
        const otherId = txn.leg === 'DEBIT' ? txn.to_customer_id : txn.from_customer_id;
        const reverseType = txn.leg === 'DEBIT' ? 'CREDIT' : 'DEBIT';
        return transferBetweenUsers({
            fromCustomerId: otherId,
            toCustomerId: customerId,
            amountNum: origAmount,
            mode: 'REVERSAL',
            desc: `REV/${txn.utr}/${txn.desc || ''}`,
            remarks: opts.reason || 'Admin reversal',
            initiatedBy: 'ADMIN',
            mpinVerified: true,
            skipBalanceCheck: true
        });
    } else {
        return addSingleTransaction(customerId, {
            type: txn.leg === 'DEBIT' ? 'credit' : 'debit',
            amountNum: origAmount,
            mode: 'REVERSAL',
            desc: `REV/${txn.id}/${txn.desc || ''}`,
            remarks: opts.reason || 'Admin reversal',
            initiatedBy: 'ADMIN',
            standalone: true,
            standaloneReason: 'ADMIN_REVERSAL',
            reconciled: true,
            skipBalanceCheck: true,
            linkedUtr: txn.utr || null
        });
    }
}

/* --------------------- SIMPLE RECON: Ensure transfers are paired --------------------- */
function runQuickReconcile() {
    const all = _getAllTxnsObj();
    const byUtr = {};
    Object.entries(all).forEach(([cid, list]) => {
        list.forEach(t => {
            if (!t.utr || t.standalone) return;
            if (!byUtr[t.utr]) byUtr[t.utr] = [];
            byUtr[t.utr].push({ cid, txn: t });
        });
    });
    const issues = [];
    Object.entries(byUtr).forEach(([utr, arr]) => {
        if (arr.length === 1) issues.push({ utr, type: 'UNPAIRED', cid: arr[0].cid, txn_id: arr[0].txn.id, leg: arr[0].txn.leg });
        if (arr.length === 2) {
            const a = arr[0].txn, b = arr[1].txn;
            const na = a.amount_num || parseFloat((a.amount||'0').replace(/[₹, ]/g,''));
            const nb = b.amount_num || parseFloat((b.amount||'0').replace(/[₹, ]/g,''));
            if (Math.abs(na - nb) > 0.001) issues.push({ utr, type: 'AMOUNT_MISMATCH', a: na, b: nb });
            if (a.leg === b.leg) issues.push({ utr, type: 'SAME_LEG_BOTH', leg: a.leg });
        }
        if (arr.length > 2) issues.push({ utr, type: 'DUP_UTR_COUNT', count: arr.length });
    });
    return { total_pairs: Object.keys(byUtr).length, issues };
}



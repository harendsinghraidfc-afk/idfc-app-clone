/* ==========================================================
   USER-SIDE DEMO PAYMENT FLOWS (Mistake-Proof via Engine)
   - Pay to Mobile / UPI
   - Scan QR Confirm
   - Bank Transfer Confirm
   - Add Money (Standalone Credit demo)
   ========================================================== */

function _activeUserIdOrNull() {
    try {
        const appUser = localStorage.getItem('idfc_app_user_data');
        if (!appUser) return null;
        const u = JSON.parse(appUser);
        return String(u.customerId);
    } catch (e) { return null; }
}

function _allUsersList() {
    try {
        const raw = localStorage.getItem('idfc_users_data');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function findUserByPhoneOrCid(query) {
    const q = String(query || '').trim().replace(/\s+/g, '');
    if (!q) return null;
    const users = _allUsersList();
    return users.find(u => {
        const cid = String(u.customerId || '');
        const ph  = String(u.phone || u.mobileNumber || u.mobile || '').replace(/\s+/g,'');
        const upi = String(u.upiId || u.upi || '').toLowerCase();
        return (cid === q) || (ph && ph.includes(q)) || (upi && upi.indexOf(q.toLowerCase()) !== -1);
    }) || null;
}

function userGetMyBalance() {
    const id = _activeUserIdOrNull();
    if (!id) return 0;
    return getCalculatedBalanceForUser(id);
}

function openMpinPrompt(onSuccess, onCancel) {
    const modalHtml = `
    <div id="__mpin_mask" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div id="__mpin_box" style="width:100%;max-width:360px;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25);">
        <div style="text-align:center;">
          <div style="width:56px;height:56px;background:#eaf2ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2a5 5 0 00-5 5v3H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2h-2V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" fill="#2f5bec"/></svg>
          </div>
          <h3 style="margin:0 0 4px;font-size:18px;color:#111;">Enter MPIN</h3>
          <p style="margin:0 0 18px;font-size:13px;color:#666;">Your 4-digit secure PIN</p>
        </div>
        <input id="__mpin_input" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*"
               placeholder="••••"
               style="width:100%;box-sizing:border-box;padding:14px 16px;text-align:center;letter-spacing:14px;font-size:22px;font-weight:600;border:1.5px solid #dfe5ef;border-radius:12px;outline:none;"/>
        <div id="__mpin_err" style="color:#d33;font-size:12px;margin-top:8px;min-height:16px;"></div>
        <div style="display:flex;gap:10px;margin-top:18px;">
          <button id="__mpin_cancel" style="flex:1;padding:12px;border:1px solid #dfe5ef;background:#fff;color:#333;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">Cancel</button>
          <button id="__mpin_submit" style="flex:1;padding:12px;border:0;background:#1b1f3a;color:#fff;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">Verify</button>
        </div>
      </div>
    </div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap.firstElementChild);

    const mask = document.getElementById('__mpin_mask');
    const inp  = document.getElementById('__mpin_input');
    const err  = document.getElementById('__mpin_err');
    setTimeout(() => inp && inp.focus(), 30);

    function close() { const m = document.getElementById('__mpin_mask'); if (m) m.remove(); }
    function submit() {
        const pin = inp.value;
        if (!/^\d{4}$/.test(pin)) { err.textContent = 'Enter 4-digit MPIN'; return; }
        const uid = _activeUserIdOrNull();
        const res = verifyMpinForUser(uid, pin);
        if (res.ok) { close(); onSuccess && onSuccess(pin); }
        else { err.textContent = res.reason || 'Incorrect MPIN'; inp.value = ''; inp.focus(); }
    }

    document.getElementById('__mpin_cancel').addEventListener('click', () => { close(); onCancel && onCancel(); });
    document.getElementById('__mpin_submit').addEventListener('click', submit);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    mask.addEventListener('click', (e) => { if (e.target === mask) { close(); onCancel && onCancel(); } });
}

function showToast(msg, type) {
    const bg = type === 'error' ? '#d33' : type === 'warn' ? '#e07b00' : '#0a8f51';
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:10px 16px;border-radius:10px;z-index:100000;font-size:13px;box-shadow:0 10px 24px rgba(0,0,0,.2);max-width:90%;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
}

function showSuccessScreen(opts) {
    const amt = formatCurrency(Number(opts.amount || 0));
    const html = `
    <div id="__success_mask" style="position:fixed;inset:0;background:#fff;z-index:99998;padding:24px;display:flex;flex-direction:column;align-items:center;">
      <div style="margin-top:40px;width:88px;height:88px;background:#e6f8ef;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#0a8f51" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h2 style="margin:14px 0 4px;color:#111;">${opts.title || 'Payment Successful'}</h2>
      <div style="font-size:30px;font-weight:700;color:#111;margin:8px 0 20px;">${amt}</div>

      <div style="width:100%;max-width:380px;background:#f7f9fc;border-radius:14px;padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">${opts.fromLabel || 'Paid from'}</span><b>${opts.fromText || 'Savings Account'}</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">${opts.toLabel || 'Paid to'}</span><b>${opts.toText || ''}</b></div>
        ${opts.mode ? `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">Mode</span><b>${opts.mode}</b></div>` : ''}
        ${opts.remarks ? `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">Remarks</span><b>${opts.remarks}</b></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">UTR / Ref</span><b style="font-family:monospace;font-size:12px;">${opts.utr || '-'}</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#666;">Date & Time</span><b>${opts.time || ''}</b></div>
      </div>

      <div style="width:100%;max-width:380px;margin-top:20px;display:flex;gap:10px;">
        <button id="__s_back" style="flex:1;padding:12px;border:1px solid #dfe5ef;background:#fff;color:#333;border-radius:12px;font-size:14px;font-weight:600;">Back</button>
        <button id="__s_done" style="flex:1;padding:12px;border:0;background:#1b1f3a;color:#fff;border-radius:12px;font-size:14px;font-weight:600;">Done</button>
      </div>
      <button id="__s_again" style="width:100%;max-width:380px;margin-top:10px;padding:12px;border:1px dashed #2f5bec;background:#f2f6ff;color:#2f5bec;border-radius:12px;font-size:13px;font-weight:600;">${opts.againLabel || 'Make another payment'}</button>
    </div>`;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);

    function close() { const m = document.getElementById('__success_mask'); if (m) m.remove(); opts.onClose && opts.onClose(); }
    document.getElementById('__s_back').addEventListener('click', () => {
        close();
    });
    document.getElementById('__s_done').addEventListener('click', () => {
        close();
        if (window.location.href.includes('pay_to_mobile') || window.location.href.includes('scan') || window.location.href.includes('bank_transfer')) {
            window.location.href = 'savings_transactions.html';
        }
    });
    document.getElementById('__s_again').addEventListener('click', () => {
        close(); opts.onAgain && opts.onAgain();
    });
}

/* --------------------- MAIN: Pay to Mobile (user clicks pay) --------------------- */
function userPayToContact(targetUser, amountNum, opts = {}) {
    const meId = _activeUserIdOrNull();
    if (!meId) { showToast('Login required', 'error'); return { ok: false, reason: 'not_logged_in' }; }
    if (!targetUser) { showToast('Beneficiary not found', 'warn'); return { ok: false, reason: 'no_beneficiary' }; }
    if (String(targetUser.customerId) === meId) { showToast('Cannot pay to self', 'warn'); return { ok: false, reason: 'self_pay' }; }
    const amt = Number(amountNum);
    if (!amt || amt <= 0) { showToast('Enter valid amount', 'warn'); return { ok: false, reason: 'bad_amount' }; }
    if (!hasSufficientBalance(meId, amt)) { showToast('Insufficient balance', 'error'); return { ok: false, reason: 'low_balance' }; }

    openMpinPrompt(() => {
        const res = transferBetweenUsers({
            fromCustomerId: meId,
            toCustomerId: targetUser.customerId,
            amountNum: amt,
            mode: opts.mode || 'UPI',
            desc: opts.desc,
            remarks: opts.remarks || '',
            initiatedBy: 'USER',
            mpinVerified: true
        });
        if (!res.ok) { showToast(res.reason || 'Payment failed', 'error'); return; }
        showSuccessScreen({
            amount: res.amount,
            fromText: 'Savings Account',
            toText: targetUser.fullName || targetUser.name || String(targetUser.customerId),
            mode: res.debit.mode || opts.mode || 'UPI',
            remarks: opts.remarks,
            utr: res.utr,
            time: res.debit.timestamp,
            againLabel: 'Pay another contact',
            onAgain: () => {
                if (document.getElementById('payAmount')) document.getElementById('payAmount').value = '';
            }
        });
    }, () => showToast('Cancelled', 'warn'));
    return { ok: true, status: 'mpin_pending' };
}

/* --------------------- MAIN: Scan QR Pay (after merchant resolved) --------------------- */
function userScanQrPay(targetUser, amountNum, opts = {}) {
    const meId = _activeUserIdOrNull();
    if (!meId) { showToast('Login required', 'error'); return { ok: false, reason: 'not_logged_in' }; }
    const amt = Number(amountNum);
    if (!amt || amt <= 0) { showToast('Enter valid amount', 'warn'); return { ok: false, reason: 'bad_amount' }; }
    if (!hasSufficientBalance(meId, amt)) { showToast('Insufficient balance', 'error'); return { ok: false, reason: 'low_balance' }; }

    openMpinPrompt(() => {
        let res;
        if (targetUser && String(targetUser.customerId) !== meId) {
            res = transferBetweenUsers({
                fromCustomerId: meId,
                toCustomerId: targetUser.customerId,
                amountNum: amt,
                mode: 'QR',
                desc: opts.desc || `QR/Payment/${targetUser.fullName || targetUser.name || 'Merchant'}`,
                remarks: opts.remarks || '',
                initiatedBy: 'USER',
                mpinVerified: true
            });
        } else {
            res = addSingleTransaction(meId, {
                type: 'debit',
                amountNum: amt,
                mode: 'QR',
                desc: opts.desc || 'QR Payment to Merchant',
                remarks: opts.remarks || '',
                mpinVerified: true,
                standalone: true,
                standaloneReason: 'EXTERNAL_MERCHANT_QR'
            });
            if (res.ok) {
                res.amount = amt;
                res.utr = res.txn.utr;
                res.debit = res.txn;
            }
        }
        if (!res.ok) { showToast(res.reason || 'Payment failed', 'error'); return; }
        showSuccessScreen({
            title: 'QR Payment Successful',
            amount: res.amount,
            fromText: 'Savings Account',
            toText: targetUser ? (targetUser.fullName || targetUser.name || 'Merchant') : (opts.merchant || 'Merchant'),
            mode: 'QR',
            remarks: opts.remarks,
            utr: res.utr,
            time: (res.debit && res.debit.timestamp) ? res.debit.timestamp : (new Date().toLocaleString()),
            againLabel: 'Scan another QR code'
        });
    }, () => showToast('Cancelled', 'warn'));
    return { ok: true, status: 'mpin_pending' };
}

/* --------------------- MAIN: Bank Transfer (via saved payee / manual) --------------------- */
function userBankTransfer(payee, amountNum, opts = {}) {
    const meId = _activeUserIdOrNull();
    if (!meId) { showToast('Login required', 'error'); return { ok: false, reason: 'not_logged_in' }; }
    const amt = Number(amountNum);
    if (!amt || amt <= 0) { showToast('Enter valid amount', 'warn'); return { ok: false, reason: 'bad_amount' }; }
    if (!hasSufficientBalance(meId, amt)) { showToast('Insufficient balance', 'error'); return { ok: false, reason: 'low_balance' }; }

    openMpinPrompt(() => {
        let res;
        const payeeIsInternal = payee && payee.customerId && String(payee.customerId) !== meId;
        if (payeeIsInternal) {
            res = transferBetweenUsers({
                fromCustomerId: meId,
                toCustomerId: payee.customerId,
                amountNum: amt,
                mode: opts.mode || 'IMPS',
                desc: opts.desc || `${opts.mode || 'IMPS'}/Paid To/${payee.name || payee.fullName || 'Beneficiary'}`,
                remarks: opts.remarks || '',
                initiatedBy: 'USER',
                mpinVerified: true
            });
        } else {
            res = addSingleTransaction(meId, {
                type: 'debit',
                amountNum: amt,
                mode: opts.mode || 'IMPS',
                desc: opts.desc || `${opts.mode || 'IMPS'}/Paid To/${payee ? (payee.name || payee.accountNumber) : 'Beneficiary'}`,
                remarks: opts.remarks || '',
                mpinVerified: true,
                standalone: true,
                standaloneReason: 'EXTERNAL_BANK_TRANSFER'
            });
            if (res.ok) {
                res.amount = amt;
                res.utr = res.txn.utr;
                res.debit = res.txn;
            }
        }
        if (!res.ok) { showToast(res.reason || 'Transfer failed', 'error'); return; }
        showSuccessScreen({
            title: 'Transfer Successful',
            amount: res.amount,
            fromText: 'Savings Account',
            toText: payee ? (payee.name || payee.fullName || `A/C ${payee.accountNumber || ''}`) : 'Beneficiary',
            mode: opts.mode || 'IMPS',
            remarks: opts.remarks,
            utr: res.utr,
            time: (res.debit && res.debit.timestamp) ? res.debit.timestamp : (new Date().toLocaleString()),
            againLabel: 'Transfer to another'
        });
    }, () => showToast('Cancelled', 'warn'));
    return { ok: true, status: 'mpin_pending' };
}

/* --------------------- MAIN: Add Money (demo standalone credit) --------------------- */
function userAddMoney(amountNum, source, opts = {}) {
    const meId = _activeUserIdOrNull();
    if (!meId) { showToast('Login required', 'error'); return { ok: false, reason: 'not_logged_in' }; }
    const amt = Number(amountNum);
    if (!amt || amt <= 0) { showToast('Enter valid amount', 'warn'); return { ok: false, reason: 'bad_amount' }; }
    if (amt > 500000) { showToast('Limit: up to ₹5,00,000', 'warn'); return { ok: false, reason: 'limit' }; }

    openMpinPrompt(() => {
        const res = addSingleTransaction(meId, {
            type: 'credit',
            amountNum: amt,
            mode: source || 'UPI',
            desc: `Add Money/${source || 'UPI'}/Load Wallet`,
            remarks: opts.remarks || 'Add Money to account',
            mpinVerified: true,
            standalone: true,
            standaloneReason: 'EXTERNAL_ADD_MONEY'
        });
        if (!res.ok) { showToast(res.reason || 'Failed to add money', 'error'); return; }
        showSuccessScreen({
            title: 'Money Added Successfully',
            amount: amt,
            fromLabel: 'Source',
            fromText: `${source || 'UPI'} (External)`,
            toLabel: 'Credited To',
            toText: 'Savings Account',
            mode: `${source || 'UPI'} • Add Money`,
            remarks: opts.remarks,
            utr: res.txn.utr,
            time: res.txn.timestamp,
            againLabel: 'Add more money'
        });
    }, () => showToast('Cancelled', 'warn'));
    return { ok: true, status: 'mpin_pending' };
}

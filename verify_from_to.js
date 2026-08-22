const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('VERIFICATION v2: No TxID row + Debit/Credit From/To correct');
console.log('========================================\n');

const htmlPath = path.join(__dirname, 'transaction_summary.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const txnsPath = path.join(__dirname, 'server_backend', 'transactions.json');
const usersPath = path.join(__dirname, 'server_backend', 'users.json');
const allTxns = JSON.parse(fs.readFileSync(txnsPath, 'utf8'));
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

let allPassed = true;

console.log('--- HTML checks ---\n');
const htmlChecks = [
    ['Transaction ID row is default display:none (hidden)', /id="detail-id".*style="display:none;"/.test(html)],
    ['Status row still visible (NO style display:none)', /<div class="detail-item">\s*\n\s*<p class="detail-label">Status/.test(html.replace(/id="detail-id"[^>]*>[\s\S]*?<\/div>\s*\n\s*<div class="detail-item">\s*\n\s*<p class="detail-label">Status/, 'CHECK_A'))],
    ['isCredit decision used for finalFrom/finalTo assignment', /if \(isCredit\)/.test(html) && /finalFrom = otherPartyLabel \|\| userAccountLabel;/.test(html) && /finalTo = userAccountLabel;/.test(html)],
    ['DEBIT branch: finalFrom=user finalTo=other-party', /else \{\s*\n\s*finalFrom = userAccountLabel;\s*\n\s*finalTo = otherPartyLabel \|\| userAccountLabel;/.test(html)],
    ['Salary standalone_reason default other-party = External Employer', /EXTERNAL_SALARY_CREDIT.*External Employer/.test(html)],
    ['IGST standalone_reason default = Government / Banking Charges', /EXTERNAL_GOVT_CHARGE.*Government \/ Banking Charges/.test(html)],
    ['detail-to row shown only when finalTo non-empty value populated', /showRow\('detail-to', !!finalTo\)/.test(html)],
];
htmlChecks.forEach(([label, ok]) => {
    if (ok) console.log(`  ✅ ${label}`);
    else { console.log(`  ❌ ${label}`); allPassed = false; }
});

console.log('\n--- From/To Logic Simulation (Debit vs Credit) ---\n');

function simulateFromTo(cid, txnId) {
    const list = allTxns[cid] || [];
    const txn = list.find(t => String(t.id) === String(txnId)) || list[0];
    if (!txn) return null;
    const user = users.find(u => String(u.customerId) === String(cid));
    const cat = (txn.category || 'savings').toLowerCase();
    const isCredit =
        (txn.leg && String(txn.leg).toUpperCase() === 'CREDIT') ||
        (txn.type && String(txn.type).toLowerCase() === 'credit') ||
        (String(txn.amount || '').indexOf('+') !== -1);
    function last4(n) { const d = String(n || '').replace(/\s+/g, ''); return d.length >= 4 ? d.slice(-4) : 'XXXX'; }
    let userAcc = `IDFC FIRST Savings xx ${last4(user && user.accountNumber)}`;
    if (cat === 'credit_card') userAcc = `FIRST Digital Credit Card xx ${last4(user && user.creditCardNumber)}`;
    else if (cat === 'loan') userAcc = `IDFC Loan Account xx ${last4(user && user.accountNumber)}`;

    let otherParty = '';
    if (txn.to_customer_id && String(txn.to_customer_id) !== String(cid)) {
        const u2 = users.find(u => String(u.customerId) === String(txn.to_customer_id));
        otherParty = u2 ? `IDFC FIRST Savings xx ${last4(u2.accountNumber)}` : '';
    }
    if (txn.from_customer_id && String(txn.from_customer_id) !== String(cid)) {
        const u2 = users.find(u => String(u.customerId) === String(txn.from_customer_id));
        otherParty = u2 ? `IDFC FIRST Savings xx ${last4(u2.accountNumber)}` : '';
    }
    if (!otherParty && txn.utr && txn.pair_of !== undefined && txn.pair_of !== null) {
        const oppLeg = String(txn.leg || 'DEBIT').toUpperCase() === 'DEBIT' ? 'CREDIT' : 'DEBIT';
        for (const cid2 of Object.keys(allTxns)) {
            if (cid2 === String(cid)) continue;
            const match = allTxns[cid2].find(t => t.utr === txn.utr && (t.leg || '').toUpperCase() === oppLeg);
            if (match) {
                const u2 = users.find(u => String(u.customerId) === String(cid2));
                otherParty = u2 ? `IDFC FIRST Savings xx ${last4(u2.accountNumber)}` : '';
                break;
            }
        }
    }
    if (!otherParty) {
        const sr = txn.standalone_reason || '';
        if (sr === 'EXTERNAL_SALARY_CREDIT') otherParty = 'External Employer / NEFT Credit';
        else if (sr === 'EXTERNAL_GOVT_CHARGE') otherParty = 'Government / Banking Charges';
        else if (sr.startsWith('EXTERNAL')) otherParty = 'External Source / Third-party';
        else if (txn.mode === 'CHARGE') otherParty = 'Bank Charges / Government Levy';
        else if (txn.desc && txn.desc.includes('Branch')) otherParty = 'IDFC FIRST Branch (Cash)';
        else if (txn.desc && (txn.desc.includes('Cash') || txn.desc.includes('Deposit'))) otherParty = 'IDFC FIRST Branch (Cash Deposit)';
    }

    let finalFrom, finalTo;
    if (isCredit) { finalFrom = otherParty || userAcc; finalTo = userAcc; }
    else { finalFrom = userAcc; finalTo = otherParty || userAcc; }

    return {
        txnId: txn.id,
        desc: txn.desc,
        isCredit,
        cat,
        userAcc,
        otherParty,
        finalFrom,
        finalTo,
        hasUserTo: finalTo === userAcc,
        hasUserFrom: finalFrom === userAcc,
    };
}

const cases = [
    { label: 'IGST 5000 (DEBIT - user is SENDER → pay charges)', cid: '8822334455', txnId: '5000', expectFromUser: true, expectToContains: 'Government' },
    { label: 'Salary 5001 (CREDIT - user is RECEIVER)', cid: '8822334455', txnId: '5001', expectFromContains: 'Employer', expectToUser: true },
    { label: 'Rahul Cash Deposit 1000 (CREDIT - branch cash in)', cid: '6910097017', txnId: '1000', expectToUser: true },
];

cases.forEach(c => {
    const r = simulateFromTo(c.cid, c.txnId);
    if (!r) { console.log(`  ❌ CASE ${c.label}: no txn`); allPassed = false; return; }
    console.log(`CASE: ${c.label}\n`);
    console.log(`  desc:        ${r.desc}`);
    console.log(`  isCredit:    ${r.isCredit ? 'YES (+)' : 'NO (-)'}`);
    console.log(`  user account:${r.userAcc}`);
    console.log(`  other party: ${r.otherParty || '(empty)'}`);
    console.log(`  👉 From:     ${r.finalFrom}`);
    console.log(`  👉 To:       ${r.finalTo}`);

    const assertions = [];
    if (c.expectFromUser) assertions.push(['From = user account (sender)', r.hasUserFrom]);
    if (c.expectToUser) assertions.push(['To = user account (receiver)', r.hasUserTo]);
    if (c.expectToContains) assertions.push([`To contains "${c.expectToContains}"`, r.finalTo.includes(c.expectToContains)]);
    if (c.expectFromContains) assertions.push([`From contains "${c.expectFromContains}"`, r.finalFrom.includes(c.expectFromContains)]);
    if (r.isCredit) assertions.push(['Credit => To must be user', r.hasUserTo]);
    else assertions.push(['Debit => From must be user', r.hasUserFrom]);

    assertions.forEach(([lbl, ok]) => {
        if (ok) console.log(`    ✅ ${lbl}`);
        else { console.log(`    ❌ ${lbl}  --- FAIL!`); allPassed = false; }
    });
    console.log('');
});

console.log('========================================');
console.log(`FINAL RESULT v2: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log('========================================');
process.exit(allPassed ? 0 : 1);

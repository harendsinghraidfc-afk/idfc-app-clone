document.addEventListener('DOMContentLoaded', () => {
    const userSelector = document.getElementById('user-selector');
    const txnTableWrapper = document.getElementById('txn-table-wrapper');
    const noUserSelected = document.getElementById('no-user-selected');
    const txnListBody = document.getElementById('txn-list-body');
    const addTxnBtn = document.querySelector('.add-txn-btn');

    // Modal Elements
    const modal = document.getElementById('txn-modal');
    const modalTitle = document.getElementById('modal-title');
    const txnForm = document.getElementById('txn-form');
    const closeModalBtn = document.getElementById('close-modal');
    const editTxnId = document.getElementById('edit-txn-id');

    // Load users into dropdown
    const users = getUsers();
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.customerId;
        option.textContent = `${user.fullName} (${user.customerId})`;
        userSelector.appendChild(option);
    });

    // Handle user selection change
    userSelector.addEventListener('change', () => {
        const selectedCustomerId = userSelector.value;
        if (selectedCustomerId) {
            loadTransactions(selectedCustomerId);
            txnTableWrapper.style.display = 'block';
            noUserSelected.style.display = 'none';
        } else {
            txnTableWrapper.style.display = 'none';
            noUserSelected.style.display = 'block';
        }
    });

    function loadTransactions(customerId) {
        txnListBody.innerHTML = '';
        const txns = getTransactionsForUser(customerId);

        if (txns.length === 0) {
            txnListBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #888;">No transactions found for this user.</td></tr>';
            return;
        }

        // Render each txn
        txns.forEach(txn => {
            const isCredit = txn.type === 'credit';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${txn.date}</td>
                <td>${txn.desc}</td>
                <td style="color: ${isCredit ? '#2ecc71' : 'white'}; font-weight: bold;">
                    ${isCredit ? '+ ' : ''}${txn.amount}
                </td>
                <td><span style="font-size: 0.8rem; opacity: 0.7;">${txn.category === 'credit_card' ? 'Credit Card' : 'Savings'}</span></td>
                <td><span class="status-pill status-${txn.status}">${txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}</span></td>
                <td>
                    <div style="display: flex; gap: 12px;">
                        <a href="#" class="edit-btn" data-id="${txn.id}" style="color: #3498db; text-decoration: none; font-weight: bold;">Edit</a>
                        <a href="#" class="delete-btn" data-id="${txn.id}" style="color: #e74c3c; text-decoration: none; font-weight: bold;">Delete</a>
                    </div>
                </td>
            `;
            txnListBody.appendChild(row);
        });

        // Add event listeners to new Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const txnId = btn.getAttribute('data-id');
                openModal(txnId);
            });
        });

        // Add event listeners to Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const txnId = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this transaction?')) {
                    deleteTransaction(customerId, txnId);
                    loadTransactions(customerId);
                }
            });
        });
    }

    // Modal logic
    function openModal(id = null) {
        if (!userSelector.value) {
            alert('Please select a user first');
            return;
        }

        if (id) {
            const txn = getTransactionById(userSelector.value, id);
            if (txn) {
                modalTitle.textContent = 'Edit Transaction';
                editTxnId.value = id;
                document.getElementById('txn-date').value = txn.date;
                document.getElementById('txn-desc').value = txn.desc;
                document.getElementById('txn-amount').value = txn.amount.replace('+ ', '');
                document.getElementById('txn-status').value = txn.status;
                document.getElementById('txn-category').value = txn.category || 'savings';
                document.getElementById('txn-type').value = txn.type || 'debit';
            }
        } else {
            modalTitle.textContent = 'Add Transaction';
            txnForm.reset();
            editTxnId.value = '';
            // Auto date
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            document.getElementById('txn-date').value = dateStr;
        }
        modal.classList.add('active');
    }

    addTxnBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));

    txnForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const customerId = userSelector.value;
        const txnData = {
            date: document.getElementById('txn-date').value,
            desc: document.getElementById('txn-desc').value,
            amount: document.getElementById('txn-amount').value,
            status: document.getElementById('txn-status').value,
            category: document.getElementById('txn-category').value,
            type: document.getElementById('txn-type').value
        };

        const id = editTxnId.value || null;
        saveTransaction(customerId, txnData, id);

        modal.classList.remove('active');
        loadTransactions(customerId);
        alert(id ? 'Transaction updated locally. Use Publish to make live.' : 'Transaction added locally. Use Publish to make live.');
    });
});

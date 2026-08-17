document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.querySelector('.primary-btn');
    const urlParams = new URLSearchParams(window.location.search);
    const editIndex = urlParams.get('edit');

    const fields = [
        'welcomeName', 'fullName', 'customerId', 'accountNumber',
        'ifscCode', 'swiftCode', 'bankName', 'branchName', 'mpin',
        'availableBalance', 'accountType', 'avgMonthlyBalance',
        'holdFunds', 'unclearedFunds', 'debitCardNumber',
        'creditCardNumber', 'ccTotalLimit', 'ccAvailableLimit'
    ];

    // If in edit mode, populate data
    if (editIndex !== null) {
        const user = getUserByIndex(parseInt(editIndex));
        if (user) {
            fields.forEach(field => {
                const elem = document.getElementById(field);
                if (elem) elem.value = user[field] || '';
            });

            // Update UI for Edit mode
            document.querySelector('h1').textContent = 'Edit User Account';
            document.querySelector('.sub-heading').textContent = 'Modify existing user details';
            addBtn.textContent = 'Update Account';
        }
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const userData = {};
            fields.forEach(field => {
                const elem = document.getElementById(field);
                if (elem) userData[field] = elem.value;
            });

            // Basic validation
            if (!userData.fullName || !userData.customerId) {
                alert('Please fill at least Name and Customer ID');
                return;
            }

            // Save or Update using our data manager
            if (typeof saveUser === 'function') {
                const index = editIndex !== null ? parseInt(editIndex) : null;
                saveUser(userData, index);

                const msg = index !== null ? 'updated' : 'created';
                alert(`User account ${msg} successfully for ${userData.fullName}. Don't forget to Publish!`);
                window.location.href = 'users.html';
            } else {
                console.error('saveUser function not found');
            }
        });
    }
});

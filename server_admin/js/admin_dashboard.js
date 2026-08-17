document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.querySelector('.primary-btn');
    const urlParams = new URLSearchParams(window.location.search);
    const editIndex = urlParams.get('edit');

    // If in edit mode, populate data
    if (editIndex !== null) {
        const user = getUserByIndex(parseInt(editIndex));
        if (user) {
            document.getElementById('welcomeName').value = user.welcomeName || '';
            document.getElementById('fullName').value = user.fullName || '';
            document.getElementById('customerId').value = user.customerId || '';
            document.getElementById('accountNumber').value = user.accountNumber || '';
            document.getElementById('ifscCode').value = user.ifscCode || '';
            document.getElementById('swiftCode').value = user.swiftCode || '';
            document.getElementById('bankName').value = user.bankName || '';
            document.getElementById('branchName').value = user.branchName || '';
            document.getElementById('mpin').value = user.mpin || '';
            document.getElementById('availableBalance').value = user.availableBalance || '';

            // Update UI for Edit mode
            document.querySelector('h1').textContent = 'Edit User Account';
            document.querySelector('.sub-heading').textContent = 'Modify existing user details';
            addBtn.textContent = 'Update Account';
        }
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const userData = {
                welcomeName: document.getElementById('welcomeName').value,
                fullName: document.getElementById('fullName').value,
                customerId: document.getElementById('customerId').value,
                accountNumber: document.getElementById('accountNumber').value,
                ifscCode: document.getElementById('ifscCode').value,
                swiftCode: document.getElementById('swiftCode').value,
                bankName: document.getElementById('bankName').value,
                branchName: document.getElementById('branchName').value,
                mpin: document.getElementById('mpin').value,
                availableBalance: document.getElementById('availableBalance').value
            };

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
                alert(`User account ${msg} successfully for ${userData.fullName}`);
                window.location.href = 'users.html';
            } else {
                console.error('saveUser function not found');
            }
        });
    }
});

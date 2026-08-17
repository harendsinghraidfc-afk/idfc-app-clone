document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.txn-table tbody');
    const publishBtn = document.getElementById('publish-btn');

    function renderUsers() {
        if (!tableBody) return;

        // Clear placeholder
        tableBody.innerHTML = '';

        // Get users from data manager
        const users = getUsers();

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color: #888;">No users registered yet.</td></tr>';
            return;
        }

        // Render each user
        users.forEach((user, index) => {
            const isDefault = index === 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="radio" name="defaultUser" ${isDefault ? 'checked' : ''}
                           style="width: 20px; height: 20px; cursor: pointer;"
                           onclick="makeDefault(${index})">
                </td>
                <td>${user.fullName}</td>
                <td>${user.customerId}</td>
                <td>${user.accountNumber}</td>
                <td><span style="font-weight: 600; color: #2ecc71;">${user.availableBalance || '₹ 0.00'}</span></td>
                <td>****</td>
                <td>
                    <div style="display: flex; gap: 15px;">
                        <a href="dashboard.html?edit=${index}" style="color: #3498db; text-decoration: none; font-weight: bold;">Edit</a>
                        <a href="#" onclick="deleteUser(${index}); return false;" style="color: #e74c3c; text-decoration: none; font-weight: bold;">Delete</a>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    window.makeDefault = (index) => {
        const users = getUsers();
        if (index === 0) return;

        // Move selected user to the top
        const [selectedUser] = users.splice(index, 1);
        users.unshift(selectedUser);

        localStorage.setItem('idfc_users_data', JSON.stringify(users));
        renderUsers();
        alert(`${selectedUser.fullName} set as default. Click 'Publish to Website' to make it live.`);
    };

    window.deleteUser = (index) => {
        if (confirm('Are you sure you want to delete this user?')) {
            const users = getUsers();
            users.splice(index, 1);
            localStorage.setItem('idfc_users_data', JSON.stringify(users));
            renderUsers();
        }
    };

    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            const users = getUsers();
            const jsonData = JSON.stringify(users, null, 4);

            const modal = document.getElementById('sync-modal');
            const textarea = document.getElementById('json-output');

            if (modal && textarea) {
                textarea.value = jsonData;
                modal.classList.add('active');
            }
        });
    }

    renderUsers();
});

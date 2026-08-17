document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.txn-table tbody');

    if (tableBody) {
        // Clear placeholder
        tableBody.innerHTML = '';

        // Get users from data manager
        const users = getUsers();

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No users registered yet.</td></tr>';
            return;
        }

        // Render each user
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.customerId}</td>
                <td>${user.accountNumber}</td>
                <td>****</td>
                <td><a href="dashboard.html?edit=${index}" style="color: #931A1D; text-decoration: none; font-weight: bold;">Edit</a></td>
            `;
            tableBody.appendChild(row);
        });
    }
});

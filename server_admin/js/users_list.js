document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.txn-table tbody');
    const publishBtn = document.getElementById('publish-btn');

    // Populate settings if exist
    const savedToken = localStorage.getItem('idfc_gh_token');
    const savedRepo = localStorage.getItem('idfc_gh_repo');
    if(savedToken) document.getElementById('gh-token').value = savedToken;
    if(savedRepo) document.getElementById('gh-repo').value = savedRepo;

    function renderUsers() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const users = getUsers();
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; color: #888;">No users registered yet.</td></tr>';
            return;
        }
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
        const [selectedUser] = users.splice(index, 1);
        users.unshift(selectedUser);
        localStorage.setItem('idfc_users_data', JSON.stringify(users));
        renderUsers();
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
        publishBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('idfc_gh_token');
            const repo = localStorage.getItem('idfc_gh_repo');
            const users = getUsers();
            const content = JSON.stringify(users, null, 4);

            if (!token || !repo) {
                // Fallback to manual sync if no token
                const modal = document.getElementById('sync-modal');
                const textarea = document.getElementById('json-output');
                if (modal && textarea) {
                    textarea.value = content;
                    modal.classList.add('active');
                }
                return;
            }

            // --- AUTOMATIC SYNC VIA GITHUB API ---
            publishBtn.textContent = 'Publishing...';
            publishBtn.disabled = true;

            try {
                const path = 'server_backend/users.json';

                // 1. Get the current file SHA (required to update)
                const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                    headers: { 'Authorization': `token ${token}` }
                });

                if (!getRes.ok) throw new Error('Could not find file on GitHub');
                const fileData = await getRes.json();
                const sha = fileData.sha;

                // 2. Update the file
                const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: 'Admin Panel Auto-Update: Synchronized users.json',
                        content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
                        sha: sha
                    })
                });

                if (updateRes.ok) {
                    alert('✅ Published Successfully! Website will update in ~60 seconds.');
                } else {
                    const err = await updateRes.json();
                    throw new Error(err.message || 'Update failed');
                }
            } catch (e) {
                alert('❌ Error: ' + e.message);
                console.error(e);
            } finally {
                publishBtn.textContent = 'Publish to Website';
                publishBtn.disabled = false;
            }
        });
    }

    renderUsers();
});

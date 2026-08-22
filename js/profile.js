document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded');

    // Scroll to Top Logic
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Logout Button Logic
    const profileLogoutBtn = document.getElementById('profile-logout-btn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                if (typeof logout === 'function') {
                    logout();
                } else {
                    localStorage.removeItem('idfc_app_user_data');
                    window.location.href = 'auth.html';
                }
            }
        });
    }

    const user = getActiveUser();

    // Explicitly use the requested UPI ID for the QR code
    const targetUpiId = "rahul.chavda@idfcfirst";
    const targetName = "Rahul Chavda";

    if (user) {
        updateProfileUI(user);
    } else {
        // Initial fallback if data hasn't synced yet
        updateProfileUI({
            fullName: targetName,
            upiId: targetUpiId,
            accountNumber: "102 9516 4831",
            ifscCode: "IDFB0042142",
            branchName: "Sejawata Branch"
        });
    }

    // Call loadAppData to ensure we have the latest from users.json
    if (typeof loadAppData === 'function') {
        loadAppData().then(syncedUser => {
            if (syncedUser) updateProfileUI(syncedUser);
        });
    }

    function updateProfileUI(user) {
        // 1. Update Name and Avatar
        const userNameElement = document.querySelector('.user-name');
        const avatarElement = document.querySelector('.avatar-circle span');

        if (userNameElement) userNameElement.textContent = user.fullName.split(' ')[0]; // Show first name
        if (avatarElement) {
            const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
            avatarElement.textContent = initials;
        }

        // 2. Update Savings Account Details
        const accountTypeElement = document.querySelector('.account-type');
        const detailRows = document.querySelectorAll('.detail-row');

        if (accountTypeElement && user.accountNumber) {
            const lastFour = user.accountNumber.replace(/\s/g, '').slice(-4);
            accountTypeElement.textContent = `Savings ••${lastFour}`;
        }

        if (detailRows.length >= 3) {
            detailRows[0].innerHTML = `<span class="label">Name:</span> ${user.fullName}`;
            detailRows[1].innerHTML = `<span class="label">IFSC:</span> ${user.ifscCode}`;
            detailRows[2].innerHTML = `<span class="label">Bank branch:</span> ${user.branchName}`;
        }

        // 3. Generate dynamic UPI QR Code
        const qrImage = document.getElementById('qr-image');
        if (qrImage) {
            const upiId = user.upiId || "rahul.chavda@idfcfirst";
            const fullName = user.fullName || "Rahul Chavda";

            // UPI URL format: upi://pay?pa=address&pn=name
            const upiData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(fullName)}`;
            // Use QRServer API to generate QR image
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiData)}`;
            qrImage.src = qrUrl;
        }

        // 4. Update My UPI Text
        const upiLabel = document.querySelector('.upi-card .card-header span');
        if (upiLabel) {
            upiLabel.innerHTML = `My UPI ↗`;
        }
    }

    // Action buttons interaction
    const actionItems = document.querySelectorAll('.action-item');
    actionItems.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('span').innerText.replace('\n', ' ');
            console.log(`Action clicked: ${label}`);
        });
    });

    // Horizontal scroll items interaction
    const scrollItems = document.querySelectorAll('.scroll-item');
    scrollItems.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('span').innerText.replace('\n', ' ');
            console.log(`What's new item clicked: ${label}`);
        });
    });
});

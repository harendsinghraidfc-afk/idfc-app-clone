document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page loaded');

    // Handle back button (already handled by onclick in HTML, but can be enhanced)
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            // Optional: add transition before going back
        });
    }

    // Dynamic data population (example)
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        // userNameElement.textContent = 'Rahul'; // Could come from a session or local storage
    }

    // Action buttons interaction
    const actionItems = document.querySelectorAll('.action-item');
    actionItems.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('span').innerText.replace('\n', ' ');
            console.log(`Action clicked: ${label}`);
            // Navigate to respective pages or show alert
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

/**
 * Tab Manager for Savings Transactions Page
 * Handles switching between Payments, Requests, Transactions, and Recurring views
 */

window.switchTab = function(tabName) {
    const tabs = document.querySelectorAll('.txn-tabs .tab-item');
    const views = document.querySelectorAll('.tab-view');

    // Remove active class from all tabs and views
    tabs.forEach(t => t.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));

    // Map tab names to their indices in the .tab-item array
    const tabMapping = {
        'payments': 0,
        'requests': 1,
        'transactions': 2,
        'recurring': 3
    };

    const index = tabMapping[tabName];
    if (index !== undefined) {
        tabs[index].classList.add('active');
        const viewId = tabName + '-view';
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');
    }
};

// Initial state check based on URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');

    if (initialTab) {
        switchTab(initialTab);
    }
});

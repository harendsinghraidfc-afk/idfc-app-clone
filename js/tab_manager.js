/**
 * Tab Manager for Savings Transactions Page
 * Handles switching between Payments and Transactions views
 */

window.switchTab = function(tabName) {
    const tabs = document.querySelectorAll('.txn-tabs .tab-item');
    const views = document.querySelectorAll('.tab-view');

    // Remove active class from all
    tabs.forEach(t => t.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));

    if (tabName === 'payments') {
        tabs[0].classList.add('active');
        document.getElementById('payments-view').classList.add('active');
    } else if (tabName === 'transactions') {
        tabs[2].classList.add('active');
        document.getElementById('transactions-view').classList.add('active');
    }
};

// Any specific logic for the payments tab inside the savings context can go here
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tab Manager Initialized');
});

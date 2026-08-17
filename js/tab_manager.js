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

// Initial state check based on URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');

    if (initialTab === 'payments') {
        switchTab('payments');
    }
});

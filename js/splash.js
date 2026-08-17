function initSplash() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');

    if (!splashScreen || !mainContent) return;

    // Display the splash screen for 5 seconds
    setTimeout(() => {
        splashScreen.style.transition = 'opacity 0.6s ease-out';
        splashScreen.style.opacity = '0';

        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainContent.style.display = 'block';

            // Dispatch event for login module
            window.dispatchEvent(new CustomEvent('splash-finished'));
        }, 600);
    }, 5000);
}

document.addEventListener('DOMContentLoaded', initSplash);

document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.mpin-box');
    const container = document.getElementById('main-container');

    // Force clear inputs on load for security/clean state
    inputs.forEach(i => i.value = '');

    // Auto focus first field initially
    if(inputs[0]) setTimeout(() => inputs[0].focus(), 300);

    inputs.forEach((input, index) => {
        // Focus: Trigger the morph animation
        input.addEventListener('focus', () => {
            container.classList.add('auth-focused');
        });

        // Blur: Revert if the user clicks away from the inputs completely
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (!document.activeElement.classList.contains('mpin-box')) {
                    container.classList.remove('auth-focused');
                }
            }, 50);
        });

        // Move forward on input
        input.addEventListener('input', (e) => {
            // Restrict to numeric
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            if (e.target.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // All digits entered
                    const enteredPin = Array.from(inputs).map(i => i.value).join('');
                    if (enteredPin.length === 4) {
                        const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
                        const correctPin = user ? user.mpin : '1234'; // Fallback if data not loaded

                        if (enteredPin === correctPin) {
                            setTimeout(() => {
                                window.location.href = 'dashboard.html';
                            }, 300);
                        } else {
                            // Show error message
                            const errorMsg = document.getElementById('error-msg');
                            if (errorMsg) errorMsg.style.display = 'block';

                            // Clear inputs and refocus first
                            setTimeout(() => {
                                inputs.forEach(i => i.value = '');
                                inputs[0].focus();
                                // Optional: Hide error after some time or on next input
                            }, 500);
                        }
                    }
                }
            }
        });

        // Hide error message on new input
        input.addEventListener('keydown', () => {
            const errorMsg = document.getElementById('error-msg');
            if (errorMsg) errorMsg.style.display = 'none';
        });

        // Move backward on backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
});

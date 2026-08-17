function initLogin() {
    const inputs = document.querySelectorAll('.mpin-box');

    // Auto-focus logic
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// Focus the first field when splash ends
window.addEventListener('splash-finished', () => {
    const firstInput = document.querySelector('.mpin-box');
    if (firstInput) firstInput.focus();
});

document.addEventListener('DOMContentLoaded', initLogin);

document.addEventListener('DOMContentLoaded', () => {
    const eyeBtn = document.querySelector('.eye-btn');
    const balanceDots = document.querySelector('.dots');
    const actualBalance = '₹ 5,00,000.00';
    let isHidden = true;

    if (eyeBtn && balanceDots) {
        eyeBtn.addEventListener('click', async () => {
            isHidden = !isHidden;
            if (isHidden) {
                balanceDots.textContent = '•••••';
                balanceDots.style.fontSize = '1.8rem';
                balanceDots.style.letterSpacing = '4px';
                eyeBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                // Show "waiting" state
                balanceDots.textContent = 'Fetching...';
                balanceDots.style.fontSize = '1rem';
                balanceDots.style.letterSpacing = 'normal';

                try {
                    // Artificial delay to simulate network request
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const response = await fetch('server_backend/users.json');
                    const users = await response.json();
                    const user = getActiveUser();

                    // Find current user in JSON or default to first
                    const userData = users.find(u => u.customerId === user?.customerId) || users[0];
                    const balance = userData.availableBalance || '₹ 0.00';

                    balanceDots.textContent = balance;
                    balanceDots.style.fontSize = '1.2rem';
                    balanceDots.style.letterSpacing = 'normal';
                } catch (e) {
                    balanceDots.textContent = '₹ Error';
                    console.error('Balance fetch failed', e);
                }

                eyeBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // --- Logout Functionality ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // --- 3D Diamond for Networth ---
    initDiamond();

    function initDiamond() {
        const container = document.getElementById('diamond-container');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 45;
        camera.position.y = -1;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const diamondGroup = new THREE.Group();
        const diamondMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd4af37,
            emissive: 0x634f2c,
            roughness: 0,
            metalness: 0.1,
            transmission: 0.7,
            ior: 2.4,
            thickness: 5.0,
            flatShading: true,
            side: THREE.DoubleSide
        });

        const topGeometry = new THREE.CylinderGeometry(4.5, 9, 3.5, 8); // Reduced size
        const topMesh = new THREE.Mesh(topGeometry, diamondMaterial);
        topMesh.position.y = 1.75;
        diamondGroup.add(topMesh);

        const bottomGeometry = new THREE.CylinderGeometry(9, 0.1, 10, 8); // Reduced size
        const bottomMesh = new THREE.Mesh(bottomGeometry, diamondMaterial);
        bottomMesh.position.y = -5;
        diamondGroup.add(bottomMesh);

        scene.add(diamondGroup);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const topLight = new THREE.PointLight(0xffffff, 2, 100);
        topLight.position.set(0, 20, 10);
        scene.add(topLight);

        const warmLight = new THREE.PointLight(0xffaa00, 1.5, 100);
        warmLight.position.set(15, -10, 15);
        scene.add(warmLight);

        function animate() {
            requestAnimationFrame(animate);
            diamondGroup.rotation.y -= 0.015; // Slightly faster rotation
            renderer.render(scene, camera);
        }
        animate();
    }

    // --- Double Click/Tap for Savings Details (Laptop & Mobile) ---
    const savingsTargets = document.querySelectorAll('.maroon-tile, .savings-card');
    let lastClickTime = 0;

    savingsTargets.forEach(target => {
        // Native Double Click for Laptops
        target.addEventListener('dblclick', () => {
            window.location.href = 'savings_details.html';
        });

        // Manual Double Tap for Trackpads/Mobile
        target.addEventListener('click', () => {
            const currentTime = new Date().getTime();
            const clickGap = currentTime - lastClickTime;

            if (clickGap < 500 && clickGap > 0) {
                window.location.href = 'savings_details.html';
            }
            lastClickTime = currentTime;
        });
    });

    // --- Video Play on Viewport Enter ---
    const promoVideo = document.getElementById('promo-video');
    if (promoVideo) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Video entered view, play from start
                    promoVideo.currentTime = 0;
                    promoVideo.play();
                }
            });
        }, { threshold: 0.5 }); // Play when at least 50% of video is visible

        observer.observe(promoVideo);
    }
});

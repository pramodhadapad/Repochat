// Main JavaScript for AHAD Electronics

document.addEventListener('DOMContentLoaded', () => {

    // Highlight active nav link
    const currentLocation = location.href;
    const menuItem = document.querySelectorAll('.nav-links a');
    const menuLength = menuItem.length;
    for (let i = 0; i < menuLength; i++) {
        if (menuItem[i].href === currentLocation) {
            menuItem[i].className = "active";
        }
    }

    // Confirm Booking Submission
    // We can add intricate validation here if needed
    // For now, let Backend handle the heavy lifting

    // Simple fade-in effect for main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.opacity = 0;
        mainContent.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            mainContent.style.opacity = 1;
        }, 100);
    }
});

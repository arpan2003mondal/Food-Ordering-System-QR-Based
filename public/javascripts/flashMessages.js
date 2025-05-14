document.addEventListener("DOMContentLoaded", function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    console.log("js accepted");
    setTimeout(() => {
        flashMessages.forEach(msg => {
            msg.style.transition = "opacity 0.5s";
            msg.style.opacity = "0";
            
            setTimeout(() => {
                msg.remove();
            }, 500);
        });
    }, 3000);
});

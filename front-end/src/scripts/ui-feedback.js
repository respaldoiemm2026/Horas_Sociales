(function setupUiFeedback() {
    const toastId = "socialhours-toast";

    window.showToast = (message, type = "info", duration = 2000) => {
        let toast = document.getElementById(toastId);
        if (!toast) {
            toast = document.createElement("div");
            toast.id = toastId;
            toast.setAttribute("role", "status");
            document.body.appendChild(toast);
        }

        toast.className = `socialhours-toast socialhours-toast-${type}`;
        toast.textContent = String(message || "");
        window.clearTimeout(toast.dismissTimer);
        requestAnimationFrame(() => toast.classList.add("is-visible"));
        toast.dismissTimer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, duration);
    };
})();

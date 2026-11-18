(function protectAuthenticatedPage() {
    const frontendCleanupVersion = "socialhours_frontend_cleanup_v2";
    if (!localStorage.getItem(frontendCleanupVersion)) {
        [
            "socialhours_registered_students",
            "socialhours_submissions",
            "socialhours_registered_hours",
            "socialhours_notifications",
        ].forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(frontendCleanupVersion, "1");
    }

    const token = localStorage.getItem("socialhours_token");
    const tabSession = sessionStorage.getItem("socialhours_tab_session");
    const currentScript = document.currentScript;
    const loginUrl = currentScript
        ? new URL("../page/login/inicio_sesion.html", currentScript.src).href
        : "../page/login/inicio_sesion.html";

    if (!token || tabSession !== token) {
        window.location.replace(loginUrl);
    }

    window.addEventListener("storage", (event) => {
        if (event.key === "socialhours_logout") {
            sessionStorage.removeItem("socialhours_tab_session");
            window.location.replace(loginUrl);
        }
    });
})();

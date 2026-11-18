(function setupNotifications() {
    const storageKey = "socialhours_notifications";

    function readNotifications() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.warn("No se pudieron leer las notificaciones:", error);
            return [];
        }
    }

    function refreshList() {
        const list = document.getElementById("notificationsList");
        if (!list) return;
        list.querySelectorAll(".notification-item").forEach((item, index) => {
            if (item.querySelector(".delete-notification-btn")) return;
            const button = document.createElement("button");
            button.type = "button";
            button.className = "delete-notification-btn";
            button.textContent = "×";
            button.title = "Eliminar notificación";
            button.dataset.notificationIndex = String(index);
            button.style.cssText = "margin-left:auto;border:0;background:transparent;color:#b42318;font-size:1.1rem;cursor:pointer;";
            item.appendChild(button);
        });
    }

    const list = document.getElementById("notificationsList");
    if (!list) return;

    list.addEventListener("click", (event) => {
        const button = event.target.closest(".delete-notification-btn");
        if (!button) return;
        const items = readNotifications();
        const index = Number(button.dataset.notificationIndex);
        if (!Number.isInteger(index) || !items[index]) return;
        items.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(items));
        list.querySelectorAll(".notification-item")[index]?.remove();
        refreshList();
        if (!items.length) list.innerHTML = '<li class="notification-empty">No hay notificaciones.</li>';
    });

    new MutationObserver(refreshList).observe(list, { childList: true });
    refreshList();
})();

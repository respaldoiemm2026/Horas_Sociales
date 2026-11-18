const form = document.getElementById("loginForm");

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("user-email").value.trim();
        const password = document.getElementById("user-password").value;
        const selectedRole = Number(document.getElementById("user-role").value);
        const submitButton = form.querySelector("button[type='submit']");

        if (!email || !password || !selectedRole) {
            showToast("Debes ingresar el correo, la contraseña y seleccionar un rol", "error");
            return;
        }

        try {
            window.setButtonBusy(submitButton, true, "Ingresando...");
            const data = await window.socialHoursApi.request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password, id_rol: selectedRole }),
            });

            const role = Number(data.user?.id_rol ?? data.user?.rol ?? 0);
            if (role !== selectedRole) {
                throw new Error("El rol seleccionado no corresponde a esta cuenta.");
            }

            localStorage.setItem("socialhours_token", data.token);
            localStorage.setItem("socialhours_user", JSON.stringify(data.user));
            sessionStorage.setItem("socialhours_tab_session", data.token);

            showToast("Inicio de sesión exitoso", "success");
            window.location.replace("../home_secretaria/p_profesor.html");
        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        } finally {
            window.setButtonBusy(submitButton, false);
        }
    });
}

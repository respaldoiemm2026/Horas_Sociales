const getDashboardByRole = () => {
  const user = JSON.parse(localStorage.getItem('socialhours_user') || 'null');
  const role = Number(user?.id_rol ?? user?.rol ?? 0);

  if (role === 2 || role === 3) {
    return '../home_secretaria/p_profesor.html';
  }

  return '../home_secretaria/p_profesor.html';
};

const populateUserInfo = () => {
  const user = JSON.parse(localStorage.getItem('socialhours_user') || 'null');
  const fullName = user ? `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario' : 'Carlos Gómez';
  const email = user?.correo || user?.email || 'carlos.gomez@montessori.edu.co';
  const role = Number(user?.id_rol ?? user?.rol ?? 0);
  const roleLabel = role === 1 ? 'Administrador' : role === 3 ? 'Secretaria' : 'Usuario no autorizado';

  const nombreCuenta = document.getElementById('nombreCuenta');
  const correoCuenta = document.getElementById('correoCuenta');
  const rolCuenta = document.getElementById('rolCuenta');
  const autorizadoCuenta = document.getElementById('autorizadoCuenta');

  if (nombreCuenta) nombreCuenta.textContent = fullName;
  if (correoCuenta) correoCuenta.textContent = email;
  if (rolCuenta) rolCuenta.textContent = roleLabel;
  if (autorizadoCuenta) autorizadoCuenta.textContent = role === 1 || role === 3 ? 'Sí' : 'No';
  const addUserCard = document.getElementById('addUserCard');
  if (addUserCard) addUserCard.hidden = role !== 1;
};

const refreshAccountProfile = async () => {
  const token = localStorage.getItem('socialhours_token');
  if (!token) return;
  const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include'
  });
  if (!response.ok) throw new Error('No fue posible cargar el perfil de la cuenta');
  const data = await response.json();
  if (data.user) {
    localStorage.setItem('socialhours_user', JSON.stringify(data.user));
    populateUserInfo();
  }
};

const homeBtn = document.getElementById('homeBtn');
if (homeBtn) {
  homeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = getDashboardByRole();
  });
}

const addUserForm = document.getElementById('addUserForm');
if (addUserForm) {
  addUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(addUserForm).entries());
    const token = localStorage.getItem('socialhours_token');
    const submitButton = addUserForm.querySelector('button[type="submit"]');
    window.setButtonBusy(submitButton, true, 'Agregando...');
    try {
      const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No fue posible agregar el usuario');
      addUserForm.reset();
      showToast(`${data.message}. La contraseña inicial es el ID.`, "success");
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      window.setButtonBusy(submitButton, false);
    }
  });
}

function setupLogoutConfirmation() {
  const logoutLink = document.getElementById('logoutBtn');
  if (!logoutLink) return;

  let modal = document.getElementById('logoutConfirmationModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'logoutConfirmationModal';
    modal.innerHTML = `
      <style>
        #logoutConfirmationModal { display: none; }
        #logoutConfirmationModal.show { display: block; }
        .logout-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .logout-modal-card {
          width: min(420px, calc(100vw - 32px));
          background: #fff;
          border-radius: 18px;
          padding: 24px 22px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
        }
        .logout-modal-card h3 { margin: 0 0 12px; font-size: 22px; color: #111827; }
        .logout-modal-card p { margin: 0 0 20px; color: #475569; font-size: 16px; }
        .logout-modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .logout-modal-actions button {
          border: none; border-radius: 10px; padding: 10px 18px; font-weight: 600; cursor: pointer;
        }
        .logout-cancel-btn { background: #e2e8f0; color: #1f2937; }
        .logout-confirm-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; }
      </style>
      <div class="logout-modal-backdrop">
        <div class="logout-modal-card" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle">
          <h3 id="logoutModalTitle">Cerrar sesión</h3>
          <p>¿Seguro que quieres cerrar sesión?</p>
          <div class="logout-modal-actions">
            <button type="button" class="logout-cancel-btn">Rechazar</button>
            <button type="button" class="logout-confirm-btn">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const confirmBtn = modal.querySelector('.logout-confirm-btn');
  const cancelBtn = modal.querySelector('.logout-cancel-btn');

  logoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    modal.classList.add('show');
  });

  cancelBtn.addEventListener('click', () => modal.classList.remove('show'));
  confirmBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    localStorage.removeItem('socialhours_token');
    localStorage.removeItem('socialhours_user');
    localStorage.setItem('socialhours_logout', String(Date.now()));
    window.location.href = '../login/inicio_sesion.html';
  });
}
setupLogoutConfirmation();

populateUserInfo();
refreshAccountProfile().catch((error) => console.warn(error.message));

const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(changePasswordForm);
    const token = localStorage.getItem('socialhours_token');
    const payload = Object.fromEntries(formData.entries());
    const submitButton = changePasswordForm.querySelector('button[type="submit"]');
    window.setButtonBusy(submitButton, true, 'Actualizando...');

    try {
      const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No fue posible cambiar la contraseña');
      changePasswordForm.reset();
      showToast(data.message, "success");
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      window.setButtonBusy(submitButton, false);
    }
  });
}

(function () {
  const PHOTO_KEY_PREFIX = 'socialhours_profile_photo:';
  const USER_KEY = 'socialhours_user';
  const DEFAULT_PHOTO = 'https://i.pravatar.cc/80?img=12';

  function getPhotoKey() {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      const identity = user?.id || user?.email;
      return identity ? `${PHOTO_KEY_PREFIX}${String(identity).trim().toLowerCase()}` : null;
    } catch (error) {
      return null;
    }
  }

  function getStoredPhoto() {
    try {
      const photoKey = getPhotoKey();
      const value = photoKey ? localStorage.getItem(photoKey) : null;
      return value || DEFAULT_PHOTO;
    } catch (error) {
      return DEFAULT_PHOTO;
    }
  }

  function getUserName() {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      if (!user) return 'Usuario';
      const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim();
      return fullName || 'Usuario';
    } catch (error) {
      return 'Usuario';
    }
  }

  function injectAvatarStyles() {
    if (document.getElementById('profile-avatar-style')) return;

    const style = document.createElement('style');
    style.id = 'profile-avatar-style';
    style.textContent = `
      .user-avatar,
      .profile-avatar-trigger {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        overflow: visible;
        cursor: pointer;
        background: transparent;
        border: none;
        padding: 0;
      }

      .user-avatar::after,
      .profile-avatar-trigger::after {
        content: "";
        position: absolute;
        right: 1px;
        bottom: 1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #22c55e;
        border: 2px solid #ffffff;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
      }

      .user-avatar img,
      .profile-avatar-trigger img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }

      .profile-avatar-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.28);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 9999;
        opacity: 1;
        visibility: visible;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }

      .profile-avatar-backdrop.is-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .profile-avatar-card {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 22px 60px rgba(15, 23, 42, 0.2);
        border-radius: 18px;
        padding: 18px 18px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        min-width: 180px;
      }

      .profile-avatar-modal-image {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
      }

      .profile-avatar-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
        line-height: 1.3;
      }
    `;

    document.head.appendChild(style);
  }

  function updateProfileImages() {
    const photo = getStoredPhoto();
    const selectors = [
      '.profile-photo',
      '.foto-mini',
      '.foto-perfil',
      '.user-avatar img',
      '.avatar',
      '.profile-avatar-modal-image'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((img) => {
        if (img instanceof HTMLImageElement) {
          img.src = photo;
          img.alt = 'Foto de perfil';
        }
      });
    });
  }

  function updateProfileModal() {
    const modal = document.getElementById('profileAvatarModal');
    if (!modal) return;

    const image = modal.querySelector('.profile-avatar-modal-image');
    const name = modal.querySelector('.profile-avatar-name');

    if (image) image.src = getStoredPhoto();
    if (name) name.textContent = getUserName();
  }

  function openProfileAvatarModal() {
    const modal = document.getElementById('profileAvatarModal');
    if (!modal) return;
    updateProfileModal();
    modal.classList.remove('is-hidden');
  }

  function closeProfileAvatarModal() {
    const modal = document.getElementById('profileAvatarModal');
    if (!modal) return;
    modal.classList.add('is-hidden');
  }

  function ensureAvatarModal() {
    if (document.getElementById('profileAvatarModal')) return;

    const modal = document.createElement('div');
    modal.id = 'profileAvatarModal';
    modal.className = 'profile-avatar-backdrop is-hidden';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="profile-avatar-card" role="dialog" aria-modal="true" aria-label="Perfil del usuario">
        <img class="profile-avatar-modal-image profile-photo" src="${getStoredPhoto()}" alt="Foto de perfil">
        <div class="profile-avatar-name">${getUserName()}</div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeProfileAvatarModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeProfileAvatarModal();
      }
    });

    document.body.appendChild(modal);
  }

  function attachAvatarTriggers() {
    document.querySelectorAll('.user-avatar').forEach((avatar) => {
      if (avatar.dataset.profileBound === 'true') return;

      avatar.dataset.profileBound = 'true';
      avatar.setAttribute('role', 'button');
      avatar.setAttribute('tabindex', '0');
      avatar.setAttribute('aria-label', 'Abrir foto de perfil');

      avatar.addEventListener('click', openProfileAvatarModal);
      avatar.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProfileAvatarModal();
        }
      });
    });
  }

  function saveProfilePhoto(photo) {
    try {
      const photoKey = getPhotoKey();
      if (!photoKey) {
        throw new Error('No hay una cuenta activa para guardar la foto');
      }
      localStorage.setItem(photoKey, photo);
      updateProfileImages();
      updateProfileModal();
      window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { photo } }));
    } catch (error) {
      console.error('No se pudo guardar la foto de perfil:', error);
    }
  }

  function initProfilePhoto() {
    injectAvatarStyles();
    ensureAvatarModal();
    attachAvatarTriggers();
    updateProfileImages();
    updateProfileModal();

    const inputFoto = document.getElementById('inputFoto');
    if (inputFoto) {
      inputFoto.addEventListener('change', function () {
        const file = this.files && this.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          showToast('La imagen debe pesar menos de 2MB.', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = function () {
          saveProfilePhoto(String(reader.result));
        };
        reader.readAsDataURL(file);
      });
    }
  }

  window.cambiarFoto = function () {
    const input = document.getElementById('inputFoto');
    if (!input || !input.files || !input.files[0]) return;

    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen debe pesar menos de 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      saveProfilePhoto(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  window.eliminarFoto = function () {
    try {
      const photoKey = getPhotoKey();
      if (photoKey) localStorage.removeItem(photoKey);
      updateProfileImages();
      updateProfileModal();
      window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { photo: DEFAULT_PHOTO } }));
    } catch (error) {
      console.error('No se pudo eliminar la foto de perfil:', error);
    }
  };

  window.addEventListener('storage', function (event) {
    if (event.key?.startsWith(PHOTO_KEY_PREFIX) || event.key === USER_KEY) {
      updateProfileImages();
      updateProfileModal();
    }
  });

  document.addEventListener('profile-photo-updated', function () {
    updateProfileImages();
    updateProfileModal();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfilePhoto);
  } else {
    initProfilePhoto();
  }
})();

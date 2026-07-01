let toastTimeoutId = null;

export function showTopFloatNotification(message, type = 'success') {
  let toast = document.getElementById('sitopiaToast') || document.getElementById('toastBox') || document.getElementById('dynamicToast');
  let msgEl = document.getElementById('toastMessage');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    toast.className = 'sitopia-toast';

    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation';
    toast.appendChild(icon);

    msgEl = document.createElement('span');
    msgEl.id = 'toastMessage';
    toast.appendChild(msgEl);

    document.body.appendChild(toast);
  } else {
    const icon = toast.querySelector('i');
    if (icon) {
      if (type === 'success') icon.className = 'fa-solid fa-circle-check';
      else if (type === 'danger') icon.className = 'fa-solid fa-circle-xmark';
      else icon.className = 'fa-solid fa-triangle-exclamation';
    }
  }

  if (msgEl) msgEl.textContent = message;
  else {
    const span = toast.querySelector('span');
    if (span) span.textContent = message;
  }

  toast.classList.add('show');

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => toast.classList.remove('show'), 3000);
}

export function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="border-radius: 10px; font-size: 0.88rem; font-weight: 600;">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }
}

export function showModalError(stepId, message) {
  const stepEl = document.getElementById(stepId);
  if (!stepEl) return;
  const existingAlert = stepEl.querySelector('.alert-modal-error');
  if (existingAlert) existingAlert.remove();

  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-modal-error mt-2';
  alertDiv.style.borderRadius = '8px';
  alertDiv.style.fontSize = '0.82rem';
  alertDiv.style.fontWeight = '600';
  alertDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation me-2"></i>${message}`;

  const button = stepEl.querySelector('button');
  if (button) stepEl.insertBefore(alertDiv, button);
  else stepEl.appendChild(alertDiv);

  setTimeout(() => alertDiv.remove(), 4000);
}

export function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const wrapper = input.parentElement;
  const icon = wrapper.querySelector('.password-toggle-icon') || input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  }
}

// Expose for legacy onclick handlers in converted pages
if (typeof window !== 'undefined') {
  window.showTopFloatNotification = showTopFloatNotification;
  window.showAlert = showAlert;
  window.showModalError = showModalError;
  window.togglePasswordVisibility = togglePasswordVisibility;
}

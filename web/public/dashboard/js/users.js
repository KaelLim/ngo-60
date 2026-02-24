import { api } from './api.js';
import { showToast } from './toast.js';

let usersList = [];

export async function loadUsers() {
  try {
    usersList = await api.getUsers();
    renderUsersTable();
  } catch (e) {
    console.error('載入使用者失敗', e);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-table');
  if (!tbody) return;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  tbody.innerHTML = usersList.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.username)}</td>
      <td>${u.role}</td>
      <td>${new Date(u.created_at).toLocaleDateString('zh-TW')}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openUserModal(${u.id})">編輯</button>
        ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">刪除</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function openUserModal(id = null) {
  const modal = document.getElementById('user-modal');
  const title = document.getElementById('user-modal-title');
  const form = document.getElementById('user-form');
  const passwordHint = document.getElementById('user-password-hint');

  form.reset();
  document.getElementById('user-id').value = '';

  if (id) {
    const user = usersList.find(u => u.id === id);
    if (!user) return;
    title.textContent = '編輯使用者';
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-role').value = user.role;
    if (passwordHint) passwordHint.style.display = '';
  } else {
    title.textContent = '新增使用者';
    if (passwordHint) passwordHint.style.display = 'none';
  }

  modal.classList.add('active');
}

export function closeUserModal() {
  document.getElementById('user-modal').classList.remove('active');
}

async function deleteUser(id) {
  if (!confirm('確定要刪除此使用者嗎？')) return;
  try {
    await api.deleteUser(id);
    showToast('使用者已刪除');
    loadUsers();
  } catch (e) {
    showToast(e.message || '刪除失敗', 'error');
  }
}

export function initUsers() {
  const form = document.getElementById('user-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const data = {
      username: document.getElementById('user-username').value.trim(),
      password: document.getElementById('user-password').value,
      role: document.getElementById('user-role').value
    };

    if (!data.username) {
      showToast('請輸入帳號', 'error');
      return;
    }

    if (!id && !data.password) {
      showToast('新增使用者需設定密碼', 'error');
      return;
    }

    // Don't send empty password on update
    if (id && !data.password) {
      delete data.password;
    }

    try {
      if (id) {
        await api.updateUser(id, data);
        showToast('使用者已更新');
      } else {
        await api.createUser(data);
        showToast('使用者已建立');
      }
      closeUserModal();
      loadUsers();
    } catch (e) {
      showToast(e.message || '儲存失敗', 'error');
    }
  });

  // Expose deleteUser globally
  window.deleteUser = deleteUser;
}

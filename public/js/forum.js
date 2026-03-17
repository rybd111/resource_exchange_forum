// API 基础 URL
const API_BASE = '/api';

// 当前用户信息
let currentUser = null;
let currentCategory = 'all';
let currentPage = 1;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupCategoryListeners();
});

// 检查登录状态
async function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showGuestView();
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        currentUser = data.data;
        showForumView();
        updateUserInfo();
        loadResources();
      } else {
        showGuestView();
      }
    } else {
      localStorage.removeItem('token');
      showGuestView();
    }
  } catch (error) {
    console.error('检查登录状态错误:', error);
    showGuestView();
  }
}

// 显示游客视图
function showGuestView() {
  document.getElementById('guestView').style.display = 'block';
  document.getElementById('forumView').style.display = 'none';
  document.getElementById('navAuth').style.display = 'flex';
  document.getElementById('navUser').style.display = 'none';
}

// 显示论坛视图
function showForumView() {
  document.getElementById('guestView').style.display = 'none';
  document.getElementById('forumView').style.display = 'block';
  document.getElementById('navAuth').style.display = 'none';
  document.getElementById('navUser').style.display = 'flex';
  document.getElementById('publishLink').style.display = 'inline';
}

// 更新用户信息
function updateUserInfo() {
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.username;
    const creditBadge = document.getElementById('creditBadge');
    creditBadge.textContent = currentUser.creditLevel || 'B';
    creditBadge.className = `credit-badge ${currentUser.creditLevel || 'B'}`;
  }
}

// 设置分类监听
function setupCategoryListeners() {
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      // 移除所有active
      categoryItems.forEach(i => i.classList.remove('active'));
      // 添加active
      item.classList.add('active');
      
      // 更新当前分类
      currentCategory = item.dataset.category;
      currentPage = 1;
      
      // 更新标题
      const categoryNames = {
        'all': '全部资源',
        'tech': '技术服务',
        'manufacture': '制造加工',
        'service': '生活服务',
        'enterprise': '企业服务',
        'product': '产品供应',
        'invest': '投资合作'
      };
      document.getElementById('currentCategory').textContent = categoryNames[currentCategory];
      
      // 加载资源
      loadResources();
    });
  });
}

// 加载资源列表
async function loadResources() {
  const resourceList = document.getElementById('resourceList');
  resourceList.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    let url = `${API_BASE}/resources?page=${currentPage}&limit=20&status=published`;
    
    if (currentCategory !== 'all') {
      url += `&category=${currentCategory}`;
    }
    
    const response = await fetch(url, {
      headers: currentUser ? {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      } : {}
    });
    
    const data = await response.json();
    
    if (data.success && data.data.rows.length > 0) {
      renderResources(data.data.rows);
      renderPagination(data.data.totalPages, data.data.currentPage);
    } else {
      resourceList.innerHTML = '<div class="empty-state">暂无资源</div>';
    }
  } catch (error) {
    console.error('加载资源错误:', error);
    resourceList.innerHTML = '<div class="empty-state">加载失败，请稍后重试</div>';
  }
}

// 渲染资源列表
function renderResources(resources) {
  const resourceList = document.getElementById('resourceList');
  
  resourceList.innerHTML = resources.map(resource => `
    <div class="resource-card" onclick="showResourceDetail('${resource.id}')">
      <div class="resource-header">
        <div>
          <div class="resource-title">${escapeHtml(resource.title)}</div>
          <span class="resource-category">${getCategoryName(resource.category)}</span>
        </div>
      </div>
      <div class="resource-desc">${escapeHtml(resource.description)}</div>
      ${resource.caseImages && resource.caseImages.length > 0 ? `
        <div class="resource-images">
          ${resource.caseImages.slice(0, 3).map(img => `
            <img src="${img.url}" alt="${img.name}">
          `).join('')}
        </div>
      ` : ''}
      <div class="resource-footer">
        <div class="resource-author">
          <span class="author-name">${resource.user ? escapeHtml(resource.user.username) : '未知用户'}</span>
          ${resource.user ? `<span class="author-credit credit-badge ${resource.user.creditLevel}">${resource.user.creditLevel}</span>` : ''}
        </div>
        <div class="resource-stats">
          <span>👁 ${resource.viewCount || 0}</span>
          <span>❤️ ${resource.likeCount || 0}</span>
          <span>${formatDate(resource.createdAt)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// 渲染分页
function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // 上一页
  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})">上一页</button>`;
  }
  
  // 页码
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="active">${i}</button>`;
    } else {
      html += `<button onclick="goToPage(${i})">${i}</button>`;
    }
  }
  
  // 下一页
  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})">下一页</button>`;
  }
  
  pagination.innerHTML = html;
}

// 跳转页面
function goToPage(page) {
  currentPage = page;
  loadResources();
}

// 显示资源详情
async function showResourceDetail(resourceId) {
  try {
    const response = await fetch(`${API_BASE}/resources/${resourceId}`, {
      headers: currentUser ? {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      } : {}
    });
    
    const data = await response.json();
    
    if (data.success) {
      const resource = data.data;
      const detailHtml = `
        <div class="resource-detail">
          <div class="detail-header">
            <h1 class="detail-title">${escapeHtml(resource.title)}</h1>
            <div class="detail-meta">
              <span>发布者：${resource.user ? escapeHtml(resource.user.username) : '未知'}</span>
              <span>信誉等级：${resource.user ? resource.user.creditLevel : '-'}</span>
              <span>发布时间：${formatDate(resource.createdAt)}</span>
            </div>
          </div>
          
          <div class="detail-content">
            <p><strong>分类：</strong>${getCategoryName(resource.category)}</p>
            <p><strong>合作类型：</strong>${getCooperationType(resource.cooperationType)}</p>
            <p><strong>价格：</strong>${getPriceDisplay(resource)}</p>
            ${resource.region ? `<p><strong>地区：</strong>${escapeHtml(resource.region)}</p>` : ''}
            <hr>
            <p>${escapeHtml(resource.description).replace(/\n/g, '<br>')}</p>
          </div>
          
          ${resource.caseImages && resource.caseImages.length > 0 ? `
            <div class="detail-images">
              ${resource.caseImages.map(img => `
                <img src="${img.url}" alt="${img.name}" onclick="window.open('${img.url}')">
              `).join('')}
            </div>
          ` : ''}
          
          <div class="comments-section">
            <h3>评论 (${resource.commentCount || 0})</h3>
            ${currentUser ? `
              <div class="comment-form">
                <textarea id="commentContent" placeholder="发表你的评论..."></textarea>
                <button class="btn btn-primary" onclick="submitComment('${resource.id}')">发表评论</button>
              </div>
            ` : '<p>请登录后评论</p>'}
            <div class="comment-list" id="commentList">
              <div class="loading">加载评论中...</div>
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('resourceDetail').innerHTML = detailHtml;
      showModal('resource');
      
      // 加载评论
      loadComments(resourceId);
    }
  } catch (error) {
    console.error('获取资源详情错误:', error);
    alert('获取资源详情失败');
  }
}

// 加载评论
async function loadComments(resourceId) {
  try {
    const response = await fetch(`${API_BASE}/comments/resource/${resourceId}`);
    const data = await response.json();
    
    const commentList = document.getElementById('commentList');
    
    if (data.success && data.data.rows.length > 0) {
      commentList.innerHTML = data.data.rows.map(comment => `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${comment.user ? escapeHtml(comment.user.username) : '匿名'}</span>
            <span class="comment-time">${formatDate(comment.createdAt)}</span>
          </div>
          <div class="comment-content">${escapeHtml(comment.contentFiltered || comment.content)}</div>
        </div>
      `).join('');
    } else {
      commentList.innerHTML = '<div class="empty-state">暂无评论，来发表第一条评论吧！</div>';
    }
  } catch (error) {
    console.error('加载评论错误:', error);
    document.getElementById('commentList').innerHTML = '<div class="empty-state">加载评论失败</div>';
  }
}

// 提交评论
async function submitComment(resourceId) {
  const content = document.getElementById('commentContent').value.trim();
  
  if (!content) {
    alert('请输入评论内容');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ resourceId, content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('commentContent').value = '';
      loadComments(resourceId);
      alert(data.message);
    } else {
      alert(data.message || '发表评论失败');
    }
  } catch (error) {
    console.error('发表评论错误:', error);
    alert('发表评论失败');
  }
}

// 发布资源
async function handlePublish(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  try {
    const response = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      closeModal('publish');
      form.reset();
      document.getElementById('imagePreview').innerHTML = '';
      loadResources();
    } else {
      alert(data.message || '发布失败');
    }
  } catch (error) {
    console.error('发布资源错误:', error);
    alert('发布失败');
  }
}

// 图片预览
function previewImages(event) {
  const files = event.target.files;
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';
  
  for (let i = 0; i < Math.min(files.length, 5); i++) {
    const file = files[i];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      preview.appendChild(img);
    };
    
    reader.readAsDataURL(file);
  }
}

// 登录
async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const phone = form.phone.value;
  const password = form.password.value;
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      currentUser = data.data.user;
      closeModal('login');
      showForumView();
      updateUserInfo();
      loadResources();
    } else {
      alert(data.message || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert('登录失败');
  }
}

// 注册
async function handleRegister(event) {
  event.preventDefault();
  
  const form = event.target;
  const password = form.password.value;
  const confirmPassword = form.confirmPassword?.value;
  
  if (confirmPassword && password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  const userData = {
    username: form.username.value,
    realName: form.realName.value,
    phone: form.phone.value,
    password: password
  };
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      currentUser = data.data.user;
      closeModal('register');
      showForumView();
      updateUserInfo();
      loadResources();
      alert('注册成功！');
    } else {
      alert(data.message || '注册失败');
    }
  } catch (error) {
    console.error('注册错误:', error);
    alert('注册失败');
  }
}

// 退出登录
function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  showGuestView();
}

// 显示弹窗
function showModal(type) {
  document.getElementById(type + 'Modal').classList.add('active');
}

// 关闭弹窗
function closeModal(type) {
  document.getElementById(type + 'Modal').classList.remove('active');
}

// 显示发布弹窗
function showPublishModal() {
  if (!currentUser) {
    alert('请先登录');
    showModal('login');
    return;
  }
  showModal('publish');
}

// 工具函数
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
}

function getCategoryName(category) {
  const names = {
    'tech': '技术服务',
    'manufacture': '制造加工',
    'service': '生活服务',
    'enterprise': '企业服务',
    'product': '产品供应',
    'invest': '投资合作'
  };
  return names[category] || category;
}

function getCooperationType(type) {
  const names = {
    'one-time': '一次性',
    'long-term': '长期合作',
    'equity': '股权合作'
  };
  return names[type] || type;
}

function getPriceDisplay(resource) {
  if (resource.priceModel === 'negotiable') return '面议';
  if (resource.priceModel === 'quoted') return '报价';
  if (resource.priceMin && resource.priceMax) {
    return `¥${resource.priceMin} - ¥${resource.priceMax}`;
  }
  return '面议';
}

// 点击弹窗外部关闭
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
}

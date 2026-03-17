// API基础URL
const API_BASE = '/api';

// 存储Token
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  
  if (token && user) {
    const userData = JSON.parse(user);
    document.getElementById('navAuth').style.display = 'none';
    document.getElementById('navUser').style.display = 'flex';
    document.getElementById('userName').textContent = userData.realName || userData.username;
    document.getElementById('creditBadge').textContent = userData.creditLevel || 'B';
    return true;
  }
  return false;
}

// 显示弹窗
function showModal(type) {
  document.getElementById(type + 'Modal').classList.add('active');
}

// 关闭弹窗
function closeModal(type) {
  document.getElementById(type + 'Modal').classList.remove('active');
}

// 切换弹窗
function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => showModal(to), 200);
}

// 切换企业字段显示
function toggleEnterpriseFields() {
  const accountType = document.querySelector('select[name="accountType"]').value;
  const enterpriseFields = document.querySelectorAll('.enterprise-field');
  enterpriseFields.forEach(field => {
    field.style.display = accountType === 'enterprise' ? 'block' : 'none';
  });
}

// 处理登录
async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = {
    phone: formData.get('phone'),
    password: formData.get('password')
  };
  
  try {
    const response = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem(TOKEN_KEY, result.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
      closeModal('login');
      checkAuth();
      location.reload();
    } else {
      alert(result.message || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert('网络错误，请稍后重试');
  }
}

// 处理注册
async function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');
  
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  const data = {
    username: formData.get('username'),
    realName: formData.get('realName'),
    phone: formData.get('phone'),
    password: password,
    idCard: formData.get('idCard') || null,
    accountType: formData.get('accountType'),
    enterpriseName: formData.get('enterpriseName') || null,
    enterpriseCode: formData.get('enterpriseCode') || null
  };
  
  try {
    const response = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      localStorage.setItem(TOKEN_KEY, result.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
      closeModal('register');
      alert('注册成功！');
      location.reload();
    } else {
      alert(result.message || result.errors?.[0]?.msg || '注册失败');
    }
  } catch (error) {
    console.error('注册错误:', error);
    alert('网络错误，请稍后重试');
  }
}

// 退出登录
function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  location.reload();
}

// 搜索资源
function searchResources() {
  const keyword = document.getElementById('searchInput').value;
  if (keyword) {
    window.location.href = '#resources?search=' + encodeURIComponent(keyword);
    loadResources(keyword);
  }
}

// 按分类筛选
function filterCategory(category) {
  window.location.href = '#resources?category=' + category;
  loadResources('', category);
}

// 加载资源列表
async function loadResources(keyword = '', category = '') {
  const container = document.getElementById('resourceList');
  container.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    let url = API_BASE + '/resources?status=published&visibility=public';
    if (keyword) url += '&search=' + encodeURIComponent(keyword);
    if (category) url += '&category=' + category;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.data.rows.length > 0) {
      container.innerHTML = result.data.rows.map(resource => createResourceCard(resource)).join('');
    } else {
      container.innerHTML = '<div class="loading">暂无资源</div>';
    }
  } catch (error) {
    console.error('加载资源错误:', error);
    // 显示模拟数据
    container.innerHTML = createMockResources();
  }
}

// 创建资源卡片HTML
function createResourceCard(resource) {
  const categoryIcons = {
    'tech': '💻',
    'manufacture': '🏭',
    'service': '🔧',
    'enterprise': '🏢',
    'product': '📦',
    'invest': '💰'
  };
  
  return `
    <div class="resource-card" onclick="viewResource('${resource.id}')">
      <div class="resource-image">
        ${categoryIcons[resource.category] || '📄'}
      </div>
      <div class="resource-content">
        <span class="resource-category">${resource.category}</span>
        <h3 class="resource-title">${resource.title}</h3>
        <p class="resource-desc">${resource.description}</p>
        <div class="resource-footer">
          <span class="resource-price">${resource.priceModel === 'negotiable' ? '面议' : resource.priceMin + '-' + resource.priceMax + '元'}</span>
          <div class="resource-author">
            <span class="author-avatar">${resource.User?.realName?.charAt(0) || 'U'}</span>
            <span class="author-name">${resource.User?.realName || '用户'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 创建模拟数据（后端未运行时显示）
function createMockResources() {
  const mockData = [
    {
      id: '1',
      title: '专业软件开发服务 - Web/APP/小程序',
      category: 'tech',
      description: '提供专业的软件开发服务，包括Web网站、APP应用、小程序开发等，技术团队拥有5年以上经验。',
      priceModel: 'negotiable',
      User: { realName: '张**' }
    },
    {
      id: '2',
      title: '汽车维修保养服务 - 20年经验',
      category: 'service',
      description: '专业汽车维修保养，提供发动机维修、电路检修、钣金喷漆等服务，质量保证。',
      priceModel: 'range',
      priceMin: 200,
      priceMax: 5000,
      User: { realName: '李**' }
    },
    {
      id: '3',
      title: '企业融资对接服务',
      category: 'invest',
      description: '专业融资顾问，帮助企业对接投资机构，提供商业计划书撰写、估值咨询等服务。',
      priceModel: 'range',
      priceMin: 5000,
      priceMax: 50000,
      User: { realName: '王**' }
    },
    {
      id: '4',
      title: '3D打印加工服务 - 工业级精度',
      category: 'manufacture',
      description: '提供SLA/SLS 3D打印服务，支持多种材料，精度可达0.1mm，适合手板模型制作。',
      priceModel: 'range',
      priceMin: 100,
      priceMax: 2000,
      User: { realName: '赵**' }
    },
    {
      id: '5',
      title: '法律咨询服务 - 合同/股权/劳动',
      category: 'enterprise',
      description: '专业律师团队，提供合同审查、股权设计、劳动纠纷等法律服务。',
      priceModel: 'negotiable',
      User: { realName: '陈**' }
    },
    {
      id: '6',
      title: '原材料供应 - 塑料颗粒/金属材料',
      category: 'product',
      description: '长期供应各类塑料颗粒、金属材料，价格优惠，量大从优，可提供检测报告。',
      priceModel: 'range',
      priceMin: 5000,
      priceMax: 100000,
      User: { realName: '刘**' }
    }
  ];
  
  return mockData.map(createResourceCard).join('');
}

// 查看资源详情
function viewResource(id) {
  window.location.href = '/resource.html?id=' + id;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadResources();
  
  // 检查URL参数
  const hash = window.location.hash;
  if (hash.includes('search=')) {
    const keyword = hash.split('search=')[1].split('&')[0];
    document.getElementById('searchInput').value = decodeURIComponent(keyword);
  }
  if (hash.includes('category=')) {
    const category = hash.split('category=')[1].split('&')[0];
    loadResources('', category);
  }
});

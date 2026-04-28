const riskProfile = {
  communityName: '西城区党建街道社区',
  riskLevel: '高风险',
  riskTypes: ['治安隐患', '矛盾纠纷', '集中上访'],
  summary: '当前社区重点关注治安隐患、矛盾纠纷和群众信访问题，需提前介入并加强法治宣传。',
  indicators: {
    '社会治安': '高',
    '矛盾纠纷': '中',
    '涉法涉诉': '高',
    '群众信访': '中'
  }
};

// DOM 元素
const communityNameEl = document.getElementById('communityName');
const riskTypesEl = document.getElementById('riskTypes');
const riskSummaryEl = document.getElementById('riskSummary');
const riskIndicatorsEl = document.getElementById('riskIndicators');
const pushGovernanceEl = document.getElementById('pushGovernance');
const pushLawEl = document.getElementById('pushLaw');
const pushActionEl = document.getElementById('pushAction');
const feedbackStatusEl = document.getElementById('feedbackStatus');
const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const refreshPushButton = document.getElementById('refreshPush');
const markHandledButton = document.getElementById('markHandled');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');
const activeRegionEl = document.getElementById('activeRegion');

let currentRegion = '西城区德胜街道';
let availableRegions = [
  {
    name: currentRegion,
    address: '北京市西城区德胜街道德外大街甲5号（德胜街道办事处）',
    lngLat: [116.376706, 39.949297]
  }
];

function setCurrentRegion(regionName) {
  currentRegion = regionName;
  if (activeRegionEl) {
    activeRegionEl.textContent = `当前区域：${regionName}`;
  }
}

// 检查登录状态并更新UI
function checkLoginStatus() {
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    loginBtn.classList.add('hidden');
    userDisplay.classList.remove('hidden');
    userDisplay.textContent = `欢迎，${user.username}`;
    logoutBtn.classList.remove('hidden');
  }
}

// 登录按钮事件
loginBtn.addEventListener('click', () => {
  window.location.href = 'login.html';
});

// 退出登录按钮事件
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

function renderRiskProfile() {
  communityNameEl.textContent = riskProfile.communityName;
  riskTypesEl.textContent = riskProfile.riskTypes.join(' / ');
  riskSummaryEl.textContent = riskProfile.summary;

  riskIndicatorsEl.innerHTML = '';
  Object.entries(riskProfile.indicators).forEach(([label, value]) => {
    const li = document.createElement('li');
    li.textContent = `${label}：${value}`;
    riskIndicatorsEl.appendChild(li);
  });
}

function appendMessage(content, role) {
  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '85%';
  wrapper.style.padding = '1rem 1.25rem';
  wrapper.style.borderRadius = '1rem';
  wrapper.style.fontSize = '0.9375rem';
  wrapper.style.lineHeight = '1.6';
  wrapper.style.boxShadow = 'var(--shadow-sm)';
  
  if (role === 'user') {
    wrapper.style.background = 'linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%)';
    wrapper.style.color = 'white';
    wrapper.style.marginLeft = 'auto';
    wrapper.style.borderBottomRightRadius = '4px';
    wrapper.innerHTML = `<div style="font-weight: 600; margin-bottom: 0.5rem;">用户</div><div style="white-space: pre-wrap;">${content}</div>`;
  } else {
    wrapper.style.backgroundColor = 'white';
    wrapper.style.color = 'var(--color-ink)';
    wrapper.style.border = '1px solid var(--color-slate-200)';
    wrapper.style.borderBottomLeftRadius = '4px';
    wrapper.innerHTML = `<div style="font-weight: 700; font-family: var(--font-title); color: var(--color-primary); margin-bottom: 0.5rem; font-size: 0.875rem;">AI 助手</div><div style="white-space: pre-wrap;">${content}</div>`;
  }
  
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function loadPush(regionName = currentRegion) {
  pushGovernanceEl.textContent = '加载中，请稍候...';
  pushLawEl.textContent = '';
  pushActionEl.textContent = '';

  setCurrentRegion(regionName);

  try {
    const response = await fetch(`/api/push?region=${encodeURIComponent(regionName)}`);
    const text = await response.text();

    const sections = text.split(/\n\n(?=【)/).map((part) => part.trim());
    const sectionMap = {
      '【治理建议】': '',
      '【普法内容】': '',
      '【处置要求】': ''
    };

    sections.forEach((part) => {
      const header = part.split('\n')[0];
      if (header in sectionMap) {
        sectionMap[header] = part.replace(header, '').trim();
      }
    });

    pushGovernanceEl.textContent = sectionMap['【治理建议】'] || text;
    pushLawEl.textContent = sectionMap['【普法内容】'] || '';
    pushActionEl.textContent = sectionMap['【处置要求】'] || '';
  } catch (error) {
    pushGovernanceEl.textContent = '推送内容加载失败，请稍后重试。';
    pushLawEl.textContent = '';
    pushActionEl.textContent = '';
    console.error('读取推送失败：', error);
  }
}

function loadAmapScript(amapKey) {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(amapKey)}`;
    script.async = true;
    script.onload = () => resolve(window.AMap);
    script.onerror = () => reject(new Error('高德地图脚本加载失败'));
    document.head.appendChild(script);
  });
}

async function initRegionMap() {
  const mapContainer = document.getElementById('amapContainer');
  if (!mapContainer) return;

  try {
    const regionsRes = await fetch('/api/regions');
    if (regionsRes.ok) {
      const regionsData = await regionsRes.json();
      availableRegions = regionsData.regions || availableRegions;
      if (regionsData.defaultRegion) {
        setCurrentRegion(regionsData.defaultRegion);
      }
    }

    const configRes = await fetch('/api/config');
    const config = await configRes.json();

    if (config.amapSecurityJsCode) {
      window._AMapSecurityConfig = {
        securityJsCode: config.amapSecurityJsCode
      };
    }

    if (!config.amapKey) {
      mapContainer.innerHTML = '<div style="padding: 1rem; color: var(--color-slate-500); font-size: 0.875rem;">未配置 AMAP_API_KEY，地图不可用。请在 .env 中配置后刷新。</div>';
      return;
    }

    const AMap = await loadAmapScript(config.amapKey);
    const defaultRegionData = availableRegions.find((region) => region.name === currentRegion) || availableRegions[0];
    const center = defaultRegionData?.lngLat || [116.38, 39.91];
    const map = new AMap.Map('amapContainer', {
      viewMode: '2D',
      zoom: 12,
      center,
      resizeEnable: true
    });

    availableRegions.forEach((regionItem) => {
      const regionName = regionItem.name;
      const lngLat = regionItem.lngLat;
      if (!lngLat) return;

      const marker = new AMap.Marker({
        position: lngLat,
        title: regionName
      });

      marker.setLabel({
        direction: 'right',
        offset: new AMap.Pixel(8, 0),
        content: `<div style="font-size:12px;color:#1e3a8a;background:#fff;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;">${regionName}</div>`
      });

      const infoWindow = new AMap.InfoWindow({
        content: `<div style="font-size:13px;line-height:1.5;"><div style="font-weight:700;color:#1e3a8a;">${regionName}</div><div style="color:#475569;">${regionItem.address || '西城区'}</div></div>`,
        offset: new AMap.Pixel(0, -28)
      });

      marker.on('click', () => {
        setCurrentRegion(regionName);
        infoWindow.open(map, lngLat);
        loadPush(regionName);
      });

      map.add(marker);
    });

    map.setFitView();
  } catch (error) {
    mapContainer.innerHTML = '<div style="padding: 1rem; color: var(--color-danger); font-size: 0.875rem;">地图初始化失败，请稍后重试。</div>';
    console.error('地图初始化失败：', error);
  }
}

async function sendChat(question) {
  appendMessage(question, 'user');
  appendMessage('正在生成回答...', 'ai');
  const latestAI = chatWindow.lastChild;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await response.json();

    if (data.error) {
      latestAI.querySelector('div:nth-child(2)').textContent = data.error;
    } else {
      latestAI.querySelector('div:nth-child(2)').textContent = data.answer;
    }
  } catch (error) {
    latestAI.querySelector('div:nth-child(2)').textContent = '服务暂时不可用，请稍后重试。';
    console.error('聊天请求失败：', error);
  }
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  chatInput.value = '';
  sendChat(question);
});

chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

refreshPushButton.addEventListener('click', () => loadPush(currentRegion));

markHandledButton.addEventListener('click', () => {
  const feedbackText = prompt('请填写处置反馈：', '已完成重点巡查、矛盾纠纷已登记并安排处理。');
  if (feedbackText) {
    localStorage.setItem('communityFeedback', JSON.stringify({ feedbackText, time: new Date().toISOString() }));
    feedbackStatusEl.textContent = '反馈已记录，感谢配合';
  }
});

function restoreFeedback() {
  const saved = localStorage.getItem('communityFeedback');
  if (saved) {
    const data = JSON.parse(saved);
    feedbackStatusEl.textContent = `反馈已记录，感谢配合（${new Date(data.time).toLocaleString()}）`;
  }
}

renderRiskProfile();
restoreFeedback();
initRegionMap();
loadPush(currentRegion);
checkLoginStatus();

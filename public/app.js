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

async function loadPush() {
  pushGovernanceEl.textContent = '加载中，请稍候...';
  pushLawEl.textContent = '';
  pushActionEl.textContent = '';

  try {
    const response = await fetch('/api/push');
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

refreshPushButton.addEventListener('click', loadPush);

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
loadPush();
checkLoginStatus();

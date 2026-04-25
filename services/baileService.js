function getApiConfig() {
  const apiUrl = process.env.BAILEAN_API_URL;
  const apiKey = process.env.BAILEAN_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error('百炼平台 API 配置缺失，请检查 BAILEAN_API_URL 和 BAILEAN_API_KEY。');
  }
  return { apiUrl, apiKey };
}

async function requestBailian(prompt) {
  const { apiUrl, apiKey } = getApiConfig();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ prompt, max_tokens: 500 })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`百炼 API 返回错误：${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data || !data.text) {
    throw new Error('百炼 API 返回格式不正确。');
  }

  return data.text;
}

export async function getPushContent(prompt) {
  return requestBailian(prompt);
}

export async function getChatResponse(prompt) {
  return requestBailian(prompt);
}

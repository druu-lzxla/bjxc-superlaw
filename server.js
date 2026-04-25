import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPushContent, getChatResponse } from './services/baileService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 固定风险画像 JSON，写死在后端
const RISK_PROFILE = {
  communityName: '西城区党建街道社区',
  riskLevel: '高风险',
  riskTypes: ['治安隐患', '矛盾纠纷', '集中上访'],
  summary: '当前社区重点关注治安隐患、矛盾纠纷和群众信访问题，需提前介入并加强法治宣传。',
  indicators: {
    socialSecurity: '高',
    conflictMediation: '中',
    legalAppeals: '高',
    publicSentiment: '中'
  },
  lastUpdated: '2026-04-25'
};

const FALLBACK_PUSH_TEXT = `【治理建议】
当前社区应对重点风险开展网格化巡查，加强矛盾纠纷排查，集中开展重点人群法治教育。建议联合综治部门建立矛盾调处机制，强化非法集资、涉黄赌等重点领域治理。

【普法内容】
请向居民宣传《中华人民共和国治安管理处罚法》《中华人民共和国人民警察法》《中华人民共和国反有组织犯罪法》，强调合法表达诉求渠道，增强依法维权意识。

【处置要求】
请社区治理单位对重点区域开展昼夜巡查，记录隐患点位，及时向检察机关反馈异常情况；对已排查出的纠纷建立台账，按期复核处置进展。`;

app.get('/api/push', async (req, res) => {
  const prompt = `请生成默认治理与普法推送（纯文本），基于以下风险画像：\n${JSON.stringify(RISK_PROFILE, null, 2)}`;

  try {
    const result = await getPushContent(prompt);
    return res.type('text/plain').send(result);
  } catch (error) {
    console.error('Push API 调用失败，使用本地 fallback：', error?.message || error);
    return res.type('text/plain').send(FALLBACK_PUSH_TEXT);
  }
});

app.post('/api/chat', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: '请求格式不正确，请提供 question 字段。' });
  }

  const prompt = `用户提问：${question}\n当前社区风险背景如下（JSON）：\n${JSON.stringify(RISK_PROFILE, null, 2)}\n请以治理普法专家身份直接回答用户问题，不要使用推送格式。`;

  try {
    const answer = await getChatResponse(prompt);
    return res.json({ answer });
  } catch (error) {
    console.error('Chat API 调用失败：', error?.message || error);
    return res.status(503).json({ error: '服务暂时不可用，请稍后重试' });
  }
});

app.post('/api/evaluate', (req, res) => {
  // 扩展方向：接入真实治理反馈数据、评估治理措施有效性、输出风险变化趋势
  const evaluationMock = {
    status: 'ok',
    summary: '当前根据 mock 数据，治理闭环执行情况稳定，整体风险略有下降。',
    metrics: {
      riskTrend: '下降',
      feedbackReceived: 18,
      interventionCoverage: '85%',
      suggestedFollowUp: '继续强化重点人群法治宣传，并完善信息共享机制。'
    },
    notes: [
      '后续可接入真实处置反馈数据',
      '建议结合街道矛盾调处台账做效果评估',
      '未来可展示风险变化趋势图表'
    ]
  };

  return res.json(evaluationMock);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务已启动，访问 http://localhost:${PORT}`);
});

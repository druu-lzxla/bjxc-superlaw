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

const DEFAULT_REGION = '西城区德胜街道';

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
const REGION_PUSH_DATA = {
  '西城区德胜街道': {
    governance: '建议联合街道综治中心与检察联络员，针对老旧小区电动车停放、夜间扰民和重点矛盾点位开展“每周巡查+每月会商”。对重复投诉事项建立“一案一档”并明确责任人。',
    law: '重点普及《中华人民共和国民法典》中相邻关系条款、《中华人民共和国治安管理处罚法》噪声与公共秩序条款，引导群众通过社区调解、12309 检察服务渠道依法反映诉求。',
    action: '48 小时内完成重点楼栋巡检清单；对三类高频投诉点形成处置台账；每周向检察联络岗回传一次整改进度。'
  },
  '西城区金融街街道': {
    governance: '建议围绕商务楼宇周边治安与劳动争议风险，建立“楼宇网格员+司法所+检察协同”快速响应机制。对涉众金融宣传开展定点巡查，减少群体性纠纷。',
    law: '重点宣传《防范和处置非法集资条例》《中华人民共和国劳动合同法》与反诈知识，提醒群众识别高收益理财陷阱，依法维护劳动报酬权益。',
    action: '对写字楼密集片区开展常态化法治宣讲；建立重点企业联系清单；出现涉众投诉时 24 小时内形成风险简报。'
  },
  '西城区牛街街道': {
    governance: '建议以社区商圈为重点，推进“商户自治+网格普法”联动机制，针对消费纠纷、邻里纠纷和未成年人保护风险进行分类治理。',
    law: '重点普及《中华人民共和国消费者权益保护法》《中华人民共和国未成年人保护法》以及反网络暴力宣传内容，提升商户与居民守法意识。',
    action: '组织每月一次商圈普法活动；对重点纠纷实施“先调后访”；对未成年人风险线索做到即发现即上报。'
  }
};

  try {
    const result = await getPushContent(prompt);
    return res.type('text/plain').send(result);
  } catch (error) {
    console.error('Push API 调用失败，使用本地 fallback：', error?.message || error);
    return res.type('text/plain').send(FALLBACK_PUSH_TEXT);
const REGION_LOCATIONS = {
  '西城区德胜街道': {
    address: '北京市西城区德胜街道德外大街甲5号（德胜街道办事处）',
    lngLat: [116.376706, 39.949297]
  },
  '西城区金融街街道': {
    address: '北京市西城区金城坊街2号（金融街街道办事处）',
    lngLat: [116.366023, 39.915189]
  },
  '西城区牛街街道': {
    address: '北京市西城区牛街8号（牛街街道办事处）',
    lngLat: [116.370273, 39.890095]
  }
};

function toPushText(regionName) {
  const regionData = REGION_PUSH_DATA[regionName] || REGION_PUSH_DATA[DEFAULT_REGION];
  return `【治理建议】\n${regionData.governance}\n\n【普法内容】\n${regionData.law}\n\n【处置要求】\n${regionData.action}`;
}

app.get('/api/config', (req, res) => {
  return res.json({
    amapKey: process.env.AMAP_API_KEY || '',
    amapSecurityJsCode: process.env.AMAP_SECURITY_JS_CODE || ''
  });
});

app.get('/api/regions', (req, res) => {
  const regions = Object.keys(REGION_PUSH_DATA).map((name) => ({
    name,
    ...(REGION_LOCATIONS[name] || {})
  }));

  return res.json({
    defaultRegion: DEFAULT_REGION,
    regions
  });
});

app.get('/api/push', async (req, res) => {
  const regionName = req.query.region || DEFAULT_REGION;
  const pushText = toPushText(regionName);
  return res.type('text/plain').send(pushText || FALLBACK_PUSH_TEXT);
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
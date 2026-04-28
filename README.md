# 社区法治生态智能预警与靶向普控系统

本仓库实现了一个基于 Node.js + Express 的政务风格全栈系统，包含：

- `GET /api/push`：按区域返回治理建议/普法内容（当前为死数据）
- `POST /api/chat`：个性化问答接口
- `POST /api/evaluate`：效果评估 mock 接口
- `GET /api/config`：前端地图配置读取接口
- `GET /api/regions`：区域列表接口
- `public/`：响应式前端页面，含推送卡片、智能问答、闭环反馈功能

## 运行方式

1. 安装依赖：

```bash
npm install
```

2. 复制环境配置：

```bash
cp .env.example .env
```

3. 填写 `.env` 中的配置：
   - `BAILEAN_API_URL` 和 `BAILEAN_API_KEY`（聊天/报告生成）
   - `AMAP_API_KEY` 和 `AMAP_SECURITY_JS_CODE`（高德地图 Web JS）

4. 启动服务：

```bash
npm start
```

5. 访问：

```text
http://localhost:3000
```

## 功能说明

- 后端使用 `dotenv` 管理环境变量
- 所有外部 API 调用封装在 `services/baileService.js`
- 前端使用 TailwindCSS CDN + 原生 JavaScript
- 推送升级为按区域返回固定 mock 内容，不依赖 geohub API
- 页面风格符合政务系统要求：蓝灰色、圆角卡片、清晰严谨布局

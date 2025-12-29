# LLM Chat Frontend - 多模态 AI 对话系统前端

本项目是基于 **Next.js 15+** 和 **Ant Design X** 开发的高性能 AI 对话系统前端。它深度对齐 OpenAPI 规范，集成了 AI 场景化组件、语音交互及管理员后台，为用户提供流畅的多模态对话体验。

---

##  技术栈

- **核心框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **基础库**: React 19 + TypeScript
- **AI 场景组件**: [Ant Design X](https://x.ant.design/)
- **样式处理**: Tailwind CSS
- **接口交互**: Fetch API 封装 + JWT Cookie 鉴权

---

##  技术亮点

###  鲁棒的鉴权体系
- **自动 Token 注入**: 通过 [withAuth.ts](file:///c:/Users/Lenovo/Desktop/岗位实践大作业/code/frontend/lib/api/withAuth.ts) 高阶函数，在每次请求时自动从 Cookie 中提取并注入 `Authorization` Header。
- **无感刷新**: 封装了 Token 刷新与过期拦截逻辑，确保用户会话的连续性。

###  沉浸式 AI 交互
- **智能组件**: 利用 Ant Design X 的 `Bubble` 和 `Sender` 组件，实现打字机效果、Markdown 渲染及流式响应展示。
- **会话管理**: 完整的会话生命周期管理，支持创建、重命名、搜索及持久化存储。

###  多模态功能集成
- **语音转文字 (STT)**: 集成浏览器 **MediaRecorder API**，实现原生的音频采集并对接后端 STT 接口。
- **文字转语音 (TTS)**: 支持后端流式语音播放，利用原生 `Audio` 对象实现流畅的交互体验。

---

##  功能模块图谱

### 聊天模块 (Chat)
- **侧边栏**: 支持多会话切换、搜索过滤及对话列表展示。
- **消息流**: 
  - 支持文本消息与多类型附件上传。
  - 历史记录分页加载：向上滚动自动触发翻页请求，优化长对话性能。
- **模型反馈**: 适配流式输出，提供即时的打字机反馈。

###  管理员后台 (Admin)
- **用户管理**: 完整的用户 CRUD 操作界面，支持权限角色分配。
- **额度管理**: 可视化展示各用户的 Token 消耗情况，支持管理员手动设置与调整。
- **Prompt 预设**: 系统级提示词模板管理，提升 AI 回复的专业度。

---

##  运行指引

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
在项目根目录创建 `.env.local` 文件，配置后端接口地址：
```env
NEXT_PUBLIC_API_BASE_URL=http://your-backend-api.com
```

### 3. 开发模式运行
```bash
npm run dev
```
启动后访问 [http://localhost:3000](http://localhost:3000) 即可预览。

---

##  开发规范说明

- **接口响应适配**: 前端已严格对齐后端 JSON 结构。消息体包含 `messages` 数组，并通过 `sender_type` (`USER` / `ASSISTANT`) 区分对话来源。
- **组件复用**: 页面布局严格遵循 Ant Design X 的规范，建议优先复用 `lib/api` 中的封装工具进行数据交互。

---



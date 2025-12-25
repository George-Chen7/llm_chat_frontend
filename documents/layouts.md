# 前端功能与页面规划（Next.js + Ant Design X）

> 目标：本地大语言模型的人机对话系统。支持文字/语音双向交互、多对话管理、用户配额、Prompt 预设管理、历史记录与附件。

## 1. 全局信息架构

- 顶部导航：产品标题、当前用户、快捷操作（新建对话、退出登录）。
- 左侧栏：对话列表（支持搜索、分组、状态筛选：ACTIVE/ARCHIVED/DELETED）。
- 右侧主区：聊天窗口或管理页。
- 全局浮层：上传附件、语音录制、TTS 播放控制、快捷 Prompt 选择。

## 2. 路由与页面清单

### 2.1 登录页 `/login`

**页面目标**：完成账号密码登录、进入系统。

**布局**
- 居中卡片布局：Logo/标题 + 表单 + 说明文本。
- 表单：账号、密码、登录按钮。
- 辅助区：错误提示、加载态。

**功能清单**
- 调用：`POST /auth/login`
- 登录成功：保存 JWT（本地存储或内存），跳转 `/chat`。
- 登录失败：展示错误信息。

---

### 2.2 聊天主页面 `/chat`

**页面目标**：完成对话管理与多模态消息交互。

**布局**
- 左侧栏（对话列表）
  - 顶部操作：新建对话按钮、搜索输入框。
  - 列表项：标题、模型、状态标签、最后更新时间。
  - 右键/更多：重命名、归档、删除。
- 右侧主区（聊天窗口）
  - 顶部：对话标题 + 模型信息 + 系统提示查看。
  - 中部：消息流（支持文本、音频、附件展示）。
  - 底部：输入区（文本输入、语音录入、附件上传、快捷 Prompt）。

**功能清单**
- 对话管理
  - 新建对话：`POST /chat/new-conversation`
  - 重命名对话：`PUT /chat/rename-conversation/{conversation_id}`
  - 删除对话：`DELETE /chat/delete-conversation/{conversation_id}`
  - 对话列表：`GET /chat/conversation-list`（如有）
- 历史记录
  - 拉取分页：`GET /chat/history/{conversation_id}?current_page=&page_size=`
- 发送消息
  - 发送文本/附件：`POST /chat/send-message/{conversation_id}`
  - 支持附件 id 关联（附件先上传）
- 附件上传
  - `POST /chat/upload-file`（multipart）
- 语音能力
  - 语音转文字（STT）：`POST /stt/request-stt`
  - 文本转语音（TTS）：`POST /tts/request/{message_id}`

**组件建议**
- ConversationList
- MessageList / MessageItem
- MessageComposer
- AttachmentUploader
- STTRecorder
- TTSPlayer

---

### 2.3 对话详情页（可选）`/chat/:id`

**页面目标**：将单个对话作为独立路由，支持分享/书签。

**布局**
- 复用聊天主页面右侧主区。
- 左侧栏保留。

**功能清单**
- 根据 route param 拉取会话历史。
- URL 直达特定会话。

---

### 2.4 用户中心 `/settings`

**页面目标**：查看个人信息、配额使用情况、修改密码。

**布局**
- 页面标题 + 基本信息卡片。
- 配额卡片：总配额、剩余配额、消耗提示。
- 修改密码表单。

**功能清单**
- 获取用户信息：`GET /user/profile`（若有）
- 修改密码：`POST /auth/reset-password`

---

### 2.5 Prompt 预设页 `/prompts`

**页面目标**：管理/选择 Prompt 预设。

**布局**
- 左侧列表：预设名称 + 简述。
- 右侧详情：内容预览 + 使用按钮。
- 顶部：新建按钮（若管理员）。

**功能清单**
- 查询预设列表：`GET /prompt-presets`（若有）
- 新建/更新/删除预设：`POST/PUT/DELETE /admin/prompt-preset`（管理员）
- 选择预设后可写入新建对话 `system_prompt`。

---

### 2.6 管理后台 `/admin`

**页面目标**：用户管理、配额管理、Prompt 预设管理。

**布局**
- Tabs：用户管理、配额管理、Prompt 管理。
- 用户管理：表格 + 搜索。
- 配额管理：表格 + 批量修改。

**功能清单**
- 用户列表：`GET /admin/users`（若有）
- 用户详情/更新：`GET/PUT /admin/user/{id}`
- 配额更新：`PUT /admin/user-quota/{id}`
- Prompt 管理：`GET/POST/PUT/DELETE /admin/prompt-preset`

---

## 3. 页面级交互细节

- 语音输入
  - 录音按钮按住/点击开始录音，停止后调用 STT。
  - STT 返回文本后自动填入输入框，允许编辑后发送。
- 语音播放
  - 对消息请求 TTS 获取 wav 数据；支持播放/暂停/进度。
- 附件
  - 上传成功后得到 attachment_id；发送消息时携带。
  - 消息中显示附件卡片（图片预览、音频播放器、文件下载）。
- 对话列表
  - Active/Archived/Deleted 分组或筛选。
  - 右键菜单/更多操作。

## 4. 权限与状态

- 未登录访问重定向 `/login`。
- JWT 过期：自动尝试 `POST /auth/refresh-token`，失败则退出登录。
- 管理权限：仅 ADMIN 角色显示 `/admin`。

## 5. 组件与公共模块建议

- API 客户端：统一处理 JWT、刷新 token、错误码。
- 全局状态：当前用户、当前对话、对话列表、快捷 Prompt。
- 主题与样式：Ant Design X 统一主题 + 自定义变量。

---

如需我补全到具体组件结构/文件树，或按 Next.js App Router 生成页面骨架，可以继续指示。

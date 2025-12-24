import { apiJson, apiRequest } from "./client";
import { refreshToken } from "./auth";
import { requestWithAuth } from "./withAuth";
import type {
  ChatHistoryResponse,
  LoginRequest,
  LoginResponse,
  NewConversationRequest,
  NewConversationResponse,
  RenameConversationRequest,
  ResetPasswordRequest,
  SendMessageRequest,
  SendMessageResponse,
  SttResponse,
  UploadAttachmentResponse,
} from "./types";

// 登录（账号密码）
export function login(data: LoginRequest) {
  return apiJson<LoginResponse>("/auth/login", data, { method: "POST" });
}

// 修改密码
export function resetPassword(data: ResetPasswordRequest, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiJson("/auth/reset-password", data, {
        method: "POST",
        token: authToken,
      }),
    token
  );
}

// 新建对话
export function newConversation(data: NewConversationRequest, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiJson<NewConversationResponse>("/chat/new-conversation", data, {
        method: "POST",
        token: authToken,
      }),
    token
  );
}

// 对话重命名
export function renameConversation(
  conversationId: number,
  data: RenameConversationRequest,
  token: string
) {
  return requestWithAuth(
    (authToken) =>
      apiJson(`/chat/rename-conversation/${conversationId}`, data, {
        method: "PUT",
        token: authToken,
      }),
    token
  );
}

// 删除对话
export function deleteConversation(conversationId: number, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest(`/chat/delete-conversation/${conversationId}`, {
        method: "DELETE",
        token: authToken,
      }),
    token
  );
}

// 获取聊天历史（分页）
export function getChatHistory(
  conversationId: number,
  params: { current_page?: number; page_size?: number },
  token: string
) {
  const search = new URLSearchParams();
  if (params.current_page) search.set("current_page", `${params.current_page}`);
  if (params.page_size) search.set("page_size", `${params.page_size}`);
  const query = search.toString();
  const path = query
    ? `/chat/history/${conversationId}?${query}`
    : `/chat/history/${conversationId}`;
  return requestWithAuth(
    (authToken) => apiRequest<ChatHistoryResponse>(path, { token: authToken }),
    token
  );
}

// 发送消息
export function sendMessage(
  conversationId: number,
  data: SendMessageRequest,
  token: string
) {
  return requestWithAuth(
    (authToken) =>
      apiJson<SendMessageResponse>(
        `/chat/send-message/${conversationId}`,
        data,
        { method: "POST", token: authToken }
      ),
    token
  );
}

// 上传附件（multipart/form-data）
export function uploadAttachment(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  return requestWithAuth(
    (authToken) =>
      apiRequest<UploadAttachmentResponse>("/chat/upload-file", {
        method: "POST",
        token: authToken,
        body: formData,
      }),
    token
  );
}

// 语音转文字（STT）
export function requestStt(audioFile: File, token: string) {
  const formData = new FormData();
  formData.append("audio", audioFile);
  return requestWithAuth(
    (authToken) =>
      apiRequest<SttResponse>("/stt/request-stt", {
        method: "POST",
        token: authToken,
        body: formData,
      }),
    token
  );
}

// 文本转语音（TTS）返回 wav 二进制流
export function requestTts(messageId: number, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest<Blob>(`/tts/request/${messageId}`, {
        method: "POST",
        token: authToken,
      }),
    token
  );
}

export { refreshToken };

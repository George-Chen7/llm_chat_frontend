import { apiJson, apiRequest } from "./client";
import { refreshToken } from "./auth";
import { requestWithAuth } from "./withAuth";
import type {
  AdminPromptPresetListResponse,
  AdminUsersResponse,
  ChatHistoryResponse,
  ChatPromptPresetResponse,
  CreatePromptPresetRequest,
  LoginRequest,
  LoginResponse,
  MeConversationsResponse,
  MeInfoResponse,
  NewConversationRequest,
  NewConversationResponse,
  NewUserRequest,
  NewUserResponse,
  RenameConversationRequest,
  ResetPasswordRequest,
  SendMessageRequest,
  SendMessageResponse,
  SetQuotaRequest,
  SttResponse,
  UploadAttachmentResponse,
} from "./types";

export function login(data: LoginRequest) {
  return apiJson<LoginResponse>("/auth/login", data, { method: "POST" });
}

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

export function getMeInfo(token: string) {
  return requestWithAuth(
    (authToken) => apiRequest<MeInfoResponse>("/me/info", { token: authToken }),
    token
  );
}

export function getMeConversations(token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest<MeConversationsResponse>("/me/conversations", {
        token: authToken,
      }),
    token
  );
}

export function getChatPromptPresets(token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest<ChatPromptPresetResponse>("/chat/prompt-preset", {
        token: authToken,
      }),
    token
  );
}

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

export function requestTts(messageId: number, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest<Blob>(`/tts/request/${messageId}`, {
        method: "GET",
        token: authToken,
      }),
    token
  );
}

export function getAdminUsers(
  params: { current_page?: number; page_size?: number },
  token: string
) {
  const search = new URLSearchParams();
  if (params.current_page) search.set("current_page", `${params.current_page}`);
  if (params.page_size) search.set("page_size", `${params.page_size}`);
  const query = search.toString();
  const path = query ? `/admin/users?${query}` : "/admin/users";
  return requestWithAuth(
    (authToken) => apiRequest<AdminUsersResponse>(path, { token: authToken }),
    token
  );
}

export function adminNewUser(data: NewUserRequest, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiJson<NewUserResponse>("/admin/new-user", data, {
        method: "POST",
        token: authToken,
      }),
    token
  );
}

export function adminDeleteUser(userId: number, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest(`/admin/delete-user/${userId}`, {
        method: "DELETE",
        token: authToken,
      }),
    token
  );
}

export function adminSetQuota(
  userId: number,
  data: SetQuotaRequest,
  token: string
) {
  return requestWithAuth(
    (authToken) =>
      apiJson(`/admin/set-quota/${userId}`, data, {
        method: "POST",
        token: authToken,
      }),
    token
  );
}

export function adminGetPromptPresets(token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest<AdminPromptPresetListResponse>("/admin/prompt-preset", {
        token: authToken,
      }),
    token
  );
}

export function adminCreatePromptPreset(
  data: CreatePromptPresetRequest,
  token: string
) {
  return requestWithAuth(
    (authToken) =>
      apiJson("/admin/prompt-preset", data, {
        method: "POST",
        token: authToken,
      }),
    token
  );
}

export function adminDeletePromptPreset(presetId: number, token: string) {
  return requestWithAuth(
    (authToken) =>
      apiRequest(`/admin/prompt-preset/${presetId}`, {
        method: "DELETE",
        token: authToken,
      }),
    token
  );
}

export { refreshToken };

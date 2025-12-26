// 通用响应结构，后端所有接口都会返回 err_code 与 err_msg。
export type ApiResponse = {
  err_code: number;
  err_msg: string;
};

// 登录返回的 Jwt token。
export type AuthToken = {
  jwt_token: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = ApiResponse & AuthToken;

export type ResetPasswordRequest = {
  old_password: string;
  new_password: string;
};

export type RefreshTokenResponse = ApiResponse & AuthToken;

export type ConversationStatus = "ACTIVE" | "ARCHIVED" | "DELETED";
export type SenderType = "USER" | "ASSISTANT" | "SYSTEM";
export type MessageContentType = "TEXT" | "AUDIO" | "FILE";
export type AttachmentType = "IMAGE" | "AUDIO" | "FILE";

export type ConversationInfo = {
  conversation_id: number;
  title: string;
  status: ConversationStatus;
  llm_model: string;
};

export type Conversation = ConversationInfo & {
  user_id: number;
  system_prompt?: string | null;
};

export type NewConversationRequest = {
  title: string;
  system_prompt?: string;
};

export type NewConversationResponse = ApiResponse & {
  conversation: ConversationInfo;
};

export type RenameConversationRequest = {
  title: string;
};

export type MessageAttachment = {
  attachment_id: number;
  attachment_type: AttachmentType;
  mime_type: string;
  url_or_path: string;
  duration_ms?: number | null;
};

export type MessageDetail = {
  message_id: number;
  sender_type: SenderType;
  content_type: MessageContentType;
  content: string;
  token_total: number;
  attachments: MessageAttachment[];
};

export type MessageInput = {
  content_type: MessageContentType;
  content: string;
};

export type SendMessageRequest = {
  message: MessageInput;
  attachment_ids?: number[];
};

export type SendMessageResponse = ApiResponse & {
  user_message: MessageDetail;
  model_message: MessageDetail;
};

export type ChatHistoryResponse = ApiResponse & {
  messages: MessageDetail[];
  total_page: number;
  total_count: number;
  current_page: number;
  page_size: number;
};

export type AttachmentInfo = {
  attachment_id: number;
  attachment_type: AttachmentType;
  mime_type: string;
  url_or_path: string;
  duration_ms?: number | null;
  created_at: string;
};

export type UploadAttachmentResponse = ApiResponse & {
  attachment: AttachmentInfo;
};

export type SttResult = {
  audio_text: string;
  audio_tokens: number;
};

export type SttResponse = ApiResponse & {
  result: SttResult;
};

export type PromptPreset = {
  prompt_preset_id: number;
  name: string;
  description: string;
  content: string;
};

export type ChatPromptPreset = {
  name: string;
  description: string;
  content: string;
};

export type MeInfoResponse = ApiResponse & {
  user: UserDetail;
};

export type MeConversationsResponse = ApiResponse & {
  conversations: ConversationInfo[];
};

export type ChatPromptPresetResponse = ApiResponse & {
  prompt_presets: ChatPromptPreset[];
};

export type UserDetail = {
  user_id: number;
  username: string;
  nickname: string;
  role: "ADMIN" | "USER";
  total_quota: number;
  used_quota: number;
};

export type AdminUsersResponse = ApiResponse & {
  users: UserDetail[];
  total_page: number;
  total_count: number;
  current_page: number;
  page_size: number;
};

export type NewUserRequest = {
  username: string;
  password: string;
  nickname: string;
  role: "ADMIN" | "USER";
  total_quota: number;
  used_quota: number;
};

export type NewUserResponse = ApiResponse & {
  user: UserDetail;
};

export type SetQuotaRequest = {
  quota: number;
};

export type AdminPromptPresetListResponse = ApiResponse & {
  prompt_presets: PromptPreset[];
};

export type CreatePromptPresetRequest = {
  name: string;
  description: string;
  content: string;
};

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokenFromCookie } from "@/lib/api/client";
import {
  getChatHistory,
  newConversation,
  requestStt,
  requestTts,
  sendMessage,
  uploadAttachment,
} from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import type {
  AttachmentInfo,
  ConversationInfo,
  MessageDetail,
} from "@/lib/api/types";

type ChatClientProps = {
  initialConversationId?: string;
};

export default function ChatClient({ initialConversationId }: ChatClientProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(initialConversationId ? Number(initialConversationId) : null);
  const [messages, setMessages] = useState<MessageDetail[]>([]);
  const [input, setInput] = useState("");
  const [attachmentIds, setAttachmentIds] = useState<number[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    AttachmentInfo[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // token 由登录页写入 cookie，页面加载时从 cookie 读取。
    setToken(getTokenFromCookie());
  }, []);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) {
      return null;
    }
    return (
      conversations.find(
        (item) => item.conversation_id === activeConversationId
      ) ?? {
        conversation_id: activeConversationId,
        title: `对话 #${activeConversationId}`,
        status: "ACTIVE",
        llm_model: "默认",
      }
    );
  }, [activeConversationId, conversations]);

  const updateToken = (nextToken: string) => {
    if (nextToken !== token) {
      setToken(nextToken);
    }
  };

  const handleAuthExpired = (message?: string) => {
    setError(message ?? "登录已过期，请重新登录。");
    router.replace("/login");
  };

  const loadHistory = async (conversationId: number, authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: response, token: nextToken } = await getChatHistory(
        conversationId,
        { current_page: 1, page_size: 50 },
        authToken
      );
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setMessages(response.messages ?? []);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "加载历史失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !activeConversationId) {
      return;
    }
    void loadHistory(activeConversationId, token);
  }, [activeConversationId, token]);

  const ensureConversation = async () => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return null;
    }
    if (activeConversationId) {
      return activeConversationId;
    }
    const title = "新对话";
    try {
      const { data: response, token: nextToken } = await newConversation(
        { title },
        token
      );
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return null;
      }
      setConversations((prev) => [response.conversation, ...prev]);
      setActiveConversationId(response.conversation.conversation_id);
      router.replace(`/chat/${response.conversation.conversation_id}`);
      return response.conversation.conversation_id;
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return null;
      }
      setError(err instanceof Error ? err.message : "创建对话失败");
      return null;
    }
  };

  const handleCreateConversation = async () => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return;
    }
    // 使用浏览器 prompt 简化交互，后续可替换为 Ant Design X 的弹窗。
    const title = window.prompt("请输入对话标题", "新对话");
    if (!title) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: response, token: nextToken } = await newConversation(
        { title },
        token
      );
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setConversations((prev) => [response.conversation, ...prev]);
      setActiveConversationId(response.conversation.conversation_id);
      router.replace(`/chat/${response.conversation.conversation_id}`);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "创建对话失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && attachmentIds.length === 0) {
      setError("请输入消息内容或上传附件。");
      return;
    }
    const conversationId = await ensureConversation();
    if (!conversationId || !token) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { data: response, token: nextToken } = await sendMessage(
        conversationId,
        {
          message: { content_type: "TEXT", content: input.trim() || " " },
          attachment_ids: attachmentIds.length ? attachmentIds : undefined,
        },
        token
      );
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setMessages((prev) => [
        ...prev,
        response.user_message,
        response.model_message,
      ]);
      setInput("");
      setAttachmentIds([]);
      setUploadedAttachments([]);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "发送消息失败");
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: response, token: nextToken } = await uploadAttachment(
        file,
        token
      );
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setAttachmentIds((prev) => [...prev, response.attachment.attachment_id]);
      setUploadedAttachments((prev) => [...prev, response.attachment]);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "上传附件失败");
    } finally {
      setLoading(false);
    }
  };

  const handleStt = async (file: File) => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // STT 只处理音频文件，返回文本后写入输入框。
      const { data: response, token: nextToken } = await requestStt(file, token);
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      setInput(response.result.audio_text);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "语音识别失败");
    } finally {
      setLoading(false);
    }
  };

  const handleTts = async (messageId: number) => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: audioBlob, token: nextToken } = await requestTts(
        messageId,
        token
      );
      updateToken(nextToken);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "语音播放失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    router.replace(`/chat/${conversationId}`);
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[280px_1fr]">
      <aside className="flex flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleCreateConversation}
            type="button"
          >
            新建对话
          </button>
          <input
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="搜索对话"
            type="search"
          />
        </div>
        <div className="flex-1 overflow-auto p-3">
          <div className="space-y-2">
            {conversations.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                暂无对话，请先创建。
              </div>
            )}
            {conversations.map((item) => (
              <button
                className={`w-full rounded-2xl border p-3 text-left ${
                  item.conversation_id === activeConversationId
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-200"
                }`}
                key={item.conversation_id}
                onClick={() => handleSelectConversation(item.conversation_id)}
                type="button"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  模型：{item.llm_model} | 状态：{item.status}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {activeConversation?.title ?? "请选择对话"}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                模型：{activeConversation?.llm_model ?? "-"} | 状态：
                {activeConversation?.status ?? "-"}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {loading ? "处理中..." : "已就绪"}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto px-6 py-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                暂无消息，输入内容开始对话。
              </div>
            )}
            {messages.map((message) => {
              const isAssistant = message.sender_type === "ASSISTANT";
              return (
                <div
                  className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
                    isAssistant
                      ? "ml-auto bg-slate-900 text-white"
                      : "bg-white"
                  }`}
                  key={message.message_id}
                >
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{message.sender_type}</span>
                    {isAssistant && (
                      <button
                        className="rounded-full border border-white/20 px-3 py-1 text-xs"
                        onClick={() => handleTts(message.message_id)}
                        type="button"
                      >
                        播放语音
                      </button>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      isAssistant ? "text-slate-100" : "text-slate-600"
                    }`}
                  >
                    {message.content}
                  </p>
                  {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2 text-xs text-slate-400">
                      {message.attachments.map((item) => (
                        <div
                          className={`rounded-lg border px-3 py-2 ${
                            isAssistant
                              ? "border-white/20"
                              : "border-slate-200"
                          }`}
                          key={item.attachment_id}
                        >
                          附件：{item.attachment_type} | {item.mime_type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <label className="cursor-pointer rounded-full border border-slate-200 px-3 py-1">
                上传附件
                <input
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleAttachmentUpload(file);
                    }
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              <label className="cursor-pointer rounded-full border border-slate-200 px-3 py-1">
                语音识别
                <input
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleStt(file);
                    }
                    event.currentTarget.value = "";
                  }}
                  type="file"
                  accept="audio/*"
                />
              </label>
              <span>已选附件：{attachmentIds.length}</span>
            </div>
            {uploadedAttachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {uploadedAttachments.map((item) => (
                  <span
                    className="rounded-full border border-slate-200 px-3 py-1"
                    key={item.attachment_id}
                  >
                    {item.attachment_type} | {item.mime_type}
                  </span>
                ))}
              </div>
            )}
            <textarea
              className="mt-3 h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入消息，支持文字、语音与附件"
              value={input}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">支持 TEXT / AUDIO / FILE</p>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sending}
                onClick={handleSendMessage}
                type="button"
              >
                {sending ? "发送中..." : "发送"}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

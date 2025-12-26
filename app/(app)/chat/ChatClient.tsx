"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { XMarkdown } from "@ant-design/x-markdown";
import { getTokenFromCookie } from "@/lib/api/client";
import {
  getMeConversations,
  getChatHistory,
  newConversation,
  requestStt,
  sendMessage,
  uploadAttachment,
} from "@/lib/api";
import { AuthExpiredError } from "@/lib/api/withAuth";
import { isDemoToken } from "@/lib/auth";
import type {
  AttachmentInfo,
  ConversationInfo,
  MessageDetail,
} from "@/lib/api/types";

type ChatClientProps = {
  initialConversationId?: string;
};

const demoConversations: ConversationInfo[] = [
  {
    conversation_id: 1,
    title: "演示对话：产品规划",
    status: "ACTIVE",
    llm_model: "默认",
  },
  {
    conversation_id: 2,
    title: "演示对话：营销方案",
    status: "ARCHIVED",
    llm_model: "默认",
  },
  {
    conversation_id: 3,
    title: "演示对话：学习助手",
    status: "ACTIVE",
    llm_model: "默认",
  },
];

const demoMessagesSeed: Record<number, MessageDetail[]> = {
  1: [
    {
      message_id: 101,
      sender_type: "USER",
      content_type: "TEXT",
      content: "帮我梳理一个产品规划的核心模块。",
      token_total: 8,
      attachments: [],
    },
    {
      message_id: 102,
      sender_type: "ASSISTANT",
      content_type: "TEXT",
      content: "可以从目标用户、核心价值、功能范围、里程碑与风险控制五个维度展开。",
      token_total: 20,
      attachments: [],
    },
  ],
  2: [
    {
      message_id: 201,
      sender_type: "USER",
      content_type: "TEXT",
      content: "请给我一个活动推广的方案框架。",
      token_total: 10,
      attachments: [],
    },
    {
      message_id: 202,
      sender_type: "ASSISTANT",
      content_type: "TEXT",
      content: "建议包含目标设定、渠道策略、内容节奏、预算分配与效果复盘。",
      token_total: 18,
      attachments: [],
    },
  ],
  3: [
    {
      message_id: 301,
      sender_type: "USER",
      content_type: "TEXT",
      content: "帮我制定一周的学习计划。",
      token_total: 8,
      attachments: [],
    },
    {
      message_id: 302,
      sender_type: "ASSISTANT",
      content_type: "TEXT",
      content: "可以按主题拆分，先打基础，再进行练习与复盘。",
      token_total: 16,
      attachments: [],
    },
  ],
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
  const [demoMessageMap, setDemoMessageMap] =
    useState<Record<number, MessageDetail[]>>(demoMessagesSeed);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollAdjustRef = useRef<{
    prevScrollHeight: number;
    prevScrollTop: number;
  } | null>(null);
  const shouldScrollToBottomRef = useRef(false);

  const pageSize = 20;

  useEffect(() => {
    // token 由登录页写入 cookie，页面加载时从 cookie 读取。
    setToken(getTokenFromCookie());
  }, []);

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    setIsMicSupported(supported);
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

  const loadDemoHistory = (conversationId: number) => {
    const list = demoMessageMap[conversationId] ?? [];
    setMessages(list);
    setCurrentPage(1);
    setTotalPage(1);
    shouldScrollToBottomRef.current = true;
  };

  const loadHistory = async (
    conversationId: number,
    authToken: string,
    page = 1
  ) => {
    if (isDemoToken(authToken)) {
      loadDemoHistory(conversationId);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: response, token: nextToken } = await getChatHistory(
        conversationId,
        { current_page: page, page_size: pageSize },
        authToken
      );
      updateToken(nextToken);
      if (response.err_code !== 0) {
        setError(response.err_msg);
        return;
      }
      const normalized = [...(response.messages ?? [])].reverse();
      if (page === 1) {
        setMessages(normalized);
        shouldScrollToBottomRef.current = true;
      } else {
        setMessages((prev) => [...normalized, ...prev]);
      }
      setCurrentPage(response.current_page ?? page);
      setTotalPage(response.total_page ?? page);
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
    setMessages([]);
    setCurrentPage(1);
    setTotalPage(1);
    void loadHistory(activeConversationId, token, 1);
  }, [activeConversationId, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    if (isDemoToken(token)) {
      setConversations(demoConversations);
      if (!activeConversationId) {
        setActiveConversationId(demoConversations[0]?.conversation_id ?? null);
      }
      return;
    }
    const loadConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: response, token: nextToken } = await getMeConversations(
          token
        );
        updateToken(nextToken);
        if (response.err_code !== 0) {
          setError(response.err_msg);
          return;
        }
        setConversations(response.conversations ?? []);
        if (!activeConversationId && response.conversations?.length) {
          setActiveConversationId(response.conversations[0].conversation_id);
        }
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          handleAuthExpired(err.message);
          return;
        }
        setError(err instanceof Error ? err.message : "加载对话列表失败");
      } finally {
        setLoading(false);
      }
    };

    void loadConversations();
  }, [activeConversationId, token]);

  useEffect(() => {
    const pending = pendingScrollAdjustRef.current;
    if (!pending) {
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const { prevScrollHeight, prevScrollTop } = pending;
    const newScrollHeight = container.scrollHeight;
    container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
    pendingScrollAdjustRef.current = null;
  }, [messages]);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) {
      return;
    }
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    shouldScrollToBottomRef.current = false;
  }, [messages]);

  const ensureConversation = async () => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return null;
    }
    if (activeConversationId) {
      return activeConversationId;
    }
    if (isDemoToken(token)) {
      const newConversationId = Date.now();
      const nextConversation: ConversationInfo = {
        conversation_id: newConversationId,
        title: "演示对话",
        status: "ACTIVE",
        llm_model: "默认",
      };
      setConversations((prev) => [nextConversation, ...prev]);
      setActiveConversationId(newConversationId);
      setDemoMessageMap((prev) => ({ ...prev, [newConversationId]: [] }));
      router.replace(`/chat/${newConversationId}`);
      return newConversationId;
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
    if (isDemoToken(token)) {
      const title = window.prompt("请输入对话标题", "演示对话");
      if (!title) {
        return;
      }
      const newConversationId = Date.now();
      const nextConversation: ConversationInfo = {
        conversation_id: newConversationId,
        title,
        status: "ACTIVE",
        llm_model: "默认",
      };
      setConversations((prev) => [nextConversation, ...prev]);
      setActiveConversationId(newConversationId);
      setDemoMessageMap((prev) => ({ ...prev, [newConversationId]: [] }));
      router.replace(`/chat/${newConversationId}`);
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
    if (isDemoToken(token)) {
      const baseId = Date.now();
      const userMessage: MessageDetail = {
        message_id: baseId,
        sender_type: "USER",
        content_type: "TEXT",
        content: input.trim() || " ",
        token_total: 0,
        attachments: uploadedAttachments.map((item) => ({
          attachment_id: item.attachment_id,
          attachment_type: item.attachment_type,
          mime_type: item.mime_type,
          url_or_path: item.url_or_path,
          duration_ms: item.duration_ms ?? null,
        })),
      };
      const assistantMessage: MessageDetail = {
        message_id: baseId + 1,
        sender_type: "ASSISTANT",
        content_type: "TEXT",
        content: "这是演示账号的模型回复示例。",
        token_total: 0,
        attachments: [],
      };
      setDemoMessageMap((prev) => {
        const nextList = [...(prev[conversationId] ?? []), userMessage, assistantMessage];
        return { ...prev, [conversationId]: nextList };
      });
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setAttachmentIds([]);
      setUploadedAttachments([]);
      shouldScrollToBottomRef.current = true;
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
      shouldScrollToBottomRef.current = true;
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
    if (isDemoToken(token)) {
      const mockAttachment: AttachmentInfo = {
        attachment_id: Date.now(),
        attachment_type: "FILE",
        mime_type: file.type || "application/octet-stream",
        url_or_path: file.name,
        created_at: new Date().toISOString(),
      };
      setAttachmentIds((prev) => [...prev, mockAttachment.attachment_id]);
      setUploadedAttachments((prev) => [...prev, mockAttachment]);
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
    if (isDemoToken(token)) {
      setInput("这是语音识别结果（演示）。");
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

  const handleMicToggle = async () => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return;
    }
    if (!isMicSupported) {
      setError("当前设备不支持麦克风录制。");
      return;
    }
    if (isDemoToken(token)) {
      setInput("这是语音识别结果（演示）。");
      return;
    }
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const file = new File([blob], "recording.webm", { type: blob.type });
        void handleStt(file);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError("无法访问麦克风，请检查权限。");
      setIsMicSupported(false);
      setIsRecording(false);
    }
  };

  const handleLoadMore = async () => {
    if (!token || !activeConversationId) {
      return;
    }
    if (isLoadingMore || currentPage >= totalPage) {
      return;
    }
    const container = scrollContainerRef.current;
    if (container) {
      pendingScrollAdjustRef.current = {
        prevScrollHeight: container.scrollHeight,
        prevScrollTop: container.scrollTop,
      };
    }
    setIsLoadingMore(true);
    try {
      await loadHistory(activeConversationId, token, currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    if (container.scrollTop <= 40) {
      void handleLoadMore();
    }
  };

  const handleTts = async (messageId: number) => {
    if (!token) {
      setError("未找到登录信息，请重新登录。");
      return;
    }
    if (isDemoToken(token)) {
      setError("演示账号暂不支持语音播放。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 使用 <audio> 的 GET 请求触发后端流式播放（依赖 Cookie 鉴权）。
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const audioUrl = `${baseUrl}/tts/request/${messageId}`;
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "use-credentials";
      audio.onplay = () => setLoading(false);
      audio.onended = () => setLoading(false);
      audio.onerror = () => {
        setLoading(false);
        setError("语音播放失败");
      };
      await audio.play();
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        handleAuthExpired(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : "语音播放失败");
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    router.replace(`/chat/${conversationId}`);
  };

  return (
    <div className="grid h-full grid-cols-[280px_1fr] overflow-hidden">
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

      <main className="flex h-full flex-col">
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

        <section
          className="flex-1 overflow-auto px-6 py-6"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          {isLoadingMore && (
            <div className="mb-4 text-center text-xs text-slate-500">
              正在加载更多消息...
            </div>
          )}
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
                      ? "bg-white"
                      : "ml-auto bg-slate-900 text-white"
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
                  <div
                    className={`mt-2 text-sm ${
                      isAssistant ? "text-slate-800" : "text-slate-100"
                    }`}
                  >
                    {isAssistant ? <XMarkdown>{message.content}</XMarkdown> : message.content}
                  </div>
                  {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-3 text-xs text-slate-400">
                      {message.attachments.map((item) => {
                        const isImage = item.mime_type.startsWith("image/");
                        const isVideo = item.mime_type.startsWith("video/");
                        const isAudio = item.mime_type.startsWith("audio/");

                        return (
                          <div
                            className={`rounded-lg border px-3 py-2 ${
                              isAssistant
                                ? "border-white/20"
                                : "border-slate-200"
                            }`}
                            key={item.attachment_id}
                          >
                            {isImage && (
                              <img
                                alt="附件图片"
                                className="max-h-64 w-auto rounded-md"
                                src={item.url_or_path}
                              />
                            )}
                            {isVideo && (
                              <video
                                className="max-h-64 w-full rounded-md"
                                controls
                                src={item.url_or_path}
                              />
                            )}
                            {isAudio && (
                              <audio className="w-full" controls src={item.url_or_path} />
                            )}
                            {!isImage && !isVideo && !isAudio && (
                              <a
                                className={`text-xs underline ${
                                  isAssistant ? "text-slate-700" : "text-slate-100"
                                }`}
                                href={item.url_or_path}
                                rel="noreferrer"
                                target="_blank"
                              >
                                下载附件：{item.mime_type}
                              </a>
                            )}
                          </div>
                        );
                      })}
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
              <button
                className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isMicSupported}
                onClick={handleMicToggle}
                type="button"
              >
                {isRecording ? "停止录音" : "语音识别"}
              </button>
              <span>已选附件：{attachmentIds.length}</span>
            </div>
            {uploadedAttachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {uploadedAttachments.map((item) => {
                  const isImage = item.mime_type.startsWith("image/");
                  return (
                    <div
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
                      key={item.attachment_id}
                    >
                      {isImage && (
                        <img
                          alt="附件预览"
                          className="h-6 w-6 rounded object-cover"
                          src={item.url_or_path}
                        />
                      )}
                      <span>
                        {item.attachment_type} | {item.mime_type}
                      </span>
                      <button
                        className="rounded-full border border-slate-200 px-2 py-0.5 text-xs"
                        onClick={() => {
                          setUploadedAttachments((prev) =>
                            prev.filter(
                              (attachment) =>
                                attachment.attachment_id !== item.attachment_id
                            )
                          );
                          setAttachmentIds((prev) =>
                            prev.filter((id) => id !== item.attachment_id)
                          );
                        }}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
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

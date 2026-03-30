import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ApiRole = "user" | "assistant";
type ChatMode = "proxy" | "browser" | "ollama";

interface ChatMessage {
  id: string;
  role: ApiRole;
  content: string;
  localOnly?: boolean;
}

interface CarAIChatWidgetProps {
  comparisonContext: string;
}

const PROXY_API_URL =
  import.meta.env.VITE_CARAI_CHAT_API_URL ??
  import.meta.env.VITE_GROK_CHAT_API_URL ??
  "/api/carai-chat";
const BROWSER_XAI_API_URL =
  import.meta.env.VITE_XAI_BROWSER_API_URL ?? "https://api.x.ai/v1/chat/completions";
const DEFAULT_XAI_MODEL = import.meta.env.VITE_XAI_MODEL ?? "grok-3-mini";

const DEFAULT_OLLAMA_CHAT_API_URL =
  import.meta.env.VITE_OLLAMA_CHAT_API_URL ?? "http://localhost:11434/v1/chat/completions";
const DEFAULT_OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL ?? "llama3.2:1b";

const STORAGE_MODE_KEY = "carculator_carai_chat_mode";
const STORAGE_BROWSER_API_KEY = "carculator_carai_browser_api_key";
const STORAGE_BROWSER_MODEL = "carculator_carai_browser_model";
const STORAGE_OLLAMA_API_URL = "carculator_ollama_chat_api_url";
const STORAGE_OLLAMA_MODEL = "carculator_ollama_model";
const STORAGE_CHAT_MESSAGES = "carculator_ai_chat_messages";
const STORAGE_CHAT_DRAFT = "carculator_ai_chat_draft";
const MAX_STORED_MESSAGES = 80;
const LEGACY_STORAGE_MODE_KEY = "carculator_grok_chat_mode";
const LEGACY_STORAGE_BROWSER_API_KEY = "carculator_grok_browser_api_key";
const LEGACY_STORAGE_BROWSER_MODEL = "carculator_grok_browser_model";

const INITIAL_ASSISTANT_MESSAGE =
  "Ask me anything about your current car comparison. I can explain trade-offs, risks, and where each option wins.";

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function bubbleClasses(role: ApiRole): string {
  if (role === "user") {
    return "ml-auto bg-foreground text-background";
  }
  return "mr-auto bg-secondary text-foreground";
}

function buildSystemPrompt(comparisonContext: string): string {
  const basePrompt = [
    "You are CarAI, an assistant that helps users compare car ownership costs.",
    "Be concise, practical, and transparent about uncertainty.",
    "Use the provided comparison context as the source of truth for numeric values.",
    "If data is missing, ask a short follow-up question instead of inventing numbers.",
  ].join(" ");

  if (!comparisonContext || !comparisonContext.trim()) {
    return `${basePrompt} No cars are configured yet, so provide general guidance until data is available.`;
  }

  return `${basePrompt}\n\nCurrent comparison context:\n${comparisonContext.trim()}`;
}

function normalizeAssistantContent(content: unknown): string {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    const textParts = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const text = (item as { text?: unknown }).text;
          const nested = (item as { content?: unknown }).content;
          if (typeof text === "string") return text;
          if (typeof nested === "string") return nested;
        }
        return "";
      })
      .filter(Boolean);

    return textParts.join("\n").trim();
  }

  return "";
}

function readStoredValue(key: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function readStoredValueWithLegacy(primaryKey: string, legacyKey: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  const primaryValue = window.localStorage.getItem(primaryKey);
  if (primaryValue !== null) return primaryValue;
  const legacyValue = window.localStorage.getItem(legacyKey);
  return legacyValue ?? fallback;
}

function readStoredMode(): ChatMode {
  const mode = readStoredValueWithLegacy(STORAGE_MODE_KEY, LEGACY_STORAGE_MODE_KEY, "ollama");
  if (mode === "browser" || mode === "proxy" || mode === "ollama") {
    return mode;
  }
  return "ollama";
}

function getDefaultMessages(): ChatMessage[] {
  return [
    {
      id: createMessageId(),
      role: "assistant",
      content: INITIAL_ASSISTANT_MESSAGE,
      localOnly: true,
    },
  ];
}

function readStoredMessages(): ChatMessage[] {
  const raw = readStoredValue(STORAGE_CHAT_MESSAGES);
  if (!raw) return getDefaultMessages();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultMessages();

    const sanitized = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const maybeRole = (item as { role?: unknown }).role;
        const role: ApiRole = maybeRole === "assistant" ? "assistant" : "user";
        const content = (item as { content?: unknown }).content;
        const id = (item as { id?: unknown }).id;
        const localOnly = (item as { localOnly?: unknown }).localOnly === true;

        if (typeof content !== "string" || !content.trim()) return null;

        return {
          id: typeof id === "string" && id.trim() ? id : createMessageId(),
          role,
          content,
          localOnly,
        } satisfies ChatMessage;
      })
      .filter((item): item is ChatMessage => item !== null);

    return sanitized.length > 0 ? sanitized.slice(-MAX_STORED_MESSAGES) : getDefaultMessages();
  } catch {
    return getDefaultMessages();
  }
}

async function sendViaOpenAiCompatibleApi(args: {
  url: string;
  model: string;
  comparisonContext: string;
  message: string;
  history: Array<{ role: ApiRole; content: string }>;
  apiKey?: string;
}): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (args.apiKey) {
    headers.Authorization = `Bearer ${args.apiKey}`;
  }

  const response = await fetch(args.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: args.model,
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(args.comparisonContext),
        },
        ...args.history,
        {
          role: "user",
          content: args.message,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const upstreamError = data?.error?.message || data?.message || "Failed to get a response from model API.";
    throw new Error(upstreamError);
  }

  const reply = normalizeAssistantContent(data?.choices?.[0]?.message?.content);
  if (!reply) {
    throw new Error("Model returned an empty response.");
  }

  return reply;
}

export function CarAIChatWidget({ comparisonContext }: CarAIChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(readStoredMode);

  const [browserApiKey, setBrowserApiKey] = useState(() =>
    readStoredValueWithLegacy(STORAGE_BROWSER_API_KEY, LEGACY_STORAGE_BROWSER_API_KEY),
  );
  const [browserModel, setBrowserModel] = useState(() =>
    readStoredValueWithLegacy(STORAGE_BROWSER_MODEL, LEGACY_STORAGE_BROWSER_MODEL, DEFAULT_XAI_MODEL),
  );

  const [ollamaApiUrl, setOllamaApiUrl] = useState(() =>
    readStoredValue(STORAGE_OLLAMA_API_URL, DEFAULT_OLLAMA_CHAT_API_URL),
  );
  const [ollamaModel, setOllamaModel] = useState(() =>
    readStoredValue(STORAGE_OLLAMA_MODEL, DEFAULT_OLLAMA_MODEL),
  );

  const [input, setInput] = useState(() => readStoredValue(STORAGE_CHAT_DRAFT));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages());

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const hasConfiguredCars = useMemo(
    () => !comparisonContext.startsWith("No cars are configured yet."),
    [comparisonContext],
  );
  const activeModelLabel = useMemo(() => {
    if (chatMode === "ollama") {
      return ollamaModel.trim() || DEFAULT_OLLAMA_MODEL;
    }
    if (chatMode === "browser") {
      return browserModel.trim() || DEFAULT_XAI_MODEL;
    }
    return "server-configured";
  }, [chatMode, ollamaModel, browserModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_MODE_KEY, chatMode);
  }, [chatMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_BROWSER_MODEL, browserModel);
  }, [browserModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_BROWSER_API_KEY, browserApiKey);
  }, [browserApiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_OLLAMA_API_URL, ollamaApiUrl);
  }, [ollamaApiUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_OLLAMA_MODEL, ollamaModel);
  }, [ollamaModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_CHAT_DRAFT, input);
  }, [input]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_CHAT_MESSAGES,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
    );
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  const sendViaProxy = async (
    message: string,
    history: Array<{ role: ApiRole; content: string }>,
  ): Promise<string> => {
    const response = await fetch(PROXY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
        comparisonContext,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || "Failed to get a response from proxy API.");
    }

    const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
    if (!reply) {
      throw new Error("Proxy returned an empty response.");
    }

    return reply;
  };

  const sendViaBrowserApi = async (
    message: string,
    history: Array<{ role: ApiRole; content: string }>,
  ): Promise<string> => {
    const trimmedKey = browserApiKey.trim();
    if (!trimmedKey) {
      throw new Error("Add an API key in Chat settings to use browser key test mode.");
    }

    return sendViaOpenAiCompatibleApi({
      url: BROWSER_XAI_API_URL,
      model: browserModel.trim() || DEFAULT_XAI_MODEL,
      comparisonContext,
      message,
      history,
      apiKey: trimmedKey,
    });
  };

  const sendViaOllama = async (
    message: string,
    history: Array<{ role: ApiRole; content: string }>,
  ): Promise<string> => {
    const url = ollamaApiUrl.trim() || DEFAULT_OLLAMA_CHAT_API_URL;
    const model = ollamaModel.trim() || DEFAULT_OLLAMA_MODEL;

    try {
      return await sendViaOpenAiCompatibleApi({
        url,
        model,
        comparisonContext,
        message,
        history,
      });
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        throw new Error(
          "Could not reach Ollama. Make sure Ollama is running and URL is http://localhost:11434/v1/chat/completions",
        );
      }
      throw requestError;
    }
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    setError(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };

    const history = messages
      .filter((msg) => !msg.localOnly)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      let reply = "";

      if (chatMode === "proxy") {
        reply = await sendViaProxy(message, history);
      } else if (chatMode === "browser") {
        reply = await sendViaBrowserApi(message, history);
      } else {
        reply = await sendViaOllama(message, history);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Something went wrong while contacting the model.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages(getDefaultMessages());
    setInput("");
    setError(null);
  };

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[24rem] h-[37rem] rounded-2xl border border-border/70 bg-card shadow-2xl flex flex-col overflow-hidden">
          <header className="px-4 py-3 border-b border-border/60 bg-secondary/20 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">CarAI</h2>
              <p className="text-[11px] text-muted-foreground">
                {hasConfiguredCars ? "Using your current comparison data" : "General mode until cars are configured"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              aria-label="Close AI chat"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="border-b border-border/50 px-3 py-2 bg-background/70">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Chat settings
              </span>
              <span>{settingsOpen ? "Hide" : "Show"}</span>
            </button>

            {settingsOpen && (
              <div className="mt-2 space-y-2.5">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">Connection mode</p>
                  <select
                    value={chatMode}
                    onChange={(event) => setChatMode(event.target.value as ChatMode)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="ollama">Ollama local (no key)</option>
                    <option value="proxy">Secure proxy (recommended for production)</option>
                    <option value="browser">Browser key test mode (xAI)</option>
                  </select>
                </div>

                {chatMode === "ollama" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">Ollama URL</p>
                      <Input
                        type="text"
                        value={ollamaApiUrl}
                        onChange={(event) => setOllamaApiUrl(event.target.value)}
                        placeholder={DEFAULT_OLLAMA_CHAT_API_URL}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">Ollama model</p>
                      <Input
                        type="text"
                        value={ollamaModel}
                        onChange={(event) => setOllamaModel(event.target.value)}
                        placeholder={DEFAULT_OLLAMA_MODEL}
                        className="h-9 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Example model: llama3.2:1b. Make sure Ollama is running locally.
                    </p>
                  </>
                )}

                {chatMode === "browser" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">xAI API key (testing only)</p>
                      <Input
                        type="password"
                        value={browserApiKey}
                        onChange={(event) => setBrowserApiKey(event.target.value)}
                        placeholder="xai-..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">xAI model</p>
                      <Input
                        type="text"
                        value={browserModel}
                        onChange={(event) => setBrowserModel(event.target.value)}
                        placeholder={DEFAULT_XAI_MODEL}
                        className="h-9 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-amber-600">
                      Browser key mode stores your key in local storage and exposes it to browser tools.
                      Use only for temporary testing.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div ref={messagesRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${bubbleClasses(message.role)}`}
              >
                {message.content}
              </div>
            ))}
            {isSending && (
              <div className="mr-auto bg-secondary text-foreground rounded-2xl px-3 py-2 text-sm">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-border/60 p-3 space-y-2">
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about monthly costs, financing trade-offs, or hidden risks..."
              className="min-h-[78px] resize-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-muted-foreground">
                Mode: {chatMode === "ollama" ? "Ollama local" : chatMode === "browser" ? "Browser key" : "Secure proxy"} | Model: {activeModelLabel}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  disabled={isSending}
                  className="text-xs"
                >
                  Clear chat
                </Button>
                <Button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isSending || input.trim().length === 0}
                  className="gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-4 sm:right-6 z-40 rounded-full px-4 py-3 bg-foreground text-background shadow-xl hover:opacity-90 transition-opacity flex items-center gap-2"
        aria-label={open ? "Close AI chat" : "Open AI chat"}
      >
        {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        <span className="text-xs font-semibold tracking-wide uppercase">AI Chat</span>
      </button>
    </>
  );
}

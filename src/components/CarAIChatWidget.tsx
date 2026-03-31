import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Language, useI18n } from "@/lib/i18n";

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

function getInitialAssistantMessage(language: Language): string {
  return language === "sv"
    ? "Fråga mig vad du vill om din nuvarande biljämförelse. Jag kan förklara avvägningar, risker och när varje alternativ är bäst."
    : "Ask me anything about your current car comparison. I can explain tradeoffs, risks, and when each option makes the most sense.";
}

function getNoCarsConfiguredPrefix(language: Language): string {
  return language === "sv" ? "Inga bilar är konfigurerade ännu." : "No cars are configured yet.";
}

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

function buildSystemPrompt(comparisonContext: string, language: Language): string {
  const isSwedish = language === "sv";
  const basePrompt = [
    isSwedish
      ? "Du är CarAI, en assistent som hjälper användare att jämföra kostnader för bilägande."
      : "You are CarAI, an assistant that helps users compare car ownership costs.",
    isSwedish
      ? "Var kortfattad, praktisk och tydlig med osäkerhet."
      : "Be concise, practical, and transparent about uncertainty.",
    isSwedish
      ? "Använd jämförelsekontexten som enda källa för numeriska värden."
      : "Use the comparison context as the only source of numeric values.",
    isSwedish
      ? "Om data saknas ska du ställa en kort följdfråga i stället för att hitta på siffror."
      : "If data is missing, ask a short follow-up question instead of inventing numbers.",
  ].join(" ");

  if (!comparisonContext || !comparisonContext.trim()) {
    return isSwedish
      ? `${basePrompt} Inga bilar är konfigurerade ännu, så ge generell vägledning tills data finns.`
      : `${basePrompt} No cars are configured yet, so provide general guidance until data is available.`;
  }

  return `${basePrompt}\n\n${isSwedish ? "Aktuell jämförelsekontext" : "Current comparison context"}:\n${comparisonContext.trim()}`;
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

function getDefaultMessages(language: Language): ChatMessage[] {
  return [
    {
      id: createMessageId(),
      role: "assistant",
      content: getInitialAssistantMessage(language),
      localOnly: true,
    },
  ];
}

function readStoredMessages(language: Language): ChatMessage[] {
  const raw = readStoredValue(STORAGE_CHAT_MESSAGES);
  if (!raw) return getDefaultMessages(language);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultMessages(language);

    const sanitized: ChatMessage[] = [];

    parsed.forEach((item) => {
      if (!item || typeof item !== "object") return;

      const maybeRole = (item as { role?: unknown }).role;
      const role: ApiRole = maybeRole === "assistant" ? "assistant" : "user";
      const content = (item as { content?: unknown }).content;
      const id = (item as { id?: unknown }).id;
      const localOnly = (item as { localOnly?: unknown }).localOnly === true;

      if (typeof content !== "string" || !content.trim()) return;

      sanitized.push({
        id: typeof id === "string" && id.trim() ? id : createMessageId(),
        role,
        content,
        localOnly,
      });
    });

    return sanitized.length > 0 ? sanitized.slice(-MAX_STORED_MESSAGES) : getDefaultMessages(language);
  } catch {
    return getDefaultMessages(language);
  }
}

async function sendViaOpenAiCompatibleApi(args: {
  url: string;
  model: string;
  comparisonContext: string;
  language: Language;
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
          content: buildSystemPrompt(args.comparisonContext, args.language),
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
    const upstreamError =
      data?.error?.message ||
      data?.message ||
      (args.language === "sv"
        ? "Kunde inte hämta svar från modell-API."
        : "Could not fetch a response from the model API.");
    throw new Error(upstreamError);
  }

  const reply = normalizeAssistantContent(data?.choices?.[0]?.message?.content);
  if (!reply) {
    throw new Error(
      args.language === "sv"
        ? "Modellen returnerade ett tomt svar."
        : "The model returned an empty response.",
    );
  }

  return reply;
}

export function CarAIChatWidget({ comparisonContext }: CarAIChatWidgetProps) {
  const { language, t } = useI18n();
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages(language));

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const hasConfiguredCars = useMemo(
    () => !comparisonContext.startsWith(getNoCarsConfiguredPrefix(language)),
    [comparisonContext, language],
  );

  const activeModelLabel = useMemo(() => {
    if (chatMode === "ollama") {
      return ollamaModel.trim() || DEFAULT_OLLAMA_MODEL;
    }
    if (chatMode === "browser") {
      return browserModel.trim() || DEFAULT_XAI_MODEL;
    }
    return t({ en: "server-configured", sv: "serverkonfigurerad" });
  }, [browserModel, chatMode, ollamaModel, t]);

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
    setMessages((previousMessages) => {
      if (
        previousMessages.length === 1 &&
        previousMessages[0]?.localOnly &&
        previousMessages[0].role === "assistant"
      ) {
        return [{ ...previousMessages[0], content: getInitialAssistantMessage(language) }];
      }

      return previousMessages;
    });
  }, [language]);

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
      throw new Error(
        data?.error ||
          t({
            en: "Could not fetch a response from the proxy API.",
            sv: "Kunde inte hämta svar från proxy-API.",
          }),
      );
    }

    const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
    if (!reply) {
      throw new Error(
        t({
          en: "The proxy returned an empty response.",
          sv: "Proxy returnerade ett tomt svar.",
        }),
      );
    }

    return reply;
  };

  const sendViaBrowserApi = async (
    message: string,
    history: Array<{ role: ApiRole; content: string }>,
  ): Promise<string> => {
    const trimmedKey = browserApiKey.trim();
    if (!trimmedKey) {
      throw new Error(
        t({
          en: "Add an API key in chat settings to use browser-key test mode.",
          sv: "Lägg till en API-nyckel i chattinställningarna för att använda testläget med webbläsarnyckel.",
        }),
      );
    }

    return sendViaOpenAiCompatibleApi({
      url: BROWSER_XAI_API_URL,
      model: browserModel.trim() || DEFAULT_XAI_MODEL,
      comparisonContext,
      language,
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
        language,
        message,
        history,
      });
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        throw new Error(
          t({
            en: "Could not reach Ollama. Make sure Ollama is running and the URL is http://localhost:11434/v1/chat/completions",
            sv: "Kunde inte nå Ollama. Kontrollera att Ollama körs och att URL är http://localhost:11434/v1/chat/completions",
          }),
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

    setMessages((previousMessages) => [...previousMessages, userMessage]);
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

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: createMessageId(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (sendError) {
      const nextError =
        sendError instanceof Error
          ? sendError.message
          : t({
            en: "Something went wrong while contacting the model.",
            sv: "Något gick fel vid kontakt med modellen.",
          });
      setError(nextError);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages(getDefaultMessages(language));
    setInput("");
    setError(null);
  };

  return (
    <>
      {open && (
        <section className="fixed inset-x-0 bottom-0 z-40 h-[100dvh] w-screen border border-border/70 border-b-0 border-x-0 bg-card shadow-2xl flex flex-col overflow-hidden rounded-t-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[37rem] sm:w-[24rem] sm:rounded-2xl sm:border sm:border-border/70">
          <header className="px-4 py-3 border-b border-border/60 bg-secondary/20 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">CarAI</h2>
              <p className="text-[11px] text-muted-foreground">
                {hasConfiguredCars
                  ? t({
                    en: "Using your current comparison data",
                    sv: "Använder din aktuella jämförelsedata",
                  })
                  : t({
                    en: "General mode until cars are configured",
                    sv: "Generellt läge tills bilar är konfigurerade",
                  })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              aria-label={t({ en: "Close AI chat", sv: "Stäng AI-chatten" })}
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="border-b border-border/50 px-3 py-2 bg-background/70">
            <button
              type="button"
              onClick={() => setSettingsOpen((previousState) => !previousState)}
              className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                {t({ en: "Chat settings", sv: "Chattinställningar" })}
              </span>
              <span>{settingsOpen ? t({ en: "Hide", sv: "Dölj" }) : t({ en: "Show", sv: "Visa" })}</span>
            </button>

            {settingsOpen && (
              <div className="mt-2 space-y-2.5">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t({ en: "Connection mode", sv: "Anslutningsläge" })}
                  </p>
                  <select
                    value={chatMode}
                    onChange={(event) => setChatMode(event.target.value as ChatMode)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="ollama">{t({ en: "Local Ollama (no key)", sv: "Ollama lokalt (ingen nyckel)" })}</option>
                    <option value="proxy">{t({ en: "Secure proxy (recommended in production)", sv: "Säker proxy (rekommenderas i produktion)" })}</option>
                    <option value="browser">{t({ en: "Browser-key test mode (xAI)", sv: "Testläge med webbläsarnyckel (xAI)" })}</option>
                  </select>
                </div>

                {chatMode === "ollama" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t({ en: "Ollama URL", sv: "Ollama-URL" })}
                      </p>
                      <Input
                        type="text"
                        value={ollamaApiUrl}
                        onChange={(event) => setOllamaApiUrl(event.target.value)}
                        placeholder={DEFAULT_OLLAMA_CHAT_API_URL}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t({ en: "Ollama model", sv: "Ollama-modell" })}
                      </p>
                      <Input
                        type="text"
                        value={ollamaModel}
                        onChange={(event) => setOllamaModel(event.target.value)}
                        placeholder={DEFAULT_OLLAMA_MODEL}
                        className="h-9 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {t({
                        en: "Example model: llama3.2:1b. Make sure Ollama is running locally.",
                        sv: "Exempelmodell: llama3.2:1b. Kontrollera att Ollama körs lokalt.",
                      })}
                    </p>
                  </>
                )}

                {chatMode === "browser" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t({ en: "xAI API key (test only)", sv: "xAI API-nyckel (endast test)" })}
                      </p>
                      <Input
                        type="password"
                        value={browserApiKey}
                        onChange={(event) => setBrowserApiKey(event.target.value)}
                        placeholder="xai-..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {t({ en: "xAI model", sv: "xAI-modell" })}
                      </p>
                      <Input
                        type="text"
                        value={browserModel}
                        onChange={(event) => setBrowserModel(event.target.value)}
                        placeholder={DEFAULT_XAI_MODEL}
                        className="h-9 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-amber-600">
                      {t({
                        en: "Browser-key mode stores the key in local storage and exposes it to browser tooling. Use it only for temporary testing.",
                        sv: "Läget med webbläsarnyckel sparar nyckeln i lokal lagring och exponerar den för webbläsarverktyg. Använd endast för tillfällig testning.",
                      })}
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
                className={`max-w-[92%] sm:max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${bubbleClasses(message.role)}`}
              >
                {message.content}
              </div>
            ))}
            {isSending && (
              <div className="mr-auto bg-secondary text-foreground rounded-2xl px-3 py-2 text-sm">
                {t({ en: "Thinking...", sv: "Tänker..." })}
              </div>
            )}
          </div>

          <div className="border-t border-border/60 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2 bg-background/95">
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t({
                en: "Ask about monthly costs, financing tradeoffs, or hidden risks...",
                sv: "Fråga om månadskostnader, finansieringsavvägningar eller dolda risker...",
              })}
              className="min-h-[96px] sm:min-h-[78px] resize-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-muted-foreground">
                {t({ en: "Mode", sv: "Läge" })}: {chatMode === "ollama"
                  ? t({ en: "Local Ollama", sv: "Ollama lokalt" })
                  : chatMode === "browser"
                    ? t({ en: "Browser key", sv: "Webbläsarnyckel" })
                    : t({ en: "Secure proxy", sv: "Säker proxy" })} | {t({ en: "Model", sv: "Modell" })}: {activeModelLabel}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  disabled={isSending}
                  className="min-h-11 flex-1 text-xs sm:min-h-0 sm:flex-none"
                >
                  {t({ en: "Clear chat", sv: "Rensa chatt" })}
                </Button>
                <Button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isSending || input.trim().length === 0}
                  className="min-h-11 flex-1 gap-2 sm:min-h-0 sm:flex-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  {t({ en: "Send", sv: "Skicka" })}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((previousState) => !previousState)}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:right-6 z-40 rounded-full px-4 py-3 bg-foreground text-background shadow-xl hover:opacity-90 transition-opacity flex items-center gap-2"
        aria-label={open
          ? t({ en: "Close AI chat", sv: "Stäng AI-chatten" })
          : t({ en: "Open AI chat", sv: "Öppna AI-chatten" })}
      >
        {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        <span className="text-xs font-semibold tracking-wide uppercase">
          {t({ en: "AI chat", sv: "AI-chatt" })}
        </span>
      </button>
    </>
  );
}

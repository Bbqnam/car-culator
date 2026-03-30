import http from "node:http";

const PORT = Number(process.env.CARAI_PROXY_PORT ?? process.env.GROK_PROXY_PORT ?? 8787);
const XAI_API_URL = process.env.XAI_API_URL ?? "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL ?? "grok-3-mini";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_REQUEST_SIZE_BYTES = 1_000_000;
const MAX_HISTORY_MESSAGES = 10;

function setJsonHeaders(res) {
  const allowOrigin = process.env.CARAI_ALLOWED_ORIGIN ?? process.env.GROK_ALLOWED_ORIGIN ?? "*";
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function sendJson(res, statusCode, payload) {
  setJsonHeaders(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function buildSystemPrompt(comparisonContext) {
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

function normalizeAssistantContent(content) {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    const textParts = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if (typeof item.text === "string") return item.text;
          if (typeof item.content === "string") return item.content;
        }
        return "";
      })
      .filter(Boolean);
    return textParts.join("\n").trim();
  }

  return "";
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = typeof item?.content === "string" ? item.content.trim() : "";
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_SIZE_BYTES) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", (error) => reject(error));
  });
}

async function handleChat(req, res) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error: "Missing XAI_API_KEY on server.",
    });
    return;
  }

  let parsed;
  try {
    const body = await readBody(req);
    parsed = JSON.parse(body || "{}");
  } catch {
    sendJson(res, 400, { error: "Invalid JSON payload." });
    return;
  }

  const message = typeof parsed?.message === "string" ? parsed.message.trim() : "";
  const comparisonContext =
    typeof parsed?.comparisonContext === "string" ? parsed.comparisonContext : "";

  if (!message) {
    sendJson(res, 400, { error: "`message` is required." });
    return;
  }

  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(comparisonContext),
    },
    ...sanitizeHistory(parsed?.history),
    {
      role: "user",
      content: message,
    },
  ];

  try {
    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        temperature: 0.4,
        max_tokens: 700,
        messages,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const upstreamError =
        data?.error?.message || data?.message || "CarAI request failed at upstream API.";
      sendJson(res, response.status, { error: upstreamError });
      return;
    }

    const reply = normalizeAssistantContent(data?.choices?.[0]?.message?.content);

    if (!reply) {
      sendJson(res, 502, { error: "CarAI provider returned an empty response." });
      return;
    }

    sendJson(res, 200, {
      reply,
      model: data?.model || XAI_MODEL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach CarAI provider API.";
    sendJson(res, 502, { error: message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    setJsonHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  const requestPath = new URL(req.url || "/", `http://${req.headers.host}`).pathname;

  const isSupportedPath = requestPath === "/api/carai-chat" || requestPath === "/api/grok-chat";
  if (!isSupportedPath) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  await handleChat(req, res);
});

server.listen(PORT, () => {
  console.log(`CarAI proxy listening on http://localhost:${PORT}`);
});

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { X, Lightbulb, Shield, TrendingUp, Menu } from "lucide-react";

import { ChatMessage, CropReport } from "@/lib/types";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { ReportCard } from "@/components/chat/ReportCard";
import { getReportById, getReports } from "@/lib/api";

/**
 * Dummy IP for now (replace with your AWS/Render public URL later)
 * Set in Vercel/Env:
 *   VITE_EXPERT_CHAT_API_URL=http://<ip>:8080
 */
const EXPERT_CHAT_API_URL =
  (import.meta as any).env?.VITE_EXPERT_CHAT_API_URL?.trim() ||
  "http://13.233.99.99:8080"; // dummy

const EXPERT_CHAT_ENDPOINT = `${EXPERT_CHAT_API_URL.replace(/\/$/, "")}/get`;

// Keep context/history compact
function clampText(input: string, max = 4500) {
  const s = String(input || "");
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function buildReportContext(r: CropReport) {
  // Build a clean, LLM-friendly context string from report
  const lines: string[] = [];

  lines.push("=== SELECTED REPORT CONTEXT ===");
  lines.push(`Report ID: ${r.id}`);
  lines.push(`Crop: ${r.crop}${r.variety ? ` | Variety/Seed: ${r.variety}` : ""}`);
  lines.push(`Location: ${r.city}, ${r.state}`);
  lines.push(`Season: ${r.season}`);
  lines.push(`Sowing Date: ${r.sowingDate}`);
  lines.push(`Status: ${r.status}`);

  if (r.seasonRisk) {
    lines.push(
      `Overall Risk: ${r.seasonRisk.score}/100 (${String(r.seasonRisk.level).toUpperCase()})`
    );
  }

  if (Array.isArray(r.stageRisks) && r.stageRisks.length) {
    lines.push("");
    lines.push("Stage-wise Risk (top):");
    r.stageRisks
      .slice(0, 6)
      .forEach((s, i) =>
        lines.push(
          `${i + 1}. ${s.stage} — ${s.riskScore}/100 (${String(s.riskLevel).toUpperCase()})`
        )
      );
  }

  lines.push("=== END REPORT CONTEXT ===");
  return clampText(lines.join("\n"), 4500);
}

async function callExpertChat(args: {
  msg: string;
  context?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const res = await fetch(EXPERT_CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // backend can ignore extra fields if not implemented yet
    body: JSON.stringify({
      msg: args.msg,
      context: args.context || "",
      history: args.history || [],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expert API failed (${res.status}): ${text || "No details"}`);
  }

  const data = await res.json();
  const answer = data?.answer ?? data?.response ?? data?.text ?? "";
  return String(answer || "").trim();
}

export default function ChatExpert() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportId = searchParams.get("rid");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reports, setReportsState] = useState<CropReport[]>([]);
  const [contextReport, setContextReport] = useState<CropReport | null>(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting + load reports + load optional context report
  useEffect(() => {
    const greeting: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: reportId
        ? "I’ve loaded your crop report as context. Ask me anything about risk management, irrigation planning, pest control, or insurance based on your report."
        : "Hello! I’m your agricultural expert. I can help with crop planning, irrigation, pest management, and crop insurance. How can I help you today?",
      timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);

    (async () => {
      try {
        const data = await getReports();
        setReportsState(data);
      } catch {
        // keep silent; UI will just show empty
      }
    })();
  }, []);

  // Load/refresh context report whenever rid changes
  useEffect(() => {
    if (!reportId) {
      setContextReport(null);
      return;
    }
    (async () => {
      try {
        const r = await getReportById(reportId);
        setContextReport(r);
      } catch {
        toast.error("Could not load selected report context");
        setContextReport(null);
      }
    })();
  }, [reportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const suggestedPrompts = useMemo(
    () => [
      { icon: Lightbulb, text: "What crops are best for my region and season?" },
      { icon: TrendingUp, text: "How can I improve yield and reduce risk this season?" },
      { icon: Shield, text: "Which insurance scheme should I choose for my crop?" },
    ],
    []
  );

  const selectContextReport = async (id: string) => {
    // Keep chat, just change context via query param
    setSearchParams({ rid: id });
  };

  const clearContext = () => {
    setSearchParams({});
    setContextReport(null);
  };

  const buildHistoryForApi = (allMessages: ChatMessage[]) => {
    // Keep last 10 turns (excluding welcome), and keep only user/assistant roles.
    const usable = allMessages
      .filter((m) => m.id !== "welcome")
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: clampText(m.content, 1200),
      }));

    return usable;
  };

  const handleSend = async (content: string) => {
    const text = String(content || "").trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    // optimistic append
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const ctx = contextReport ? buildReportContext(contextReport) : "";
      const history = buildHistoryForApi([...messages, userMessage]);

      const answerText = await callExpertChat({
        msg: text,
        context: ctx,
        history,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answerText || "I couldn’t generate a response. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry — I couldn’t reach the expert service right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const SidebarContent = () => (
    <>
      <h3 className="font-semibold text-sm text-muted-foreground mb-4">{t("reports")}</h3>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("no_reports")}
          <br />
          <span className="text-xs">{t("create_first")}</span>
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDiscuss={selectContextReport}
              compact
            />
          ))}
        </div>
      )}

      {!contextReport && messages.length === 1 && (
        <div className="mt-8 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Quick Actions</h3>
          {suggestedPrompts.map((prompt, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-auto py-3 text-left"
              onClick={() => handleSend(prompt.text)}
              disabled={loading}
            >
              <prompt.icon className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs">{prompt.text}</span>
            </Button>
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-muted-foreground">
        <div className="font-medium mb-1">Expert API</div>
        <div className="break-all">{EXPERT_CHAT_ENDPOINT}</div>
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-80 border-r border-border bg-sidebar p-4 overflow-y-auto chat-scroll">
        <SidebarContent />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full">
        {/* Mobile Menu Button + Context Bar */}
        <div className="border-b border-border">
          <div className="flex items-center gap-2 p-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-4 overflow-y-auto">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {contextReport && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    Context
                  </Badge>
                  <div className="text-xs truncate">
                    <span className="font-medium">{contextReport.crop}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      • {contextReport.city}, {contextReport.state}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={clearContext}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Context Bar */}
          {contextReport && (
            <div className="hidden md:block bg-muted/30 px-6 py-3">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant="outline" className="flex-shrink-0">
                    Context
                  </Badge>
                  <div className="text-sm truncate">
                    <span className="font-medium">{contextReport.crop}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      • {contextReport.city}, {contextReport.state}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={clearContext} disabled={loading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <Composer onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}


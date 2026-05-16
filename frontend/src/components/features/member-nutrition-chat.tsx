"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Dumbbell, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_CHIPS = [
  "Ăn gì trước khi tập?",
  "Calo cần nạp mỗi ngày?",
  "Protein cho người tập gym?",
  "Giảm mỡ nên ăn gì?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-[var(--primary-pink)] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

export function MemberNutritionChat() {
  const { authorizedRequest } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý dinh dưỡng MYFIT 🏋️. Tôi có thể tư vấn về chế độ ăn, calo, protein và dinh dưỡng quanh buổi tập. Bạn muốn hỏi gì?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setIsTyping(true);

      try {
        const history = nextMessages.slice(1, -1).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await authorizedRequest<{ reply: string }>(
          "/api/v1/me/nutrition-chat",
          {
            method: "POST",
            body: JSON.stringify({ message: trimmed, history }),
          }
        );

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.data.reply },
        ]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Không thể kết nối AI";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${msg}` },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping, authorizedRequest]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở chatbot dinh dưỡng"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_4px_20px_rgba(255,107,157,0.5)] transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
        }}
      >
        {open ? (
          <ChevronDown className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(255,107,157,0.25)]"
          style={{ height: "520px", maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center gap-3 px-5 py-4"
            style={{
              background: "linear-gradient(135deg, var(--primary-pink) 0%, var(--deep-pink) 100%)",
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Trợ lý dinh dưỡng</p>
              <p className="text-[11px] text-white/80 truncate">MYFIT · Powered by Llama 3.1</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/35"
              aria-label="Đóng chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ background: "var(--pastel-pink)" }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-white text-[var(--charcoal)] rounded-bl-sm shadow-sm"
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          background:
                            "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
                        }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick chips (only show when just 1 message = greeting) */}
          {messages.length === 1 && (
            <div
              className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none"
              style={{ background: "var(--pastel-pink)" }}
            >
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void sendMessage(chip)}
                  className="shrink-0 rounded-full border border-[var(--primary-pink)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--deep-pink)] transition hover:bg-[var(--blush)]"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            className="shrink-0 flex items-center gap-2 border-t border-[var(--blush)] bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi dinh dưỡng..."
              disabled={isTyping}
              className="flex-1 rounded-full border border-[var(--gray-100)] bg-[var(--gray-100)] px-4 py-2 text-sm text-[var(--charcoal)] outline-none transition placeholder:text-[var(--gray-500)] focus:border-[var(--primary-pink)] focus:ring-2 focus:ring-[rgba(255,107,157,0.2)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-pink), var(--deep-pink))",
              }}
              aria-label="Gửi"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

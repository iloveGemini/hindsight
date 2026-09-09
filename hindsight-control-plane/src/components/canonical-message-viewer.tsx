"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  User,
  Sparkles,
  Terminal,
  Wrench,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Lightbulb,
  Search,
  ExternalLink,
  Code2,
  FileText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompactMarkdown } from "@/components/compact-markdown";
import {
  CanonicalMessage,
  AssociatedMemoryFact,
  getCanonicalMessageText,
} from "@/lib/canonical-message";
import { cn } from "@/lib/utils";

interface CanonicalMessageViewerProps {
  messages: CanonicalMessage[];
  evidenceMapping?: Map<string, AssociatedMemoryFact[]>;
  onSelectMemory?: (memoryId: string) => void;
  bankId?: string;
  documentId?: string;
  className?: string;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "user":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <User className="w-3 h-3" />
          User
        </span>
      );
    case "assistant":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Sparkles className="w-3 h-3" />
          Assistant
        </span>
      );
    case "action":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Wrench className="w-3 h-3" />
          Action
        </span>
      );
    case "system":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
          <Terminal className="w-3 h-3" />
          {role || "System"}
        </span>
      );
  }
}

function ActionContent({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const isLong = lines.length > 3 || text.length > 200;

  return (
    <div className="rounded-md border border-border/80 bg-muted/40 overflow-hidden font-mono text-xs">
      <div
        className={cn(
          "px-3 py-2 text-foreground/90 whitespace-pre-wrap break-all leading-relaxed",
          !expanded && isLong && "max-h-24 overflow-hidden"
        )}
      >
        {text}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] border-t border-border/60 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronDown className="w-3 h-3" />
              折叠详情
            </>
          ) : (
            <>
              <ChevronRight className="w-3 h-3" />
              展开全部 ({lines.length} 行)
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function CanonicalMessageViewer({
  messages,
  evidenceMapping,
  onSelectMemory,
  bankId,
  documentId,
  className,
}: CanonicalMessageViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyMessageId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("已复制消息 ID");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const role = msg.actor?.role || "system";
      if (roleFilter !== "all" && role !== roleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const text = getCanonicalMessageText(msg).toLowerCase();
        const id = msg.message_id.toLowerCase();
        const q = searchQuery.toLowerCase();
        return text.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [messages, roleFilter, searchQuery]);

  const totalFactsCount = useMemo(() => {
    if (!evidenceMapping) return 0;
    let count = 0;
    evidenceMapping.forEach((facts) => {
      count += facts.length;
    });
    return count;
  }, [evidenceMapping]);

  const rolesAvailable = useMemo(() => {
    const set = new Set<string>();
    messages.forEach((m) => {
      if (m.actor?.role) set.add(m.actor.role);
    });
    return Array.from(set);
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full space-y-3", className)}>
      {/* Top Filter and Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-card/60">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索对话消息..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={roleFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRoleFilter("all")}
              className="h-7 px-2 text-xs"
            >
              全部 ({messages.length})
            </Button>
            {rolesAvailable.map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRoleFilter(role)}
                className="h-7 px-2 text-xs capitalize"
              >
                {role}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalFactsCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Lightbulb className="w-3 h-3" />
              {totalFactsCount} 条衍生事实
            </span>
          )}
          <span>共 {filteredMessages.length} 条消息</span>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            没有找到匹配的对话消息
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const role = msg.actor?.role || "system";
            const text = getCanonicalMessageText(msg);
            const associatedFacts = evidenceMapping?.get(msg.message_id) || [];
            const isUser = role === "user";
            const isAssistant = role === "assistant";
            const isAction = role === "action";
            const isSystem = role === "system";

            return (
              <div
                key={msg.message_id || index}
                className={cn(
                  "rounded-lg border p-4 transition-all",
                  isUser && "bg-card border-border/80",
                  isAssistant && "bg-primary/[0.03] border-primary/20",
                  isAction && "bg-muted/30 border-border/70",
                  isSystem && "bg-muted/20 border-dashed border-border/60"
                )}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={role} />
                    <span className="font-mono text-muted-foreground text-[11px]">
                      #{msg.sequence ?? index + 1}
                    </span>
                    {msg.occurred_at && (
                      <span
                        className="text-muted-foreground text-[11px]"
                        title={new Date(msg.occurred_at).toLocaleString()}
                      >
                        {formatRelativeTime(msg.occurred_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Integrity indicator */}
                    {msg.integrity?.canonical_sha256 && (
                      <span
                        className="text-muted-foreground/60 hover:text-foreground cursor-help"
                        title={`SHA256: ${msg.integrity.canonical_sha256}`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {/* Message ID badge with copy */}
                    <button
                      type="button"
                      onClick={() => copyMessageId(msg.message_id)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded transition-colors"
                      title={`点击复制完整 ID: ${msg.message_id}`}
                    >
                      {copiedId === msg.message_id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{msg.message_id.slice(0, 8)}</span>
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-sm">
                  {isAction ? (
                    <ActionContent text={text} />
                  ) : isSystem ? (
                    <div className="font-mono text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 p-2.5 rounded border border-border/50">
                      {text}
                    </div>
                  ) : (
                    <CompactMarkdown className="leading-relaxed text-foreground">
                      {text}
                    </CompactMarkdown>
                  )}
                </div>

                {/* Evidence Bridge: Associated Memory Units / Facts */}
                {associatedFacts.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 gap-1.5"
                        >
                          <Lightbulb className="w-3 h-3" />
                          衍生了 {associatedFacts.length} 条记忆事实
                          <ChevronRight className="w-3 h-3 ml-0.5 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3 space-y-2" align="start">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          证据衍生的记忆事实 ({associatedFacts.length})
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {associatedFacts.map((fact) => (
                            <div
                              key={fact.id}
                              className="p-2.5 rounded-md border border-border bg-muted/40 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.2 rounded text-[10px] font-medium uppercase",
                                    fact.type === "experience"
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                      : fact.type === "observation"
                                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                  )}
                                >
                                  {fact.type || "world"}
                                </span>
                                {onSelectMemory && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onSelectMemory(fact.id)}
                                    className="h-5 px-1 text-[11px] gap-1 text-muted-foreground hover:text-primary"
                                  >
                                    查看
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{fact.text}</p>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <span className="text-[11px] text-muted-foreground/70">
                      证据链：已关联此消息
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

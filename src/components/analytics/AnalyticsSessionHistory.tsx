import { History, Check, SkipForward, X, Timer, Coffee, Zap, Hourglass, ShieldCheck, Shield, ShieldAlert, Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { FocusSession, SessionType, SessionStatus, FOCUS_CATEGORIES } from "@/types/analytics";

interface SessionHistoryProps {
  sessions: FocusSession[];
  formatDuration: (seconds: number, format?: 'short' | 'long') => string;
}

export const AnalyticsSessionHistory = ({ sessions, formatDuration }: SessionHistoryProps) => {
  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'skipped':
        return <SkipForward className="w-3.5 h-3.5 text-yellow-500" />;
      case 'abandoned':
        return <X className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const getTypeIcon = (type: SessionType) => {
    switch (type) {
      case 'pomodoro':
        return <Timer className="w-3.5 h-3.5" />;
      case 'deep-work':
        return <Zap className="w-3.5 h-3.5" />;
      case 'break':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'countup':
        return <Hourglass className="w-3.5 h-3.5" />;
    }
  };

  const getTypeLabel = (type: SessionType) => {
    switch (type) {
      case 'pomodoro':
        return 'Pomodoro';
      case 'deep-work':
        return 'Deep Work';
      case 'break':
        return 'Break';
      case 'countup':
        return 'Open Focus';
    }
  };

  const getTypeColor = (type: SessionType) => {
    switch (type) {
      case 'pomodoro':
        return 'text-amber-500 bg-amber-500/10';
      case 'deep-work':
        return 'text-purple-500 bg-purple-500/10';
      case 'break':
        return 'text-green-500 bg-green-500/10';
      case 'countup':
        return 'text-cyan-500 bg-cyan-500/10';
    }
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'perfect':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/15 text-green-500">
            <ShieldCheck className="w-2.5 h-2.5" />
          </span>
        );
      case 'good':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-400">
            <Shield className="w-2.5 h-2.5" />
          </span>
        );
      case 'distracted':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-400">
            <ShieldAlert className="w-2.5 h-2.5" />
          </span>
        );
      default:
        return null;
    }
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <span className="inline-flex items-center gap-px">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "w-2 h-2",
              i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
            )}
          />
        ))}
      </span>
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const dateKey = formatDate(session.startTime);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {} as Record<string, FocusSession[]>);

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">Recent Sessions</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{sessions.length} total</span>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {Object.entries(groupedSessions).map(([dateLabel, dateSessions]) => (
            <div key={dateLabel}>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                {dateLabel}
              </div>
              <div className="space-y-1.5">
                {dateSessions.map((session) => {
                  const categoryInfo = session.category
                    ? FOCUS_CATEGORIES.find(c => c.id === session.category)
                    : null;

                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                        getTypeColor(session.sessionType)
                      )}>
                        {getTypeIcon(session.sessionType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold truncate">
                            {session.taskLabel || getTypeLabel(session.sessionType)}
                          </span>
                          {session.xpEarned > 0 && (
                            <span className="text-[10px] text-primary font-medium">
                              +{session.xpEarned} XP
                            </span>
                          )}
                          {session.hasNotes && (
                            <MessageSquare className="w-2.5 h-2.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(session.startTime)} · {formatDuration(session.actualDuration)}
                          </span>
                          {categoryInfo && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                              categoryInfo.color, "text-white"
                            )}>
                              {categoryInfo.label}
                            </span>
                          )}
                          {getQualityBadge(session.focusQuality)}
                          {getRatingStars(session.rating)}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusIcon(session.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No sessions yet</p>
          <p className="text-xs mt-1">Start a focus session and your history will appear here</p>
        </div>
      )}
    </div>
  );
};

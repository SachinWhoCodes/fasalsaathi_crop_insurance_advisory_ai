import { ChatMessage } from '@/lib/types';
import { Bot, User } from 'lucide-react';
import { Badge } from '../ui/badge';

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick?: (url: string) => void;
}

export const MessageBubble = ({ message, onCitationClick }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`rounded-full p-2 h-8 w-8 flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary' : 'bg-accent'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-accent-foreground" />
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card border border-border'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.citations.map((citation, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 text-xs"
                onClick={() => onCitationClick?.(citation.url)}
              >
                {citation.title}
              </Badge>
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

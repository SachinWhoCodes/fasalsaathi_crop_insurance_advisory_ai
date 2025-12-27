import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const Composer = ({ onSend, disabled }: ComposerProps) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat_placeholder')}
              disabled={disabled}
              className="min-h-[52px] max-h-[200px] resize-none pr-12 rounded-2xl"
              rows={1}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 h-8 w-8"
              disabled
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-[52px] w-[52px] rounded-2xl flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

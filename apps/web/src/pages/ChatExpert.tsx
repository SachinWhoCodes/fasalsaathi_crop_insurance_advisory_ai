import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatMessage } from '@/lib/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Composer } from '@/components/chat/Composer';
import { ReportCard } from '@/components/chat/ReportCard';
import { sendChatMessage, getReports, getReportById } from '@/lib/api';
import { CropReport } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, Shield, TrendingUp, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function ChatExpert() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('rid');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reports, setReports] = useState<CropReport[]>([]);
  const [contextReport, setContextReport] = useState<CropReport | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    const greeting: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: reportId 
        ? "I've loaded your crop report. I can provide detailed advice on risk management, irrigation planning, and insurance options specific to your crop."
        : "Hello! I'm your agricultural expert. I can help with crop selection, pest management, irrigation planning, and insurance advice. How can I assist you today?",
      timestamp: new Date().toISOString()
    };
    setMessages([greeting]);
    loadReports();
    
    if (reportId) {
      loadContextReport(reportId);
    }
  }, [reportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadReports = async () => {
    const data = await getReports();
    setReports(data);
  };

  const loadContextReport = async (id: string) => {
    const report = await getReportById(id);
    setContextReport(report);
  };

  const handleSend = async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await sendChatMessage(content, 'expert', { reportId: reportId || undefined });
      setMessages(prev => [...prev, response]);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscuss = (id: string) => {
    window.location.href = `/chat/expert?rid=${id}`;
  };

  const clearContext = () => {
    window.location.href = '/chat/expert';
  };

  const suggestedPrompts = [
    { icon: Lightbulb, text: 'What crops are best for my region?' },
    { icon: TrendingUp, text: 'How can I improve my yield?' },
    { icon: Shield, text: 'Which insurance scheme should I choose?' }
  ];

  const SidebarContent = () => (
    <>
      <h3 className="font-semibold text-sm text-muted-foreground mb-4">
        {t('reports')}
      </h3>
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('no_reports')}<br />
          <span className="text-xs">{t('create_first')}</span>
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onDiscuss={handleDiscuss}
              compact
            />
          ))}
        </div>
      )}

      {!contextReport && messages.length === 1 && (
        <div className="mt-8 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">
            Quick Actions
          </h3>
          {suggestedPrompts.map((prompt, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 h-auto py-3 text-left"
              onClick={() => handleSend(prompt.text)}
            >
              <prompt.icon className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs">{prompt.text}</span>
            </Button>
          ))}
        </div>
      )}
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
                  <Badge variant="outline" className="flex-shrink-0 text-xs">Context</Badge>
                  <div className="text-xs truncate">
                    <span className="font-medium">{contextReport.crop}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0" onClick={clearContext}>
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
                  <Badge variant="outline" className="flex-shrink-0">Context</Badge>
                  <div className="text-sm truncate">
                    <span className="font-medium">{contextReport.crop}</span>
                    <span className="text-muted-foreground"> • {contextReport.city}, {contextReport.state}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={clearContext}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(message => (
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

        <Composer onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}

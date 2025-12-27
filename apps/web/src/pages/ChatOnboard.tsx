import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage, OnboardingStep } from '@/lib/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Composer } from '@/components/chat/Composer';
import { ReportCard } from '@/components/chat/ReportCard';
import { OnboardingStepper } from '@/components/chat/OnboardingStepper';
import { sendChatMessage, getReports } from '@/lib/api';
import { CropReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export default function ChatOnboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reports, setReports] = useState<CropReport[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('details');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    const greeting: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to FasalSaathi AI! I'll help you create a comprehensive crop report. Let's start by understanding your crop details. Which crop are you planning to sow?",
      timestamp: new Date().toISOString()
    };
    setMessages([greeting]);
    loadReports();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadReports = async () => {
    const data = await getReports();
    setReports(data);
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
      const response = await sendChatMessage(content, 'onboard', { currentStep });
      setMessages(prev => [...prev, response]);

      // Simulate step progression
      const stepIndex = ['details', 'ideals', 'forecast', 'risk', 'insurance', 'indexed', 'ready'].indexOf(currentStep);
      if (stepIndex < 6) {
        const nextStep = ['details', 'ideals', 'forecast', 'risk', 'insurance', 'indexed', 'ready'][stepIndex + 1] as OnboardingStep;
        setTimeout(() => setCurrentStep(nextStep), 1000);
      }

      if (currentStep === 'ready') {
        toast.success('Report created successfully!', {
          action: {
            label: 'View Report',
            onClick: () => navigate('/reports/report-1')
          }
        });
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscuss = (reportId: string) => {
    navigate(`/chat/expert?rid=${reportId}`);
  };

  const SidebarContent = () => (
    <>
      <OnboardingStepper currentStep={currentStep} />
      
      <div className="mt-8">
        <h3 className="font-semibold text-sm text-muted-foreground mb-4">
          {t('reports')}
        </h3>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('no_reports')}
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
        {/* Mobile Menu Button */}
        <div className="md:hidden border-b border-border p-2">
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

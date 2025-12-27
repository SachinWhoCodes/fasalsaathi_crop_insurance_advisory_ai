import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, LineChart, Shield, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
              {t('hero_title')}
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-in-up">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up">
              <Link to="/onboard">
                <Button size="lg" className="gap-2">
                  <Bot className="h-5 w-5" />
                  Quick Form Onboard
                </Button>
              </Link>
              <Link to="/chat/onboard">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('cta_onboard')}
                </Button>
              </Link>
              <Link to="/chat/expert">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('cta_expert')}
                </Button>
              </Link>
              <Link to="/reports">
                <Button size="lg" variant="secondary" className="gap-2">
                  <FileText className="h-5 w-5" />
                  {t('cta_view_reports')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/10">
            <CardHeader>
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('feature_1_title')}</CardTitle>
              <CardDescription>{t('feature_1_desc')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-accent/10">
            <CardHeader>
              <div className="rounded-lg bg-accent/10 w-12 h-12 flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>{t('feature_2_title')}</CardTitle>
              <CardDescription>{t('feature_2_desc')}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/10">
            <CardHeader>
              <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('feature_3_title')}</CardTitle>
              <CardDescription>{t('feature_3_desc')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          {[
            { icon: Bot, title: 'Chat with AI', desc: 'Answer simple questions about your crop through natural conversation' },
            { icon: LineChart, title: 'Get Analysis', desc: 'Receive detailed risk assessment for each growth stage' },
            { icon: Shield, title: 'Choose Insurance', desc: 'Compare schemes and enroll in the best coverage for your needs' },
            { icon: CheckCircle2, title: 'Track Application', desc: 'Monitor your insurance application status in real-time' }
          ].map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="rounded-full bg-primary/10 p-3 flex-shrink-0">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

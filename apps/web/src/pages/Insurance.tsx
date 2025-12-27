import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle, HelpCircle, FileText } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';
import { getReports } from '@/lib/api';
import type { CropReport } from '@/lib/types';

export default function Insurance() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [latestReport, setLatestReport] = useState<CropReport | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoadingLatest(true);
      try {
        const reports = await getReports();
        setLatestReport(reports?.[0] ?? null);
      } catch (e) {
        setLatestReport(null);
        console.error('Failed to load latest report for insurance recommendations:', e);
      } finally {
        setLoadingLatest(false);
      }
    };
    run();
  }, [user]);

  const schemes = [
    {
      id: 'pmfby',
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      description: 'Comprehensive crop insurance with low farmer premium and high government subsidy',
      icon: Shield,
      color: 'text-primary',
    },
    {
      id: 'wbcis',
      name: 'Weather Based Crop Insurance (WBCIS)',
      description: 'Index-based insurance using weather parameters for quick settlements',
      icon: CheckCircle2,
      color: 'text-accent',
    },
    {
      id: 'mnais',
      name: 'Modified NAIS',
      description: 'Traditional area-based assessment with wide network coverage',
      icon: AlertCircle,
      color: 'text-orange-500',
    },
  ];

  const faqs = [
    {
      q: 'What is crop insurance?',
      a: 'Crop insurance provides financial protection to farmers against crop losses due to natural calamities, pests, and diseases. It ensures income stability even during bad seasons.',
    },
    {
      q: 'How much premium do I need to pay?',
      a: 'Premium rates are typically 2-5% of the sum insured, with significant government subsidies. The actual farmer share is usually 2% for food crops and 5% for horticultural crops.',
    },
    {
      q: 'What risks are covered?',
      a: 'Coverage includes drought, excess rainfall, flood, hailstorm, cyclone, pest attacks, and diseases. Weather-based schemes cover specific weather parameters like rainfall, temperature, and humidity.',
    },
    {
      q: 'How is the claim settled?',
      a: 'Claims are assessed based on crop cutting experiments (for yield-based) or weather station data (for index-based). Settlements are directly transferred to farmer bank accounts.',
    },
    {
      q: 'When should I enroll?',
      a: 'Enrollment windows are usually 2-4 weeks before sowing season. For Kharif (monsoon) crops: April-July. For Rabi (winter) crops: October-December.',
    },
    {
      q: 'Can I insure multiple crops?',
      a: 'Yes, you can insure different crops on different land parcels. Each crop requires a separate policy with its own premium calculation.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">{t('insurance')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Protect your crops with government-backed insurance schemes. Compare and choose the best coverage for your farming needs.
        </p>
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <Link to="/chat/onboard">
            <Button size="lg" className="gap-2">Get Personalized Recommendations</Button>
          </Link>
          <Link to="/reports">
            <Button size="lg" variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              View My Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Personalized Recommendations */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Recommended for you</CardTitle>
          <CardDescription>
            Based on your latest crop report, we’ll guide you to the most relevant insurance options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingLatest ? (
            <p className="text-sm text-muted-foreground">Loading your latest report...</p>
          ) : latestReport ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {latestReport.crop} • {latestReport.city}, {latestReport.state}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sowing: {new Date(latestReport.sowingDate).toLocaleDateString()} • {latestReport.season}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link to={`/reports/${latestReport.id}`}>
                  <Button>View Recommendations</Button>
                </Link>
                <Link to="/chat/onboard">
                  <Button variant="outline">Create New Report</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-medium">No report found yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a crop report to unlock personalized insurance recommendations.
                </p>
              </div>
              <Link to="/chat/onboard">
                <Button>Create First Report</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Schemes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Available Schemes</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {schemes.map((scheme) => (
            <Card key={scheme.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <scheme.icon className={`h-6 w-6 ${scheme.color}`} />
                </div>
                <CardTitle>{scheme.name}</CardTitle>
                <CardDescription>{scheme.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/chat/onboard">
                  <Button variant="outline" className="w-full">Check Eligibility</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <Card>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{faq.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-8">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-3">Need Help Choosing?</h2>
        <p className="text-muted-foreground mb-6">
          Chat with our AI expert to get personalized insurance recommendations based on your crop and location
        </p>
        <Link to="/chat/expert">
          <Button size="lg" className="gap-2">Talk to Expert</Button>
        </Link>
      </div>
    </div>
  );
}


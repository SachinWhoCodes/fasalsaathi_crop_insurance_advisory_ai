import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAuth } from '@/contexts/AuthContext';
import { getReportById, getSchemesForReport, startInsuranceApplication } from '@/lib/api';
import type { CropReport, InsuranceScheme } from '@/lib/types';

const schema = z.object({
  farmerName: z.string().min(2, 'Farmer name is required'),
});

type FormValues = z.infer<typeof schema>;

export default function InsuranceEnroll() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const schemeId = params.get('sid') || '';
  const reportId = params.get('rid') || '';

  const [report, setReport] = useState<CropReport | null>(null);
  const [scheme, setScheme] = useState<InsuranceScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { farmerName: user?.name || '' },
  });

  useEffect(() => {
    const run = async () => {
      if (!schemeId || !reportId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [r, schemes] = await Promise.all([
          getReportById(reportId),
          getSchemesForReport(reportId),
        ]);
        setReport(r);
        setScheme(schemes.find((s) => s.id === schemeId) || null);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load enrollment details');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [schemeId, reportId]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    if (!schemeId || !reportId) return;

    setSubmitting(true);
    try {
      await startInsuranceApplication({ reportId, schemeId, farmerName: values.farmerName });
      toast.success('Application submitted!');
      navigate('/applications');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!schemeId || !reportId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Missing details</CardTitle>
            <CardDescription>
              We couldn’t find a scheme or report to enroll for. Please open a report and choose a scheme again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link to="/reports">
              <Button>Go to Reports</Button>
            </Link>
            <Link to="/insurance">
              <Button variant="outline">Go to Insurance</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link to={reportId ? `/reports/${reportId}` : '/reports'}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Enroll in Insurance</CardTitle>
              <CardDescription>Confirm details and submit your application</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details...
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="font-semibold">{scheme?.name || 'Selected scheme'}</p>

                {report && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">{report.crop}</span> • {report.city}, {report.state}
                    </p>
                    <p>
                      Season: {report.season} • Sowing: {new Date(report.sowingDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="farmerName">Farmer name</Label>
                  <Input
                    id="farmerName"
                    placeholder="Enter your name"
                    {...form.register('farmerName')}
                  />
                  {form.formState.errors.farmerName?.message && (
                    <p className="text-sm text-destructive">{form.formState.errors.farmerName.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  By submitting, you confirm the provided information is accurate. This demo stores your application in Firestore.
                </p>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Calendar, Sprout, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  crop: z.string().min(1, 'Crop is required'),
  seed_type: z.string().min(1, 'Seed type is required'),
  soil: z.string().min(1, 'Soil type is required'),
  district: z.string().min(1, 'District is required'),
  season: z.string().min(1, 'Season is required'),
  state: z.string().min(1, 'State is required'),
  sowing_date: z.string().min(1, 'Sowing date is required'),
});

type FormValues = z.infer<typeof formSchema>;

type Stage = {
  name: string;
  duration_days: number;
  importance_weight: number;
  ideal: {
    tmin_c: number;
    tmax_c: number;
    rh_pct: number;
    rain_mm: number;
    wind_kmph: number;
  };
  forecasted?: {
    tmin_c: number;
    tmax_c: number;
    rh_pct: number;
    rain_mm: number;
    wind_kmph: number;
  };
};

type PredictPayload = {
  state: string | null;
  total_duration_days: number;
  meta?: any;
  crop: string;
  sw_date?: string | null;
  district: string;
  stages: Stage[];
};

type RiskResult = {
  crop: string;
  district: string;
  stage_wise_risk: { name: string; score: number; level: string }[];
  overall_risk: { score: number; level: string };
  description?: string;
};

const processingSteps = [
  { key: 'submit', message: 'Sending crop details to model...' },
  { key: 'predict', message: 'Generating ideal crop-stage plan...' },
  { key: 'forecast', message: 'Filling 120-day forecast across stages...' },
  { key: 'risk', message: 'Calculating stage-wise & overall risk...' },
  { key: 'save', message: 'Saving report to your account...' },
  { key: 'done', message: 'Finalizing report...' },
] as const;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  // If the promise is a fetch call, it should already include signal
  // Here we just enforce generic timeout by racing.
  return Promise.race([
    promise.finally(() => clearTimeout(timeout)),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function postJson<TResponse>(url: string, body: unknown, label: string): Promise<TResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error ? ` — ${j.error}` : '';
    } catch {
      // ignore
    }
    throw new Error(`${label} failed (${res.status})${detail}`);
  }

  return (await res.json()) as TResponse;
}

export default function FormOnboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const progress = useMemo(() => {
    if (!isProcessing) return 0;
    return ((currentStep + 1) / processingSteps.length) * 100;
  }, [isProcessing, currentStep]);

  // ✅ Dummy defaults (replace with AWS IP later via Vercel env vars)
  const PREDICT_URL =
    import.meta.env.VITE_PREDICT_API_URL || 'http://<AWS_IP>:5000/predict';
  const FORECAST_URL =
    import.meta.env.VITE_FORECAST_API_URL || 'http://<AWS_IP>:5001/fill-forecast';
  const RISK_URL =
    import.meta.env.VITE_RISK_API_URL || 'http://<AWS_IP>:5002/calculate-risk';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crop: '',
      seed_type: '',
      soil: '',
      district: '',
      season: '',
      state: '',
      sowing_date: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!isAuthenticated || !user) {
      toast.error('Please login first.');
      navigate('/auth/login');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);

    try {
      // STEP 0: submit
      setCurrentStep(0);

      // ✅ IMPORTANT mapping:
      // Your ML service uses `sw_date` in output if present, so we send it.
      const predictInput = {
        crop: data.crop,
        seed_type: data.seed_type,
        soil: data.soil,
        district: data.district,
        season: data.season,
        state: data.state,
        sw_date: data.sowing_date, // <- sowing date mapped to sw_date
      };

      // STEP 1: Predict (ML)
      setCurrentStep(1);
      const predicted = await withTimeout(
        postJson<PredictPayload>(PREDICT_URL, predictInput, 'Predict API'),
        120000,
        'Predict API'
      );

      if (!predicted?.stages?.length) {
        throw new Error('Predict API returned empty stages');
      }

      // STEP 2: Fill forecast into stages
      setCurrentStep(2);
      const withForecast = await withTimeout(
        postJson<PredictPayload>(FORECAST_URL, predicted, 'Forecast API'),
        120000,
        'Forecast API'
      );

      // STEP 3: Calculate risk + Gemini summary
      setCurrentStep(3);
      const risk = await withTimeout(
        postJson<RiskResult>(RISK_URL, withForecast, 'Risk API'),
        120000,
        'Risk API'
      );

      // STEP 4: Save in Firestore
      setCurrentStep(4);

      const reportDoc = {
        userId: user.id,
        status: 'ready',

        // Quick fields for list cards / filters
        title: `${data.crop} • ${data.district}`,
        crop: data.crop,
        seed_type: data.seed_type,
        soil: data.soil,
        district: data.district,
        state: data.state,
        season: data.season,
        sowing_date: data.sowing_date,

        overallRisk: risk?.overall_risk || null,
        stageWiseRisk: risk?.stage_wise_risk || [],
        description: risk?.description || '',

        // Full raw payloads for ReportDetails page
        raw: {
          predictInput,
          predicted,
          forecastedPayload: withForecast,
          riskResult: risk,
        },

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'reports'), reportDoc);

      // STEP 5: Done
      setCurrentStep(5);
      toast.success('Report generated successfully!');
      navigate(`/reports/${ref.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to generate report. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sprout className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Crop Onboarding</CardTitle>
            </div>
            <CardDescription>
              Fill in your crop details to get personalized risk assessment and insurance recommendations
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="crop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crop</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Wheat, Rice, Cotton" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seed_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seed Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select seed type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="traditional">Traditional</SelectItem>
                            <SelectItem value="organic">Organic</SelectItem>
                            <SelectItem value="gmo">GMO</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="soil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soil Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select soil type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="clay">Clay</SelectItem>
                            <SelectItem value="loam">Loam</SelectItem>
                            <SelectItem value="sandy">Sandy</SelectItem>
                            <SelectItem value="silt">Silt</SelectItem>
                            <SelectItem value="peat">Peat</SelectItem>
                            <SelectItem value="chalky">Chalky</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Season</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                            <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                            <SelectItem value="zaid">Zaid (Summer)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Punjab, Maharashtra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ludhiana, Pune" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sowing_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sowing Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="date" {...field} />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit & Generate Report'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Backend endpoints:
                  <br />
                  Predict: <span className="font-mono">{PREDICT_URL}</span>
                  <br />
                  Forecast: <span className="font-mono">{FORECAST_URL}</span>
                  <br />
                  Risk: <span className="font-mono">{RISK_URL}</span>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Processing Dialog */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Processing Your Data
            </DialogTitle>
            <DialogDescription>
              Please wait while we analyze your crop information and generate insights
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {processingSteps[currentStep]?.message}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-2">
              {processingSteps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-2 text-sm transition-opacity ${
                    index <= currentStep ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  {index < currentStep ? (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : index === currentStep ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted" />
                  )}
                  <span className={index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


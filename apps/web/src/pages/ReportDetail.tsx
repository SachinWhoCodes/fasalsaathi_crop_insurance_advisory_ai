import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Share2, Download, MessageSquare, Shield } from 'lucide-react';
import { InsuranceSchemeCard } from '@/components/insurance/InsuranceSchemeCard';
import { toast } from 'sonner';

// --- Types (local view models; avoids depending on old mock types) ---
type StageIdealForecast = {
  name: string;
  duration_days?: number;
  importance_weight?: number;
  ideal?: {
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

type RiskStage = { name: string; score: number; level: string };
type RiskOverall = { score: number; level: string };

type ReportDoc = {
  userId: string;

  status?: string;

  crop?: string;
  seed_type?: string; // your form name
  variety?: string;   // legacy name

  soil?: string;
  district?: string;
  city?: string;
  state?: string;

  season?: string;
  sowing_date?: string;
  sowingDate?: string;

  overallRisk?: RiskOverall;
  stageWiseRisk?: RiskStage[];
  description?: string;

  raw?: {
    forecastedPayload?: {
      crop?: string;
      district?: string;
      state?: string;
      sw_date?: string | null;
      stages?: StageIdealForecast[];
    };
    riskResult?: {
      crop?: string;
      district?: string;
      overall_risk?: RiskOverall;
      stage_wise_risk?: RiskStage[];
      description?: string;
    };
  };

  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
};

type StageUI = {
  stage: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributors: Array<{ factor: string; impact: number; description: string }>;
  recommendations: string[];
};

type ReportUI = {
  id: string;
  crop: string;
  variety: string;
  city: string;
  state: string;
  sowingDate: string; // ISO or date string
  season: string;
  status: string;
  createdAt: number; // ms
  updatedAt: number; // ms
  seasonRisk: { score: number; level: 'low' | 'medium' | 'high' | 'critical' };
  stageRisks: StageUI[];
  description?: string;
};

function tsToMs(v: any): number {
  if (!v) return Date.now();
  if (typeof v === 'number') return v;
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  const d = new Date(v);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

function normalizeLevel(level?: string): 'low' | 'medium' | 'high' | 'critical' {
  const l = String(level || '').trim().toLowerCase();
  // Gemini/risk-api returns: Low / Moderate / High / Very High
  if (l === 'low') return 'low';
  if (l === 'moderate' || l === 'medium') return 'medium';
  if (l === 'high') return 'high';
  if (l === 'very high' || l === 'very_high' || l === 'critical') return 'critical';
  // fallback
  return 'medium';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function deviationPct(ideal: number, forecast: number) {
  const denom = ideal === 0 ? 1 : Math.abs(ideal);
  return Math.abs(forecast - ideal) / denom;
}

function buildContributorsAndRecs(stage: StageIdealForecast): {
  contributors: Array<{ factor: string; impact: number; description: string }>;
  recommendations: string[];
} {
  const ideal = stage.ideal;
  const fc = stage.forecasted;

  if (!ideal || !fc) {
    return { contributors: [], recommendations: [] };
  }

  const metrics = [
    { key: 'tmin_c', label: 'Min Temperature', unit: '°C' },
    { key: 'tmax_c', label: 'Max Temperature', unit: '°C' },
    { key: 'rh_pct', label: 'Humidity', unit: '%' },
    { key: 'rain_mm', label: 'Rainfall', unit: 'mm' },
    { key: 'wind_kmph', label: 'Wind', unit: 'km/h' },
  ] as const;

  const diffs = metrics.map((m) => {
    const i = (ideal as any)[m.key] ?? 0;
    const f = (fc as any)[m.key] ?? 0;
    const dev = deviationPct(i, f); // 0..inf
    return { ...m, ideal: i, forecast: f, dev };
  });

  // Top 3 deviations
  const top = [...diffs].sort((a, b) => b.dev - a.dev).slice(0, 3);

  const contributors = top.map((x) => ({
    factor: x.label,
    impact: clamp(Math.round(x.dev * 100), 0, 100),
    description: `Forecast ${x.forecast}${x.unit} vs ideal ${x.ideal}${x.unit}`,
  }));

  const recommendations: string[] = [];

  // Simple actionable rules based on sign & severity
  for (const x of diffs) {
    const delta = x.forecast - x.ideal;
    const severity = x.dev;

    if (severity < 0.2) continue; // only recommend when deviation >= 20%

    if (x.key === 'rain_mm') {
      if (delta > 0) recommendations.push('Improve drainage; avoid waterlogging after heavy rains.');
      else recommendations.push('Plan supplemental irrigation; conserve soil moisture with mulching.');
    }
    if (x.key === 'tmax_c') {
      if (delta > 0) recommendations.push('Use mulching/shade where possible; irrigate during cooler hours.');
      else recommendations.push('Watch for cold stress; consider protective irrigation/fogging if needed.');
    }
    if (x.key === 'tmin_c') {
      if (delta < 0) recommendations.push('Protect seedlings from cold nights (mulch / light irrigation).');
      else recommendations.push('Monitor for heat stress during nights; ensure adequate soil moisture.');
    }
    if (x.key === 'rh_pct') {
      if (delta > 0) recommendations.push('High humidity: monitor fungal disease; ensure airflow and timely spray if required.');
      else recommendations.push('Low humidity: avoid moisture stress; optimize irrigation scheduling.');
    }
    if (x.key === 'wind_kmph') {
      if (delta > 0) recommendations.push('High wind: use windbreaks; secure young plants and support staking if needed.');
    }
  }

  // Remove duplicates
  return {
    contributors,
    recommendations: Array.from(new Set(recommendations)).slice(0, 4),
  };
}

function scaleOverallRiskTo100(overallScore: number) {
  // Your overall score is ~0..16 typically (10 stages * ~1.6 max)
  // Scale to 0..100 safely.
  const score = (overallScore / 16) * 100;
  return clamp(Math.round(score), 0, 100);
}

function scaleStageRiskTo100(stageScore: number) {
  // Stage score ~0..1.6 typically
  const score = (stageScore / 1.6) * 100;
  return clamp(Math.round(score), 0, 100);
}

function getRiskColor(level: string) {
  switch (normalizeLevel(level)) {
    case 'low':
      return 'text-green-500';
    case 'medium':
      return 'text-yellow-500';
    case 'high':
      return 'text-orange-500';
    case 'critical':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}

// Basic insurance recommendation (frontend logic for now)
function recommendSchemes(report: ReportUI) {
  const level = report.seasonRisk.level;

  const base = [
    {
      id: 'pmfby',
      name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
      description: 'Government-backed crop insurance for yield losses due to natural risks.',
      tags: ['Govt', 'Yield Loss', 'Popular'],
    },
    {
      id: 'wbcis',
      name: 'WBCIS (Weather Based Crop Insurance Scheme)',
      description: 'Insurance payouts triggered by adverse weather parameters (rainfall/temperature).',
      tags: ['Weather', 'Parametric', 'Fast Claims'],
    },
    {
      id: 'state-relief',
      name: 'State Crop Relief / Assistance',
      description: 'State-level relief schemes during severe weather events (availability varies).',
      tags: ['State', 'Relief'],
    },
  ];

  // Add “strong recommendation” reason
  return base.map((s) => ({
    ...s,
    recommendedReason:
      level === 'critical'
        ? 'Your overall risk is very high. Strongly recommended to enroll this season.'
        : level === 'high'
        ? 'Your risk is high. Recommended for financial protection.'
        : 'Recommended as a safety net for seasonal uncertainties.',
  }));
}

export default function ReportDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [report, setReport] = useState<ReportUI | null>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async (reportId: string) => {
    setLoading(true);
    try {
      const ref = doc(db, 'reports', reportId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setReport(null);
        setSchemes([]);
        setLoading(false);
        return;
      }

      const data = snap.data() as ReportDoc;

      // Ownership check (recommended)
      if (user?.id && data.userId && data.userId !== user.id) {
        setReport(null);
        setSchemes([]);
        setLoading(false);
        return;
      }

      const forecastStages: StageIdealForecast[] =
        data.raw?.forecastedPayload?.stages || [];

      const riskStages: RiskStage[] =
        data.stageWiseRisk ||
        data.raw?.riskResult?.stage_wise_risk ||
        [];

      const overall: RiskOverall =
        data.overallRisk ||
        data.raw?.riskResult?.overall_risk ||
        { score: 0, level: 'Moderate' };

      const crop = data.crop || data.raw?.forecastedPayload?.crop || 'N/A';
      const variety = data.seed_type || data.variety || 'N/A';
      const city = data.district || data.city || data.raw?.forecastedPayload?.district || 'N/A';
      const state = data.state || data.raw?.forecastedPayload?.state || 'N/A';
      const sowingDate = data.sowing_date || data.sowingDate || data.raw?.forecastedPayload?.sw_date || new Date().toISOString();
      const season = data.season || 'N/A';

      // Build stageRisks UI from forecast stages + risk API stage list
      const stageRisks: StageUI[] = forecastStages.map((st) => {
        const match = riskStages.find((r) => r.name?.toLowerCase() === st.name?.toLowerCase());
        const stageScore100 = scaleStageRiskTo100(match?.score ?? 0);

        const { contributors, recommendations } = buildContributorsAndRecs(st);

        return {
          stage: st.name,
          riskScore: stageScore100,
          riskLevel: normalizeLevel(match?.level),
          contributors,
          recommendations,
        };
      });

      // Season risk score from overall (scaled)
      const seasonRiskScore = scaleOverallRiskTo100(overall.score);
      const seasonRiskLevel = normalizeLevel(overall.level);

      const reportUI: ReportUI = {
        id: snap.id,
        crop,
        variety,
        city,
        state,
        sowingDate,
        season,
        status: data.status || 'ready',
        createdAt: tsToMs(data.createdAt),
        updatedAt: tsToMs(data.updatedAt),
        seasonRisk: { score: seasonRiskScore, level: seasonRiskLevel },
        stageRisks,
        description: data.description || data.raw?.riskResult?.description || '',
      };

      setReport(reportUI);
      setSchemes(recommendSchemes(reportUI));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to load report');
      setReport(null);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    if (!report) return;

    const url = window.location.href;
    try {
      // Use native share if available
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: `FasalSaathi Report: ${report.crop}`,
          text: `Risk report for ${report.crop} in ${report.city}, ${report.state}`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Unable to share right now');
    }
  };

  const downloadReportJson = () => {
    if (!report || !id) return;
    const payload = {
      report,
      reportId: id,
      downloadedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fasalsaathi-report-${id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const descriptionBlock = useMemo(() => {
    if (!report?.description) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>AI-generated risk summary</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
        </CardContent>
      </Card>
    );
  }, [report?.description]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
          <p className="text-muted-foreground">{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Report not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/reports">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {report.crop} - {report.variety}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>
                {report.city}, {report.state}
              </span>
              <span>•</span>
              <span>Sowing: {new Date(report.sowingDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{report.season}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={shareReport}>
              <Share2 className="h-4 w-4" />
              {t('share') || 'Share'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={downloadReportJson}>
              <Download className="h-4 w-4" />
              {t('download') || 'Download'}
            </Button>
            <Link to={`/chat/expert?rid=${report.id}`}>
              <Button size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('discuss_expert') || 'Discuss with Expert'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Season Risk */}
          <Card>
            <CardHeader>
              <CardTitle>{t('season_risk') || 'Season Risk'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{report.seasonRisk.score}/100</span>
                <Badge variant="outline" className={getRiskColor(report.seasonRisk.level)}>
                  {report.seasonRisk.level.toUpperCase()}
                </Badge>
              </div>
              <Progress value={report.seasonRisk.score} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Overall seasonal risk assessment based on stage-wise forecast deviations.
              </p>
            </CardContent>
          </Card>

          {descriptionBlock}

          {/* Stage Risks */}
          <Card>
            <CardHeader>
              <CardTitle>{t('stage_risks') || 'Stage Risks'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.stageRisks.map((stage, i) => (
                <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{stage.stage}</h3>
                    <Badge variant="outline" className={getRiskColor(stage.riskLevel)}>
                      {stage.riskScore}/100
                    </Badge>
                  </div>
                  <Progress value={stage.riskScore} className="h-2 mb-3" />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Risk Contributors:</p>

                    {stage.contributors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No forecast comparison available.</p>
                    ) : (
                      stage.contributors.map((contrib, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs">
                            {contrib.impact}%
                          </Badge>
                          <div>
                            <span className="font-medium">{contrib.factor}:</span>
                            <span className="text-muted-foreground ml-1">{contrib.description}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {stage.recommendations.length > 0 && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Recommendations:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {stage.recommendations.map((rec, k) => (
                          <li key={k}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Insurance Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('insurance_recommendations') || 'Insurance Recommendations'}
              </CardTitle>
              <CardDescription>
                Recommended insurance schemes based on your crop risk profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schemes.map((scheme) => (
                <InsuranceSchemeCard
                  key={scheme.id}
                  scheme={scheme as any}
                  reportId={report.id}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1">{report.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium mt-1">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium mt-1">
                  {new Date(report.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


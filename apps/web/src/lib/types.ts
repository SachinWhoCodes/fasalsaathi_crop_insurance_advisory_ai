export type OnboardingStep = 
  | 'details' 
  | 'ideals' 
  | 'forecast' 
  | 'risk' 
  | 'insurance' 
  | 'indexed' 
  | 'ready';

export type ReportStatus = 'pending' | 'processing' | 'ready' | 'error';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CropReport {
  id: string;
  crop: string;
  variety: string;
  city: string;
  state: string;
  sowingDate: string;
  season: string;
  status: ReportStatus;
  seasonRisk: {
    score: number;
    level: RiskLevel;
  };
  stageRisks: StageRisk[];
  createdAt: string;
  updatedAt: string;
}

export interface StageRisk {
  stage: string;
  riskScore: number;
  riskLevel: RiskLevel;
  contributors: RiskContributor[];
  recommendations: string[];
}

export interface RiskContributor {
  factor: string;
  impact: number;
  description: string;
}

export interface InsuranceScheme {
  id: string;
  name: string;
  provider: string;
  premiumPerHa: number;
  farmerSharePct: number;
  subsidyPct: number;
  coveragePerHa: number;
  perils: string[];
  features: string[];
  enrollmentWindow: string;
  citations: Citation[];
  recommended?: boolean;
  rationale?: string;
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface InsuranceApplication {
  applicationId: string;
  schemeId: string;
  reportId: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  farmerName: string;
  cropName: string;
  schemeName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

export interface ReportContext {
  reportId: string;
  crop: string;
  city: string;
  state: string;
  season: string;
  seasonScore: number;
  topStage: string;
}

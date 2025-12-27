import { 
  CropReport, 
  InsuranceScheme, 
  InsuranceApplication, 
  ChatMessage,
  OnboardingStep 
} from './types';

// Mock data storage
let mockReports: CropReport[] = [
  {
    id: 'report-1',
    crop: 'Wheat',
    variety: 'HD-2967',
    city: 'Meerut',
    state: 'Uttar Pradesh',
    sowingDate: '2024-11-15',
    season: 'Rabi 2024-25',
    status: 'ready',
    seasonRisk: {
      score: 68,
      level: 'medium'
    },
    stageRisks: [
      {
        stage: 'Germination',
        riskScore: 45,
        riskLevel: 'low',
        contributors: [
          { factor: 'Temperature', impact: 25, description: 'Optimal range 15-20°C' },
          { factor: 'Soil Moisture', impact: 20, description: 'Adequate moisture available' }
        ],
        recommendations: ['Monitor soil temperature', 'Ensure proper seed depth']
      },
      {
        stage: 'Vegetative',
        riskScore: 72,
        riskLevel: 'high',
        contributors: [
          { factor: 'Drought', impact: 45, description: 'Below-normal rainfall expected' },
          { factor: 'Pest Pressure', impact: 27, description: 'Aphid infestation risk' }
        ],
        recommendations: ['Plan irrigation schedule', 'Monitor for pests weekly']
      },
      {
        stage: 'Flowering',
        riskScore: 85,
        riskLevel: 'critical',
        contributors: [
          { factor: 'Heat Stress', impact: 55, description: 'Temperature may exceed 35°C' },
          { factor: 'Water Deficit', impact: 30, description: 'Critical water requirement' }
        ],
        recommendations: ['Arrange backup irrigation', 'Consider heat-tolerant varieties next season']
      }
    ],
    createdAt: '2024-11-10T10:30:00Z',
    updatedAt: '2024-11-10T12:45:00Z'
  },
  {
    id: 'report-2',
    crop: 'Rice',
    variety: 'IR-64',
    city: 'Thanjavur',
    state: 'Tamil Nadu',
    sowingDate: '2024-06-20',
    season: 'Kharif 2024',
    status: 'ready',
    seasonRisk: {
      score: 52,
      level: 'medium'
    },
    stageRisks: [
      {
        stage: 'Tillering',
        riskScore: 38,
        riskLevel: 'low',
        contributors: [
          { factor: 'Rainfall', impact: 20, description: 'Normal monsoon pattern' },
          { factor: 'Nutrient', impact: 18, description: 'Adequate nitrogen levels' }
        ],
        recommendations: ['Apply top dressing fertilizer', 'Maintain water level']
      },
      {
        stage: 'Panicle Initiation',
        riskScore: 65,
        riskLevel: 'medium',
        contributors: [
          { factor: 'Disease', impact: 40, description: 'Blast disease risk moderate' },
          { factor: 'Wind', impact: 25, description: 'Lodging risk in heavy winds' }
        ],
        recommendations: ['Apply fungicide preventively', 'Consider staking in exposed areas']
      }
    ],
    createdAt: '2024-06-15T08:20:00Z',
    updatedAt: '2024-06-15T09:15:00Z'
  }
];

let mockSchemes: Record<string, InsuranceScheme[]> = {
  'report-1': [
    {
      id: 'scheme-1',
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      provider: 'Agriculture Insurance Company',
      premiumPerHa: 1200,
      farmerSharePct: 2,
      subsidyPct: 98,
      coveragePerHa: 50000,
      perils: ['Drought', 'Flood', 'Hailstorm', 'Pest', 'Disease'],
      features: [
        'Comprehensive risk coverage',
        'Low farmer premium',
        'Quick claim settlement',
        'Technology-based assessment'
      ],
      enrollmentWindow: 'Oct 15 - Dec 31, 2024',
      citations: [
        { title: 'PMFBY Official Guidelines', url: 'https://pmfby.gov.in', snippet: 'Government subsidized crop insurance scheme' }
      ],
      recommended: true,
      rationale: 'Best overall coverage for wheat crops in UP with minimal farmer contribution'
    },
    {
      id: 'scheme-2',
      name: 'Weather Based Crop Insurance (WBCIS)',
      provider: 'ICICI Lombard',
      premiumPerHa: 1500,
      farmerSharePct: 5,
      subsidyPct: 95,
      coveragePerHa: 45000,
      perils: ['Rainfall Deficit', 'Temperature Extremes', 'Humidity', 'Wind Speed'],
      features: [
        'Weather parameter based',
        'No crop cutting experiments',
        'Faster payouts',
        'Objective assessment'
      ],
      enrollmentWindow: 'Oct 1 - Nov 30, 2024',
      citations: [
        { title: 'WBCIS Scheme Details', url: 'https://agricoop.gov.in', snippet: 'Index-based weather insurance' }
      ]
    },
    {
      id: 'scheme-3',
      name: 'Modified NAIS',
      provider: 'National Insurance Company',
      premiumPerHa: 1000,
      farmerSharePct: 3,
      subsidyPct: 97,
      coveragePerHa: 40000,
      perils: ['Drought', 'Flood', 'Cyclone', 'Fire'],
      features: [
        'Traditional coverage',
        'Area-based assessment',
        'Government backed',
        'Wide network'
      ],
      enrollmentWindow: 'Nov 1 - Dec 15, 2024',
      citations: [
        { title: 'NAIS Scheme', url: 'https://agricoop.nic.in', snippet: 'National Agricultural Insurance Scheme' }
      ]
    }
  ],
  'report-2': [
    {
      id: 'scheme-4',
      name: 'PMFBY - Rice Variant',
      provider: 'Agriculture Insurance Company',
      premiumPerHa: 1500,
      farmerSharePct: 2,
      subsidyPct: 98,
      coveragePerHa: 60000,
      perils: ['Flood', 'Drought', 'Pest', 'Disease', 'Cyclone'],
      features: [
        'Paddy-specific coverage',
        'Monsoon risk protection',
        'Quick settlement',
        'Mobile-based claims'
      ],
      enrollmentWindow: 'May 1 - Jul 15, 2024',
      citations: [
        { title: 'PMFBY Rice Coverage', url: 'https://pmfby.gov.in/rice', snippet: 'Specialized rice insurance under PMFBY' }
      ],
      recommended: true,
      rationale: 'Comprehensive monsoon and flood protection for rice cultivation in Tamil Nadu'
    }
  ]
};

let mockApplications: InsuranceApplication[] = [];

// API functions
export const getReports = async (): Promise<CropReport[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockReports];
};

export const getReportById = async (id: string): Promise<CropReport | null> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockReports.find(r => r.id === id) || null;
};

export const getSchemesForReport = async (reportId: string): Promise<InsuranceScheme[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSchemes[reportId] || [];
};

export const compareSchemes = async (reportId: string): Promise<InsuranceScheme[]> => {
  return getSchemesForReport(reportId);
};

export const startInsuranceApplication = async (data: {
  reportId: string;
  schemeId: string;
  farmerName: string;
}): Promise<InsuranceApplication> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const report = mockReports.find(r => r.id === data.reportId);
  const schemes = mockSchemes[data.reportId] || [];
  const scheme = schemes.find(s => s.id === data.schemeId);
  
  const application: InsuranceApplication = {
    applicationId: `app-${Date.now()}`,
    schemeId: data.schemeId,
    reportId: data.reportId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    farmerName: data.farmerName,
    cropName: report?.crop || 'Unknown',
    schemeName: scheme?.name || 'Unknown Scheme'
  };
  
  mockApplications.push(application);
  return application;
};

export const getApplications = async (): Promise<InsuranceApplication[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...mockApplications];
};

// Chat simulation
export const sendChatMessage = async (
  message: string,
  mode: 'onboard' | 'expert',
  context?: { reportId?: string; currentStep?: OnboardingStep }
): Promise<ChatMessage> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate AI response
  let response = '';
  
  if (mode === 'onboard') {
    if (!context?.currentStep || context.currentStep === 'details') {
      response = "Great! Let's start by understanding your crop details. Which crop are you planning to sow this season?";
    } else if (context.currentStep === 'ideals') {
      response = "Perfect! Now, what are your ideal growing conditions and targets for yield?";
    } else if (context.currentStep === 'ready') {
      response = "Excellent! Your crop report is now ready. You can view detailed risk analysis and insurance recommendations.";
    } else {
      response = "I'm gathering more information about your crop. This helps us provide accurate risk assessment.";
    }
  } else {
    if (context?.reportId) {
      response = "Based on your wheat crop in Meerut, I recommend focusing on irrigation planning during the flowering stage, as our analysis shows a critical heat stress risk. The PMFBY scheme would provide the best coverage for your situation.";
    } else {
      response = "Hello! I'm your crop advisory expert. I can help you with crop selection, pest management, irrigation planning, and insurance advice. What would you like to know?";
    }
  }
  
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
    citations: context?.reportId ? [
      { title: 'Wheat Heat Stress Guidelines', url: '#', snippet: 'Managing temperature stress in wheat' }
    ] : undefined
  };
};

export const createReport = async (step: OnboardingStep): Promise<{ reportId: string; status: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (step === 'ready') {
    return { reportId: 'report-1', status: 'ready' };
  }
  
  return { reportId: '', status: 'processing' };
};

import { InsuranceScheme } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Shield, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface InsuranceSchemeCardProps {
  scheme: InsuranceScheme;
  reportId: string;
}

export const InsuranceSchemeCard = ({ scheme, reportId }: InsuranceSchemeCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className={scheme.recommended ? 'border-primary/50 bg-primary/5' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg">{scheme.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{scheme.provider}</p>
          </div>
          {scheme.recommended && (
            <Badge className="bg-primary">Recommended</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scheme.rationale && (
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{scheme.rationale}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Coverage
            </div>
            <p className="font-semibold">₹{scheme.coveragePerHa.toLocaleString()}/ha</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Premium
            </div>
            <p className="font-semibold">₹{scheme.premiumPerHa.toLocaleString()}/ha</p>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Farmer Share</div>
            <p className="font-semibold">{scheme.farmerSharePct}%</p>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Subsidy</div>
            <p className="font-semibold text-primary">{scheme.subsidyPct}%</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Covered Perils:</p>
          <div className="flex flex-wrap gap-1">
            {scheme.perils.map((peril, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {peril}
              </Badge>
            ))}
          </div>
        </div>

        {scheme.features.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Key Features:</p>
            <ul className="text-sm space-y-1">
              {scheme.features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{scheme.enrollmentWindow}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            onClick={() => navigate(`/insurance/enroll?sid=${scheme.id}&rid=${reportId}`)}
          >
            {t('start_enrollment')}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => window.open(scheme.citations[0]?.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

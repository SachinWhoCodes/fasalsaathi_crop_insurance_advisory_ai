import { CropReport } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ReportCardProps {
  report: CropReport;
  onDiscuss?: (reportId: string) => void;
  compact?: boolean;
}

export const ReportCard = ({ report, onDiscuss, compact }: ReportCardProps) => {
  const { t } = useTranslation();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-primary/10 text-primary border-primary/20';
      case 'processing': return 'bg-accent/10 text-accent border-accent/20';
      case 'pending': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-all hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{report.crop}</h3>
            <p className="text-sm text-muted-foreground truncate">{report.variety}</p>
          </div>
          <Badge variant="outline" className={getStatusColor(report.status)}>
            {report.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">{report.city}, {report.state}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sowing:</span>
            <span className="font-medium">
              {new Date(report.sowingDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Season:</span>
            <span className="font-medium">{report.season}</span>
          </div>
          {report.status === 'ready' && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Season Risk:</span>
              <Badge variant="outline" className={getRiskColor(report.seasonRisk.level)}>
                {report.seasonRisk.score}/100
              </Badge>
            </div>
          )}
        </div>

        {report.status === 'ready' && (
          <div className="flex gap-2 mt-4">
            {onDiscuss && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => onDiscuss(report.id)}
              >
                <MessageSquare className="h-4 w-4" />
                {t('discuss_expert')}
              </Button>
            )}
            <Link to={`/reports/${report.id}`} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full gap-2">
                View
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

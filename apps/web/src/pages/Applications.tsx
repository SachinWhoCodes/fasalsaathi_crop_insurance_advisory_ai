import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InsuranceApplication } from '@/lib/types';
import { getApplications } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Applications() {
  const { t } = useTranslation();
  const { isAuthLoading } = useAuth();
  const [applications, setApplications] = useState<InsuranceApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading) loadApplications();
  }, [isAuthLoading]);

  const loadApplications = async () => {
    setLoading(true);
    const data = await getApplications();
    setApplications(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'submitted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('applications')}</h1>
        <p className="text-muted-foreground">Track your insurance application status</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No applications yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Create a crop report and choose an insurance scheme to start your first application
            </p>
            <Link to="/chat/onboard">
              <Button>Start Onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <Card key={app.applicationId} className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{app.schemeName}</h3>
                      <Badge variant="outline" className={getStatusColor(app.status)}>
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Application ID: </span>
                        <span className="font-mono font-medium">{app.applicationId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Farmer: </span>
                        <span className="font-medium">{app.farmerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Crop: </span>
                        <span className="font-medium">{app.cropName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied: </span>
                        <span className="font-medium">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {app.status === 'pending' && (
                      <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg">
                        Your application is under review. You'll be notified once it's processed.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link to={`/reports/${app.reportId}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        View Report
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


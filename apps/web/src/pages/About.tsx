import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Bot, Shield, TrendingUp } from 'lucide-react';

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center rounded-full bg-primary p-4 mb-4">
            <Sprout className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4">About FasalSaathi AI</h1>
          <p className="text-xl text-muted-foreground">
            Empowering farmers with AI-driven crop insurance advisory
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              FasalSaathi AI is dedicated to making crop insurance accessible and understandable for every farmer. 
              We leverage artificial intelligence to analyze crop risks, provide personalized recommendations, 
              and simplify the insurance enrollment process.
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-2">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Advanced machine learning models analyze weather patterns, soil conditions, and historical data 
                to provide accurate risk assessments for each growth stage of your crop.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="rounded-lg bg-accent/10 w-12 h-12 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Comprehensive Coverage</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Compare multiple government-backed insurance schemes including PMFBY, WBCIS, and Modified NAIS. 
                Find the perfect coverage that matches your needs and budget.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Data-Driven Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Access detailed risk contributors, stage-wise analysis, and actionable recommendations 
                to make informed decisions about your crop management and insurance needs.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="rounded-lg bg-accent/10 w-12 h-12 flex items-center justify-center mb-2">
                  <Sprout className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Farmer-First Approach</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Multilingual support, simple chat-based interface, and expert advisory available 24/7 
                to ensure every farmer can benefit from modern agricultural technology.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. Chat-Based Onboarding</h3>
                <p>Answer simple questions about your crop through natural conversation with our AI assistant.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2. Risk Analysis</h3>
                <p>Get detailed seasonal and stage-wise risk assessments based on location, weather, and crop type.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3. Insurance Recommendations</h3>
                <p>Receive personalized scheme suggestions with detailed comparisons and enrollment guidance.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4. Easy Enrollment</h3>
                <p>Complete your insurance application online with step-by-step support from our platform.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Built with modern web technologies including React, TypeScript, and Tailwind CSS. 
              Our AI models are powered by state-of-the-art machine learning frameworks, ensuring 
              fast, accurate, and reliable predictions. The platform is fully responsive and works 
              seamlessly across desktop, tablet, and mobile devices.
            </CardContent>
          </Card>

          <div className="text-center mt-12 p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl">
            <h2 className="text-2xl font-bold mb-3">Join Thousands of Farmers</h2>
            <p className="text-muted-foreground">
              Start your journey towards secure and informed farming today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

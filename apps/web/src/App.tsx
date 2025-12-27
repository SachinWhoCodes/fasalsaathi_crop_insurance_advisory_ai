import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ChatOnboard from "./pages/ChatOnboard";
import ChatExpert from "./pages/ChatExpert";
import FormOnboard from "./pages/FormOnboard";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import Insurance from "./pages/Insurance";
import Applications from "./pages/Applications";
import About from "./pages/About";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import InsuranceEnroll from "./pages/InsuranceEnroll";
import "./i18n";

const queryClient = new QueryClient();

const App = () => {
  // Set dark mode by default
  if (!document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.add('dark');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/onboard" element={<FormOnboard />} />
                <Route path="/chat/onboard" element={<ChatOnboard />} />
                <Route path="/chat/expert" element={<ChatExpert />} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/reports/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
                <Route path="/insurance" element={<ProtectedRoute><Insurance /></ProtectedRoute>} />
                <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/insurance/enroll" element={<ProtectedRoute><InsuranceEnroll /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

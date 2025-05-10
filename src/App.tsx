
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import Index from "./pages/Index";
import AccueilPage from "./pages/AccueilPage";
import LoginPage from "./pages/LoginPage";
import DocumentPage from "./pages/DocumentPage";
import DocumentsPage from "./pages/DocumentsPage";
import CategoryPage from "./pages/CategoryPage";
import CategoriesPage from "./pages/CategoriesPage";
import UploadPage from "./pages/UploadPage";
import NotFound from "./pages/NotFound";
import GeneratePage from "./pages/GeneratePage";
import DocumentSummaryPage from "./pages/DocumentSummaryPage";
import HistoryPage from "./pages/HistoryPage";
import ExercisesPage from "./pages/ExercisesPage";
import LandingPage from "./pages/LandingPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/cancel" element={<CancelPage />} />
            
            {/* Routes protégées par abonnement */}
            <Route path="/accueil" element={<SubscriptionGuard><AccueilPage /></SubscriptionGuard>} />
            <Route path="/documents" element={<SubscriptionGuard><DocumentsPage /></SubscriptionGuard>} />
            <Route path="/documents/:id" element={<SubscriptionGuard><DocumentPage /></SubscriptionGuard>} />
            <Route path="/categories" element={<SubscriptionGuard><CategoriesPage /></SubscriptionGuard>} />
            <Route path="/categories/:id" element={<SubscriptionGuard><CategoryPage /></SubscriptionGuard>} />
            <Route path="/upload" element={<SubscriptionGuard><UploadPage /></SubscriptionGuard>} />
            <Route path="/generate" element={<SubscriptionGuard><GeneratePage /></SubscriptionGuard>} />
            <Route path="/summarize-document" element={<SubscriptionGuard><DocumentSummaryPage /></SubscriptionGuard>} />
            <Route path="/historique" element={<SubscriptionGuard><HistoryPage /></SubscriptionGuard>} />
            <Route path="/exercises" element={<SubscriptionGuard><ExercisesPage /></SubscriptionGuard>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SubscriptionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

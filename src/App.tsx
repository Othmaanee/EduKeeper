
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
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
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import DocumentSummaryPage from "./pages/DocumentSummaryPage";
import HistoryPage from "./pages/HistoryPage";
import ExercisesPage from "./pages/ExercisesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/accueil" element={<AccueilPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:id" element={<CategoryPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/dashboard-enseignant" element={<TeacherDashboardPage />} />
            <Route path="/summarize-document" element={<DocumentSummaryPage />} />
            <Route path="/historique" element={<HistoryPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

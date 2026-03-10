import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ClientPage from "./pages/ClientPage";
import LocaleSelector from "./pages/LocaleSelector";
import LocalizedClientPage from "./pages/LocalizedClientPage";
import ReaderPage from "./pages/ReaderPage";
import ReadingResultPage from "./pages/ReadingResultPage";
import NotFound from "./pages/NotFound";
import { localeConfigs } from "@/config/locales";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ClientPage />} />
            <Route path="/locales" element={<LocaleSelector />} />
            <Route path="/kr" element={<LocalizedClientPage config={localeConfigs.kr} />} />
            <Route path="/jp" element={<LocalizedClientPage config={localeConfigs.jp} />} />
            <Route path="/us" element={<LocalizedClientPage config={localeConfigs.us} />} />
            <Route path="/reader" element={<ReaderPage />} />
            <Route path="/reader/result/:id" element={<ReadingResultPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

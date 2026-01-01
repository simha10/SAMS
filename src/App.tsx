import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { ThemeProvider } from "next-themes";
import { Navigate } from "react-router-dom";

// Import authAPI
import { authAPI } from "@/services/api";
import { NetworkProvider } from "@/contexts/NetworkContext";
import AppContent from "./AppContent";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <NetworkProvider>
      <ThemeProvider 
        defaultTheme="dark" 
        storageKey="vite-ui-theme"
        attribute="class"
        enableSystem={false}
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </NetworkProvider>
  );
};

export default App;
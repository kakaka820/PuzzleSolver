//client/src/App.tsx
//ルーティング設定

import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Solver from "@/pages/Solver";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calibration from "@/pages/Calibration";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calibration" component={Calibration} />
      <Route path="/" component={Solver} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Router base="/PuzzleSolver">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
    </Router>
  );
}

export default App;

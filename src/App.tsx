import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Carregamento lazy — cada página vira um chunk separado no build
// Reduz o bundle inicial de ~540KB para ~150KB
const Login          = lazy(() => import("./pages/Login"));
const Signup         = lazy(() => import("./pages/Signup"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Analise        = lazy(() => import("./pages/Analise"));

// Fallback simples enquanto o chunk carrega
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/projetos/:id"   element={<ProjectDetails />} />
          <Route path="/analise"        element={<Analise />} />
          <Route path="*"               element={<Login />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;

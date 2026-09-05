import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
// Carregamento lazy — cada página vira um chunk separado no build
// Reduz o bundle inicial de ~540KB para ~150KB
const Home            = lazy(() => import("./pages/marketing/Home"));
const ComoFunciona    = lazy(() => import("./pages/marketing/ComoFunciona"));
const NormasCobertas  = lazy(() => import("./pages/marketing/NormasCobertas"));
const Sobre            = lazy(() => import("./pages/marketing/Sobre"));
const ComingSoon       = lazy(() => import("./pages/marketing/ComingSoon"));
const Login           = lazy(() => import("./pages/Login"));
const Signup          = lazy(() => import("./pages/Signup"));
const ResetPassword    = lazy(() => import("./pages/ResetPassword"));
const Dashboard       = lazy(() => import("./pages/Dashboard"));
const ProjectDetails  = lazy(() => import("./pages/ProjectDetails"));
const Analise          = lazy(() => import("./pages/Analise"));
const Privacidade      = lazy(() => import("./pages/Privacidade"));
const Termos           = lazy(() => import("./pages/Termos"));
const Consentimento     = lazy(() => import("./pages/Consentimento"));
const MinhaConta       = lazy(() => import("./pages/MinhaConta"));
const AdminPainel      = lazy(() => import("./pages/AdminPainel"));
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
          <Route path="/"               element={<Home />} />
          <Route path="/como-funciona"  element={<ComoFunciona />} />
          <Route path="/normas" element={<NormasCobertas />} />
          <Route
            path="/precos"
            element={
              <ComingSoon
                title="Preços"
                seoDescription="Planos e preços do VISAcheck GO — em breve."
              />
            }
          />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/projetos/:id"   element={<ProjectDetails />} />
          <Route path="/analise"        element={<Analise />} />
          <Route path="/privacidade"    element={<Privacidade />} />
          <Route path="/termos"         element={<Termos />} />
          <Route path="/consentimento"  element={<Consentimento />} />
          <Route path="/minha-conta"    element={<MinhaConta />} />
          <Route path="/admin"          element={<AdminPainel />} />
          <Route path="*"               element={<Login />} />
        </Routes>
      </Suspense>
    </div>
  );
}
export default App;

import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;

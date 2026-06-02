import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../pages/LoginPage";
import { WorkspacePage } from "../pages/WorkspacePage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/workspace/chat" element={<WorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}


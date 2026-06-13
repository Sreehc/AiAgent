import { Route, Routes } from "react-router-dom";
import { AppShell } from "../components/shell/AppShell";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AccountPage } from "../pages/AccountPage";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { AdminAuditPage } from "../pages/AdminAuditPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { HistoryPage } from "../pages/HistoryPage";
import { KnowledgeBasesPage } from "../pages/KnowledgeBasesPage";
import { LoginPage } from "../pages/LoginPage";
import { McpServersPage } from "../pages/McpServersPage";
import { ImageGenerationPage } from "../pages/ImageGenerationPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { RagEvaluationPage } from "../pages/RagEvaluationPage";
import { WorkspacePage } from "../pages/WorkspacePage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/invite" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/workspace/chat" element={<WorkspacePage />} />
          <Route path="/workspace/knowledge-bases" element={<KnowledgeBasesPage />} />
          <Route path="/workspace/image-generation" element={<ImageGenerationPage />} />
          <Route path="/workspace/history" element={<HistoryPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/mcp-servers" element={<McpServersPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
          <Route path="/admin/rag-evaluations" element={<RagEvaluationPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

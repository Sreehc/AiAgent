import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "../components/shell/AppShell";
import { ProtectedRoute } from "../components/ProtectedRoute";

const AccountPage = lazy(() => import("../pages/AccountPage").then((module) => ({ default: module.AccountPage })));
const AdminOverviewPage = lazy(() => import("../pages/AdminOverviewPage").then((module) => ({ default: module.AdminOverviewPage })));
const AdminSettingsPage = lazy(() => import("../pages/AdminSettingsPage").then((module) => ({ default: module.AdminSettingsPage })));
const AdminAuditPage = lazy(() => import("../pages/AdminAuditPage").then((module) => ({ default: module.AdminAuditPage })));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const HistoryPage = lazy(() => import("../pages/HistoryPage").then((module) => ({ default: module.HistoryPage })));
const KnowledgeBasesPage = lazy(() => import("../pages/KnowledgeBasesPage").then((module) => ({ default: module.KnowledgeBasesPage })));
const LoginPage = lazy(() => import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const McpServersPage = lazy(() => import("../pages/McpServersPage").then((module) => ({ default: module.McpServersPage })));
const ImageGenerationPage = lazy(() => import("../pages/ImageGenerationPage").then((module) => ({ default: module.ImageGenerationPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const RegisterPage = lazy(() => import("../pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage })));
const RagEvaluationPage = lazy(() => import("../pages/RagEvaluationPage").then((module) => ({ default: module.RagEvaluationPage })));
const WorkspacePage = lazy(() => import("../pages/WorkspacePage").then((module) => ({ default: module.WorkspacePage })));

export function AppRouter() {
  return (
    <Suspense fallback={null}>
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
            <Route path="/admin/overview" element={<AdminOverviewPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/mcp-servers" element={<McpServersPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/rag-evaluations" element={<RagEvaluationPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

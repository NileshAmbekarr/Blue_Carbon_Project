// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Web3Provider from './providers/Web3Provider';
import Home from './pages/Home';
import LoginPage from '@/pages/auth/Login';
// import RegisterPage from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import ProjectsListPage from '@/pages/projects/ProjectsList';
import MRVReview from './pages/audits/MRVReview';
import PlotEditor from './pages/projects/PlotEditor';
import MonitoringEvents from './pages/monitoring/MonitoringEvents';
import CreditsDashboard from './pages/credits/CreditsDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AuditorDashboard from '@/pages/audits/AuditorDashboard';
import ProjectDetails from '@/pages/projects/ProjectDetails';

function App() {
  return (
    <Web3Provider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<LoginPage />} />
        {/* <Route path="/auth/register" element={<RegisterPage />} /> */}
        
        {/* Protected Routes */}
        <Route
          path="/app"
          element={
            <Layout>
              <ProtectedRoute />
            </Layout>
          }
        >
          {/* Routes accessible to all logged-in users */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/:id/plots" element={<PlotEditor />} />
          <Route path="projects/:id/monitoring" element={<MonitoringEvents />} />
          <Route path="credits" element={<CreditsDashboard />} />

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* Auditor Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['auditor']} />}>
            <Route path="audits" element={<AuditorDashboard />} />
            <Route path="audits/mrv/:id" element={<MRVReview />} />
          </Route>
        </Route>

        {/* Public Explorer Routes */}
        <Route path="/public/explorer" element={<div>Public Explorer - Coming Soon</div>} />
        <Route path="/public/documentation" element={<div>Documentation - Coming Soon</div>} />
        <Route path="/public/help" element={<div>Help Center - Coming Soon</div>} />
        <Route path="/public/contact" element={<div>Contact Us - Coming Soon</div>} />
        <Route path="/public/privacy" element={<div>Privacy Policy - Coming Soon</div>} />
        <Route path="/public/terms" element={<div>Terms of Service - Coming Soon</div>} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Web3Provider>
  );
}

export default App;
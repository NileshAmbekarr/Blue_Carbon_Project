// App.jsx
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Web3Provider from './providers/Web3Provider';
import LoginPage from '@/pages/auth/Login';
import Dashboard from '@/pages/dashboard/Dashboard';
import ProjectsListPage from '@/pages/projects/ProjectsList';
import MRVReview from './pages/audits/MRVReview';
import PlotEditor from './pages/projects/PlotEditor';
import MonitoringEvents from './pages/monitoring/MonitoringEvents';
import CreditsDashboard from './pages/credits/CreditsDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AuditorDashboard from '@/pages/audits/AuditorDashboard';
import ProjectDetails from '@/pages/projects/ProjectDetails';
// ... other page imports

// // Temporary Imports 
// import BypassAuth from '@/components/DevTools/BypassAuth';

function App() {
  return (
    <Web3Provider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Layout>
              <ProtectedRoute />
            </Layout>
          }
        >
        {/* Routes accessible to all logged-in users */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<ProjectsListPage />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="projects/:id/plots" element={<PlotEditor />} />
        <Route path="projects/:id/monitoring" element={<MonitoringEvents />} />
        <Route path="credits" element={<CreditsDashboard />} />

        {/* Admin Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
            {/* ... other admin routes */}
        </Route>

         {/* Auditor Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Auditor']} />}>
            <Route path="audits" element={<AuditorDashboard />} />
            <Route path="audits/mrv/:id" element={<MRVReview />} />
        </Route>
      </Route>
      {/* ... public explorer routes */}
    </Routes>
    </Web3Provider>
  );
}

export default App;
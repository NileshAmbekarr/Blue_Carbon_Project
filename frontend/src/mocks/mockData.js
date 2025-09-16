// src/mocks/mockData.js
export const mockUsers = {
  admin: {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@bluecarbon.com',
    role: 'Admin',
    organization: 'NCCR'
  },
  auditor: {
    id: 'auditor-1',
    name: 'Auditor User',
    email: 'auditor@bluecarbon.com',
    role: 'Auditor',
    organization: 'Audit Firm'
  },
  developer: {
    id: 'developer-1',
    name: 'Developer User',
    email: 'developer@bluecarbon.com',
    role: 'Developer',
    organization: 'Green NGO'
  }
};

export const mockProjects = [
  {
    id: 'proj-1',
    name: 'Mangrove Restoration - Kerala',
    location: 'Kerala, India',
    area: 500,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2026-01-15',
    carbonCredits: 2500,
    lastAudit: '2024-08-15',
    coordinator: 'Dr. Priya Kumar'
  },
  {
    id: 'proj-2',
    name: 'Urban Forest - Mumbai',
    location: 'Mumbai, India',
    area: 750,
    status: 'pending',
    startDate: '2024-03-01',
    carbonCredits: 1800,
    coordinator: 'Mr. Rajesh Patel'
  },
  {
    id: 'proj-3',
    name: 'Agroforestry - Karnataka',
    location: 'Karnataka, India',
    area: 320,
    status: 'completed',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    carbonCredits: 950,
    lastAudit: '2024-06-30',
    coordinator: 'Ms. Lakshmi Rao'
  }
];

export const mockCredits = [
  {
    id: 'cred-1',
    projectId: 'proj-1',
    amount: 500,
    vintage: '2024',
    status: 'issued',
    issuedDate: '2024-09-01',
    blockchainTx: '0x1234...abcd'
  },
  {
    id: 'cred-2',
    projectId: 'proj-2',
    amount: 300,
    vintage: '2024',
    status: 'pending',
    blockchainTx: null
  }
];

export const mockAudits = [
  {
    id: 'audit-1',
    projectId: 'proj-1',
    auditorId: 'auditor-1',
    status: 'in_progress',
    startDate: '2024-09-01',
    findings: [],
    recommendations: []
  },
  {
    id: 'audit-2',
    projectId: 'proj-3',
    auditorId: 'auditor-1',
    status: 'completed',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    findings: ['All standards met'],
    recommendations: ['Improve monitoring frequency']
  }
];

export const mockDashboardStats = {
  totalProjects: 15,
  activeProjects: 8,
  totalCredits: 12500,
  creditsThisYear: 3200,
  pendingAudits: 3,
  completedAudits: 12,
  monthlyGrowth: 15.2
};

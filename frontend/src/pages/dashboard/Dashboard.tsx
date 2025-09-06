// pages/dashboard/Dashboard.tsx
import React from 'react';
import { useAuth } from '../../hooks/auth/useAuth';
import { useMockDashboardStats, useMockProjects } from '../../hooks/queries/useMockQueries';
import { 
  FolderIcon, 
  DocumentCheckIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isAdmin, isAuditor, isDeveloper } = useAuth();
  
  // Use mock data queries
  const { data: dashboardStats, isLoading: statsLoading } = useMockDashboardStats();
  const { data: projectsData } = useMockProjects();
  
  // Mock data for recent activity - replace with actual API call later
  const recentActivity = [
    {
      id: 1,
      type: 'project_created',
      title: 'New mangrove restoration project created',
      description: 'Chilika Lake Mangrove Project - 150 hectares',
      time: '2 hours ago',
      user: 'Odisha Forest Dept.'
    },
    {
      id: 2,
      type: 'mrv_submitted',
      title: 'MRV report submitted for review',
      description: 'Sundarbans Conservation Project - Q3 2024',
      time: '4 hours ago',
      user: 'West Bengal NGO'
    },
    {
      id: 3,
      type: 'credits_issued',
      title: 'Carbon credits issued',
      description: '1,250 tCO₂e credits issued for verified project',
      time: '1 day ago',
      user: 'System'
    }
  ];

  // Use mock stats or fallback to defaults
  const stats = dashboardStats ? {
    totalProjects: dashboardStats.totalProjects,
    activeProjects: dashboardStats.activeProjects,
    pendingMRV: dashboardStats.pendingMRV || 0,
    totalCredits: dashboardStats.totalCredits,
    issuedCredits: dashboardStats.issuedCredits,
    retiredCredits: dashboardStats.retiredCredits || 0,
    pendingApprovals: dashboardStats.pendingApprovals || 0,
    organizations: dashboardStats.organizations
  } : {
    totalProjects: 0,
    activeProjects: 0,
    pendingMRV: 0,
    totalCredits: 0,
    issuedCredits: 0,
    retiredCredits: 0,
    pendingApprovals: 0,
    organizations: 0
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? (
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="sr-only">{change > 0 ? 'Increased' : 'Decreased'} by</span>
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.email}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your blue carbon projects today.
          </p>
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user?.roles?.join(', ') || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          change={12}
          icon={FolderIcon}
          color="blue"
        />
        
        {(isAuditor || isAdmin) && (
          <StatCard
            title="Pending MRV Reviews"
            value={stats.pendingMRV}
            change={-5}
            icon={DocumentCheckIcon}
            color="orange"
          />
        )}
        
        <StatCard
          title="Total Credits Issued"
          value={`${(stats.issuedCredits || 0).toLocaleString()} tCO₂e`}
          change={8}
          icon={CurrencyDollarIcon}
          color="green"
        />
        
        {isAdmin && (
          <StatCard
            title="Active Organizations"
            value={stats.organizations}
            change={3}
            icon={ChartBarIcon}
            color="purple"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {activity.user.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {activity.time} • {activity.user}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <a
                href="#"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all activity
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-6 grid grid-cols-1 gap-4">
              {isDeveloper && (
                <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                      <FolderIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Create New Project
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Start a new blue carbon restoration project with baseline documentation.
                    </p>
                  </div>
                </button>
              )}
              
              {(isAuditor || isAdmin) && (
                <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                      <DocumentCheckIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Review MRV Reports
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Review and approve pending MRV reports from project developers.
                    </p>
                  </div>
                </button>
              )}
              
              <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <CurrencyDollarIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    View Credits
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage your carbon credit portfolio and track transactions.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
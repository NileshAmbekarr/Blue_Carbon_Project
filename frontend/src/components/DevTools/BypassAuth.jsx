// src/components/DevTools/BypassAuth.jsx
import React from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { mockUsers } from '@/mocks/mockData';

const BypassAuth = () => {
  const { user, setAuth, clearAuth } = useAuthStore();

  const loginAs = (role) => {
    const mockUser = mockUsers[role];
    if (mockUser) {
      setAuth(`mock-token-${role}`, mockUser);
    }
  };

  if (user) {
    return null; // Don't show if already logged in
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Frontend Testing Mode</h2>
        <p className="text-gray-600 text-center mb-6">
          Backend not ready? No problem! Test with mock data.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => loginAs('admin')}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium"
          >
            Login as Admin (NCCR)
          </button>

          <button
            onClick={() => loginAs('auditor')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
          >
            Login as Auditor
          </button>

          <button
            onClick={() => loginAs('developer')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium"
          >
            Login as Developer (NGO)
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Dev Mode:</strong> This bypasses authentication for testing.
            All data is mock data and won't persist.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BypassAuth;

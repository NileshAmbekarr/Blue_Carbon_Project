// src/components/DevTools/RoleSwitcher.jsx
import React from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { mockUsers } from '@/mocks/mockData';

const RoleSwitcher = () => {
  const { user, setAuth } = useAuthStore();

  const switchRole = (role) => {
    const mockUser = mockUsers[role];
    if (mockUser) {
      setAuth(`mock-token-${role}`, mockUser);
    }
  };

  const roles = [
    { key: 'admin', label: 'Admin (NCCR)', color: 'bg-red-500' },
    { key: 'auditor', label: 'Auditor', color: 'bg-blue-500' },
    { key: 'developer', label: 'Developer (NGO)', color: 'bg-green-500' }
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="text-sm font-semibold mb-2">Dev: Switch Role</h3>
      <div className="flex gap-2">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => switchRole(role.key)}
            className={`px-3 py-1 text-xs rounded ${
              user?.roles?.includes(role.key.charAt(0).toUpperCase() + role.key.slice(1))
                ? `${role.color} text-white`
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-600">
        Current: {user?.roles?.join(', ') || 'None'}
      </div>
    </div>
  );
};

export default RoleSwitcher;

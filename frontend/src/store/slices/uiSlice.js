// store/slices/uiSlice.js
import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  theme: 'light',
  language: 'en',
  notifications: [],
  modals: {
    walletConnect: false,
    projectForm: false,
    evidenceViewer: false,
    confirmDialog: false
  },
  
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  setTheme: (theme) => set({ theme }),
  
  setLanguage: (language) => set({ language }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    }]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  openModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: true }
  })),
  
  closeModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: false }
  })),
  
  closeAllModals: () => set({
    modals: {
      walletConnect: false,
      projectForm: false,
      evidenceViewer: false,
      confirmDialog: false
    }
  })
}));
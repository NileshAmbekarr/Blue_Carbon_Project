// store/slices/creditsSlice.js
import { create } from 'zustand';

export const useCreditsStore = create((set, get) => ({
  credits: [],
  batches: [],
  transactions: [],
  selectedBatch: null,
  loading: false,
  error: null,
  
  setCredits: (credits) => set({ credits }),
  setBatches: (batches) => set({ batches }),
  setTransactions: (transactions) => set({ transactions }),
  setSelectedBatch: (batch) => set({ selectedBatch: batch }),
  
  addBatch: (batch) => set((state) => ({
    batches: [...state.batches, batch]
  })),
  
  updateBatch: (id, updates) => set((state) => ({
    batches: state.batches.map(batch => 
      batch.id === id ? { ...batch, ...updates } : batch
    )
  })),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
// store/slices/auditsSlice.js
import { create } from 'zustand';

export const useAuditsStore = create((set, get) => ({
  audits: [],
  selectedAudit: null,
  evidence: [],
  loading: false,
  error: null,
  
  setAudits: (audits) => set({ audits }),
  setSelectedAudit: (audit) => set({ selectedAudit: audit }),
  setEvidence: (evidence) => set({ evidence }),
  
  addAudit: (audit) => set((state) => ({
    audits: [...state.audits, audit]
  })),
  
  updateAudit: (id, updates) => set((state) => ({
    audits: state.audits.map(audit => 
      audit.id === id ? { ...audit, ...updates } : audit
    ),
    selectedAudit: state.selectedAudit?.id === id 
      ? { ...state.selectedAudit, ...updates } 
      : state.selectedAudit
  })),
  
  addEvidence: (evidence) => set((state) => ({
    evidence: [...state.evidence, evidence]
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
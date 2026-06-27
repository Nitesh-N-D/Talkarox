import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  activeModal: null,
  emergencyBroadcast: null, // { id, title, message, createdAt }
  onboardingStep: 0,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  setEmergencyBroadcast: (broadcast) => set({ emergencyBroadcast: broadcast }),
  clearEmergencyBroadcast: () => set({ emergencyBroadcast: null }),

  setOnboardingStep: (step) => set({ onboardingStep: step }),
}));

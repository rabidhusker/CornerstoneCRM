import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Command menu state
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  toggleCommandMenu: () => void;

  // Active modal state
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  closeModal: () => void;

  // Mobile menu state
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Command menu
      commandMenuOpen: false,
      setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
      toggleCommandMenu: () =>
        set((state) => ({ commandMenuOpen: !state.commandMenuOpen })),

      // Active modal
      activeModal: null,
      setActiveModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    }),
    {
      name: "cstg-crm-ui-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

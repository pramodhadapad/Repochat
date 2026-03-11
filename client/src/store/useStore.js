import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      theme: 'dark',
      isSidebarCollapsed: false,
      currentRepo: null,
      messages: [],
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setCurrentRepo: (repo) => set({ currentRepo: repo }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ 
        messages: [message, ...state.messages] 
      })),
      
      logout: () => set({ user: null, token: null, currentRepo: null, messages: [] }),
    }),
    {
      name: 'repochat-storage', // unique name
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        theme: state.theme,
        isSidebarCollapsed: state.isSidebarCollapsed
      }), // only persist these fields
    }
  )
);

export default useStore;

import { useCallback } from 'react';

export const useNavigateToSection = () => {
  return useCallback((section: string) => {
    // This is a simple hook to abstract the navigation logic
    // In a real app, this might use React Router or a context
    
    // Find the onNavigate function from the App component
    // This is a bit of a hack, but it works for our demo
    const appComponent = window.appComponent;
    if (appComponent && typeof appComponent.handleNavigation === 'function') {
      appComponent.handleNavigation(section);
    } else {
      console.warn('App component or handleNavigation function not found');
    }
  }, []);
};
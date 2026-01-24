// Create a new file: context/ScrollContext.jsx
import React, { createContext, useContext, useState } from 'react';

const ScrollContext = createContext();

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
};

export const ScrollProvider = ({ children }) => {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  
  const hideTabBar = () => setTabBarVisible(false);
  const showTabBar = () => setTabBarVisible(true);
  const toggleTabBar = () => setTabBarVisible(prev => !prev);

  return (
    <ScrollContext.Provider value={{
      tabBarVisible,
      hideTabBar,
      showTabBar,
      toggleTabBar
    }}>
      {children}
    </ScrollContext.Provider>
  );
};
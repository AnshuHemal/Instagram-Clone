/**
 * TabPagerContext
 *
 * Provides a context and helper hook to manage the scroll state of the main
 * TabLayout pager. Allows child horizontal lists (stories, suggestions, viewpagers)
 * to temporarily disable parent page swiping for a fluid, conflict-free swipe UX.
 */

import React, { createContext, useContext, useState } from 'react';

interface TabPagerContextProps {
  pagerScrollEnabled: boolean;
  setPagerScrollEnabled: (enabled: boolean) => void;
}

const TabPagerContext = createContext<TabPagerContextProps | undefined>(undefined);

export const TabPagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);

  return (
    <TabPagerContext.Provider value={{ pagerScrollEnabled, setPagerScrollEnabled }}>
      {children}
    </TabPagerContext.Provider>
  );
};

export const useTabPager = () => {
  const context = useContext(TabPagerContext);
  if (!context) {
    throw new Error('useTabPager must be used within a TabPagerProvider');
  }
  return context;
};

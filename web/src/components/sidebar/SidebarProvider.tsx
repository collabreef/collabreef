import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "react-router";

interface SidebarContextType {
  isOpen: boolean;
  isCollapse: boolean;
  isOver1280: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const location = useLocation();
  const over1280 = window.innerWidth >= 1280;
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapse, setIsCollapse] = useState(over1280 && true);
  const [isOver1280, setIsOver1280] = useState(over1280);

  const openSidebar = () => {
    setIsOpen(true)
  }
  const closeSidebar = () => {
    setIsOpen(false);
  }
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  }
  const collapseSidebar = () => {
    setIsCollapse(true);
  }
  const expandSidebar = () => {
    setIsCollapse(false);
  }

  useEffect(() => {
    const handleResize = () => {
      const over1280 = window.innerWidth >= 1280;
      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
      if (isTouchDevice) return
      setIsOpen(false);
      setIsCollapse(over1280 && true)
      setIsOver1280(over1280);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle route changes - close sidebar on small screens, keep open on large screens
  useEffect(() => {
    if (!isOver1280) {
      setIsOpen(false);
    }
  }, [location.pathname, isOver1280]);

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapse, openSidebar, closeSidebar, toggleSidebar, collapseSidebar, expandSidebar, isOver1280 }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be use in SidebarProvider ");
  }
  return context;
};
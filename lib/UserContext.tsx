"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Event = {
  id: string;
  name: string;
  date: string; // ISO string or YYYY-MM-DD
  syllabus: string;
  phoneNumber?: string; // Optional field for the Twilio Agentic Call feature
  plan?: any; // To store the generated JSON plan later
  completedTasks?: string[]; // Store IDs or indices of completed tasks
  chatHistory?: any[]; // ISO-scoping history to each event
};

export type UserProfile = {
  isLoggedIn: boolean;
  name: string;
  studyLevel: string;
  school: string;
  course: string;
  events: Event[];
  chatHistorySnapshot: any[]; // Store chat context for the AI
};

const defaultProfile: UserProfile = {
  isLoggedIn: false,
  name: "",
  studyLevel: "",
  school: "",
  course: "",
  events: [],
  chatHistorySnapshot: [],
};

type UserContextType = {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addEvent: (event: Omit<Event, "id">) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  toggleTaskCompletion: (eventId: string, taskId: string) => void;
  saveEventHistory: (eventId: string, history: any[]) => void;
  syncAllSchedules: () => void;
  updateEventPlanTasks: (eventId: string, newTasks: any[]) => void;
  syncEventStartTime: (eventId: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isMounted, setIsMounted] = useState(false);

  // Load from session storage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      // Clear out any old persistent data from previous app versions
      if (localStorage.getItem("studysmart_user")) {
        localStorage.removeItem("studysmart_user");
      }
      
      const stored = sessionStorage.getItem("studysmart_user");
      if (stored) {
        setProfile({ ...defaultProfile, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to parse user profile", e);
    }
  }, []);

  // Save to session storage when profile changes
  useEffect(() => {
    if (isMounted) {
      try {
        sessionStorage.setItem("studysmart_user", JSON.stringify(profile));
      } catch (e) {
        console.error("Failed to stringify user profile", e);
      }
    }
  }, [profile, isMounted]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const addEvent = (event: Omit<Event, "id">) => {
    const newEvent: Event = { ...event, id: Date.now().toString() };
    setProfile((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)),
    }));
  };

  const deleteEvent = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.filter((ev) => ev.id !== id),
    }));
  };
  
  const toggleTaskCompletion = (eventId: string, taskId: string) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.map((ev) => {
        if (ev.id === eventId) {
          const completedTasks = ev.completedTasks || [];
          const isCompleted = completedTasks.includes(taskId);
          return {
            ...ev,
            completedTasks: isCompleted
              ? completedTasks.filter((id) => id !== taskId)
              : [...completedTasks, taskId],
          };
        }
        return ev;
      }),
    }));
  };

  const logout = () => {
    setProfile(defaultProfile);
    if (typeof window !== "undefined") {
      localStorage.clear();      // Hard reset for ALL project data
      sessionStorage.clear();    // Wipe session-specific tokens/history
      window.location.href = "/";
    }
  };

  const saveEventHistory = (eventId: string, history: any[]) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.map((ev) => 
        ev.id === eventId ? { ...ev, chatHistory: history } : ev
      ),
    }));
  };

  const syncAllSchedules = () => {
    const now = new Date().toISOString();
    setProfile((prev) => ({
      ...prev,
      events: prev.events.map((ev) => 
        ev.plan ? { ...ev, plan: { ...ev.plan, generatedAt: now } } : ev
      ),
    }));
  };

  const updateEventPlanTasks = (eventId: string, newTasks: any[]) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.map((ev) => 
        ev.id === eventId 
          ? { ...ev, plan: { ...ev.plan, today_tasks: newTasks, generatedAt: new Date().toISOString() } } 
          : ev
      ),
    }));
  };

  const syncEventStartTime = (eventId: string) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events.map((ev) =>
        ev.id === eventId
          ? { ...ev, plan: { ...ev.plan, generatedAt: new Date().toISOString() } }
          : ev
      ),
    }));
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <UserContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleTaskCompletion,
        saveEventHistory,
        syncAllSchedules,
        updateEventPlanTasks,
        syncEventStartTime,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

const PlanContext = createContext();

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState({ id: 'free', name: 'Kostenlos', is_active: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Plan direkt aus dem User-Profil lesen - kein extra API-Call nötig
    if (user) {
      const planId = user.premium_plan_id || 'free';
      const planNames = {
        'free': 'Kostenlos',
        'basic': 'Basic',
        'pro': 'Pro',
        'elite': 'Elite',
        'ultimate': 'Ultimate',
      };
      setPlan({
        id: planId,
        name: planNames[planId] || 'Kostenlos',
        is_active: planId !== 'free',
      });
    } else {
      setPlan({ id: 'free', name: 'Kostenlos', is_active: false });
    }
    setLoading(false);
  }, [user]);

  const hasFeature = (requiredPlan) => {
    if (!plan) return false;
    const planHierarchy = {
      'free': 0, 'basic': 1, 'pro': 2, 'elite': 3, 'ultimate': 4
    };
    const userLevel = planHierarchy[plan.id] || 0;
    const requiredLevel = planHierarchy[requiredPlan] || 0;
    return userLevel >= requiredLevel;
  };

  const reload = () => {}; // Kein Reload nötig, kommt aus AuthContext

  return (
    <PlanContext.Provider value={{ plan, loading, hasFeature, reload }}>
      {children}
    </PlanContext.Provider>
  );
}

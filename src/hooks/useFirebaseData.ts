'use client';

import { useState, useEffect } from 'react';
import { 
  CompetitorService, 
  HourlyDataService, 
  GrossePriseService, 
  JudgeService,
  UserService,
  CompetitionSettingsService,
  type CompetitorDoc,
  type HourlyDataDoc,
  type GrossePriseDoc,
  type JudgeDoc,
  type UserDoc,
  type CompetitionSettingsDoc
} from '@/lib/firestore';

// Hook for competitors data
export function useCompetitors() {
  const [competitors, setCompetitors] = useState<CompetitorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = CompetitorService.subscribeToCompetitors((data) => {
      setCompetitors(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveCompetitor = async (competitor: Omit<CompetitorDoc, 'lastUpdate'>) => {
    try {
      const result = await CompetitorService.saveCompetitor(competitor);
      if (!result.success) {
        setError('Failed to save competitor');
      }
      return result;
    } catch (err) {
      setError('Failed to save competitor');
      return { success: false, error: err };
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      const result = await CompetitorService.deleteCompetitor(id);
      if (!result.success) {
        setError('Failed to delete competitor');
      }
      return result;
    } catch (err) {
      setError('Failed to delete competitor');
      return { success: false, error: err };
    }
  };

  return {
    competitors,
    loading,
    error,
    saveCompetitor,
    deleteCompetitor
  };
}

// Hook for hourly data
export function useHourlyData() {
  const [hourlyData, setHourlyData] = useState<HourlyDataDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = HourlyDataService.subscribeToHourlyData((data) => {
      setHourlyData(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveHourlyEntry = async (entry: Omit<HourlyDataDoc, 'lastUpdate'>) => {
    try {
      const result = await HourlyDataService.saveHourlyEntry(entry);
      if (!result.success) {
        setError('Failed to save hourly entry');
      }
      return result;
    } catch (err) {
      setError('Failed to save hourly entry');
      return { success: false, error: err };
    }
  };

  return {
    hourlyData,
    loading,
    error,
    saveHourlyEntry
  };
}

// Hook for grosse prise data
export function useGrossePrise() {
  const [grossePriseData, setGrossePriseData] = useState<GrossePriseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = GrossePriseService.subscribeToGrossePrise((data) => {
      setGrossePriseData(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveGrossePriseEntry = async (entry: Omit<GrossePriseDoc, 'lastUpdate'>) => {
    try {
      const result = await GrossePriseService.saveGrossePriseEntry(entry);
      if (!result.success) {
        setError('Failed to save grosse prise entry');
      }
      return result;
    } catch (err) {
      setError('Failed to save grosse prise entry');
      return { success: false, error: err };
    }
  };

  return {
    grossePriseData,
    loading,
    error,
    saveGrossePriseEntry
  };
}

// Hook for judges
export function useJudges() {
  const [judges, setJudges] = useState<JudgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = JudgeService.subscribeToJudges((data) => {
      setJudges(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveJudge = async (judge: Omit<JudgeDoc, 'lastUpdate'>) => {
    try {
      const result = await JudgeService.saveJudge(judge);
      if (!result.success) {
        setError('Failed to save judge');
      }
      return result;
    } catch (err) {
      setError('Failed to save judge');
      return { success: false, error: err };
    }
  };

  const deleteJudge = async (id: string) => {
    try {
      const result = await JudgeService.deleteJudge(id);
      if (!result.success) {
        setError('Failed to delete judge');
      }
      return result;
    } catch (err) {
      setError('Failed to delete judge');
      return { success: false, error: err };
    }
  };

  return {
    judges,
    loading,
    error,
    saveJudge,
    deleteJudge
  };
}

// Hook for users
export function useUsers() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = UserService.subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveUser = async (user: Omit<UserDoc, 'lastUpdate'>) => {
    try {
      const result = await UserService.saveUser(user);
      if (!result.success) {
        setError('Failed to save user');
      }
      return result;
    } catch (err) {
      setError('Failed to save user');
      return { success: false, error: err };
    }
  };

  return {
    users,
    loading,
    error,
    saveUser
  };
}

// Hook for competition settings
export function useCompetitionSettings() {
  const [settings, setSettings] = useState<CompetitionSettingsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = CompetitionSettingsService.subscribeToSettings((data) => {
      setSettings(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveSettings = async (settings: Omit<CompetitionSettingsDoc, 'lastUpdate'>) => {
    try {
      const result = await CompetitionSettingsService.saveSettings(settings);
      if (!result.success) {
        setError('Failed to save settings');
      }
      return result;
    } catch (err) {
      setError('Failed to save settings');
      return { success: false, error: err };
    }
  };

  return {
    settings,
    loading,
    error,
    saveSettings
  };
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { fetchProfessionals, fetchProfessionalById, fetchServices, fetchProfessionalServices, fetchAvailability, fetchBlockedTimes, fetchAppointments, fetchMyAppointments, fetchAppointmentById, createAppointment, cancelAppointment, rescheduleAppointment, cancelAppointmentByAdmin, deleteAppointment, fetchBusinessSettings, fetchNotifications, editAppointmentByClient, updateProfileAvatar, deleteCancelledAppointment, fetchWorkSchedules, upsertWorkSchedules, fetchScheduleOverrides, upsertScheduleOverride, deleteScheduleOverride, fetchEffectiveSchedule } from '../services/api';
import type { Professional, Service, ProfessionalService, Availability, BlockedTime, Appointment, BusinessSettings, Notification } from '../supabase/types';
import { useNotifications } from './useNotifications';
import { useAuth } from './useAuth';

export { useAuth, useNotifications };

async function fetchProfessionalByUserId(userId: string): Promise<Professional | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Professional;
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProfessionals();
      setProfessionals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (!isMounted) setProfessionals([]);
    });
    return () => {
      isMounted = false;
    };
  }, [load]);

  return { professionals, loading, error, refetch: load };
}

export function useProfessional(id: string | null) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProfessional(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchProfessionalById(id).then((data) => {
      if (!isMounted) return;
      setProfessional(data);
      setLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      setError(err.message);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { professional, loading, error };
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServices();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (!isMounted) setServices([]);
    });
    return () => {
      isMounted = false;
    };
  }, [load]);

  return { services, loading, error, refetch: load };
}

export function useProfessionalServices(professionalId: string | null) {
  const [items, setItems] = useState<(ProfessionalService & { service: Service })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!professionalId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchProfessionalServices(professionalId).then((data) => {
      if (!isMounted) return;
      setItems(data);
      setLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      setError(err.message);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [professionalId]);

  return { items, loading, error };
}

export function useAvailability(professionalId?: string | null) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAvailability(professionalId);
      setAvailability(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  return { availability, loading, error, refetch: load };
}

export function useBlockedTimes(professionalId?: string | null) {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBlockedTimes(professionalId);
      setBlockedTimes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  return { blockedTimes, loading, error, refetch: load };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (!isMounted) setAppointments([]);
    });
    return () => {
      isMounted = false;
    };
  }, [load]);

  return { appointments, loading, error, refetch: load };
}

export function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (!isMounted) setAppointments([]);
    });
    return () => {
      isMounted = false;
    };
  }, [load]);

  return { appointments, loading, error, refetch: load };
}

export function useAppointment(id: string | null) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setAppointment(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchAppointmentById(id);
      setAppointment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (!isMounted) setAppointment(null);
    });
    return () => {
      isMounted = false;
    };
  }, [load]);

  return { appointment, loading, error, refetch: load };
}

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(async (
    professionalId: string,
    serviceId: string,
    startAt: string,
    clientNote?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      return await createAppointment(professionalId, serviceId, startAt, clientNote);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async (appointmentId: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      await cancelAppointment(appointmentId, reason);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reschedule = useCallback(async (appointmentId: string, newStartAt: string) => {
    try {
      setLoading(true);
      setError(null);
      await rescheduleAppointment(appointmentId, newStartAt);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelByAdmin = useCallback(async (appointmentId: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      await cancelAppointmentByAdmin(appointmentId, reason);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteAppointment(appointmentId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, book, cancel, reschedule, cancelByAdmin, remove };
}

export function useMyProfessional() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const userId = session?.user?.id;
      if (!userId) {
        setProfessional(null);
        setLoading(false);
        return;
      }

      fetchProfessionalByUserId(userId).then((data) => {
        if (!isMounted) return;
        setProfessional(data);
        setLoading(false);
      }).catch((err) => {
        if (!isMounted) return;
        setError(err.message);
        setLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { professional, loading, error };
}

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchBusinessSettings().then((data) => {
      if (!isMounted) return;
      setSettings(data);
      setLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      setError(err.message);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, loading, error };
}

export function useNotificationsHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    load().then(() => {
      if (!isMounted) setNotifications([]);
    });
    return () => {
      isMounted = false;
    };
  }, [load]);

  return { notifications, loading, error, refetch: load };
}

export function useEditAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edit = useCallback(async (
    appointmentId: string,
    professionalId: string,
    serviceId: string,
    startAt: string,
    clientNote?: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      await editAppointmentByClient(appointmentId, professionalId, serviceId, startAt, clientNote);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { edit, loading, error };
}

export function useDeleteCancelledAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteCancelledAppointment(appointmentId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

export function useUpdateProfileAvatar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAvatar = useCallback(async (userId: string, imageUri: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      return await updateProfileAvatar(userId, imageUri);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateAvatar, loading, error };
}

// ============================================================================
// Work Schedules Hooks
// ============================================================================

export function useWorkSchedules(professionalId?: string | null) {
  const [schedules, setSchedules] = useState<import('../supabase/types').WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!professionalId) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkSchedules(professionalId);
      setSchedules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setSchedules([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { schedules, loading, error, refetch: load };
}

export function useSaveWorkSchedules() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (professionalId: string, schedules: Array<{
    weekday: number;
    start_time: string;
    end_time: string;
    lunch_start?: string | null;
    lunch_end?: string | null;
  }>) => {
    try {
      setLoading(true);
      setError(null);
      await upsertWorkSchedules(professionalId, schedules);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { save, loading, error };
}

export function useScheduleOverrides(professionalId?: string | null) {
  const [overrides, setOverrides] = useState<import('../supabase/types').ScheduleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (startDate?: string, endDate?: string) => {
    if (!professionalId) {
      setOverrides([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchScheduleOverrides(professionalId, startDate, endDate);
      setOverrides(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    load();
  }, [load]);

  return { overrides, loading, error, refetch: load };
}

export function useSaveScheduleOverride() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (
    professionalId: string,
    specificDate: string,
    options: {
      is_off?: boolean;
      start_time?: string | null;
      end_time?: string | null;
      lunch_start?: string | null;
      lunch_end?: string | null;
      reason?: string | null;
    } = {},
  ) => {
    try {
      setLoading(true);
      setError(null);
      await upsertScheduleOverride(professionalId, specificDate, options);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { save, loading, error };
}

export function useDeleteScheduleOverride() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (professionalId: string, specificDate: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteScheduleOverride(professionalId, specificDate);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

export function useEffectiveSchedule(professionalId?: string | null) {
  const [schedule, setSchedule] = useState<import('../supabase/types').EffectiveSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (date: string) => {
    if (!professionalId) {
      setSchedule(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEffectiveSchedule(professionalId, date);
      setSchedule(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  return { schedule, loading, error, load };
}

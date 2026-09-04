import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { fetchProfessionals, fetchProfessionalById, fetchServices, fetchProfessionalServices, fetchBlockedTimes, fetchAllBlockedTimes, createBlockedTime, updateBlockedTime, deleteBlockedTime, fetchAppointments, fetchMyAppointments, fetchAppointmentById, createAppointment, cancelAppointment, rescheduleAppointment, cancelAppointmentByAdmin, deleteAppointment, fetchBusinessSettings, fetchNotifications, editAppointmentByClient, updateProfileAvatar, updateProfile, deleteAppointmentByClient, deleteAppointmentByAdmin, fetchScheduleOverrides, upsertScheduleOverride, deleteScheduleOverride, fetchWorkWindows, upsertWorkWindows, fetchEffectiveWindows, fetchProfessionalScheduleData, fetchAllWorkWindows, fetchAllBreaksForProfessional, createServiceForProfessional, updateProfessionalService, updateServiceCatalog, deleteProfessionalService, updateServiceImage, deleteServiceImage } from '../services/api';
import type { Professional, Service, ProfessionalService, BlockedTime, Appointment, BusinessSettings, Notification, WorkWindow, WorkWindowInput, EffectiveWindow, ProfessionalScheduleData, ScheduleBreak } from '../supabase/types';
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

  const load = useCallback(async () => {
    if (!professionalId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchProfessionalServices(professionalId);
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setItems([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { items, loading, error, refetch: load };
}

export function useCreateServiceForProfessional() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (
    professionalId: string,
    name: string,
    description: string | null,
    durationMinutes: number,
    price: number | null
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      return await createServiceForProfessional(professionalId, name, description, durationMinutes, price);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useUpdateProfessionalService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (
    professionalServiceId: string,
    updates: { duration_minutes?: number; price?: number | null; is_active?: boolean }
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updateProfessionalService(professionalServiceId, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useUpdateServiceCatalog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCatalog = useCallback(async (
    serviceId: string,
    updates: { name?: string; description?: string | null; default_duration_minutes?: number }
  ) => {
    try {
      setLoading(true);
      setError(null);
      await updateServiceCatalog(serviceId, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateCatalog, loading, error };
}

export function useDeleteProfessionalService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (professionalServiceId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteProfessionalService(professionalServiceId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

export function useUpdateServiceImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (serviceId: string, imageUri: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      return await updateServiceImage(serviceId, imageUri);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadImage, loading, error };
}

export function useDeleteServiceImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeImage = useCallback(async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteServiceImage(serviceId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeImage, loading, error };
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

  const removeCancelledByAdmin = useCallback(async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteAppointmentByAdmin(appointmentId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, book, cancel, reschedule, cancelByAdmin, remove, removeCancelledByAdmin };
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

export function useDeleteAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteAppointmentByClient(appointmentId);
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

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (userId: string, updates: { name?: string; phone?: string }) => {
    try {
      setLoading(true);
      setError(null);
      await updateProfile(userId, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

// ============================================================================
// Schedule Overrides Hooks
// ============================================================================

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

// ============================================================================
// Work Windows Hooks (multi-window, multi-break, vigência)
// ============================================================================

export function useWorkWindows(professionalId?: string | null) {
  const [windows, setWindows] = useState<WorkWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!professionalId) {
      setWindows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkWindows(professionalId);
      setWindows(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setWindows([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { windows, loading, error, refetch: load };
}

export function useSaveWorkWindows() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (professionalId: string, windows: WorkWindowInput[]) => {
    try {
      setLoading(true);
      setError(null);
      await upsertWorkWindows(professionalId, windows);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { save, loading, error };
}

export function useEffectiveWindows(professionalId?: string | null) {
  const [windows, setWindows] = useState<EffectiveWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (date: string) => {
    if (!professionalId) {
      setWindows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEffectiveWindows(professionalId, date);
      setWindows(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  return { windows, loading, error, load };
}

export function useProfessionalScheduleData(professionalId?: string | null) {
  const [data, setData] = useState<ProfessionalScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!professionalId) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchProfessionalScheduleData(professionalId);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setData([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { data, loading, error, refetch: load };
}

// ============================================================================
// Schedule Breaks Hook
// ============================================================================

export function useScheduleBreaks(professionalId?: string | null) {
  const [breaks, setBreaks] = useState<ScheduleBreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!professionalId) {
      setBreaks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllBreaksForProfessional(professionalId);
      setBreaks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setBreaks([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { breaks, loading, error, refetch: load };
}

// ============================================================================
// Blocked Times Management Hooks
// ============================================================================

export function useAllBlockedTimes(professionalId?: string | null) {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!professionalId) {
      setBlockedTimes([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllBlockedTimes(professionalId);
      setBlockedTimes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setBlockedTimes([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { blockedTimes, loading, error, refetch: load };
}

export function useCreateBlockedTime() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (professionalId: string, startAt: string, endAt: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      return await createBlockedTime(professionalId, startAt, endAt, reason);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useUpdateBlockedTime() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, updates: { start_at?: string; end_at?: string; reason?: string }) => {
    try {
      setLoading(true);
      setError(null);
      await updateBlockedTime(id, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useDeleteBlockedTime() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteBlockedTime(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

// ============================================================================
// Professional ID Hook (for admin screens that need the current professional's ID)
// ============================================================================

export function useMyProfessionalId() {
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const userId = session?.user?.id;
      if (!userId) {
        setProfessionalId(null);
        setLoading(false);
        return;
      }

      supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .single()
        .then(({ data, error: queryError }) => {
          if (!isMounted) return;
          if (queryError) {
            setError('Erro ao carregar dados do profissional.');
            setProfessionalId(null);
          } else {
            setProfessionalId(data?.id ?? null);
          }
          setLoading(false);
        });
    }).catch(() => {
      if (!isMounted) return;
      setError('Erro ao verificar sessão.');
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  return { professionalId, loading, error };
}

// ============================================================================
// All Work Windows (admin view — all professionals)
// ============================================================================

export function useAllWorkWindows() {
  const [windows, setWindows] = useState<(WorkWindow & { professional_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllWorkWindows();
      setWindows(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    load().then(() => { if (!isMounted) setWindows([]); });
    return () => { isMounted = false; };
  }, [load]);

  return { windows, loading, error, refetch: load };
}

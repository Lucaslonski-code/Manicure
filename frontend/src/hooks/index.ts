import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { fetchProfessionals, fetchProfessionalById, fetchServices, fetchProfessionalServices, fetchAvailability, fetchBlockedTimes, fetchAppointments, fetchMyAppointments, fetchAppointmentById, createAppointment, cancelAppointment, rescheduleAppointment, cancelAppointmentByAdmin, deleteAppointment, fetchBusinessSettings } from '../services/api';
import type { Professional, Service, ProfessionalService, Availability, BlockedTime, Appointment, BusinessSettings } from '../supabase/types';
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

  useEffect(() => {
    if (!id) {
      setAppointment(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchAppointmentById(id).then((data) => {
      if (!isMounted) return;
      setAppointment(data);
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

  return { appointment, loading, error };
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

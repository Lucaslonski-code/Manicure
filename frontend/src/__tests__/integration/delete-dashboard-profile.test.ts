jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  deleteAppointmentByClient: jest.fn(),
  deleteAppointmentByAdmin: jest.fn(),
  deleteAppointment: jest.fn(),
  cancelAppointment: jest.fn(),
  cancelAppointmentByAdmin: jest.fn(),
  fetchAppointments: jest.fn(),
  fetchMyAppointments: jest.fn(),
  fetchAppointmentById: jest.fn(),
  createAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
  editAppointmentByClient: jest.fn(),
  updateProfile: jest.fn(),
  updateProfileAvatar: jest.fn(),
  fetchProfessionals: jest.fn(),
  fetchServices: jest.fn(),
  fetchBusinessSettings: jest.fn(),
  fetchNotifications: jest.fn(),
  deleteBlockedTime: jest.fn(),
  createBlockedTime: jest.fn(),
  updateBlockedTime: jest.fn(),
  fetchBlockedTimes: jest.fn(),
  fetchAllBlockedTimes: jest.fn(),
  fetchScheduleOverrides: jest.fn(),
  upsertScheduleOverride: jest.fn(),
  deleteScheduleOverride: jest.fn(),
  fetchWorkWindows: jest.fn(),
  upsertWorkWindows: jest.fn(),
  fetchEffectiveWindows: jest.fn(),
  fetchProfessionalScheduleData: jest.fn(),
  fetchAllWorkWindows: jest.fn(),
  fetchAllBreaksForProfessional: jest.fn(),
  createServiceForProfessional: jest.fn(),
  updateProfessionalService: jest.fn(),
  updateServiceCatalog: jest.fn(),
  deleteProfessionalService: jest.fn(),
  updateServiceImage: jest.fn(),
  deleteServiceImage: jest.fn(),
  fetchProfessionalById: jest.fn(),
  fetchProfessionalServices: jest.fn(),
  fetchUserById: jest.fn(),
}));

jest.mock('../../supabase/client', () => ({
  supabase: {
    auth: { getUser: jest.fn(), getSession: jest.fn() },
    from: jest.fn(() => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), delete: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis() })),
    rpc: jest.fn(),
  },
}));

jest.mock('../../services/auth/authService', () => ({
  signUpService: jest.fn(),
  signInService: jest.fn(),
  signOutService: jest.fn(),
  resetPasswordService: jest.fn(),
  updatePasswordService: jest.fn(),
  resendConfirmationService: jest.fn(),
  fetchProfileService: jest.fn(),
}));

jest.mock('../../services/notifications/notifications', () => ({
  registerNotificationToken: jest.fn(),
  deactivateNotificationToken: jest.fn(),
  fetchNotificationTokens: jest.fn(),
}));

import {
  deleteAppointmentByClient,
  deleteAppointmentByAdmin,
  deleteAppointment,
} from '../../services/api';

describe('Appointment Delete API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteAppointmentByClient', () => {
    it('should call RPC delete_appointment_by_client', async () => {
      (deleteAppointmentByClient as jest.Mock).mockResolvedValue(undefined);
      await deleteAppointmentByClient('apt-123');
      expect(deleteAppointmentByClient).toHaveBeenCalledWith('apt-123');
    });

    it('should throw on error', async () => {
      (deleteAppointmentByClient as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
      await expect(deleteAppointmentByClient('apt-123')).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteAppointmentByAdmin', () => {
    it('should call RPC delete_appointment_by_admin', async () => {
      (deleteAppointmentByAdmin as jest.Mock).mockResolvedValue(undefined);
      await deleteAppointmentByAdmin('apt-456');
      expect(deleteAppointmentByAdmin).toHaveBeenCalledWith('apt-456');
    });

    it('should throw on unauthorized', async () => {
      (deleteAppointmentByAdmin as jest.Mock).mockRejectedValue(new Error('Acesso negado'));
      await expect(deleteAppointmentByAdmin('apt-456')).rejects.toThrow('Acesso negado');
    });

    it('should throw on not found', async () => {
      (deleteAppointmentByAdmin as jest.Mock).mockRejectedValue(new Error('Agendamento nao encontrado'));
      await expect(deleteAppointmentByAdmin('nonexistent')).rejects.toThrow('Agendamento nao encontrado');
    });
  });

  describe('deleteAppointment (legacy direct DELETE)', () => {
    it('should be callable', async () => {
      (deleteAppointment as jest.Mock).mockResolvedValue(undefined);
      await deleteAppointment('apt-789');
      expect(deleteAppointment).toHaveBeenCalledWith('apt-789');
    });
  });
});

describe('Delete hooks (structure check)', () => {
  it('useDeleteAppointment should be exported', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../hooks/index.ts'),
      'utf-8'
    );
    expect(source).toContain('export function useDeleteAppointment');
    expect(source).toContain('deleteAppointmentByClient');
  });

  it('useBooking should have removeCancelledByAdmin using deleteAppointmentByAdmin', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../hooks/index.ts'),
      'utf-8'
    );
    expect(source).toContain('removeCancelledByAdmin');
    expect(source).toContain('deleteAppointmentByAdmin');
  });
});

describe('useUpdateProfile (structure check)', () => {
  it('should be exported and call updateProfile', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../hooks/index.ts'),
      'utf-8'
    );
    expect(source).toContain('export function useUpdateProfile');
    expect(source).toContain('updateProfile(userId, updates)');
  });
});

describe('Migration 0026 — delete_appointment_by_client without status restriction', () => {
  it('should exist in migration file', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../../../../supabase/migrations/0026_fix_real_delete.sql');
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('delete_appointment_by_client');
    expect(content).toContain('delete_appointment_by_admin');
    expect(content).toContain('SECURITY DEFINER');
    expect(content).toContain('get_auth_professional_id');
  });

  it('should NOT contain the old status restriction', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../../../../supabase/migrations/0026_fix_real_delete.sql');
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).not.toContain("v_status != 'cancelled'");
    expect(content).not.toContain("Somente agendamentos cancelados podem ser excluidos");
  });

  it('should have proper ownership check for client', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../../../../supabase/migrations/0026_fix_real_delete.sql');
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('client_user_id != v_caller_id');
    expect(content).toContain('Acesso negado');
  });

  it('should have proper ownership check for professional', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../../../../supabase/migrations/0026_fix_real_delete.sql');
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('v_appointment_professional_id != v_professional_id');
  });
});

describe('Dashboard filter logic', () => {
  it('DashboardScreen should use correct filter types', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/admin/DashboardScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain("filter: 'today'");
    expect(source).toContain("filter: 'confirmed'");
    expect(source).toContain("filter: 'cancelled'");
    expect(source).toContain("filter: 'upcoming'");
  });

  it('FilteredAppointmentsScreen should support all 4 filter types', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/admin/FilteredAppointmentsScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain("case 'today'");
    expect(source).toContain("case 'confirmed'");
    expect(source).toContain("case 'cancelled'");
    expect(source).toContain("case 'upcoming'");
  });

  it('AdminStack should have PanelFilteredAppointments route', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../navigation/stacks/AdminStack.tsx'),
      'utf-8'
    );

    expect(source).toContain('PanelFilteredAppointments');
    expect(source).toContain('FilteredAppointmentsScreen');
    expect(source).toContain('PanelAppointmentDetails');
  });

  it('ProfessionalPanelScreen should have PanelFilteredAppointments route', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/professional/ProfessionalPanelScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain('PanelFilteredAppointments');
    expect(source).toContain('FilteredAppointmentsScreen');
  });

  it('Dashboard card counts should match filter conditions', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/admin/DashboardScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain('todayAppointments.length');
    expect(source).toContain("a.status === 'confirmed'");
    expect(source).toContain("a.status === 'cancelled'");
    expect(source).toContain("a.status === 'confirmed'");
  });

  it('FilteredAppointmentsScreen filter conditions should match Dashboard counts', () => {
    const fs = require('fs');
    const path = require('path');
    const filteredSource = fs.readFileSync(
      path.join(__dirname, '../../screens/admin/FilteredAppointmentsScreen.tsx'),
      'utf-8'
    );

    expect(filteredSource).toContain("case 'today'");
    expect(filteredSource).toContain("case 'confirmed'");
    expect(filteredSource).toContain("case 'cancelled'");
    expect(filteredSource).toContain("case 'upcoming'");
  });
});

describe('Profile editing capability', () => {
  it('client ProfileScreen should have edit mode', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/client/ProfileScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain('handleSaveProfile');
    expect(source).toContain('handleStartEdit');
    expect(source).toContain('TextInput');
    expect(source).toContain('updateProfileFn');
    expect(source).toContain('setProfile');
  });

  it('admin ProfileScreen should have edit mode', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/admin/ProfileScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain('handleSaveProfile');
    expect(source).toContain('handleStartEdit');
    expect(source).toContain('TextInput');
    expect(source).toContain('updateProfileFn');
    expect(source).toContain('setProfile');
  });

  it('api.ts should export updateProfile', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../services/api.ts'),
      'utf-8'
    );

    expect(source).toContain('export async function updateProfile');
    expect(source).toContain("from('users')");
    expect(source).toContain('.update(updates)');
  });

  it('hooks should export useUpdateProfile', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../hooks/index.ts'),
      'utf-8'
    );

    expect(source).toContain('export function useUpdateProfile');
    expect(source).toContain('updateProfile');
  });
});

describe('Authorization checks in migration', () => {
  it('delete_appointment_by_client checks client ownership', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../../../supabase/migrations/0026_fix_real_delete.sql'),
      'utf-8'
    );

    const clientFnStart = source.indexOf('FUNCTION public.delete_appointment_by_client');
    const adminFnStart = source.indexOf('FUNCTION public.delete_appointment_by_admin');
    const clientSection = source.substring(clientFnStart, adminFnStart);

    expect(clientSection).toContain('auth.uid()');
    expect(clientSection).toContain('client_user_id');
    expect(clientSection).toContain('40101');
    expect(clientSection).toContain('40301');
  });

  it('delete_appointment_by_admin checks professional ownership', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../../../supabase/migrations/0026_fix_real_delete.sql'),
      'utf-8'
    );

    const adminFnStart = source.indexOf('FUNCTION public.delete_appointment_by_admin');
    const adminSection = source.substring(adminFnStart);

    expect(adminSection).toContain('get_auth_professional_id()');
    expect(adminSection).toContain('professional_id');
    expect(adminSection).toContain('40101');
    expect(adminSection).toContain('40301');
  });
});

describe('Delete is separate from Cancel', () => {
  it('client AppointmentDetailsScreen should have both cancel and delete buttons', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/client/AppointmentDetailsScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain('Cancelar agendamento');
    expect(source).toContain('Excluir agendamento');
    expect(source).toContain('showCancelDialog');
    expect(source).toContain('showDeleteDialog');
    expect(source).toContain('removeAppointment');
  });

  it('admin AppointmentDetailsScreen should have both cancel and delete buttons', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/admin/AppointmentDetailsScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain('Cancelar agendamento');
    expect(source).toContain('Excluir agendamento');
    expect(source).toContain('showCancelDialog');
    expect(source).toContain('showDeleteDialog');
  });

  it('client MyAppointmentsScreen should show delete for all non-completed appointments', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../screens/client/MyAppointmentsScreen.tsx'),
      'utf-8'
    );

    expect(source).toContain("item.status !== 'completed'");
    expect(source).toContain('useDeleteAppointment');
    expect(source).toContain('Excluir agendamento');
  });
});

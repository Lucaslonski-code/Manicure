import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const EXPO_PUSH_URL = "https://expo.dev/notifications/push/send";

type NotificationEvent = "confirmation" | "cancellation" | "reschedule";

interface AppointmentRow {
  id: string;
  client_user_id: string;
  professional_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  status: string;
  client_note?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by_user_id?: string;
  cancellation_reason?: string;
}

interface NotificationTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  is_active: boolean;
}

interface ProfessionalRow {
  id: string;
  user_id: string;
  display_name: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  appointment_id: string;
  type: string;
  channel: string;
  status: string;
}

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, any>): Promise<{ success: string[]; failed: string[] }> {
  if (tokens.length === 0) {
    return { success: [], failed: [] };
  }

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Expo Push API error:", response.status, text);
    return { success: [], failed: tokens };
  }

  const result: { data: { status: string; id?: string; message?: string; ticket?: string }[] } = await response.json();
  const success: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const item = result.data[i];
    if (item.status === "ok" || item.status === "accepted") {
      success.push(tokens[i]);
    } else {
      failed.push(tokens[i]);
    }
  }

  return { success, failed };
}

export default withSupabase({ auth: ["secret"] }, async (req, ctx) => {
  try {
    const body = await req.json();
    const appointmentId = body?.appointment_id as string | undefined;
    const event = body?.event as NotificationEvent | undefined;

    if (!appointmentId || !event) {
      return Response.json({ error: "appointment_id e event são obrigatórios" }, { status: 400 });
    }

    const callerId = ctx.auth?.user?.id;
    if (!callerId) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: appointment, error: appointmentError } = await ctx.supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return Response.json({ error: "Operação não permitida" }, { status: 404 });
    }

    const appointmentRow = appointment as AppointmentRow;

    const isClientActor = callerId === appointmentRow.client_user_id;
    const { data: professional } = await ctx.supabase
      .from("professionals")
      .select("user_id")
      .eq("id", appointmentRow.professional_id)
      .single();

    const professionalUserId = (professional as ProfessionalRow | null)?.user_id;
    const isAdminActor = callerId === professionalUserId;

    if (!isClientActor && !isAdminActor) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }

    const recipients: string[] = [];
    if (isClientActor && professionalUserId) {
      recipients.push(professionalUserId);
    } else if (isAdminActor && appointmentRow.client_user_id !== professionalUserId) {
      recipients.push(appointmentRow.client_user_id);
    }

    if (recipients.length === 0) {
      return Response.json({ success: true, sent: 0 });
    }

    const { data: tokensData } = await ctx.supabase
      .from("notifications_tokens")
      .select("id, user_id, token, platform, is_active")
      .in("user_id", recipients)
      .eq("is_active", true);

    const tokens = (tokensData as NotificationTokenRow[] | null) ?? [];
    const validTokens = tokens.filter((t) => t.is_active).map((t) => t.token);

    let title = "";
    let body = "";

    switch (event) {
      case "confirmation":
        title = "Agendamento confirmado";
        body = "Seu agendamento foi confirmado com sucesso.";
        break;
      case "cancellation":
        title = "Agendamento cancelado";
        body = "Um agendamento foi cancelado.";
        break;
      case "reschedule":
        title = "Agendamento reagendado";
        body = "Seu agendamento foi reagendado.";
        break;
    }

    const notificationData: Record<string, any> = {
      appointmentId: appointmentRow.id,
      event,
      status: appointmentRow.status,
      start_at: appointmentRow.start_at,
      end_at: appointmentRow.end_at,
      url: `appmanicure://appointment/${appointmentRow.id}`,
    };

    const { success, failed } = await sendExpoPush(validTokens, title, body, notificationData);

    if (failed.length > 0) {
      await ctx.supabase
        .from("notifications_tokens")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("token", failed);
    }

    const notificationsToInsert: Omit<NotificationRow, "id" | "created_at">[] = [];
    for (const recipientId of recipients) {
      const recipientTokens = tokens.filter((t) => t.user_id === recipientId);
      const status: "pending" | "sent" | "failed" =
        recipientTokens.length > 0 && recipientTokens.some((t) => success.includes(t.token))
          ? "sent"
          : recipientTokens.length > 0
            ? "failed"
            : "pending";

      notificationsToInsert.push({
        user_id: recipientId,
        appointment_id: appointmentId,
        type: event === "confirmation" ? "confirmation" : event === "cancellation" ? "cancellation" : "reschedule",
        channel: "push",
        status,
      });
    }

    if (notificationsToInsert.length > 0) {
      for (const notification of notificationsToInsert) {
        await ctx.supabase.rpc('record_notification', {
          p_user_id: notification.user_id,
          p_appointment_id: notification.appointment_id,
          p_type: notification.type,
          p_channel: notification.channel,
          p_status: notification.status,
          p_caller_id: callerId,
        });
      }
    }

    return Response.json({ success: true, sent: success.length, failed: failed.length });
  } catch {
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
});

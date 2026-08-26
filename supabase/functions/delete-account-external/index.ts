import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

interface DeleteAccountRequest {
  email: string;
  password: string;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default withSupabase({ auth: ["secret"] }, async (req, ctx) => {
  try {
    const body = (await req.json()) as DeleteAccountRequest;
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return Response.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const keyHash = await sha256(email);

    const { data: rateLimitAllowed, error: rateLimitError } = await ctx.supabase.rpc('check_rate_limit', {
      p_key_hash: keyHash,
      p_action: 'delete_account_external',
      p_max_attempts: 5,
      p_window_minutes: 15,
      p_block_minutes: 30,
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      return Response.json({ error: "Erro interno" }, { status: 500 });
    }

    if (rateLimitAllowed === false) {
      return Response.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
    }

    const { data: authData, error: authError } = await ctx.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return Response.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const userId = authData.user.id;

    if (ctx.auth?.user && ctx.auth.user.id !== userId) {
      return Response.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { error: deleteError } = await ctx.supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return Response.json({ error: "Erro ao excluir conta" }, { status: 500 });
    }

    await ctx.supabase
      .from('rate_limits')
      .delete()
      .eq('key_hash', keyHash)
      .eq('action', 'delete_account_external');

    return Response.json({ success: true, message: "Conta excluída com sucesso" });
  } catch {
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
});

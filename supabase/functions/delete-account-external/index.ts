import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

interface DeleteAccountRequest {
  email: string;
  password: string;
}

export default withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
  try {
    const body = (await req.json()) as DeleteAccountRequest;
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return Response.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const { data: authData, error: authError } = await ctx.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return Response.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const userId = authData.user.id;

    const { error: deleteError } = await ctx.supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return Response.json({ error: "Erro ao excluir conta" }, { status: 500 });
    }

    return Response.json({ success: true, message: "Conta excluída com sucesso" });
  } catch (err) {
    console.error("delete-account-external error:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
});

import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Uma letra maiúscula')
  .regex(/[a-z]/, 'Uma letra minúscula')
  .regex(/[0-9]/, 'Um número')
  .regex(/[^A-Za-z0-9]/, 'Um símbolo');

export const signUpSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const passwordRecoverySchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

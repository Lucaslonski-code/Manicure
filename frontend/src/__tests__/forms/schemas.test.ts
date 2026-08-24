import { signUpSchema, loginSchema, passwordRecoverySchema, newPasswordSchema } from '@forms/schemas';

const validPassword = 'Senha123!';

describe('signUpSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '11999999999',
      password: validPassword,
      confirmPassword: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome muito curto', () => {
    const result = signUpSchema.safeParse({
      name: 'Ma',
      email: 'maria@example.com',
      phone: '11999999999',
      password: validPassword,
      confirmPassword: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar e-mail inválido', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria-invalido',
      phone: '11999999999',
      password: validPassword,
      confirmPassword: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar telefone muito curto', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '123',
      password: validPassword,
      confirmPassword: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senha muito curta', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '11999999999',
      password: '123',
      confirmPassword: '123',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senhas diferentes', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '11999999999',
      password: validPassword,
      confirmPassword: 'Senha456!',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = loginSchema.safeParse({
      email: 'maria@example.com',
      password: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar e-mail inválido', () => {
    const result = loginSchema.safeParse({
      email: 'maria-invalido',
      password: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senha vazia', () => {
    const result = loginSchema.safeParse({
      email: 'maria@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordRecoverySchema', () => {
  it('deve aceitar e-mail válido', () => {
    const result = passwordRecoverySchema.safeParse({
      email: 'maria@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar e-mail inválido', () => {
    const result = passwordRecoverySchema.safeParse({
      email: 'maria-invalido',
    });
    expect(result.success).toBe(false);
  });
});

describe('newPasswordSchema', () => {
  it('deve aceitar senhas iguais', () => {
    const result = newPasswordSchema.safeParse({
      password: validPassword,
      confirmPassword: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar senhas diferentes', () => {
    const result = newPasswordSchema.safeParse({
      password: validPassword,
      confirmPassword: 'Senha456!',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senha muito curta', () => {
    const result = newPasswordSchema.safeParse({
      password: '123',
      confirmPassword: '123',
    });
    expect(result.success).toBe(false);
  });
});

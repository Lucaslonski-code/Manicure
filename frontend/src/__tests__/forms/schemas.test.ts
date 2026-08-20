import { signUpSchema, loginSchema, passwordRecoverySchema, newPasswordSchema } from '@forms/schemas';

describe('signUpSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '11999999999',
      password: 'senha123',
      confirmPassword: 'senha123',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome muito curto', () => {
    const result = signUpSchema.safeParse({
      name: 'Ma',
      email: 'maria@example.com',
      phone: '11999999999',
      password: 'senha123',
      confirmPassword: 'senha123',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar e-mail inválido', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria-invalido',
      phone: '11999999999',
      password: 'senha123',
      confirmPassword: 'senha123',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar telefone muito curto', () => {
    const result = signUpSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '123',
      password: 'senha123',
      confirmPassword: 'senha123',
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
      password: 'senha123',
      confirmPassword: 'senha456',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = loginSchema.safeParse({
      email: 'maria@example.com',
      password: 'senha123',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar e-mail inválido', () => {
    const result = loginSchema.safeParse({
      email: 'maria-invalido',
      password: 'senha123',
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
      password: 'novaSenha123',
      confirmPassword: 'novaSenha123',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar senhas diferentes', () => {
    const result = newPasswordSchema.safeParse({
      password: 'novaSenha123',
      confirmPassword: 'outraSenha456',
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

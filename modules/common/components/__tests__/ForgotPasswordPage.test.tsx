import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import ForgotPasswordPage from '../ForgotPasswordPage';
import { AuthProvider } from '../../services/AuthProvider';
import { AuthServiceInterface } from '../../../../app/services/AuthServiceInterface';

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock do AuthService
const mockAuthService: AuthServiceInterface = {
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  signUp: jest.fn(),
  resendConfirmation: jest.fn(),
};

const mockPush = jest.fn();

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  const renderWithProvider = (authService = mockAuthService) => {
    return render(
      <AuthProvider service={authService}>
        <ForgotPasswordPage />
      </AuthProvider>
    );
  };

  it('deve renderizar o formulário de recuperação de senha', () => {
    renderWithProvider();

    expect(screen.getByText('Esqueci minha senha')).toBeInTheDocument();
    expect(
      screen.getByText('Digite seu email e enviaremos um link para redefinir sua senha')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toBeInTheDocument();
  });

  it('deve mostrar erro quando email estiver vazio', async () => {
    renderWithProvider();

    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email é obrigatório.')).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando email for inválido', async () => {
    renderWithProvider();

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });

    fireEvent.change(emailInput, { target: { value: 'email-inválido' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email inválido.')).toBeInTheDocument();
    });
  });

  it('deve chamar resetPassword com email válido e mostrar mensagem de sucesso', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue({ success: true });
    const authServiceWithMock = {
      ...mockAuthService,
      resetPassword: mockResetPassword,
    };

    renderWithProvider(authServiceWithMock);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      expect(
        screen.getByText('Email enviado com sucesso! Verifique sua caixa de entrada.')
      ).toBeInTheDocument();
    });

    // Verifica se o email foi limpo após sucesso
    expect(emailInput).toHaveValue('');
  });

  it('deve mostrar erro quando resetPassword falhar', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue({
      success: false,
      error: 'Usuário não encontrado',
    });
    const authServiceWithMock = {
      ...mockAuthService,
      resetPassword: mockResetPassword,
    };

    renderWithProvider(authServiceWithMock);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Usuário não encontrado')).toBeInTheDocument();
    });
  });

  it('deve mostrar erro genérico quando resetPassword rejeitar', async () => {
    const mockResetPassword = jest.fn().mockRejectedValue(new Error('Network error'));
    const authServiceWithMock = {
      ...mockAuthService,
      resetPassword: mockResetPassword,
    };

    renderWithProvider(authServiceWithMock);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao enviar email de recuperação. Tente novamente.')
      ).toBeInTheDocument();
    });
  });

  it('deve navegar de volta para login ao clicar em "Voltar ao login"', () => {
    renderWithProvider();

    const backLink = screen.getByText('Voltar ao login');
    fireEvent.click(backLink);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('deve desabilitar campos e botão durante carregamento', async () => {
    // Mock que simula delay
    const mockResetPassword = jest
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
    const authServiceWithMock = {
      ...mockAuthService,
      resetPassword: mockResetPassword,
    };

    renderWithProvider(authServiceWithMock);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Durante o carregamento
    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeInTheDocument();
    expect(emailInput).toBeDisabled();

    // Após completar
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Enviar link de recuperação' })
      ).toBeInTheDocument();
      expect(emailInput).not.toBeDisabled();
    });
  });

  it('deve sanitizar email removendo espaços', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue({ success: true });
    const authServiceWithMock = {
      ...mockAuthService,
      resetPassword: mockResetPassword,
    };

    renderWithProvider(authServiceWithMock);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Enviar link de recuperação' });

    fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });
});

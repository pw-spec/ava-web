// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const signUp = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signUp } }),
}));

import { SignUpForm } from '@/components/auth/SignUpForm';

describe('SignUpForm', () => {
  beforeEach(() => signUp.mockReset());

  it('blocks a CA sign-up before calling Supabase', () => {
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/not available in your state/i)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls Supabase signUp with state metadata for an allowed state', async () => {
    signUp.mockResolvedValue({ data: {}, error: null });
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'TX' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(signUp.mock.calls[0][0].options.data.state_code).toBe('TX');
  });
});

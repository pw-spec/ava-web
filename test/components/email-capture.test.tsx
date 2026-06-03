// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailCapture } from '@/components/teaser/EmailCapture';

describe('EmailCapture', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows an error and does not submit an invalid email', () => {
    render(<EmailCapture />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits a valid email and shows success', async () => {
    render(<EmailCapture />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    await waitFor(() => expect(screen.getByText(/you're on the list/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }));
  });

  it('renders a non-focusable, hidden honeypot field', () => {
    render(<EmailCapture />);
    const honeypot = screen.getByTestId('honeypot');
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });
});

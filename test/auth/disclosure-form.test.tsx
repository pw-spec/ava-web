// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisclosureForm } from '@/components/auth/DisclosureForm';

describe('DisclosureForm', () => {
  it('gates on a native required checkbox (works without JS hydration)', () => {
    render(<DisclosureForm />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAttribute('name', 'accept');
    // Button is not JS-disabled; the browser blocks submit until the required box is checked.
    expect(screen.getByRole('button', { name: /agree and continue/i })).toBeEnabled();
  });

  it('posts to the accept route', () => {
    const { container } = render(<DisclosureForm />);
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('action', '/disclosure/accept');
    expect(form).toHaveAttribute('method', 'post');
  });

  it('states it is AI and not medical advice', () => {
    render(<DisclosureForm />);
    expect(screen.getAllByText(/not medical advice/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\bAI\b/).length).toBeGreaterThanOrEqual(1);
  });
});

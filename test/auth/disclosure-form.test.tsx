// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisclosureForm } from '@/components/auth/DisclosureForm';

describe('DisclosureForm', () => {
  it('disables submit until the box is checked', () => {
    render(<DisclosureForm />);
    const submit = screen.getByRole('button', { name: /agree and continue/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit).not.toBeDisabled();
  });

  it('states it is AI and not medical advice', () => {
    render(<DisclosureForm />);
    // Both phrases appear in the paragraph and the checkbox label.
    expect(screen.getAllByText(/not medical advice/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\bAI\b/).length).toBeGreaterThanOrEqual(1);
  });
});

// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { RadarTeaser } from '@/components/teaser/RadarTeaser';

describe('RadarTeaser', () => {
  it('starts with all axes unscored', () => {
    render(<RadarTeaser />);
    expect(screen.getAllByText('??').length).toBe(6);
  });

  it('fills an axis when a question is answered', () => {
    render(<RadarTeaser />);
    const energy = screen.getByTestId('q-energy');
    fireEvent.click(within(energy).getByRole('button', { name: /great/i }));
    // Energy is no longer ?? -> fewer than 6 unscored
    expect(screen.getAllByText('??').length).toBe(5);
  });

  it('reveals the email-capture form via the CTA', () => {
    render(<RadarTeaser />);
    fireEvent.click(screen.getByRole('button', { name: /get your full profile/i }));
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});

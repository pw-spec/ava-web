// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('landing page', () => {
  it('shows the product name and the not-medical-advice disclaimer', () => {
    render(<Home />);
    expect(screen.getAllByText(/ava/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });

  it('renders the interactive teaser CTA', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /get your full profile/i })).toBeInTheDocument();
  });
});

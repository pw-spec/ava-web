// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShareCard } from '@/components/share/ShareCard';

const silhouette = [40, 0, 60, 50, 45, 55];

describe('ShareCard', () => {
  it('shows the overall number, the baseline copy, and the CTA', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName={null} />);
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText(/got my baseline with ava/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /map your six/i })).toBeInTheDocument();
  });

  it('renders the silhouette as an unlabeled shape (no axis names or per-axis values)', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName={null} />);
    expect(screen.getByRole('img', { name: /wellness silhouette/i })).toBeInTheDocument();
    for (const label of ['Energy', 'Strength', 'Sleep', 'Drive', 'Focus', 'Body']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('personalizes the copy when a display name is given', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName="Pat" />);
    expect(screen.getByText(/pat got a wellness baseline/i)).toBeInTheDocument();
  });

  it('shows the video placeholder when there is no clip yet', () => {
    render(<ShareCard overall={47} silhouette={silhouette} displayName={null} />);
    expect(screen.getByLabelText(/ava clip/i)).toBeInTheDocument();
  });
});

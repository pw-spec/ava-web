// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadarChart } from '@/components/radar/RadarChart';
import { computeProfile } from '@/lib/scoring';

describe('RadarChart', () => {
  it('renders all six axis labels', () => {
    render(<RadarChart profile={computeProfile({ energy: [4] })} />);
    for (const label of ['Energy', 'Strength', 'Sleep', 'Drive', 'Focus', 'Body']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows ?? for unscored axes', () => {
    render(<RadarChart profile={computeProfile({ energy: [4] })} />);
    // five axes unscored -> at least one ?? marker
    expect(screen.getAllByText('??').length).toBeGreaterThanOrEqual(5);
  });

  it('shows the overall score and non-diagnostic tier label', () => {
    render(<RadarChart profile={computeProfile({ energy: [4, 4], sleep: [4, 4] })} />);
    expect(screen.getByTestId('overall')).toHaveTextContent('100');
    expect(screen.getByText('Optimized')).toBeInTheDocument();
  });
});

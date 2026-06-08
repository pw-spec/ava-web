// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { createShareCard } = vi.hoisted(() => ({ createShareCard: vi.fn() }));
vi.mock('@/lib/share/client', () => ({ createShareCard }));

import { ShareBaseline } from '@/components/share/ShareBaseline';

describe('ShareBaseline', () => {
  beforeEach(() => createShareCard.mockReset());

  it('renders nothing when there is no baseline to share', () => {
    const { container } = render(<ShareBaseline canShare={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('creates a card and reveals the link on click', async () => {
    createShareCard.mockResolvedValue({ ok: true, token: 't', url: 'https://ava.test/share/t' });
    render(<ShareBaseline canShare />);
    fireEvent.click(screen.getByRole('button', { name: /share my baseline/i }));
    await waitFor(() => expect(createShareCard).toHaveBeenCalledTimes(1));
    expect(await screen.findByLabelText(/share link/i)).toHaveValue('https://ava.test/share/t');
  });

  it('copies the link', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    createShareCard.mockResolvedValue({ ok: true, token: 't', url: 'https://ava.test/share/t' });
    render(<ShareBaseline canShare />);
    fireEvent.click(screen.getByRole('button', { name: /share my baseline/i }));
    fireEvent.click(await screen.findByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('https://ava.test/share/t');
  });

  it('shows an error when the link cannot be created', async () => {
    createShareCard.mockResolvedValue({ ok: false });
    render(<ShareBaseline canShare />);
    fireEvent.click(screen.getByRole('button', { name: /share my baseline/i }));
    expect(await screen.findByText(/couldn.t create a link/i)).toBeInTheDocument();
  });
});

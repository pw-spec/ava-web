// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatComposer } from '@/components/chat/ChatComposer';

describe('ChatComposer', () => {
  it('sends trimmed text and clears the field', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={false} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '  low energy  ' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith('low energy');
    expect((box as HTMLTextAreaElement).value).toBe('');
  });

  it('does not send empty/whitespace', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('is disabled while a turn is pending', () => {
    render(<ChatComposer onSend={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });
});

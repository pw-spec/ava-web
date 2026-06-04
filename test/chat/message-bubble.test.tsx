// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

describe('MessageBubble', () => {
  it('renders Ava (assistant) text aligned left', () => {
    const { container } = render(<MessageBubble role="assistant">How is your sleep?</MessageBubble>);
    expect(screen.getByText('How is your sleep?')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('justify-start');
  });

  it('renders the user message aligned right with the brand surface', () => {
    const { container } = render(<MessageBubble role="user">pretty rough</MessageBubble>);
    expect(container.firstChild).toHaveClass('justify-end');
  });
});

describe('TypingIndicator', () => {
  it('exposes an accessible label', () => {
    render(<TypingIndicator />);
    expect(screen.getByLabelText(/ava is typing/i)).toBeInTheDocument();
  });
});

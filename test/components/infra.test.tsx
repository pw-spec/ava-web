// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function Hello() {
  return <p>hello radar</p>;
}

describe('component test infra', () => {
  it('renders a component into jsdom', () => {
    render(<Hello />);
    expect(screen.getByText('hello radar')).toBeInTheDocument();
  });
});

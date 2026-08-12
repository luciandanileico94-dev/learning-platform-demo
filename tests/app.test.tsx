import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Learningo Telegram-style shell', () => {
  beforeEach(() => localStorage.clear());

  it('renders the original welcome gate with fixture data', async () => {
    const { App } = await import('../frontend/App');
    render(createElement(App));
    expect((await screen.findAllByText(/Learningo/i)).length).toBeGreaterThan(0);
  });
});

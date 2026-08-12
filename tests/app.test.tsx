import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { createElement } from 'react';

vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
describe('React core flow', () => {
  it('shows the local catalog when API is offline', async () => {
    const { default: App } = await import('../frontend/App');
    render(createElement(App));
    expect((await screen.findAllByText('Scriere clară')).length).toBeGreaterThan(0);
    expect(screen.getByText('Structura ideii')).toBeInTheDocument();
  });
});

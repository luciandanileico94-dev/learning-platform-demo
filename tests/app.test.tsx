import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { vi } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

describe('traseul de învățare', () => {
  it('parcurge onboardingul, predarea și cele trei interacțiuni', async () => {
    const { default: App } = await import('../frontend/App');
    render(createElement(App));
    fireEvent.click(screen.getByRole('button', { name: /Începe demo-ul/ }));
    fireEvent.click(screen.getByRole('button', { name: /Școală/ }));
    fireEvent.click(screen.getByRole('button', { name: /Matematică/ }));
    fireEvent.click(screen.getByRole('button', { name: /Clasa a VIII-a/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuă/ }));
    fireEvent.click(screen.getByRole('button', { name: /Verifică ce ai înțeles/ }));
    fireEvent.click(screen.getByRole('button', { name: /Scad 5/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Exact');
    fireEvent.click(screen.getByRole('button', { name: /Următorul exercițiu/ }));
    fireEvent.change(screen.getByLabelText('Răspunsul tău'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Verifică/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Exact');
  });

  it('permite retry după un răspuns greșit', async () => {
    const { default: App } = await import('../frontend/App');
    render(createElement(App));
    fireEvent.click(screen.getByRole('button', { name: /Începe demo-ul/ }));
    fireEvent.click(screen.getByRole('button', { name: /Școală/ }));
    fireEvent.click(screen.getByRole('button', { name: /Matematică/ }));
    fireEvent.click(screen.getByRole('button', { name: /Clasa a VIII-a/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuă/ }));
    fireEvent.click(screen.getByRole('button', { name: /Verifică ce ai înțeles/ }));
    fireEvent.click(screen.getByRole('button', { name: /Împart direct/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Mai încearcă');
    fireEvent.click(screen.getByRole('button', { name: /Încearcă din nou/ }));
    expect(screen.getByRole('button', { name: /Scad 5/ })).toBeEnabled();
  });
});

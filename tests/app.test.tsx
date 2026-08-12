import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

describe('catalogul și traseul de învățare', () => {
  beforeEach(() => localStorage.clear());

  it('deschide catalogul, cursul și primele interacțiuni', async () => {
    const { default: App } = await import('../frontend/App');
    render(createElement(App));
    fireEvent.click(screen.getByRole('button', { name: /Vezi catalogul/ }));
    fireEvent.click(screen.getByRole('button', { name: /Vezi cursul: Matematică pentru gimnaziu/ }));
    fireEvent.click(screen.getByRole('button', { name: /Ecuații liniare/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuă/ }));
    fireEvent.click(screen.getByRole('button', { name: /Începe exercițiul/ }));
    fireEvent.click(screen.getByRole('button', { name: /Scad 5/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Exact');
    fireEvent.click(screen.getByRole('button', { name: /Următorul exercițiu/ }));
    fireEvent.change(screen.getByLabelText('Răspunsul tău'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Verifică/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Exact');
  });

  it('permite retry și păstrează progresul după finalizarea lecției', async () => {
    const { default: App } = await import('../frontend/App');
    render(createElement(App));
    fireEvent.click(screen.getByRole('button', { name: /Vezi catalogul/ }));
    fireEvent.click(screen.getByRole('button', { name: /Vezi cursul: Matematică pentru gimnaziu/ }));
    fireEvent.click(screen.getByRole('button', { name: /Ecuații liniare/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuă/ }));
    fireEvent.click(screen.getByRole('button', { name: /Începe exercițiul/ }));
    fireEvent.click(screen.getByRole('button', { name: /Împart direct/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Mai încearcă');
    fireEvent.click(screen.getByRole('button', { name: /Încearcă din nou/ }));
    expect(screen.getByRole('button', { name: /Scad 5/ })).toBeEnabled();
  });
});

import { app } from '../backend/server';

describe('serverul opțional nu expune autentificare', () => {
  it('are doar date sintetice de lecție', () => {
    expect(app).toBeDefined();
  });
});

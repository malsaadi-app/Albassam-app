import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Health API', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  it('should return healthy status', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.database).toBe(true);
    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeGreaterThan(0);
  });

  it('should have correct response structure', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
  });

  it('should return valid timestamp', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe('Status API', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  it('should return operational status', async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('operational');
  });

  it('should include service statuses', async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const data = await response.json();

    expect(data.services).toBeDefined();
    expect(data.services.application).toBeDefined();
    expect(data.services.database).toBeDefined();
    expect(data.services.application.status).toBe('operational');
    expect(data.services.database.status).toBe('operational');
  });

  it('should include uptime information', async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const data = await response.json();

    expect(data.uptime).toBeDefined();
    expect(data.uptime.seconds).toBeGreaterThan(0);
    expect(data.uptime.formatted).toBeDefined();
  });

  it('should include version', async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const data = await response.json();

    expect(data.version).toBeDefined();
    expect(typeof data.version).toBe('string');
  });
});

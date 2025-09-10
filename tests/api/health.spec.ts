import { test, expect } from '@playwright/test';

test.describe('Backend API Health Tests', () => {
  test('health endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'healthy',
      environment: 'development',
      version: expect.any(String),
      timestamp: expect.any(String)
    });
  });

  test('API responds with CORS headers', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toEqual('http://localhost:3000');
  });

  test('health check responds quickly', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/health');
    const endTime = Date.now();
    
    expect(response.ok()).toBeTruthy();
    expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
  });
});
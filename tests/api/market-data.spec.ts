import { test, expect } from '@playwright/test';

test.describe('Market Data API Tests', () => {
  test('get trading symbols', async ({ request }) => {
    const response = await request.get('/api/market-data/symbols');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: expect.any(Array)
    });
    
    // Verify symbols structure
    if (data.data.length > 0) {
      expect(data.data[0]).toMatchObject({
        symbol: expect.any(String),
        baseCurrency: expect.any(String),
        quoteCurrency: expect.any(String),
        isActive: expect.any(Boolean)
      });
    }
  });

  test('get ticker for BTC-USD', async ({ request }) => {
    const response = await request.get('/api/market-data/BTC-USD/ticker');
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
    } else {
      // If no real exchange data, expect proper error response
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    }
  });

  test('get candles for BTC-USD', async ({ request }) => {
    const response = await request.get('/api/market-data/BTC-USD/candles?timeFrame=1h&limit=10');
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
      
      // Check if data contains candles array
      if (data.data.candles) {
        expect(data.data.candles).toEqual(expect.any(Array));
      }
    } else {
      // If no real exchange data, expect proper error response
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    }
  });
});
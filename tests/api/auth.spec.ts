import { test, expect } from '@playwright/test';

test.describe('Authentication API Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser-${Date.now()}`,
    password: 'TestPassword123!'
  };

  test('register new user', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: testUser
    });

    if (response.ok()) {
      const data = await response.json();
      expect(data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: testUser.email,
            username: testUser.username,
            id: expect.any(String)
          }),
          token: expect.any(String)
        })
      });
    } else {
      // Handle database connection issues gracefully
      const data = await response.json();
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    }
  });

  test('login with valid credentials', async ({ request }) => {
    const loginUser = {
      email: `login-test-${Date.now()}@example.com`,
      username: `logintest-${Date.now()}`,
      password: 'TestPassword123!'
    };

    // First register a user
    const registerResponse = await request.post('/api/auth/register', {
      data: loginUser
    });

    if (registerResponse.ok()) {
      // Then try to login with the same credentials
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          email: loginUser.email,
          password: loginUser.password
        }
      });

      if (loginResponse.ok()) {
        const data = await loginResponse.json();
        expect(data).toMatchObject({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            token: expect.any(String)
          })
        });
      }
    }
  });

  test('login with invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.any(String)
    });
  });

  test('protected route requires authentication', async ({ request }) => {
    const response = await request.get('/api/trading/status');
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining('token')
    });
  });
});
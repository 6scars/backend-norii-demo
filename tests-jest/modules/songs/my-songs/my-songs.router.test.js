import { afterEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import app from '../../../../app.js';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('My Songs API', () => {
  it('returns 401 when the authorization header is missing', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const response = await request(app).get('/api/my-songs');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Authentication required'
    });
  });

  it('returns 401 when the bearer token is invalid', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const response = await request(app)
      .get('/api/my-songs')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Token is not valid or expired'
    });
  });
});

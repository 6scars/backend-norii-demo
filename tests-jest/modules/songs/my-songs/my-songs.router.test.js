import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

const sqlMock = jest.fn().mockResolvedValue([]);

jest.unstable_mockModule('#db', () => ({
  sql: sqlMock,
}));

const { default: app } = await import('../../../../app.js');

beforeEach(() => {
  sqlMock.mockClear();
});

describe('My Songs API', () => {
  it('returns 401 when the authorization header is missing', async () => {
    const response = await request(app).get('/api/my-songs');

    expect(sqlMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Authentication required' });
  });

  it('returns 401 when the bearer token is invalid', async () => {
    const response = await request(app)
      .get('/api/my-songs')
      .set('Authorization', 'Bearer invalid-token');

    expect(sqlMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not valid or expired' });
  });
});

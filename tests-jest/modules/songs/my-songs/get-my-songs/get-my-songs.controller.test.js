import { describe, expect, it, jest } from '@jest/globals';

import { createGetMySongsController } from '#songs/my-songs/get-my-songs/get-my-songs.controller.js';

function createResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn()
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
}

describe('getMySongs controller', () => {
  it('returns songs belonging to the authenticated author', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: 9,
        song_name: 'Cienie',
        song_image: 'cienie.png',
        credit: null,
        created_at: '2026-01-01',
        views: 3
      }
    ]);
    const controller = createGetMySongsController({ query });
    const request = {
      payloadJWT: { id: 7 },
      query: {}
    };
    const response = createResponse();
    const next = jest.fn();

    await controller(request, response, next);

    expect(query).toHaveBeenCalledWith(7, null, 20);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      data: [
        {
          id: '9',
          songName: 'Cienie',
          songImage: 'cienie.png',
          credit: null,
          createdAt: '2026-01-01',
          views: 3
        }
      ],
      nextCursor: null
    });
    expect(next).not.toHaveBeenCalled();
  });
});

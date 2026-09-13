import assert from 'node:assert/strict';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_KEY = 'test-key';

const { createPublishSongController } = await import('#songs/publish-song/publish-song.controller.js');
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'spotify-upload-cleanup-'));
let requestNumber = 0;

after(() => rm(temporaryRoot, { recursive: true, force: true }));

async function createRequest() {
  requestNumber += 1;
  const mp3Path = path.join(temporaryRoot, `${requestNumber}.mp3`);
  const imagePath = path.join(temporaryRoot, `${requestNumber}.png`);
  await Promise.all([
    writeFile(mp3Path, Buffer.from('audio')),
    writeFile(imagePath, Buffer.from('image')),
  ]);

  return {
    body: {
      addSongForm: JSON.stringify({ song_name: 'Test song', credit: 'Tester' }),
      publicationConsent: JSON.stringify({
        audioRightsConfirmed: true,
        coverRightsConfirmed: true,
        publishingTermsAccepted: true,
        policyVersion: '2026-09-12-v1',
      }),
    },
    files: {
      mp3: [{ path: mp3Path, filename: `${requestNumber}.mp3`, mimetype: 'audio/mpeg' }],
      img: [{ path: imagePath, filename: `${requestNumber}.png`, mimetype: 'image/png' }],
    },
    payloadJWT: { id: 7 },
  };
}

function createStorage({ failUploadNumber } = {}) {
  const uploaded = [];
  const removed = [];
  return {
    uploaded,
    removed,
    from(bucket) {
      return {
        async upload(objectPath) {
          if (uploaded.length + 1 === failUploadNumber) {
            return { error: { message: 'storage upload failed' } };
          }
          uploaded.push({ bucket, path: objectPath });
          return { error: null };
        },
        async remove(paths) {
          removed.push({ bucket, paths });
          return { error: null };
        },
      };
    },
  };
}

async function execute(controller, req) {
  let forwardedError;
  let response;
  const res = {
    status(status) {
      response = { status };
      return this;
    },
    json(body) {
      response.body = body;
      return this;
    },
  };
  await controller(req, res, (error) => { forwardedError = error; });
  return { forwardedError, response };
}

test('removes the MP3 from Supabase when the cover upload fails', async () => {
  const storage = createStorage({ failUploadNumber: 2 });
  const queries = {
    async insertPublishedSong() { throw new Error('database should not be called'); },
  };
  const controller = createPublishSongController({ storage, queries });

  const { forwardedError } = await execute(controller, await createRequest());

  assert.equal(forwardedError.status, 500);
  assert.deepEqual(storage.removed, [{ bucket: 'spotify', paths: ['songs/1.mp3'] }]);
});

test('removes both Supabase objects when the database transaction fails', async () => {
  const storage = createStorage();
  const queries = {
    async insertPublishedSong() { throw new Error('database transaction failed'); },
  };
  const controller = createPublishSongController({ storage, queries });

  const { forwardedError } = await execute(controller, await createRequest());

  assert.equal(forwardedError.message, 'database transaction failed');
  assert.deepEqual(storage.removed, [{
    bucket: 'spotify',
    paths: ['songs/2.mp3', 'images/songPictures/2.png'],
  }]);
});

test('keeps Supabase objects after the publication transaction succeeds', async () => {
  const storage = createStorage();
  let receivedConsent;
  const queries = {
    async insertPublishedSong(...args) {
      receivedConsent = args.at(-1);
      return 12;
    },
  };
  const controller = createPublishSongController({ storage, queries });

  const { forwardedError, response } = await execute(controller, await createRequest());

  assert.equal(forwardedError, undefined);
  assert.equal(response.status, 201);
  assert.equal(receivedConsent.policyVersion, '2026-09-12-v1');
  assert.deepEqual(storage.removed, []);
});


test('rejects missing publication consent before uploading to Supabase', async () => {
  const storage = createStorage();
  let queryCalls = 0;
  const queries = {
    async insertPublishedSong() {
      queryCalls += 1;
      return 12;
    },
  };
  const controller = createPublishSongController({ storage, queries });
  const request = await createRequest();
  delete request.body.publicationConsent;

  const { forwardedError } = await execute(controller, request);

  assert.equal(forwardedError.status, 422);
  assert.equal(queryCalls, 0);
  assert.deepEqual(storage.uploaded, []);
  assert.deepEqual(storage.removed, []);
});
test('rejects an invalid title before uploading and removes temporary files', async () => {
  const storage = createStorage();
  let queryCalls = 0;
  const queries = {
    async insertPublishedSong() {
      queryCalls += 1;
      return 12;
    },
  };
  const controller = createPublishSongController({ storage, queries });
  const request = await createRequest();
  request.body.addSongForm = JSON.stringify({ song_name: 'abc' });
  const temporaryAudioPath = request.files.mp3[0].path;

  const { forwardedError } = await execute(controller, request);

  assert.equal(forwardedError.status, 422);
  assert.equal(forwardedError.message, 'Tytuł musi mieć co najmniej 5 znaków.');
  assert.equal(queryCalls, 0);
  assert.deepEqual(storage.uploaded, []);
  await assert.rejects(access(temporaryAudioPath), { code: 'ENOENT' });
});

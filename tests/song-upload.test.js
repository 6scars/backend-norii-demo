import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import express from 'express';

process.env.JWT_SECRET = 'test-upload-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_KEY = 'test-key';

const { createSongUploadRouter, uploadDir } = await import('../modules/postModules/saveSongInBaseModule/saveSongInBase.router.js');
const seen = [];
let policyError = null;
const publishingPolicy = {
  async getStatus() { return { canPublish: true }; },
  async assertCanStartUpload() { if (policyError) throw policyError; },
};
const app = express();
app.use('/api', createSongUploadRouter(async (req, res) => {
  seen.push({ files: req.files, userId: req.payloadJWT.id });
  res.status(201).json({ message: 'ok' });
}, { publishingPolicy }));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: error.message }));
const server = createServer(app);

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await Promise.all(seen.flatMap((entry) => Object.values(entry.files).flat()).map((file) => unlink(file.path).catch(() => {})));
});

const url = () => `http://127.0.0.1:${server.address().port}/api/saveSongInBase`;
const token = jwt.sign({ id: 7 }, process.env.JWT_SECRET);

function form({ audio = Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00audio'), image = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]), audioName = 'song.mp3', imageName = 'cover.png', audioType = 'audio/mpeg', imageType = 'image/png' } = {}) {
  const body = new FormData();
  body.append('addSongForm', JSON.stringify({ song_name: 'Test song' }));
  body.append('mp3', new Blob([audio], { type: audioType }), audioName);
  body.append('img', new Blob([image], { type: imageType }), imageName);
  return body;
}

async function upload(body, auth = `Bearer ${token}`) {
  return fetch(url(), { method: 'POST', headers: auth ? { Authorization: auth } : {}, body });
}

test('rejects missing and invalid credentials before saving multipart files', async () => {
  const initialFiles = await readdir(uploadDir).catch(() => []);
  for (const credential of [null, 'Bearer bad-token']) {
    const response = await upload(form(), credential);
    assert.equal(response.status, 401);
    assert.equal(seen.length, 0);
    assert.deepEqual(await readdir(uploadDir).catch(() => []), initialFiles);
  }
});

test('checks demo limits before parsing and saving multipart files', async () => {
  const initialFiles = await readdir(uploadDir).catch(() => []);
  const initialSeen = seen.length;
  policyError = Object.assign(new Error('W wersji demonstracyjnej możesz mieć maksymalnie 2 aktywne publikacje.'), {
    status: 409,
  });

  try {
    const response = await upload(form());
    assert.equal(response.status, 409);
    assert.match((await response.json()).message, /maksymalnie 2 aktywne publikacje/);
    assert.equal(seen.length, initialSeen);
    assert.deepEqual(await readdir(uploadDir).catch(() => []), initialFiles);
  } finally {
    policyError = null;
  }
});

test('reports authenticated demo publishing status', async () => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/demo-publishing-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { canPublish: true });
});

test('accepts MP3 and PNG bytes only for a valid session', async () => {
  const response = await upload(form());
  assert.equal(response.status, 201);
  assert.equal(seen.at(-1).userId, 7);
  assert.equal(path.extname(seen.at(-1).files.mp3[0].filename), '.mp3');
  assert.equal(path.extname(seen.at(-1).files.img[0].filename), '.png');
  assert.equal((await readFile(seen.at(-1).files.mp3[0].path)).subarray(0, 3).toString(), 'ID3');
});

test('rejects mismatched extension, MIME and content with specific messages', async () => {
  const cases = [
    [{ audioName: 'song.php' }, 'Nagranie musi być plikiem MP3.'],
    [{ audioType: 'application/octet-stream' }, 'Nagranie musi być plikiem MP3.'],
    [{ audio: Buffer.from('<?php evil(); ?>') }, 'Zawartość nagrania nie jest prawidłowym plikiem MP3.'],
    [{ imageName: 'cover.svg' }, 'Okładka musi być plikiem JPG lub PNG.'],
    [{ imageType: 'image/svg+xml' }, 'Okładka musi być plikiem JPG lub PNG.'],
    [{ image: Buffer.from('<svg></svg>') }, 'Zawartość okładki nie jest prawidłowym plikiem JPG lub PNG.'],
  ];
  for (const [input, message] of cases) {
    const response = await upload(form(input));
    assert.equal(response.status, 415);
    assert.equal((await response.json()).message, message);
  }
});

test('rejects oversized audio and cover with their individual limits', async () => {
  const bigAudio = Buffer.concat([Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00'), Buffer.alloc(25 * 1024 * 1024)]);
  const bigImage = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(5 * 1024 * 1024)]);
  const audioResponse = await upload(form({ audio: bigAudio }));
  const imageResponse = await upload(form({ image: bigImage }));

  assert.equal(audioResponse.status, 413);
  assert.equal((await audioResponse.json()).message, 'Nagranie jest za duże. Maksymalny rozmiar to 25 MB.');
  assert.equal(imageResponse.status, 413);
  assert.equal((await imageResponse.json()).message, 'Okładka jest za duża. Maksymalny rozmiar to 5 MB.');
});

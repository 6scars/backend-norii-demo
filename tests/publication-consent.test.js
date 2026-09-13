import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PUBLISHING_POLICY_VERSION,
  parsePublicationConsent,
} from '../modules/postModules/saveSongInBaseModule/publicationConsent.js';

const acceptedConsent = {
  audioRightsConfirmed: true,
  coverRightsConfirmed: true,
  publishingTermsAccepted: true,
  policyVersion: PUBLISHING_POLICY_VERSION,
};

test('accepts all required publication statements at the current version', () => {
  assert.deepEqual(parsePublicationConsent(JSON.stringify(acceptedConsent)), acceptedConsent);
});

test('rejects missing publication statements', () => {
  assert.throws(
    () => parsePublicationConsent(JSON.stringify({ ...acceptedConsent, coverRightsConfirmed: false })),
    (error) => error.status === 422 && error.message.includes('okładki')
  );
});

test('rejects a stale publishing policy version', () => {
  assert.throws(
    () => parsePublicationConsent(JSON.stringify({ ...acceptedConsent, policyVersion: 'old-version' })),
    (error) => error.status === 409 && error.message.includes('nieaktualna')
  );
});

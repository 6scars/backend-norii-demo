import { describe, expect, it } from '@jest/globals';

import {
  PUBLISHING_POLICY_VERSION,
  parsePublicationConsent
} from '#songs/publish-song/publish-song.publication-consent.js';

const acceptedConsent = {
  audioRightsConfirmed: true,
  coverRightsConfirmed: true,
  publishingTermsAccepted: true,
  policyVersion: PUBLISHING_POLICY_VERSION
};

describe('parsePublicationConsent', () => {
  it('accepts all required statements at the current policy version', () => {
    const result = parsePublicationConsent(JSON.stringify(acceptedConsent));

    expect(result).toEqual(acceptedConsent);
  });

  it('rejects consent without confirmed cover rights', () => {
    const consentWithoutCoverRights = {
      ...acceptedConsent,
      coverRightsConfirmed: false
    };

    expect(() =>
      parsePublicationConsent(JSON.stringify(consentWithoutCoverRights))
    ).toThrow('Potwierdź prawa do okładki.');
  });

  it('rejects an outdated policy version', () => {
    const outdatedConsent = {
      ...acceptedConsent,
      policyVersion: 'old-version'
    };

    expect(() =>
      parsePublicationConsent(JSON.stringify(outdatedConsent))
    ).toThrow('Wersja zasad publikowania jest nieaktualna.');
  });
});

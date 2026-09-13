import AppError from '../../../config/errorHandler/errorHandler.js';

export const PUBLISHING_POLICY_VERSION = '2026-09-12-v1';

const requiredStatements = [
  ['audioRightsConfirmed', 'Potwierdź prawa do nagrania.'],
  ['coverRightsConfirmed', 'Potwierdź prawa do okładki.'],
  ['publishingTermsAccepted', 'Zaakceptuj zasady publikowania.'],
];

export function parsePublicationConsent(rawConsent) {
  let consent;
  try {
    consent = JSON.parse(rawConsent);
  } catch {
    throw new AppError('Prześlij wymagane oświadczenia przed publikacją.', 422);
  }

  for (const [field, message] of requiredStatements) {
    if (consent?.[field] !== true) throw new AppError(message, 422);
  }

  if (consent.policyVersion !== PUBLISHING_POLICY_VERSION) {
    throw new AppError('Wersja zasad publikowania jest nieaktualna. Odśwież stronę i spróbuj ponownie.', 409);
  }

  return {
    audioRightsConfirmed: true,
    coverRightsConfirmed: true,
    publishingTermsAccepted: true,
    policyVersion: PUBLISHING_POLICY_VERSION,
  };
}

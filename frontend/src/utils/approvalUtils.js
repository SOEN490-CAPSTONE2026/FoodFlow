const APPROVAL_REQUIRED_CODE = 'error.account.not_approved';

const APPROVAL_REQUIRED_PATTERNS = [
  /account not approved/i,
  /not approved yet/i,
  /non approuv/i,
  /no ha sido aprobad/i,
  /nao foi aprovad/i,
  /não foi aprovad/i,
  /尚未获批准/,
  /لم يحصل على الموافقة/,
];

export const isApprovedAccount = accountStatus => accountStatus === 'ACTIVE';

export const isApprovalRequiredError = error => {
  const data = error?.response?.data;
  const values = [
    data?.code,
    data?.messageKey,
    data?.message,
    data?.error,
    error?.message,
  ].filter(Boolean);

  return values.some(
    value =>
      value === APPROVAL_REQUIRED_CODE ||
      APPROVAL_REQUIRED_PATTERNS.some(pattern => pattern.test(String(value)))
  );
};

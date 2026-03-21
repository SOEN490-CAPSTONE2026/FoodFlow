export const normalizeStatus = value => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
};

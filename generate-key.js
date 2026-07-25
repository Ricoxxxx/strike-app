const KEY_SALT = 'STRIKE_2026_SALT_9F3K';

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(9, '0').slice(0, 9);
}

function generateKey(hoursValid) {
  const expiryMinutes = Math.floor((Date.now() + hoursValid * 3600000) / 60000);
  const expiryPart = expiryMinutes.toString(36).toUpperCase().padStart(7, '0');
  const checksumPart = simpleHash(expiryPart + KEY_SALT);
  return expiryPart + checksumPart;
}

const hours = parseFloat(process.argv[2]);

if (isNaN(hours)) {
  console.log('Usage: node generate-key.js <hours>');
  process.exit(1);
}

const key = generateKey(hours);
const formatted = key.match(/.{1,4}/g).join('-');
const expiresAt = new Date(Date.now() + hours * 3600000);

console.log('');
console.log('Key:      ' + formatted);
console.log('Valid for: ' + hours + ' hour' + (hours === 1 ? '' : 's'));
console.log('Expires:   ' + expiresAt.toLocaleString());
console.log('');
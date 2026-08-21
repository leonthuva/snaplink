function isValidUrl(string) {
  if (!string || typeof string !== 'string') {
    return false;
  }

  let url;
  try {
    url = new URL(string);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return false;
  }

  const privateIpRegex = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;
  if (privateIpRegex.test(hostname)) {
    return false;
  }

  return true;
}

module.exports = { isValidUrl };
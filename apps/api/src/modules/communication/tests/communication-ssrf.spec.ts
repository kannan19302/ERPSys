import { describe, it, expect } from 'vitest';
import { isSafeUrl } from '../communication-ssrf.util';

describe('communication-ssrf.util', () => {
  describe('isSafeUrl', () => {
    it('allows public domain names and public IPs', async () => {
      // Note: We can't guarantee DNS resolution of third party domains in offline testing,
      // but standard DNS lookups should resolve known public addresses if online,
      // or we can test with a mocked resolver or known public IPs.
      expect(await isSafeUrl('https://www.google.com')).toBe(true);
      expect(await isSafeUrl('http://8.8.8.8')).toBe(true);
    });

    it('blocks loopback IP addresses (IPv4 & IPv6)', async () => {
      expect(await isSafeUrl('http://127.0.0.1')).toBe(false);
      expect(await isSafeUrl('http://127.0.0.2')).toBe(false);
      expect(await isSafeUrl('http://[::1]')).toBe(false);
      expect(await isSafeUrl('http://[0:0:0:0:0:0:0:1]')).toBe(false);
    });

    it('blocks localhost hostname', async () => {
      expect(await isSafeUrl('http://localhost')).toBe(false);
      expect(await isSafeUrl('http://localhost:3000')).toBe(false);
    });

    it('blocks private IP addresses (RFC 1918)', async () => {
      expect(await isSafeUrl('http://10.0.0.1')).toBe(false);
      expect(await isSafeUrl('http://192.168.1.1')).toBe(false);
      expect(await isSafeUrl('http://172.16.0.1')).toBe(false);
      expect(await isSafeUrl('http://172.31.255.255')).toBe(false);
    });

    it('blocks link-local IP addresses', async () => {
      expect(await isSafeUrl('http://169.254.169.254')).toBe(false);
      expect(await isSafeUrl('http://[fe80::1]')).toBe(false);
    });

    it('returns false for malformed URLs', async () => {
      expect(await isSafeUrl('not-a-url')).toBe(false);
      expect(await isSafeUrl('http://')).toBe(false);
    });
  });
});

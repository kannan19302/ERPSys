import * as dns from 'node:dns/promises';
import * as net from 'node:net';

export async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // Check if hostname itself is an IP address
    if (net.isIP(hostname)) {
      return isPublicIp(hostname);
    }

    // Resolve hostname to IPs
    const addresses: string[] = [];
    
    // Attempt resolve4
    const v4 = await dns.resolve4(hostname).catch(() => []);
    addresses.push(...v4);

    // Attempt resolve6
    const v6 = await dns.resolve6(hostname).catch(() => []);
    addresses.push(...v6);

    if (addresses.length === 0) {
      // Try dns.lookup as fallback (handles localhost and local hostnames)
      const lookupResult = await dns.lookup(hostname).catch(() => null);
      if (lookupResult) {
        addresses.push(lookupResult.address);
      }
    }

    if (addresses.length === 0) {
      return false; // Can't resolve DNS
    }

    // Ensure all resolved IPs are public
    for (const ip of addresses) {
      if (!isPublicIp(ip)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function isPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;
    const [p0, p1] = parts;
    if (p0 === undefined || p1 === undefined) return false;
    // Loopback
    if (p0 === 127) return false;
    // Private Network (RFC 1918)
    if (p0 === 10) return false;
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return false;
    if (p0 === 192 && p1 === 168) return false;
    // Link-local
    if (p0 === 169 && p1 === 254) return false;
    // Shared address space (RFC 6598)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return false;
    // Testnet / Reserved
    if (p0 === 0 || p0 >= 224) return false;
    return true;
  } else if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // Loopback
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return false;
    // Unique local address (ULA)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return false;
    // Link-local
    if (normalized.startsWith('fe80')) return false;
    // Unspecified
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return false;
    return true;
  }
  return false;
}

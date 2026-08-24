const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCaponeEmail } = require('../ingestor/parser');

test("prefers the real Today's Top Offer card over a hidden preheader duplicate", () => {
  // Mirrors the real email layout: a hidden inbox-preview div repeats the top offer as
  // "Earn N% back at Merchant" ahead of the visible hero card in DOM order, and a
  // catalog-wide "Expiring Aug 23" banner sits near the top while the hero card's own
  // single-day expiry ("Rewards offer ends on Aug 20 at 11:59 PM PDT") is in its footer.
  const html = `
    <html><body>
      <div style="display:none">Earn 30% back at StubHub</div>
      <div>Expiring Aug 23 or as noted</div>
      <div class="hero">
        <a href="https://example.com/stubhub"><img src="https://example.com/stubhub.png"></a>
        <span>30% back at StubHub</span>
      </div>
      <p>Rewards offer ends on Aug 20 at 11:59 PM PDT. Limited availability, rate may vary.</p>
    </body></html>
  `;

  const { offers } = parseCaponeEmail(html, {
    messageId: 'abc123',
    date: '2026-08-20T12:14:51.000Z',
  });

  const stubhub = offers.find(o => o.merchant === 'StubHub');
  assert.ok(stubhub, 'expected a StubHub offer to be parsed');
  assert.equal(stubhub.source, 'todays-top');
  assert.equal(stubhub.expiresAt, '2026-08-21T07:00:00.000Z');
});

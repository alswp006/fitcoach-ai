import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
const { window } = dom;
try {
  const desc = Object.getOwnPropertyDescriptor(window.location, 'href')
    || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location), 'href');
  console.log('descriptor:', desc);
  Object.defineProperty(window.location, 'href', {
    configurable: true,
    get() { return 'http://localhost/'; },
    set(v) { console.log('blocked set to', v); },
  });
  window.location.href = 'https://evil.com';
  console.log('after set, href=', window.location.href);
} catch (e) {
  console.log('ERROR', e.message);
}

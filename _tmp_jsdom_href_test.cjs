const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
const { window } = dom;
const proto = Object.getPrototypeOf(window.location);
const desc = Object.getOwnPropertyDescriptor(proto, 'href');
console.log('desc:', desc && { configurable: desc.configurable, hasSet: !!desc.set, hasGet: !!desc.get });
try {
  Object.defineProperty(proto, 'href', {
    configurable: true,
    enumerable: desc.enumerable,
    get: desc.get,
    set(v) { console.log('INTERCEPTED SET', v); },
  });
  window.location.href = 'http://evil.com';
  console.log('after set, location.href=', window.location.href);
} catch (e) {
  console.log('ERROR', e.message);
}

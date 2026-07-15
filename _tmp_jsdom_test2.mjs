import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
const { window } = dom;

console.log('window.open desc:', Object.getOwnPropertyDescriptor(window, 'open'));
console.log('location.assign desc:', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location), 'assign'));
console.log('location.replace desc:', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location), 'replace'));

try {
  const orig = window.open;
  window.open = function (...args) { console.log('patched open called with', args); return null; };
  window.open('https://evil.com');
  console.log('patch ok');
} catch (e) {
  console.log('open patch ERROR', e.message);
}

try {
  const origAssign = window.location.assign.bind(window.location);
  window.location.assign = function (url) { console.log('patched assign called with', url); };
  window.location.assign('https://evil.com');
  console.log('assign patch ok');
} catch (e) {
  console.log('assign patch ERROR', e.message);
}

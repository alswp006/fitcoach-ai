import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
const { window } = dom;
console.log('own assign desc:', Object.getOwnPropertyDescriptor(window.location, 'assign'));
console.log('own replace desc:', Object.getOwnPropertyDescriptor(window.location, 'replace'));
console.log('own href desc on location:', Object.getOwnPropertyDescriptor(window.location, 'href'));

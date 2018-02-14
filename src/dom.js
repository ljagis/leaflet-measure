// dom.js
// utility functions for managing DOM elements

export function selectOne(selector, el) {
  if (!el) {
    el = document;
  }
  return el.querySelector(selector);
}

export function selectAll(selector, el) {
  if (!el) {
    el = document;
  }
  return Array.prototype.slice.call(el.querySelectorAll(selector));
}

export function hide(el) {
  if (el) {
    el.setAttribute('style', 'display:none;');
    return el;
  }
}

export function show(el) {
  if (el) {
    el.removeAttribute('style');
    return el;
  }
}

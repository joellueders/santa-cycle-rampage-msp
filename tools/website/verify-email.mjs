import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('email-signup.js', import.meta.url), 'utf8');
const endpoint = JSON.parse(readFileSync(new URL('event-data.json', import.meta.url))).email.endpoint;
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
function formFixture(endpoint, valid, email) {
  const input = { attributes: {}, removeAttribute(key) { delete this.attributes[key]; }, setAttribute(key, value) { this.attributes[key] = value; } };
  const button = { textContent: 'Keep me posted', disabled: false };
  const status = { hidden: true, textContent: '' };
  const fallback = { hidden: true };
  const nodes = { 'input[type="email"]': input, 'button[type="submit"]': button, '.email-signup-status': status, '.email-signup-fallback': fallback };
  let submit;
  const form = {
    email,
    action: endpoint, querySelector: key => nodes[key], reportValidity: () => valid,
    setAttribute() {}, removeAttribute() {}, addEventListener(_name, callback) { submit = callback; }
  };
  const send = () => submit({ preventDefault() {} });
  return { form, send, input, button, status, fallback };
}
function harness(fetchResponse, valid = true, addresses = ['fixture@example.org']) {
  const forms = addresses.map(email => formFixture(endpoint, valid, email));
  const calls = [];
  const window = {
    AbortController: globalThis.AbortController,
    setTimeout: () => 1, clearTimeout() {},
    FormData: function (form) { return [['fields[email]', form.email], ['ml-submit', '1'], ['anticsrf', 'true']]; },
    fetch: async (url, options) => { calls.push({ url, options }); return fetchResponse(url, options); }
  };
  vm.runInNewContext(script, { document: { querySelectorAll: () => forms.map(fixture => fixture.form) }, window, URLSearchParams });
  return { ...forms[0], forms, calls };
}
const response = value => ({ ok: true, json: async () => value });
const success = harness(async () => response({ success: true }));
await success.send();
check(success.calls.length === 1, 'One request per signup');
const { url, options } = success.calls[0];
check(url.startsWith('https://assets.mailerlite.com/'), 'No dashboard redirect');
check(options.method === 'POST' && options.redirect === 'error' && options.credentials === 'omit', 'Private POST body and redirects rejected');
check(options.body.get('fields[email]') === 'fixture@example.org', 'Email survives serialization');
check(options.body.get('ml-submit') === '1' && options.body.get('anticsrf') === 'true' && options.body.get('ajax') === '1', 'Provider fields included');
check(success.status.textContent.startsWith('Thanks!') && success.button.disabled && success.fallback.hidden, 'Success displayed inline only after provider success');
const rejected = harness(async () => response({ success: false, errors: { fields: { email: ['Email rejected.'] } } }));
await rejected.send();
check(rejected.status.textContent === 'Email rejected.' && rejected.input.attributes['aria-invalid'] === 'true', 'Provider field error displayed safely');
check(!rejected.button.disabled && !rejected.fallback.hidden, 'Field errors allow retry or hosted fallback');
for (const failure of [async () => { throw new Error('Offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('Not JSON'); } })]) {
  const failed = harness(failure);
  await failed.send();
  check(failed.status.textContent.startsWith('We couldn’t confirm') && !failed.button.disabled && !failed.fallback.hidden, 'Transport failure is never reported as success');
}
const extraStep = harness(async () => response({ success: false, fieldsToConfirm: ['email'] }));
await extraStep.send();
check(!extraStep.fallback.hidden && !extraStep.status.textContent.startsWith('Thanks!'), 'Additional provider steps use the hosted form, not false success');
const invalid = harness(async () => response({ success: true }), false);
await invalid.send();
check(invalid.calls.length === 0, 'Invalid input never leaves the browser');
let release;
const pending = harness(() => new Promise(resolve => { release = resolve; }));
const first = pending.send();
await pending.send();
check(pending.calls.length === 1 && pending.button.disabled, 'Double submission blocked while pending');
release(response({ success: true }));
await first;
await success.send();
check(success.calls.length === 1, 'Repeat events after success are ignored');
let finishShared;
const crossForm = harness(() => new Promise(resolve => { finishShared = resolve; }), true,
  ['fixture@example.org', 'Fixture@EXAMPLE.org']);
const sharedRequest = crossForm.send();
await crossForm.forms[1].send();
check(crossForm.calls.length === 1 && crossForm.forms[1].status.textContent.includes('already being sent'), 'Second form blocks the same address while pending');
finishShared(response({ success: true }));
await sharedRequest;
await crossForm.forms[1].send();
check(crossForm.calls.length === 1 && crossForm.forms[1].status.textContent.startsWith('Thanks!'), 'Second form reuses confirmed success');
let attempt = 0;
const retry = harness(async () => attempt++ === 0 ? { ok: false } : response({ success: true }), true,
  ['fixture@example.org', 'fixture@example.org']);
await retry.send();
await retry.forms[1].send();
check(retry.calls.length === 2 && retry.forms[1].status.textContent.startsWith('Thanks!'), 'Failure releases the address for retry in another form');
console.log(`${checks} signup checks passed using mocked responses only. No email addresses submitted.`);

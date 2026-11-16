import { copyText } from '../lib/clipboard.js';
import { toast } from './toast.js';
import { ICON } from './icons.js';

const CONTACT_EMAIL = 'devarjun876@gmail.com';

const MESSAGES = {
  name: { missing: 'Please add your name.' },
  email: { missing: 'Please add your email.', invalid: 'That email address doesn’t look right.' },
  message: { missing: 'Write a short message.' },
};

function setStatus(el, message, state) {
  el.textContent = message;
  el.dataset.state = state;
  el.classList.remove('sr-only');
}

/** Copy buttons beside the email and phone cards. */
export function initCopyButtons() {
  document.querySelectorAll('.contact-card[href^="mailto:"], .contact-card[href^="tel:"]').forEach((card) => {
    const item = card.closest('li');
    if (!item) return;
    const isMail = card.getAttribute('href').startsWith('mailto:');
    const what = isMail ? 'email address' : 'phone number';
    const text = card.textContent.trim();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', `Copy ${what}`);
    btn.innerHTML = ICON.copy;
    btn.addEventListener('click', async () => {
      const ok = await copyText(text);
      toast(ok ? `${isMail ? 'Email' : 'Phone number'} copied` : 'Couldn’t copy. Please select it manually.');
      if (!ok) return;
      btn.dataset.done = '';
      btn.innerHTML = ICON.check;
      setTimeout(() => {
        delete btn.dataset.done;
        btn.innerHTML = ICON.copy;
      }, 1600);
    });
    item.classList.add('has-copy');
    item.append(btn);
  });
}

export function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  const fields = [...form.querySelectorAll('input, textarea')];
  const messageField = form.querySelector('textarea');

  // an error line under each field, and a character counter under the message
  fields.forEach((input) => {
    const meta = document.createElement('div');
    meta.className = 'field-meta';
    const error = document.createElement('span');
    error.className = 'field-error';
    error.id = `${input.id}-error`;
    meta.append(error);
    if (input === messageField) {
      const counter = document.createElement('span');
      counter.className = 'field-count';
      counter.id = 'cf-count';
      meta.append(counter);
    }
    input.closest('.field').append(meta);
    input.setAttribute('aria-describedby', error.id);
  });
  const counter = document.getElementById('cf-count');

  function updateCount() {
    if (!counter || !messageField) return;
    const max = messageField.maxLength;
    const n = messageField.value.length;
    counter.textContent = `${n} / ${max}`;
    counter.classList.toggle('is-near', n >= max * 0.9);
  }

  function validate(input) {
    let message = '';
    if (!input.value.trim()) message = MESSAGES[input.name].missing;
    else if (input.validity.typeMismatch) message = MESSAGES[input.name].invalid;
    document.getElementById(`${input.id}-error`).textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !message;
  }

  fields.forEach((input) => {
    input.addEventListener('blur', () => { if (input.value || input.hasAttribute('aria-invalid')) validate(input); });
    input.addEventListener('input', () => {
      if (input.hasAttribute('aria-invalid')) validate(input); // clears the error as soon as it is fixed
      if (input === messageField) updateCount();
    });
  });
  updateCount();

  // shown after a successful submit: the safety net for visitors with no mail app set up
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.hidden = true;
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'btn btn-outline btn-sm';
  copy.textContent = 'Copy message';
  const again = document.createElement('a');
  again.className = 'btn btn-outline btn-sm';
  again.textContent = 'Open email again';
  actions.append(copy, again);
  status.after(actions);

  let draftText = '';
  copy.addEventListener('click', async () => {
    const ok = await copyText(`To: ${CONTACT_EMAIL}\n\n${draftText}`);
    toast(ok ? 'Message copied' : 'Couldn’t copy. Please select it manually.');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const invalid = fields.filter((f) => !validate(f));
    if (invalid.length) {
      setStatus(status, 'Please fix the highlighted fields.', 'error');
      actions.hidden = true;
      invalid[0].focus();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const email = String(data.get('email')).trim();
    const message = String(data.get('message')).trim();

    const subject = `Portfolio enquiry from ${name}`;
    const body = `${message}\n\n— ${name} (${email})`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    draftText = `Subject: ${subject}\n\n${body}`;
    again.href = href;
    actions.hidden = false;
    setStatus(status, `Opening your email app with the message ready to send. Nothing happened? Copy the message and send it to ${CONTACT_EMAIL}.`, 'success');
    window.location.href = href;
    form.reset();
    updateCount();
  });
}

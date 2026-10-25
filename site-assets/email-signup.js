(() => {
  document.querySelectorAll('form.email-signup:not([hidden])').forEach(form => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.email-signup-status');
    const fallback = form.querySelector('.email-signup-fallback');
    const originalLabel = button.textContent;
    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      busy = true;
      button.disabled = true;
      button.textContent = 'Sending…';
      form.setAttribute('aria-busy', 'true');
      input.removeAttribute('aria-invalid');
      status.hidden = false;
      status.textContent = 'Sending your signup…';
      fallback.hidden = true;
      const controller = new window.AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const body = new URLSearchParams(new window.FormData(form));
        body.set('ajax', '1');
        const response = await window.fetch(form.action, {
          method: 'POST', body, mode: 'cors', credentials: 'omit',
          redirect: 'error', signal: controller.signal
        });
        if (!response.ok) throw new Error('Signup service unavailable');
        const result = await response.json();
        if (result.success === true) {
          status.textContent = 'Thanks! Check your inbox to confirm your signup. If you’ve already confirmed, you’re all set.';
          button.textContent = 'Request received';
          return;
        }
        const emailErrors = result.errors?.fields?.email;
        if (emailErrors) {
          input.setAttribute('aria-invalid', 'true');
          const message = Array.isArray(emailErrors) ? emailErrors.filter(value => typeof value === 'string').join(' ') : '';
          status.textContent = message || 'Please check your email address and try again.';
        } else {
          status.textContent = 'MailerLite couldn’t complete this signup. Please use the signup page below.';
        }
        fallback.hidden = false;
        button.disabled = false;
        button.textContent = originalLabel;
      } catch {
        status.textContent = 'We couldn’t confirm your signup. Check your inbox before trying again, or use the signup page below.';
        fallback.hidden = false;
        button.disabled = false;
        button.textContent = originalLabel;
      } finally {
        window.clearTimeout(timeout);
        form.removeAttribute('aria-busy');
        busy = false;
      }
    });
  });
})();

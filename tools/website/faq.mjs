import { readFileSync } from 'node:fs';

export const faqContent = JSON.parse(readFileSync(new URL('./faq-data.json', import.meta.url), 'utf8'));
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const link = (url, text) => `<a href="${esc(url)}">${esc(text)}</a>`;

export function rideStatus(c) {
  const stops = [...c.announcementStatus.stops].sort((a, b) => a.number - b.number);
  const first = stops[0];
  const count = stops.filter(stop => stop.status === 'confirmed').length;
  const allConfirmed = stops.length > 0 && count === stops.length;
  const firstConfirmed = first?.status === 'confirmed';
  const start = new Date(c.startDate);
  const date = new Intl.DateTimeFormat('en-US', { timeZone: c.timeZone, weekday: 'long', month: 'long', day: 'numeric' }).format(start);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: c.timeZone, hour: 'numeric' }).format(start);
  const announcement = esc(c.route.announcement);
  const stopsLine = allConfirmed
    ? stops.every(stop => stop.time) ? 'The brewery stops and approximate arrival times are posted in the schedule.' : 'The brewery stops are posted in the schedule. Arrival times will be added here once confirmed.'
    : count > 0 ? `Some brewery stops are confirmed. The remaining stops will be announced in ${announcement}.` : `Stops will be announced in ${announcement}.`;
  const firstName = firstConfirmed ? first.mapUrl ? link(first.mapUrl, first.name) : esc(first.name) : 'the first brewery';
  const arrival = firstConfirmed
    ? `The first brewery is ${firstName}, stop ${first.number}.${first.time ? ` Approximate arrival: ${esc(first.time)}.` : ' The approximate arrival time will be posted here once confirmed.'}`
    : `We will post that brewery and the arrival time here in ${announcement}.`;
  return { date, time, first, firstConfirmed, allConfirmed, stopsLine, firstName, arrival };
}

function emailInvitation(c, text) {
  if (c.email.enabled && c.email.signupUrl) return link(c.email.signupUrl, text);
  if (c.email.enabled && /^https:\/\//.test(c.email.endpoint)) return `<a href="#schedule-email">${esc(text)}</a>`;
  return esc(text);
}

export function renderScheduleJoinNote(c) {
  const status = rideStatus(c);
  const ending = status.firstConfirmed ? status.arrival : 'Arrival times are posted here once the route is set.';
  return `<p class="schedule-join-note">Not riding the whole thing? Join at any stop. Most people jump in at the first brewery, stop ${status.first.number}. ${ending}</p>`;
}

function locationAnswer(c) {
  const s = rideStatus(c);
  const location = c.announcementStatus.startLocation.status === 'confirmed'
    ? `Our starting location is ${c.announcementStatus.startLocation.mapUrl ? link(c.announcementStatus.startLocation.mapUrl, [c.announcementStatus.startLocation.name, c.announcementStatus.startLocation.address].filter(Boolean).join(', ')) : esc([c.announcementStatus.startLocation.name, c.announcementStatus.startLocation.address].filter(Boolean).join(', '))}.`
    : `The starting location is not announced yet${c.announcementStatus.startLocation.previousName ? `, because ${esc(c.announcementStatus.startLocation.previousName)} is not our starting point this year` : ''}.`;
  return `<p>We meet at ${esc(s.time)} on ${esc(s.date)}. ${location} ${s.stopsLine} ${link(c.links.event, 'RSVP on Facebook')} or ${emailInvitation(c, 'sign up for email')} to hear first.</p>`;
}

function participationAnswer(c) {
  const s = rideStatus(c);
  return `<p>Yes. Meet the group at any brewery stop. Many riders join at the first brewery, our second stop. ${s.arrival} ${emailInvitation(c, 'Get the email to hear first')}.</p>`;
}

const indicator = '<svg class="faq-indicator" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 10h12"/><path class="faq-indicator-vertical" d="M10 4v12"/></svg>';

export function renderFaq(c) {
  const status = rideStatus(c);
  const render = item => {
    let answer = item.answerType === 'location' ? locationAnswer(c) : item.answerType === 'participation' ? participationAnswer(c) : item.answerHtml;
    answer = answer.replaceAll('https://www.facebook.com/events/1972798296683555/', esc(c.links.event));
    if (item.id === 'not-riding' && status.firstConfirmed) answer += `<p>${status.arrival}</p>`;
    if (item.id === 'toys') answer += '<p><a href="#toy">See the toy drive details.</a></p>';
    return `<details data-faq-id="${item.id}"><summary><span>${esc(item.question)}</span>${indicator}</summary><div class="faq-answer">${answer}</div></details>`;
  };
  return faqContent.displayOrder.map(id => {
    const item = faqContent.items.find(item => item.id === id);
    if (!item) throw new Error('Unknown FAQ item: ' + id);
    return render(item);
  }).join('').replaceAll('—', ', ');
}

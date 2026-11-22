import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const files = ['index.html', 'rebel.html', 'press.html', 'santa-cycle-rampage-2026.ics'];

function replaceRequired(source, pattern, replacement) {
  if (!pattern.test(source)) throw new Error('Could not find the published schedule field: ' + pattern);
  return source.replace(pattern, replacement);
}

export function pendingScheduleFiles(read) {
  const output = new Map();
  for (const name of files.slice(0, 2)) {
    let home = read(name);
    const meetupRow = home.match(/<div class="schedule-card" aria-label="Confirmed ride stops">(<div class="schedule-row">[^<]*<span>[^<]+<\/span><a [^>]+>[^<]+<\/a><\/div>)/)?.[1];
    if (!meetupRow) throw new Error('Could not find the confirmed meetup row in ' + name);
    home = replaceRequired(home, /<h3 class="schedule-heading">[^<]+<\/h3>/,
      '<h3 class="schedule-heading">Brewery stops to be announced</h3>');
    home = replaceRequired(home, /<p class="schedule-description">[^<]+<\/p>/,
      '<p class="schedule-description">The meetup is confirmed. Sign up below for updates on brewery stops and approximate arrival times.</p>');
    home = replaceRequired(home, /<div class="schedule-card" aria-label="Confirmed ride stops">[\s\S]*?(?=<aside class="ride-smart")/,
      '<div class="schedule-card" aria-label="Confirmed meetup">' + meetupRow + '</div>');
    home = replaceRequired(home, /<p class="schedule-join-note">[^<]+<\/p>/,
      '<p class="schedule-join-note">Joining partway through? Check back for the stop schedule.</p>');
    output.set(name, home);
  }
  let press = read('press.html');
  press = replaceRequired(press, /(<dt>(?:Route|Brewery) stops<\/dt><dd>)[^<]+(<\/dd>)/, '$1To be announced$2');
  if (press.includes('class="status-summary"')) {
    press = replaceRequired(press, /(<p class="status-summary">[^<]+?\.)[\s\S]*?<\/p>/,
      '$1 Brewery stops and approximate arrival times will be announced later.</p>');
  } else {
    press = replaceRequired(press, /<p class="note">Approximate route arrival times:[^<]+<\/p>/,
      '<p class="note">Brewery stops and approximate arrival times will be announced later.</p>');
  }
  output.set('press.html', press);

  let calendar = read(files[3]).replace(/\r\n[ \t]/g, '');
  calendar = replaceRequired(calendar, /DTEND:[^\r\n]+\r\n/, '');
  calendar = replaceRequired(calendar, /DESCRIPTION:([^\r\n]+?)\. Join anywhere[^\r\n]+/,
    'DESCRIPTION:$1. Brewery stops and times will be announced later.');
  // The replacement is ASCII. Fold at 75 characters as required by iCalendar.
  calendar = calendar.replace(/^DESCRIPTION:[^\r\n]+/m, line => line.length > 75
    ? line.slice(0, 75) + '\r\n ' + line.slice(75) : line);
  output.set(files[3], calendar);
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) throw new Error('Provide a new output directory for the pending schedule files.');
  const read = name => readFileSync(new URL('../../' + name, import.meta.url), 'utf8');
  const output = pendingScheduleFiles(read);
  mkdirSync(target);
  for (const [name, content] of output) writeFileSync(path.join(target, name), content, { flag: 'wx' });
}

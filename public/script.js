const BIRTHDAY_TZ = 'America/Toronto'; // Ottawa's time zone (Eastern Time)

// Minutes the given time zone is offset from UTC, at this moment (handles DST automatically).
function getUtcOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0';
  const match = tzPart.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + (hours < 0 ? -mins : mins);
}

// Real UTC timestamp for "00:00 on Oct 14" as experienced in Ottawa, for a given year.
function torontoOct14Utc(year) {
  const approx = new Date(Date.UTC(year, 9, 14, 12, 0, 0)); // midday UTC, safely inside Oct 14 ET either way
  const offsetMin = getUtcOffsetMinutes(approx, BIRTHDAY_TZ);
  return Date.UTC(year, 9, 14, 0, 0, 0) - offsetMin * 60000;
}

// True for all of Oct 14, as experienced in Ottawa (not the viewer's own time zone).
function isBirthdayToday() {
  const ottawaDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: BIRTHDAY_TZ,
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return ottawaDateStr === '10/14';
}

function nextOct14() {
  const now = new Date();
  const thisYear = now.getFullYear();
  let targetMs = torontoOct14Utc(thisYear);
  if (targetMs < now.getTime()) {
    targetMs = torontoOct14Utc(thisYear + 1);
  }
  return new Date(targetMs);
}

function updateCountdown() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  const caption = document.getElementById('countdown-caption');
  const section = document.getElementById('countdown');
  if (!daysEl) return;

  const target = nextOct14();
  const now = new Date();
  const diff = target - now;

  if (isBirthdayToday()) {
    section.innerHTML = '<p class="countdown-caption" style="margin-top:0;font-size:1.3rem;">today\'s the day 🎉</p>';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minsEl.textContent = String(mins).padStart(2, '0');
  secsEl.textContent = String(secs).padStart(2, '0');
  caption.textContent = 'until the big day';
}

updateCountdown();
setInterval(updateCountdown, 1000);

const candle = document.getElementById('candle');
const caption = document.getElementById('candle-caption');
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const colors = ['#6E2A38', '#D98B96', '#C9A227', '#FBF4E8', '#2A1B22'];

function burst(originX, originY) {
  const pieces = Array.from({ length: 140 }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 16,
    vy: Math.random() * -14 - 4,
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
    gravity: 0.35 + Math.random() * 0.15,
    life: 1,
  }));

  let frame;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    pieces.forEach((p) => {
      if (p.life <= 0) return;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= 0.006;

      if (p.life > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (alive) {
      frame = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  cancelAnimationFrame(frame);
  tick();
}

let wished = false;

function setCandleLockedState() {
  if (isBirthdayToday()) {
    candle.classList.remove('locked');
    caption.textContent = 'make a wish';
  } else {
    candle.classList.add('locked');
    caption.textContent = 'click when it\u2019s your birthday';
  }
}
setCandleLockedState();

candle.addEventListener('click', () => {
  if (!isBirthdayToday()) {
    caption.textContent = 'click when it\u2019s your birthday';
    candle.classList.remove('shake');
    // restart the shake animation even on repeated clicks
    void candle.offsetWidth;
    candle.classList.add('shake');
    return;
  }

  const rect = candle.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 3);

  if (!wished) {
    candle.classList.add('blown');
    caption.textContent = 'happy birthday, Sofia 🎂';
    wished = true;
  } else {
    candle.classList.toggle('blown');
    caption.textContent = candle.classList.contains('blown')
      ? 'happy birthday, Sofia 🎂'
      : 'make a wish';
  }
});

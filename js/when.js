(() => {
  const AR_MONTHS = {
    يناير: 1,
    فبراير: 2,
    مارس: 3,
    أبريل: 4,
    ابريل: 4,
    مايو: 5,
    يونيو: 6,
    يوليو: 7,
    أغسطس: 8,
    اغسطس: 8,
    سبتمبر: 9,
    أكتوبر: 10,
    اكتوبر: 10,
    نوفمبر: 11,
    ديسمبر: 12,
  };

  function locale() {
    try {
      if (localStorage.getItem("mh-lang") === "en") return "en-US";
    } catch (error) {
      /* localStorage can be blocked */
    }
    return "ar";
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function clockFromHint(hint) {
    const time = String(hint || "");
    const clock = time.match(/(\d{1,2}):(\d{2})/);
    if (!clock) return null;
    let hour = Number(clock[1]);
    const minute = Number(clock[2]);
    if (/م|pm/i.test(time) && hour < 12) hour += 12;
    if (/ص|am/i.test(time) && hour === 12) hour = 0;
    return { hour, minute };
  }

  function parseArabic(text, hint) {
    const match = String(text || "").match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
    if (!match) return null;
    const month = AR_MONTHS[match[2]];
    if (!month) return null;
    const clock = clockFromHint(hint);
    if (!clock) return { date: new Date(Number(match[3]), month - 1, Number(match[1])), time: false };
    const date = new Date(`${match[3]}-${pad(month)}-${pad(match[1])}T${pad(clock.hour)}:${pad(clock.minute)}:00+03:00`);
    return Number.isNaN(date.getTime()) ? null : { date, time: true };
  }

  function parse(value, hint) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : { date: value, time: true };
    const text = String(value || "").trim();
    if (!text) return null;
    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(text)) {
      const date = new Date(text);
      return Number.isNaN(date.getTime()) ? null : { date, time: true };
    }
    const naive = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (naive) {
      if (!naive[4]) return { date: new Date(Number(naive[1]), Number(naive[2]) - 1, Number(naive[3])), time: false };
      const date = new Date(`${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}`);
      return Number.isNaN(date.getTime()) ? null : { date, time: true };
    }
    return parseArabic(text, hint);
  }

  function format(value, options) {
    const opts = options || {};
    const parsed = parse(value, opts.hint);
    if (!parsed) return "";
    const loc = opts.locale || locale();
    if (opts.short) {
      const day = new Intl.DateTimeFormat(loc, { day: "numeric" }).format(parsed.date);
      const month = new Intl.DateTimeFormat(loc, { month: "short" }).format(parsed.date).replace(".", "");
      const year = new Intl.DateTimeFormat(loc, { year: "numeric" }).format(parsed.date);
      return `${day} ${month} ${year}`;
    }
    const comma = loc.startsWith("ar") ? "، " : ", ";
    const weekday = new Intl.DateTimeFormat(loc, { weekday: "long" }).format(parsed.date);
    const datePart = new Intl.DateTimeFormat(loc, { month: "long", day: "numeric", year: "numeric" }).format(parsed.date);
    const showTime = opts.time !== false && parsed.time;
    if (!showTime) return `${weekday}${comma}${datePart}`;
    const clock = new Intl.DateTimeFormat(loc, { hour: "numeric", minute: "2-digit", hour12: true }).format(parsed.date);
    return `${weekday}${comma}${datePart} • ${clock}`;
  }

  function toUtc(value) {
    const parsed = parse(value);
    if (!parsed || !parsed.time) return "";
    return parsed.date.toISOString();
  }

  function toInput(value) {
    const parsed = parse(value);
    if (!parsed || !parsed.time) return "";
    const date = parsed.date;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function announce(id) {
    const rev = String(Date.now());
    try {
      localStorage.setItem("mh-cups-rev", rev);
    } catch (error) {
      /* ignore */
    }
    try {
      const channel = new BroadcastChannel("mh-cups");
      channel.postMessage({ rev, id: id || 0 });
      channel.close();
    } catch (error) {
      /* ignore */
    }
  }

  window.MHWhen = { parse, format, toUtc, toInput, announce };
})();

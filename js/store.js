/*
  PROGRESS STORE (localStorage, this device only)
  {
    xp, muted,
    day: {last:'YYYY-MM-DD', streak, roundsToday},
    worlds: { [worldId]: { levels:[{stars, cleared, plays}], misses:{kind:n}, firstTry, total } }
  }
*/
(() => {
  const MQ = window.MQ;
  const KEY = 'mathQuestV6';
  const today = () => new Date().toLocaleDateString('en-CA');
  let data = null;

  const blankWorld = () => ({ levels: [0, 1, 2, 3].map(() => ({ stars: 0, cleared: false, plays: 0 })), misses: {}, firstTry: 0, total: 0 });

  function load() {
    try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { data = null; }
    if (!data) {
      data = { xp: 0, muted: false, day: { last: '', streak: 0, roundsToday: 0 }, worlds: {}, seenIntro: {} };
      // Keep XP earned in the older version of the app.
      try { const old = JSON.parse(localStorage.getItem('mathQuestProgress') || 'null'); if (old?.xp) data.xp = old.xp; } catch {}
      try { data.muted = localStorage.getItem('mathQuestMuted') === '1'; } catch {}
    }
    data.worlds ||= {}; data.seenIntro ||= {}; data.day ||= { last: '', streak: 0, roundsToday: 0 };
    if (data.day.last !== today()) data.day.roundsToday = 0;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }

  MQ.store = {
    get data() { return data; },
    world(id) { data.worlds[id] ||= blankWorld(); return data.worlds[id]; },
    setName(n) { data.name = String(n || '').trim().slice(0, 20); save(); },
    muted: () => !!data?.muted,
    setMuted(v) { data.muted = v; save(); },
    addXP(n) { data.xp += n; save(); MQ.renderStats?.(); },
    unlocked(id, lvl) { return lvl === 0 || this.world(id).levels[lvl - 1].cleared; },
    miss(id, kind) { if (!id || !kind) return; const w = this.world(id); w.misses[kind] = (w.misses[kind] || 0) + 1; save(); },
    fixed(id, kind) { if (!id || !kind) return; const w = this.world(id); if (w.misses[kind] > 0) w.misses[kind]--; save(); },
    problem(id, firstTry) { if (!id) return; const w = this.world(id); w.total++; if (firstTry) w.firstTry++; save(); },
    // Returns {newlyCleared, starsBefore}
    round(id, lvl, stars) {
      const out = { newlyCleared: false, starsBefore: 0 };
      if (id && lvl != null) {
        const L = this.world(id).levels[lvl];
        out.starsBefore = L.stars; L.plays++;
        L.stars = Math.max(L.stars, stars);
        if (stars >= 1 && !L.cleared) { L.cleared = true; out.newlyCleared = true; }
      }
      const t = today();
      if (data.day.last !== t) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        data.day.streak = data.day.last === y.toLocaleDateString('en-CA') ? data.day.streak + 1 : 1;
        data.day.last = t; data.day.roundsToday = 0;
      }
      data.day.roundsToday++;
      save();
      return out;
    },
    seen(key) { const s = !!data.seenIntro[key]; data.seenIntro[key] = true; save(); return s; },
    reset() { localStorage.removeItem(KEY); load(); }
  };
  load();
})();

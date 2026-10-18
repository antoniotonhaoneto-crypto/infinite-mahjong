// Gerador pseudoaleatório determinístico (Mulberry32) para tabuleiros reproduzíveis e Desafio Diário.

export function hashString(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createPRNG(seedInput = Date.now()) {
  let a = typeof seedInput === 'number'
    ? (seedInput >>> 0) || 1
    : hashString(seedInput) || 1;

  return {
    next() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(min, maxExclusive) {
      return min + Math.floor(this.next() * (maxExclusive - min));
    },
    pick(arr) {
      if (!arr.length) return undefined;
      return arr[this.nextInt(0, arr.length)];
    },
    shuffle(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
  };
}

export function getTodayKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getYesterdayKey(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getTodayKey(d);
}


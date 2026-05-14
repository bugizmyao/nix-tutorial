/**
 * 進捗管理 — localStorageを使った章ごとの完了スライド管理
 *
 * データ構造:
 *   {
 *     "ch1": { completed: 3, total: 5 },
 *     "ch2": { completed: 0, total: 4 },
 *     ...
 *   }
 */
const Progress = (() => {
  const KEY = 'nix-tutorial:progress:v1';

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  const save = (data) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage not available', e);
    }
  };

  return {
    /** 章の進捗を取得 */
    getChapter(chId) {
      const data = load();
      return data[`ch${chId}`] || { completed: 0, total: 0 };
    },

    /** 章の進捗を更新（最大値で上書き） */
    setChapter(chId, completed, total) {
      const data = load();
      const key = `ch${chId}`;
      const prev = data[key] || { completed: 0, total: 0 };
      data[key] = {
        completed: Math.max(prev.completed, completed),
        total: Math.max(prev.total, total),
      };
      save(data);
    },

    /** 全章マップを取得 */
    getAll() {
      return load();
    },

    /** 進捗率を計算（章ごと + 全体） */
    calcOverall(chapters) {
      const data = load();
      let done = 0;
      let total = 0;
      chapters.forEach((ch) => {
        const p = data[`ch${ch.id}`] || { completed: 0, total: ch.estSlides || 0 };
        done += p.completed;
        total += Math.max(p.total, ch.estSlides || 0);
      });
      return total === 0 ? 0 : Math.round((done / total) * 100);
    },

    /** 章の状態を判定 */
    statusOf(chId, estSlides = 0) {
      const p = this.getChapter(chId);
      const total = Math.max(p.total, estSlides);
      if (total === 0) return 'not-started';
      if (p.completed >= total) return 'completed';
      if (p.completed > 0) return 'in-progress';
      return 'not-started';
    },

    /** 全進捗をリセット */
    reset() {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
    },
  };
})();

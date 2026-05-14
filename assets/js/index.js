/**
 * トップページのロジック
 * - chapters.json を読み込む
 * - 章リストを描画
 * - 進捗バーを更新
 */
(async () => {
  const listEl = document.getElementById('chapter-list');
  const overallText = document.getElementById('overall-progress-text');
  const overallFill = document.getElementById('overall-progress-fill');
  const resetBtn = document.getElementById('reset-btn');

  let data;
  try {
    const res = await fetch('assets/data/chapters.json');
    data = await res.json();
  } catch (e) {
    listEl.innerHTML = '<li class="error">章データの読み込みに失敗しました。ローカルでは <code>python3 -m http.server</code> 経由で開いてください。</li>';
    return;
  }

  const render = () => {
    listEl.innerHTML = '';
    data.chapters.forEach((ch) => {
      const status = Progress.statusOf(ch.id, ch.estSlides);
      const p = Progress.getChapter(ch.id);
      const total = Math.max(p.total, ch.estSlides);
      const completed = p.completed;
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

      const li = document.createElement('li');
      li.className = `chapter-card ${status}`;
      li.dataset.chId = ch.id;
      li.innerHTML = `
        <div class="chapter-num">${status === 'completed' ? '✓' : ch.id}</div>
        <div class="chapter-info">
          <h3>Chapter ${ch.id}: ${escapeHTML(ch.title)}</h3>
          <p>${escapeHTML(ch.summary || '')}</p>
        </div>
        <div class="chapter-status">${completed}/${total || ch.estSlides} (${pct}%)</div>
      `;
      li.addEventListener('click', () => {
        location.href = `lesson.html?ch=${ch.id}`;
      });
      listEl.appendChild(li);
    });

    const overallPct = Progress.calcOverall(data.chapters);
    overallText.textContent = `${overallPct}%`;
    overallFill.style.width = `${overallPct}%`;
  };

  resetBtn.addEventListener('click', () => {
    if (confirm('進捗をリセットしますか？')) {
      Progress.reset();
      render();
    }
  });

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  render();
})();

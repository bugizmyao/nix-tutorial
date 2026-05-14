/**
 * レッスンページのロジック
 * - クエリから章IDとスライド番号を取得
 * - 章のMarkdownを取得しスライドに分割
 * - marked.js でレンダリング
 * - 進捗を localStorage に保存
 */
(async () => {
  const titleEl = document.getElementById('lesson-title');
  const cardEl = document.getElementById('slide-card');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const indicatorEl = document.getElementById('slide-indicator');
  const chFillEl = document.getElementById('ch-progress-fill');
  const chTextEl = document.getElementById('ch-progress-text');
  const sidebarListEl = document.getElementById('sidebar-list');
  const sidebarEl = document.getElementById('sidebar');
  const backdropEl = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('sidebar-toggle');

  // クエリパラメータ
  const params = new URLSearchParams(location.search);
  let chId = parseInt(params.get('ch') || '1', 10);
  let slideIdx = parseInt(params.get('slide') || '0', 10);

  // chapters.json 読み込み
  let chaptersData;
  try {
    chaptersData = await (await fetch('assets/data/chapters.json')).json();
  } catch (e) {
    cardEl.innerHTML = '<p class="error">章データの読み込みに失敗しました。<code>python3 -m http.server</code> 経由で開いてください。</p>';
    return;
  }

  const chapters = chaptersData.chapters;
  const chapter = chapters.find((c) => c.id === chId);
  if (!chapter) {
    cardEl.innerHTML = `<p class="error">章 ${chId} が見つかりません。</p>`;
    return;
  }

  // sidebar 描画
  const renderSidebar = () => {
    sidebarListEl.innerHTML = '';
    chapters.forEach((ch) => {
      const status = Progress.statusOf(ch.id, ch.estSlides);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `lesson.html?ch=${ch.id}`;
      a.className = (ch.id === chId ? 'active ' : '') + status;
      const check = status === 'completed' ? '<span class="check">✓</span>' : '';
      a.innerHTML = `<span class="num">${ch.id}</span> ${check}${escapeHTML(ch.title)}`;
      li.appendChild(a);
      sidebarListEl.appendChild(li);
    });
  };
  renderSidebar();

  // marked.js 設定
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: false,
      gfm: true,
      highlight: function (code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try { return hljs.highlight(code, { language: lang }).value; } catch (e) {}
        }
        return code;
      },
    });
  }

  // chapter markdown 取得
  let mdText;
  try {
    const res = await fetch(`assets/content/${chapter.file}`);
    if (!res.ok) throw new Error('fetch failed');
    mdText = await res.text();
  } catch (e) {
    cardEl.innerHTML = `<p class="error">${escapeHTML(chapter.file)} の読み込みに失敗しました。</p>`;
    return;
  }

  // スライドに分割（行頭の `---` 区切り）
  const slides = mdText
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (slideIdx < 0) slideIdx = 0;
  if (slideIdx >= slides.length) slideIdx = slides.length - 1;

  // タイトル更新
  titleEl.textContent = `Ch.${chId} ${chapter.title}`;
  document.title = `Ch.${chId} ${chapter.title} - Nix Tutorial`;

  const render = () => {
    const raw = slides[slideIdx] || '';
    let html;
    if (typeof marked !== 'undefined') {
      html = marked.parse(raw);
    } else {
      html = `<pre>${escapeHTML(raw)}</pre>`;
    }
    cardEl.innerHTML = html;

    // blockquote の装飾用クラスを自動付与（最初のテキストで判定）
    cardEl.querySelectorAll('blockquote').forEach((bq) => {
      const text = bq.textContent.trim();
      if (text.startsWith('[try]')) {
        bq.classList.add('try');
        bq.innerHTML = bq.innerHTML.replace(/\[try\]\s*/, '');
      } else if (text.startsWith('[hint]')) {
        bq.classList.add('hint');
        bq.innerHTML = bq.innerHTML.replace(/\[hint\]\s*/, '');
      } else if (text.startsWith('[note]')) {
        bq.classList.add('note');
        bq.innerHTML = bq.innerHTML.replace(/\[note\]\s*/, '');
      }
    });

    // table を横スクロール用ラッパーで囲む（モバイルでのはみ出し対策）
    cardEl.querySelectorAll('table').forEach((tbl) => {
      if (tbl.parentElement.classList.contains('table-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });

    // hljs 適用
    if (typeof hljs !== 'undefined') {
      cardEl.querySelectorAll('pre code').forEach((el) => {
        try { hljs.highlightElement(el); } catch (e) {}
      });
    }

    // インジケータ更新
    indicatorEl.textContent = `${slideIdx + 1} / ${slides.length}`;
    const pct = Math.round(((slideIdx + 1) / slides.length) * 100);
    chFillEl.style.width = `${pct}%`;
    chTextEl.textContent = `${slideIdx + 1}/${slides.length}`;

    // ボタン状態
    prevBtn.disabled = slideIdx === 0;
    nextBtn.textContent = slideIdx === slides.length - 1 ? '完了 ✓' : '次へ →';

    // 進捗保存（現在スライドの次まで読んだとみなす）
    Progress.setChapter(chId, slideIdx + 1, slides.length);

    // URL更新（履歴汚さない）
    const url = new URL(location.href);
    url.searchParams.set('slide', slideIdx);
    history.replaceState({}, '', url);

    // スクロールトップ
    cardEl.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // sidebar 再描画（進捗の✓を更新）
    renderSidebar();
  };

  prevBtn.addEventListener('click', () => {
    if (slideIdx > 0) {
      slideIdx--;
      render();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (slideIdx < slides.length - 1) {
      slideIdx++;
      render();
    } else {
      // 最終スライド → 次の章へ or トップへ
      const nextCh = chapters.find((c) => c.id === chId + 1);
      if (nextCh) {
        location.href = `lesson.html?ch=${nextCh.id}`;
      } else {
        location.href = 'index.html';
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
  });

  // sidebar toggle (mobile)
  toggleBtn.addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
    backdropEl.classList.toggle('open');
  });
  backdropEl.addEventListener('click', () => {
    sidebarEl.classList.remove('open');
    backdropEl.classList.remove('open');
  });

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  render();
})();

# Nix Tutorial

Progate風スライドで Nix / nix-darwin / home-manager を学ぶ静的Webサイト。

**Live**: https://bugizmyao.github.io/nix-tutorial/

## 構成

```
docs/learning/nix-tutorial/
├── index.html              # トップ（章一覧 + 全体進捗）
├── lesson.html             # スライドビューア (?ch=N&slide=N)
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── progress.js     # localStorage 管理
│   │   ├── index.js        # トップページロジック
│   │   └── lesson.js       # スライドビューアロジック
│   ├── data/
│   │   └── chapters.json   # 章メタデータ
│   └── content/
│       ├── ch01.md         # 各章スライド本体（`---` 区切り）
│       ├── ch02.md
│       ├── ...
│       └── ch09.md
└── README.md
```

## ローカルでの起動

`file://` 直接アクセスは fetch() が動かないので、HTTPサーバ経由で起動する。

```bash
cd docs/learning/nix-tutorial
python3 -m http.server 8000
# → http://localhost:8000/ をブラウザで開く
```

## 章の追加・修正

- 既存章の編集: `assets/content/chXX.md` を直接編集
- スライドの区切りは行頭の `---`（前後に空行）
- 章の追加: `assets/data/chapters.json` に章メタを追記 + `chXX.md` を新規作成

### スライド内の特殊記法

通常の Markdown に加えて、以下のクラス付き blockquote が使える:

```markdown
> [try] 演習: 自分で叩いてみよう
> ```bash
> nix --version
> ```

> [hint] ヒント文

> [note] メモ
```

## カリキュラム

| 章 | テーマ |
|---|------|
| 1 | Nixとは何か |
| 2 | インストール |
| 3 | 基本コマンド |
| 4 | 開発環境を作る |
| 5 | Nix言語入門 |
| 6 | Flakes入門 |
| 7 | Flake化された開発環境 |
| 8 | nix-darwin |
| 9 | home-manager |

## 進捗管理

`localStorage` の `nix-tutorial:progress:v1` キーに保存。
ブラウザを変えると進捗は引き継がれない（個人用なので割り切り）。

## 配信

`docs/` 配下なので GitHub Pages で配信可能。

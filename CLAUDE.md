# スタレ ガチャ計画プランナー（事業 01）

企画書: `../../01_企画部/01_スタレ_ガチャ計画ツール/企画書_2026-09-12.md`
実装計画: `docs/実装計画_2026-09-12.md`

## 動作確認

- テスト: `node --test tests/`
- 画面: Browser パネルで `hsr-pull-planner`（`.claude/launch.json`。`python -m http.server 8000` で `index.html` を配信）

## この案件の制約

- `index.html` 1 ファイル。ライブラリ・CDN・サーバーなし
- 計算は `<script id="calc">` の `Calc` に、画面の処理は `<script id="ui">` に書く。`Calc` は DOM を触らない
- テストは `tests/helpers/load-calc.js` で `index.html` から `Calc` を読み込む。`Calc` を変えたら必ずテストを回す
- 公式の画像・ロゴ・音声は使わない。文字と CSS だけ
- 作者名は「ユニフ」。フッターの非公式表記を消さない

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// index.html の <script id="calc"> だけを抜き出して評価し、Calc を返す。
// 画面の処理（<script id="ui">）は読み込まないので、DOM なしで動く。
module.exports = function loadCalc() {
  const htmlPath = path.join(__dirname, '..', '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script id="calc">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('index.html に <script id="calc"> がありません');
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(m[1], ctx);
  if (!ctx.Calc) throw new Error('<script id="calc"> が window.Calc を定義していません');
  return ctx.Calc;
};

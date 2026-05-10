# indexion SDD カスタマイズガイド

`indexion spec` の SDD パイプラインは KGF スペックで方言を切り替えられる。本書はその拡張・変更・運用ノウハウをまとめる。

## 1. 全体像

### 関連サブコマンド

| コマンド                                 | 引数                       | 既定値            | 役割                                                    |
| ---------------------------------------- | -------------------------- | ----------------- | ------------------------------------------------------- |
| `spec draft`                             | `--profile <kgf-lang>`     | `sdd-requirement` | ドキュメントから SDD ドラフトを生成（セクションベース） |
| `spec align <diff/trace/suggest/status>` | `--spec-format <kgf-lang>` | `auto`            | 仕様↔実装の整合（fact ベース）                          |
| `spec verify`                            | （内部で auto 判定）       | —                 | 仕様適合性検証                                          |

`<kgf-lang>` は KGF スペックの `language:` 値そのまま。`auto` は `DocumentSection` セマンティクスを定義したスペックを総当たり。

### コア処理の流れ

1. `KGFRegistry::load_from_dir(specs_dir)` で `*.kgf` を全件ロード
2. ファイル拡張子から `detect_from_path` でスペック選択（`auto`時）or `--spec-format` で固定
3. `interpret_document(content, path, spec)`
   - lex → トークン列
   - `extract_document_sections`（`section_token: HEADING` を使ってヘッダ抽出）
   - 各 section に対して `eval_rule_semantics("DocumentSection", labels, ctx)`
4. emit された fact 列を消費
   - `document_requirement` → 要件 (`spec align` のメイン入力)
   - `document_requirement_criteria` → 受入条件
   - `document_scenario` → シナリオ
   - `document_section_role` → ロール（メタ除外の判定）
   - `document_section_refs` / `document_literals` / `document_table_pairs` → 補助情報

### draft と align の違い（重要）

- **`draft`**: セクション単位のレンダリング。すべてのヘッダが要件候補になる。`document_requirement` の `id`/`title` は使わず、`section.title` をそのまま採用。`document_section_role` でフィルタのみ実施（許可ロール: `""`, `requirement`, `summary` の3つのみ通過 / `src/spec/draft/analysis.mbt:186-192`）。`document_requirement_criteria` の criteria 配列だけはマージされる。
- **`align`**: fact 駆動。`document_requirement` を emit したものだけが要件として入る。ID/normative/criteria すべて KGF 抽出値が反映される。

→ **正確な要件 ID/normative を見たいなら `align trace` を使う。`draft` の出力は cc-sdd 互換 Markdown 固定。**

## 2. 新しい SDD 方言を追加する手順

### Step 1. ディレクトリと空のスペックを用意

```bash
mkdir -p custom-kgfs
touch custom-kgfs/my-sdd.kgf
```

### Step 2. 最小スケルトンを書く

```kgf
kgf 0.6
language: my-sdd
sources: .md, .markdown, .mdx

=== lex
SKIP        /(\s+)+/
TOKEN HEADING     /^(?:#{1,6})(?=\s)/
TOKEN INLINE_CODE /`([^`\n]+)`/
TOKEN TEXT        /[^\s]+/

=== grammar
Doc -> ( Other )*
Other -> TEXT

=== features
content_type: document
detection_scope: overlay
section_token: HEADING
heading_text_tokens: TEXT, INLINE_CODE

=== semantics
on DocumentSection {
  note document_heading payload obj("line", $line, "level", countOccurrences($marker, "#"))
}
```

### Step 3. 要件抽出ルールを追加

```kgf
on DocumentSection when startsWith(trim($title), "<MY-PREFIX>") {
  let req_id = trim(beforeFirst(after_marker, " "))
  let req_title = trim(afterFirst(after_marker, " "))
  let req_body = trim($body)
  let upper = toUpper(req_body)
  let normative = cond(containsStr(upper, "SHALL"), "SHALL", cond(containsStr(upper, "MUST"), "MUST", cond(containsStr(upper, "SHOULD"), "SHOULD")))
  note document_requirement payload obj("id", req_id, "title", req_title, "description", req_body, "normative", normative, "line", $line, "end_line", $end_line)
  bind ns "value" name "current_requirement" to req_id
}
```

`bind ns "value" name "current_requirement" to req_id` で次に出てくる受入条件・シナリオに parent_id として継承される。

### Step 4. 受入条件・シナリオ・メタ除外を定義

```kgf
on DocumentSection when eq(toLower(trim($title)), "<受入条件のヘッダ>") {
  note document_requirement_criteria payload obj(
    "parent_id", $scope("value", "current_requirement"),
    "criteria", collectLinesAfterPrefixes($body, "- [ ]", "- [x]", "-", "1.", "2."),
    "line", $line, "end_line", $end_line)
}

on DocumentSection when startsWith(trim($title), "<シナリオ接頭辞>") {
  note document_scenario payload obj(
    "parent_id", $scope("value", "current_requirement"),
    "title", trim(afterFirst($title, "<シナリオ接頭辞>")),
    "given", collectLinesAfterPrefixes($body, "- GIVEN", "GIVEN"),
    "when", collectLinesAfterPrefixes($body, "- WHEN", "WHEN"),
    "then", collectLinesAfterPrefixes($body, "- THEN", "THEN"),
    "line", $line, "end_line", $end_line)
}

on DocumentSection when eq(toLower(trim($title)), "<メタヘッダ>") {
  note document_section_role payload obj("line", $line, "role", "meta")
}
```

許可される role 値とその扱い:

| role            | draft    | align    | 用途                 |
| --------------- | -------- | -------- | -------------------- |
| `""` (未設定)   | 含む     | 含む     | 通常セクション       |
| `requirement`   | 含む     | 含む     | 明示的に要件節       |
| `summary`       | 含む     | 含む     | 要約                 |
| `meta`          | **除外** | **除外** | 表紙・目次・改訂履歴 |
| `reference`     | **除外** | **除外** | 参考文献             |
| `example`       | **除外** | **除外** | 例示                 |
| `appendix_code` | **除外** | **除外** | 付録コード           |
| `index`         | **除外** | **除外** | 索引                 |

判定 SoT: `src/spec/draft/analysis.mbt:186-192` (draft) / `src/spec/align/spec_adapter.mbt:117-122` (align)。

### Step 5. 検証

```bash
indexion kgf check custom-kgfs/my-sdd.kgf
indexion kgf inspect --spec=my-sdd --kgf-dir=custom-kgfs <sample.md>
indexion spec align trace --specs-dir="$PWD/custom-kgfs" --spec-format=my-sdd <sample.md> <sample.md>
```

`align trace` の `requirements` 配列に期待した要件が出てくれば成功。

## 3. 既存 SDD 方言を変更する手順

### 既存方言は kgfs/ サブモジュール (indexion-kgf) にある

```bash
git submodule update --init kgfs
ls kgfs/dsl/  # markdown.kgf, sdd-requirement.kgf, sdd-user-story.kgf, rfc-plaintext.kgf
```

### 変更方針

| やりたいこと                                       | アプローチ                                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 検出パターンを増やしたい (例: `要件 N:`日本語形式) | `kgfs/dsl/sdd-requirement.kgf` の `=== semantics` に `on DocumentSection when startsWith(...)` ブロック追加                                                                         |
| 別フォーマット (Gherkin / 独自) を新規追加         | 新規 `.kgf` を別名で作成（既存変更ではなくオーバーレイ）                                                                                                                            |
| draft の Markdown 出力テンプレを変えたい           | `src/spec/draft/analysis.mbt:294` の `render_markdown` を改修                                                                                                                       |
| メタ除外ロールを追加・変更したい                   | `should_include_role` (align) と `should_include_section_role` (draft) のリストを書き換え                                                                                           |
| normative 判定キーワードを追加                     | KGF 側の `cond(containsStr(...))` チェーンに追加するか、`src/spec/align/spec_adapter.mbt:34-46` の `classify_normative_strength` を修正（こちらは text 全文に対する固定キーワード） |

### サブモジュール変更時のフロー

1. `cd kgfs && git checkout -b <branch>`
2. 変更してコミット → push
3. 親リポジトリで submodule pointer を更新 → コミット
4. 親リポジトリの release は CLAUDE.md の `deploy-process` skill に従う（submodule→parent push 順）

## 4. KGF セマンティクス API クイックリファレンス

### `DocumentSection` 評価時に渡されるラベル

`src/document/structure/structure.mbt:465-475` で設定。

| 変数                                | 内容                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `$title` / `$title_text`            | ヘッダテキスト（`#` 抜き、`heading_text_tokens` のトークンを単一 ASCII 空白で連結） |
| `$body` / `$body_text` / `$content` | 次のヘッダまでのセクション本文（生テキスト、改行込み）                              |
| `$marker`                           | ヘッダマーカー文字列（`##` など）                                                   |
| `$line`                             | ヘッダの行番号（1-indexed）                                                         |
| `$end_line`                         | セクション末尾行                                                                    |
| `$level`                            | KGF 内部で算出された階層レベル（`countOccurrences($marker, "#")` でも代用可）       |
| `$file`                             | 解析対象ファイルパス                                                                |

### emit する fact の種類

| fact kind                       | payload key                                                                                        | 用途                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `document_requirement`          | `id`, `title`, `description`, `normative`, `line`, `end_line`                                      | 要件本体（id/title 必須、空だと棄却 / `spec_adapter.mbt:336-339`） |
| `document_requirement_criteria` | `parent_id`, `criteria` (string[]), `line`, `end_line`                                             | 受入条件                                                           |
| `document_scenario`             | `parent_id`, `title`, `given` (string[]), `when` (string[]), `then` (string[]), `line`, `end_line` | シナリオ                                                           |
| `document_section_role`         | `line`, `role`                                                                                     | セクション分類（メタ除外）                                         |
| `document_section_refs`         | `line`, `refs` (string[])                                                                          | 内部参照                                                           |
| `document_literals`             | `line`, `values` (string[])                                                                        | 数値・リテラルリテラル抽出                                         |
| `document_table_pairs`          | `line`, `pairs` ({label, literal}[])                                                               | 表形式の対                                                         |
| `document_heading`              | `line`, `level`                                                                                    | 階層レベル明示                                                     |

### 利用可能な組み込み関数

`src/kgf/semantics/eval_expr.mbt` がSoT。

文字列: `trim`, `toUpper`, `toLower`, `containsStr`, `startsWith`, `beforeFirst`, `afterFirst`, `digits`, `concat`, `slice`, `stripQuotes`, `first`, `last`, `countOccurrences`

正規表現: `regexCaptures(text, pattern, group, global)`, `regexPairs(text, pattern, key_group, value_group)`

リスト構築: `collectLinesAfterPrefixes(body, prefix1, prefix2, ...)`

論理: `eq(a, b)`, `cond(test, then, else?)`, `not(x)`

JSON 構築: `obj("k1", v1, "k2", v2, ...)`（null 値は自動でスキップ）

数値: `add`, `sub`, `mul`, `div`, `floor`, `hexToInt`

その他: `coalesce(v1, v2, ...)`（最初の非 null を返す）, `children(node)`

コンテキスト: `$resolve(path)`, `$resolveFrom(...)`, `$findAncestor(...)`, `$scope(ns, name)`, `$callId`, `$autoSym`, `$autoCall`, `$collectRefs`, `$file`, `$root`, `$language`

スコープ操作: `bind ns "<namespace>" name "<key>" to <value>` で後続セクションから `$scope("<namespace>", "<key>")` で参照可能。

### `=== features` の主要キー

| キー                     | 値の例              | 役割                                               |
| ------------------------ | ------------------- | -------------------------------------------------- |
| `content_type`           | `document`          | ドキュメント扱い (`spec` パイプラインの対象になる) |
| `detection_scope`        | `overlay`           | `auto` 検出時の優先付け                            |
| `section_token`          | `HEADING`           | セクション境界トークン                             |
| `heading_text_tokens`    | `TEXT, INLINE_CODE` | ヘッダテキスト構成トークン（単一空白で連結される） |
| `coverage_token_kinds`   | `INLINE_CODE, TEXT` | カバレッジ計算対象                                 |
| `vocabulary_token_kinds` | `TEXT, INLINE_CODE` | 類似度比較で使う語彙                               |
| `reference_token_kinds`  | `INLINE_CODE`       | 参照抽出対象                                       |
| `embedded_code_fence`    | `CODE_FENCE`        | コードブロック検出                                 |

## 5. 落とし穴

### 5.1 `--specs-dir` の相対パスは壊れる（プロジェクト内実行時）

**症状**: プロジェクトルート (`kgfs/` サブモジュールがある場所) で `--specs-dir=examples/foo/specs` のような相対パスを渡すと、自前スペックが無視され、`kgfs/` 全体がフォールバックで読み込まれる → `--spec-format` 指定の方言が registry に存在せず 0 件結果。

**原因**: `find_kgfs_dir` 内で `resolve_path(target_dir, explicit_path)` を実行 (`src/config/paths.mbt:402-411`)。`target_dir` には `config.impl_path` が渡されるが、これは **ファイルパス**。結果が `examples/foo/sample.md/examples/foo/specs` のような無効パスに展開され、`is_valid_dir` が false → fallback 連鎖で project_candidate (`kgfs/`) が選ばれる。

**回避策**: **必ず絶対パスで渡す**。

```bash
indexion spec align trace --specs-dir="$PWD/custom-kgfs" --spec-format=my-sdd ...
```

### 5.2 `let` / `cond` などの式は1行で書く

**症状**: `kgf check` は通るが、ランタイムで該当ブロックが評価されず fact が一切 emit されない（無条件 `on DocumentSection { ... }` ですら）。

**原因**: KGF semantics の式パーサは改行で式を切り上げるため、改行を跨いだ `cond(...)` / `obj(...)` / `regexCaptures(...)` などはルール全体の評価を破壊する（既存 `kgfs/dsl/sdd-requirement.kgf` 含めすべての式が1行で書かれているのが規約の証）。

**回避策**: 長い `cond` チェーンも `obj(...)` 引数列も**1行に収める**。コメント・空行は `===` ブロック間や `on ... { }` ブロック間で OK。

### 5.3 `draft` の Markdown 出力ヘッダは cc-sdd 互換固定

**症状**: 自方言で `draft --format=markdown` しても `# SDD Draft` / `### Requirement N:` / `#### N.M:` が出る。

**原因**: `src/spec/draft/analysis.mbt:294-310` の `render_markdown` が固定文字列で出力。

**回避策**:

- `--format=json` で取得 → 自前でレンダリング、または
- `render_markdown` を改修してテンプレ化する PR を出す

### 5.4 `draft` は section.title をそのまま採用、KGF 抽出 ID は使わない

**症状**: `kakuyaku.kgf` で `id="AUTH-001"` / `title="セッションタイムアウト"` を emit しても、`draft` の出力は `Requirement N: §AUTH-001 セッションタイムアウト` のように生ヘッダが採用される。

**原因**: `draft` は `collect_section_requirement` で `section.title` を直接渡している (`src/spec/draft/analysis.mbt:127-147`)。`document_requirement` の `id`/`title` は使われない。

**回避策**:

- 正確な ID/normative/criteria を取りたい場合は `spec align trace --format=json` を使う
- `draft` 自体を fact ベースに書き換える PR を出す

### 5.5 `detect_from_path` は1スペックしか返さない

**症状**: `kgfs/` に既存 `markdown.kgf` がある状態で `auto` モードを使うと、`.md` ファイルに対して別スペックが選ばれて自方言が無視される。

**原因**: `KGFRegistry::detect_from_path` (`src/kgf/registry/registry.mbt:209-231`) は最長拡張子マッチで先頭1件を返す。

**回避策**:

- `--spec-format=my-sdd` で固定する（`auto` を避ける）
- `--specs-dir` を **自方言だけ** が入った専用ディレクトリに向ける（絶対パスで）

### 5.6 `align` のキャッシュが古い結果を返す

**症状**: KGF を編集したのに同じ結果が返る。

**場所**: `.indexion/cache/spec/align/` (CWD 起点)

**回避策**: 実験中は `rm -rf .indexion/cache/spec` を都度実行。あるいは `--cache-dir=/tmp/throwaway` で明示的に別ディレクトリを使う。

### 5.7 `document_requirement` の `id` / `title` が空だと棄却される

**場所**: `src/spec/align/spec_adapter.mbt:336-339`

```moonbit
let id = json_string_field(payload, "id").unwrap_or("")
let title = json_string_field(payload, "title").unwrap_or("")
if id.length() == 0 || title.length() == 0 {
  continue
}
```

**注意**: `beforeFirst("AUTH-001", " ")` が `"AUTH-001"` を返す（区切り文字なし時はそのまま）など、構文ミスマッチで空文字が出ることがある。emit 前にデフォルト値を当てるか、guard を `when` 句で先に絞っておくこと。

### 5.8 ヘッダテキスト連結は単一 ASCII 空白

**症状**: 多バイト空白や複数空白を含むヘッダ書式を期待した正規表現がマッチしない。

**原因**: `extract_headings` (`src/document/structure/structure.mbt:282-286`) は heading_text_tokens のトークンを単一 ASCII 空白で連結。ソースの空白幅は失われる。

**回避策**: パターンを `\s+` で書く、または `[^\s]+` トークンと連結ロジックを前提に検出。

### 5.9 `spec_defines_requirement_extraction` のフォールバック挙動

**仕様**: スペックが `document_requirement` を emit する semantic ブロックを持つ場合、ある file で 0 件 emit されると **そのファイルにはフォールバック検出を適用しない** (`src/spec/align/spec_adapter.mbt:130-157`, `416-418`)。

**意味**: 「この spec を使うなら、要件らしきものは全部明示的にマークされているはず」という設計思想。逆に `rfc-plaintext` のような汎用 spec は `document_requirement` を emit しないため、すべての section が fallback で要件候補になる。

**注意**: 自方言で要件抽出条件を絞りすぎると、要件 0 件のファイルが「要件なし」扱いされ、レポートで突き合わない。

### 5.10 グラマーのパース失敗は致命的ではない

`Doc -> ...` のパースが失敗してイベントが空でも、`extract_document_sections` はトークン列から直接 heading を取り出すので動く。`=== grammar` は SDD 用途では実質的にフォーマットチェックのみで、セクション抽出には不要。最低限の grammar (`Doc -> ( Other )*` / `Other -> TEXT`) で済ませて良い。

## 6. デバッグ手順

### Step 1. 構文チェック

```bash
indexion kgf check <path/to/spec.kgf>
```

regex エラー、参照不明シンボル、semantics の型整合性を検査。

### Step 2. トークン化を確認

```bash
indexion kgf inspect --spec=<lang> --kgf-dir=<dir> <sample.md>
```

`HEADING` / `TEXT` / `INLINE_CODE` の境界が想定通りか見る。多バイト文字の扱い特に注意。

### Step 3. fact 単位で出力を確認

`align trace --format=json` を使うのが最も詳細。

```bash
rm -rf .indexion/cache/spec
indexion spec align trace \
  --specs-dir="$PWD/custom-kgfs" \
  --spec-format=<lang> \
  --cache-dir=/tmp/throwaway \
  <sample.md> <sample.md> | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('reqs:', len(d['requirements']))
for r in d['requirements']:
    print(' ', r['id'], '|', r['title'], '| nrm=', r.get('normative'), '| crit=', len(r.get('criteria', [])))"
```

### Step 4. 段階的にルールを追加

問題のある方言は次の順で要素を追加して切り分け:

1. 無条件 `on DocumentSection { note document_requirement payload obj("id", concat("DBG-", $line), "title", $title, ...) }` → 全 section が要件として出るか確認
2. 1 件の `when` 条件付きルール → guard 句が動くか
3. `let` / `cond` を含む処理 → 1行で書けているか
4. role 系 → メタ除外が効いているか

### Step 5. プロジェクト内 vs 外で挙動が違う場合

`--specs-dir` を絶対パス化する。`/tmp/test/` などプロジェクト外ディレクトリにスペック+サンプルをコピーして再現させる（5.1 落とし穴の検証）。

## 7. リファレンス: コア実装ファイル

| 関心事                                   | ファイル                                   | 行                      |
| ---------------------------------------- | ------------------------------------------ | ----------------------- |
| draft 設定構造                           | `src/spec/draft/types.mbt`                 | 1-21                    |
| draft セクション収集                     | `src/spec/draft/analysis.mbt`              | 200-227                 |
| draft Markdown レンダラ (cc-sdd 互換)    | `src/spec/draft/analysis.mbt`              | 294-330                 |
| draft role フィルタ                      | `src/spec/draft/analysis.mbt`              | 186-192                 |
| align spec adapter                       | `src/spec/align/spec_adapter.mbt`          | 全体                    |
| align 要件抽出                           | `src/spec/align/spec_adapter.mbt`          | 305-467                 |
| align role フィルタ                      | `src/spec/align/spec_adapter.mbt`          | 117-122                 |
| align spec 選択 (auto / 明示)            | `src/spec/align/spec_adapter.mbt`          | 183-214                 |
| draft CLI                                | `cmd/indexion/spec/draft/cli.mbt`          | 1-100                   |
| align CLI                                | `cmd/indexion/spec/align/cli.mbt`          | 1-200                   |
| ドキュメント section 抽出                | `src/document/structure/structure.mbt`     | 206-360                 |
| KGF semantics 評価                       | `src/kgf/semantics/eval_expr.mbt`          | 全体 (組み込み関数 SoT) |
| KGF レジストリ読み込み                   | `src/kgf/features/features.mbt`            | 226-250                 |
| `find_kgfs_dir` (specs-dir 解決バグ箇所) | `src/config/paths.mbt`                     | 395-446                 |
| `select_kgfs_dir_candidate` 優先順位     | `src/config/paths.mbt`                     | 584-612                 |
| 既存 SDD 方言サンプル                    | `kgfs/dsl/sdd-requirement.kgf`             | サブモジュール          |
|                                          | `kgfs/dsl/sdd-user-story.kgf`              | サブモジュール          |
|                                          | `kgfs/dsl/markdown.kgf`                    | サブモジュール          |
|                                          | `kgfs/dsl/rfc-plaintext.kgf`               | サブモジュール          |
| 自作方言サンプル (本プロジェクト)        | `examples/sdd-kakuyaku/specs/kakuyaku.kgf` | —                       |

## 8. 開発フローの推奨

1. 既存方言 (`kgfs/dsl/sdd-requirement.kgf` など) をベースにコピー
2. `language:` を新名に変更、`sources:` 拡張子を確認
3. 自分の検出パターンを `=== semantics` に追加（既存ルールはコメントアウトせず削除して整理）
4. `kgf check` → `kgf inspect` → `align trace --format=json` の順に検証
5. **必ず絶対パスで `--specs-dir` を指定**、キャッシュは都度 `rm -rf`
6. 最終的に `examples/<your-dialect>/specs/<lang>.kgf` 配下に置く（または `kgfs/` サブモジュールに PR）

## 9. 関連 SoT

- KGF 組み込み関数 SoT: `src/kgf/semantics/eval_expr.mbt`
- KGF レジストリ読み込み SoT: `src/kgf/features/features.mbt:226`
- ドキュメント section 抽出 SoT: `src/document/structure/structure.mbt:326`
- spec パス解決 SoT: `src/config/paths.mbt:395`
- 既存方言の参考実装 SoT: `kgfs/dsl/` （submodule: `git@github.com:trkbt10/indexion-kgf`）

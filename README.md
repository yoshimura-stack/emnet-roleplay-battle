# 下剋上ロープレ10分1本勝負 — V2

## What's new
- Three.jsによる3Dアリーナ背景、カメラパンチ、パーティクル演出
- 既存の抽選 / VS / バトルロジックを維持したままV2演出層を追加
- `core-state.js` を追加し、ゲーム状態を `localStorage` に永続化
- カスタムイベント `emnet:*` により、将来のHOST / PROJECTOR / Realtime分離に備えた構造
- Cloudflare Pages / GitHub Pagesへそのまま配置可能な静的構成

## Local launch
ブラウザ直開きでも基本機能は動作しますが、Three.js CDNとブラウザのセキュリティ制約を避けるため、ローカルHTTPサーバー推奨です。

```bash
python -m http.server 8080
```

その後 `http://localhost:8080` を開きます。

## Cloudflare Pages
1. このフォルダをGitHubリポジトリへpush
2. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git
3. Framework preset: None
4. Build command: 空欄
5. Build output directory: `/`
6. Deploy

## Next architecture step
次フェーズで `/host` と `/projector` にUIを分離し、Supabase Realtime + DB + Server Clock + Self Healを追加する想定です。


## Asset filename policy
All deploy-time asset filenames are ASCII-only (lowercase letters, numbers, underscores, hyphens). Japanese display names remain unchanged inside the UI. This prevents filename encoding and case-sensitivity problems across Windows, GitHub, and Cloudflare Pages.

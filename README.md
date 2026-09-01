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


## V4 True 3D Arena
Battle fighters are rendered inside the Three.js scene as layered cutouts with parallax depth, animated camera, stage architecture, rim glow, and hit-reaction shock rings. DOM fighter images are hidden during battle while HUD/buttons remain HTML for reliability.


## V5 Comic Fighter System
- Fighter profiles for 芳村 / 大森 / 小嶋 / 荒木
- Codenames, archetypes, taglines and fighter-specific move labels
- Perspective-heavy Three.js arena with deep tunnel frames, octagonal platform, energy towers and 3D camera orbit
- Comic-book HUD / halftone styling
- Existing game logic and Cloudflare/GitHub deployment flow preserved

## V6 Comic Fighter Roulette
- Pilot fighter art integrated for 芳村 / 大森 / 小嶋 / 荒木.
- Character roulette shows full comic fighter cards when artwork exists.
- STOP triggers an "awakening" flash / zoom / codename punch-in.
- VS splash uses comic fighter art for supported characters.
- Unsupported members automatically fall back to the existing photo assets.


## V6.1
- Roulette now uses dedicated character-focused artwork (`roulette_*.png`).
- Full poster artwork (`fighter_*.png`) remains reserved for the VS confirmation cinematic.

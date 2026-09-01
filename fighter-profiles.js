/* EMNET Roleplay Battle V5 - fighter identity layer */
(() => {
  const PROFILES = {
    '芳村': {
      codename: 'VANGUARD', archetype: 'ALL-ROUNDER', accent: '#19e6ff', accent2: '#006bff',
      tagline: '戦略で導き、拳で未来を切り拓け。', art: 'fighter_yoshimura.png',
      moves: ['Pulse Break', 'Rising Drive', 'Blue Impact', 'Vanguard Overdrive']
    },
    '大森': {
      codename: 'MAVERICK', archetype: 'TRICKSTER BRAWLER', accent: '#ff5a1f', accent2: '#ffb000',
      tagline: '遊びが武器だ。カオスで勝利を奪え。', art: 'fighter_omori.png',
      moves: ['Chaos Jab', 'Blaze Rush', 'Wild Trigger', 'Maverick Riot']
    },
    '小嶋': {
      codename: 'SKYRUSH', archetype: 'RUSHDOWN', accent: '#d92cff', accent2: '#7028ff',
      tagline: '魅せて、追い込んで、勝利は私のステージ。', art: 'fighter_kojima.png',
      moves: ['Flash Step', 'Velvet Burst', 'Star Lance', 'Skyrush Finale']
    },
    '荒木': {
      codename: 'CRIMSON EDGE', archetype: 'PRECISION STRIKER', accent: '#ff254a', accent2: '#ff8a1f',
      tagline: '紅蓮の刃で、すべてを斬り裂く。', art: 'fighter_araki.png',
      moves: ['Scarlet Drive', 'Golden Fang', 'Crimson Edge', 'Scarlet Execution']
    }
  };
  const FALLBACK = { codename: 'CHALLENGER', archetype: 'FIGHTER', accent: '#ffffff', accent2: '#8a8a8a', tagline: '限界を超えろ。', moves: ['Strike', 'Pulse', 'Drive', 'Ultimate'] };
  window.FIGHTER_PROFILES = Object.freeze(PROFILES);
  window.getFighterProfile = name => ({ ...FALLBACK, ...(PROFILES[name] || {}) });
})();

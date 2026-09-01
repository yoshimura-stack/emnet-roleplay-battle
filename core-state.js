/* EMNET Event Game Core - lightweight local state layer (V2 foundation) */
(() => {
  const KEY = 'emnet_event_game_core_v2';
  const defaultState = {
    version: 2,
    gameId: 'gekokujo-roleplay',
    phase: 'select',
    updatedAt: Date.now(),
    match: { manager: null, main: null, sub: null, agency: null, judge: null },
    battle: { p1Hp: 100, p2Hp: 100, remainingSec: 600, active: false }
  };

  const safeParse = (raw) => {
    try { return JSON.parse(raw); } catch (_) { return null; }
  };

  let state = Object.assign({}, defaultState, safeParse(localStorage.getItem(KEY)) || {});

  function persist() {
    state.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('emnet:core-state', { detail: structuredClone(state) }));
  }

  function setPhase(phase) {
    state.phase = phase;
    persist();
  }

  function setMatch(patch) {
    state.match = { ...state.match, ...patch };
    persist();
  }

  function setBattle(patch) {
    state.battle = { ...state.battle, ...patch };
    persist();
  }

  function reset() {
    state = structuredClone(defaultState);
    state.updatedAt = Date.now();
    persist();
  }

  window.EMNETCore = {
    getState: () => structuredClone(state),
    setPhase,
    setMatch,
    setBattle,
    reset,
    emit(name, detail = {}) {
      window.dispatchEvent(new CustomEvent(`emnet:${name}`, { detail }));
    }
  };

  persist();
})();

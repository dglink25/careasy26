// src/services/notificationSounds.js
//
// ✅ CORRECTIONS :
//   - forceUnlock() méthode async — attend que AudioContext soit vraiment actif
//   - Joue les sons même si l'utilisateur n'a pas encore interagi (Chrome autoplay)
//   - Sons enrichis, bien distinctifs par type

class NotificationSounds {
  constructor() {
    this.ctx       = null;
    this.enabled   = true;
    this.volume    = 0.7;
    this._unlocked = false;
    this._unlockPromise = null;

    // Pré-déverrouiller à chaque interaction utilisateur
    const events = ['click', 'touchstart', 'keydown', 'mousedown', 'scroll'];
    const unlock = () => this.forceUnlock();
    events.forEach(evt =>
      document.addEventListener(evt, unlock, { once: false, passive: true })
    );
  }

  // ── Déverrouillage AudioContext — ASYNC ───────────────────────
  forceUnlock() {
    if (this._unlocked && this.ctx?.state === 'running') {
      return Promise.resolve();
    }

    if (this._unlockPromise) return this._unlockPromise;

    this._unlockPromise = (async () => {
      try {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state !== 'running') {
          await this.ctx.resume();
        }
        if (this.ctx.state === 'running') {
          this._unlocked = true;
        }
      } catch (err) {
        console.warn('[Sound] AudioContext unlock failed:', err);
      } finally {
        this._unlockPromise = null;
      }
    })();

    return this._unlockPromise;
  }

  _getCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch { return null; }
    }
    // Tenter resume non-bloquant
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx.state !== 'closed' ? this.ctx : null;
  }

  _tone(freq, duration, type = 'sine', gainVal = null, delay = 0) {
    const ctx = this._getCtx();
    if (!ctx) return;
    const g = gainVal ?? this.volume * 0.5;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(g, ctx.currentTime + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch {}
  }

  // ── 💬 Message — 2 notes vives type WhatsApp ──────────────────
  playMessage() {
    this._tone(1318, 0.12, 'sine', this.volume * 0.55, 0);
    this._tone(1567, 0.20, 'sine', this.volume * 0.50, 0.13);
  }

  // ── ✅ Succès (entreprise validée) — fanfare 4 notes ──────────
  playSuccess() {
    [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]].forEach(([f, d]) =>
      this._tone(f, 0.22, 'sine', this.volume * 0.5, d)
    );
  }

  // ── ⚠️ Alerte (rejet / annulation) — 3 notes basses ──────────
  playAlert() {
    this._tone(440, 0.15, 'sawtooth', this.volume * 0.35, 0);
    this._tone(330, 0.15, 'sawtooth', this.volume * 0.35, 0.18);
    this._tone(440, 0.15, 'sawtooth', this.volume * 0.35, 0.36);
  }

  // ── 📅 RDV confirmé — 2 notes douces ─────────────────────────
  playRdvConfirmed() {
    this._tone(698, 0.18, 'sine', this.volume * 0.5, 0);
    this._tone(880, 0.22, 'sine', this.volume * 0.45, 0.17);
  }

  // ── 📅 RDV en attente — double bip doux ──────────────────────
  playRdvPending() {
    this._tone(880, 0.10, 'sine', this.volume * 0.40, 0);
    this._tone(880, 0.10, 'sine', this.volume * 0.30, 0.16);
  }

  // ── 🔔 Pending admin — 3 notes alertes ───────────────────────
  playPending() {
    this._tone(660, 0.12, 'sine', this.volume * 0.50, 0);
    this._tone(880, 0.12, 'sine', this.volume * 0.45, 0.14);
    this._tone(660, 0.12, 'sine', this.volume * 0.40, 0.28);
  }

  // ── 🔔 Défaut — bip unique ────────────────────────────────────
  playDefault() {
    this._tone(660, 0.18, 'sine', this.volume * 0.45, 0);
  }

  // ── Dispatch par type ─────────────────────────────────────────
  play(type) {
    if (!this.enabled) return;
    try {
      switch (type) {
        case 'message':                return this.playMessage();
        case 'entreprise_approved':    return this.playSuccess();
        case 'entreprise_rejected':    return this.playAlert();
        case 'entreprise_pending':
        case 'new_entreprise_pending': return this.playPending();
        case 'rdv_confirmed':          return this.playRdvConfirmed();
        case 'rdv_cancelled':          return this.playAlert();
        case 'rdv_pending':            return this.playRdvPending();
        default:                       return this.playDefault();
      }
    } catch (err) {
      console.warn('[Sound] play error:', err);
    }
  }

  setVolume(v)  { this.volume  = Math.max(0, Math.min(1, Number(v) || 0.7)); }
  setEnabled(b) { this.enabled = Boolean(b); }
}

export const notificationSounds = new NotificationSounds();
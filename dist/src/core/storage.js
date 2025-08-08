"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const KEY = {
    LAST_THEME: "themeLab:lastTheme",
    UI_STATE: "themeLab:uiState",
    BUNDLE: "themeLab:bundle"
};
class Storage {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    load() {
        return {
            theme: this.ctx.globalState.get(KEY.LAST_THEME) ?? undefined,
            ui: this.ctx.globalState.get(KEY.UI_STATE) ?? undefined,
            bundle: this.ctx.globalState.get(KEY.BUNDLE) ?? []
        };
    }
    async saveTheme(theme) {
        await this.ctx.globalState.update(KEY.LAST_THEME, theme);
    }
    async saveUi(ui) {
        await this.ctx.globalState.update(KEY.UI_STATE, ui);
    }
    async saveBundle(bundle) {
        await this.ctx.globalState.update(KEY.BUNDLE, bundle);
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map
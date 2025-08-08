"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeBundle = void 0;
class ThemeBundle {
    items = [];
    constructor(initial) {
        if (Array.isArray(initial))
            this.items = initial.slice();
    }
    add(theme) {
        const name = theme.name || `Theme ${this.items.length + 1}`;
        const existing = this.items.find(t => (t.name || "").toLowerCase() === name.toLowerCase());
        if (existing) {
            const suffixed = `${name}-${Date.now()}`;
            this.items.push({ ...theme, name: suffixed });
        }
        else {
            this.items.push({ ...theme });
        }
    }
    clear() {
        this.items = [];
    }
    list() {
        return this.items.slice();
    }
}
exports.ThemeBundle = ThemeBundle;
//# sourceMappingURL=bundleModel.js.map
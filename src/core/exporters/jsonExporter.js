"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAsJson = exportAsJson;
function exportAsJson(theme) {
    return JSON.stringify(theme, null, 2);
}

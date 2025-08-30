"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
/**
 * RequestId middleware - generuje jedinečný requestId pre každý request
 * a pridá ho do request objektu aj response headera
 */
function requestIdMiddleware(req, res, next) {
    // Generuj nový requestId pre každý request
    const requestId = (0, uuid_1.v4)();
    // Ulož do request objektu
    req.requestId = requestId;
    // Pridaj do response headera
    res.setHeader('X-Request-Id', requestId);
    next();
}
//# sourceMappingURL=requestId.js.map
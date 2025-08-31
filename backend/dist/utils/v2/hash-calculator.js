"use strict";
/**
 * SHA-256 Hash Calculator pre Protocol V2
 * Zabezpečuje integrity checking a deduplication
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashCalculator = void 0;
const crypto_1 = __importDefault(require("crypto"));
class HashCalculator {
    /**
     * Vypočíta SHA-256 hash pre buffer
     */
    static calculateSHA256(buffer) {
        return crypto_1.default.createHash('sha256')
            .update(buffer)
            .digest('hex');
    }
    /**
     * Vypočíta MD5 hash pre backward compatibility
     */
    static calculateMD5(buffer) {
        return crypto_1.default.createHash('md5')
            .update(buffer)
            .digest('hex');
    }
    /**
     * Vypočíta všetky hash hodnoty pre súbor
     */
    static calculateHashes(buffer) {
        return {
            sha256: this.calculateSHA256(buffer),
            md5: this.calculateMD5(buffer),
            size: buffer.length,
            timestamp: new Date()
        };
    }
    /**
     * Vytvorí manifest pre photo a všetky jeho derivatívy
     */
    static createPhotoManifest(photoId, original, derivatives, metadata) {
        const originalHash = this.calculateSHA256(original);
        return {
            photoId,
            originalHash,
            derivativeHashes: {
                thumb: this.calculateSHA256(derivatives.thumb),
                gallery: this.calculateSHA256(derivatives.gallery),
                pdf: this.calculateSHA256(derivatives.pdf)
            },
            sizes: {
                original: original.length,
                thumb: derivatives.thumb.length,
                gallery: derivatives.gallery.length,
                pdf: derivatives.pdf.length
            },
            createdAt: new Date(),
            metadata
        };
    }
    /**
     * Verifikuje integrity súboru pomocou hash
     */
    static verifyIntegrity(buffer, expectedHash) {
        const actualHash = this.calculateSHA256(buffer);
        return actualHash === expectedHash;
    }
    /**
     * Detekuje duplicitné súbory na základe hash
     */
    static isDuplicate(hash1, hash2) {
        return hash1 === hash2;
    }
    /**
     * Generuje unique identifier na základe hash a timestamp
     */
    static generateUniqueId(buffer) {
        const hash = this.calculateSHA256(buffer);
        const timestamp = Date.now();
        return `${hash.substring(0, 16)}_${timestamp}`;
    }
    /**
     * Generuje manifest pre súbory
     * Používa sa v testoch
     */
    static generateManifest(files) {
        return {
            files,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            timestamp: new Date(),
            version: '2.0'
        };
    }
}
exports.HashCalculator = HashCalculator;
//# sourceMappingURL=hash-calculator.js.map
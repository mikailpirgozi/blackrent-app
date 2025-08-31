"use strict";
/**
 * Feature Flags API Routes
 * Provides feature flag management for frontend
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// In-memory feature flags (can be moved to database later)
const featureFlags = {
    PROTOCOL_V2_ENABLED: {
        enabled: process.env.PROTOCOL_V2_ENABLED === 'true',
        percentage: parseInt(process.env.PROTOCOL_V2_PERCENTAGE || '100'),
        users: process.env.PROTOCOL_V2_USER_IDS?.split(',') || [],
    },
};
/**
 * GET /api/feature-flags/:flagName
 * Get specific feature flag
 */
router.get('/:flagName', auth_1.authenticateToken, (req, res) => {
    try {
        const { flagName } = req.params;
        const flag = featureFlags[flagName];
        if (!flag) {
            return res.status(404).json({
                success: false,
                error: `Feature flag '${flagName}' not found`,
            });
        }
        res.json({
            success: true,
            flag: {
                name: flagName,
                enabled: flag.enabled,
                percentage: flag.percentage,
                users: flag.users,
            },
        });
    }
    catch (error) {
        console.error('Feature flag error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get feature flag',
        });
    }
});
/**
 * GET /api/feature-flags
 * Get all feature flags
 */
router.get('/', auth_1.authenticateToken, (req, res) => {
    try {
        res.json({
            success: true,
            flags: featureFlags,
        });
    }
    catch (error) {
        console.error('Feature flags error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get feature flags',
        });
    }
});
exports.default = router;
//# sourceMappingURL=feature-flags.js.map
/**
 * verifyHourReport.js
 *
 * Master orchestrator for AI-powered hour report verification.
 * Combines three verification layers with configurable weights:
 *
 *   Layer 1 (35%): Text-to-Topic — TF-IDF + keyword overlap
 *   Layer 2A (20%): OCR text extraction from proof image
 *   Layer 2B (20%): Scene classification via MobileNet
 *   Layer 3 (25%): Teaching aids/methods consistency
 *
 * Exports a single function: verifyHourReport()
 *
 * @module verifyHourReport
 */

import { verifyTextMatch, verifyAidsMethodsConsistency } from './textVerification';
import { verifyImage, cleanupImageVerification } from './imageVerification';

// ═══════════════════════════════════════════════════════════════
// LAYER WEIGHTS
// ═══════════════════════════════════════════════════════════════
const WEIGHTS = {
    textMatch: 0.35,     // Layer 1: text description vs topic
    ocrMatch: 0.20,      // Layer 2A: OCR text in image
    sceneMatch: 0.20,    // Layer 2B: MobileNet scene classification
    aidsMatch: 0.25,     // Layer 3: teaching aids/methods consistency
};

// ═══════════════════════════════════════════════════════════════
// THRESHOLDS
// ═══════════════════════════════════════════════════════════════
const THRESHOLDS = {
    verified: 70,        // score >= 70 → ✅ VERIFIED
    lowConfidence: 40,   // score 40-69 → ⚠️ LOW CONFIDENCE
    // score < 40 → 🚩 FLAGGED
};

/**
 * Reweight remaining layers if some layers fail/are unavailable.
 * @param {Object} layerResults - Map of layer names to their results (null if failed)
 * @returns {Object} Adjusted weights summing to 1.0
 */
function reweightLayers(layerResults) {
    const activeWeights = {};
    let totalActive = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
        if (layerResults[key] !== null && layerResults[key] !== undefined) {
            activeWeights[key] = weight;
            totalActive += weight;
        }
    }

    // Normalize to sum to 1.0
    if (totalActive > 0 && totalActive < 1.0) {
        const scale = 1.0 / totalActive;
        for (const key of Object.keys(activeWeights)) {
            activeWeights[key] = activeWeights[key] * scale;
        }
    }

    return activeWeights;
}

/**
 * Determine verification status from score.
 * @param {number} score - Final score 0-100
 * @returns {{ verified: boolean, flagged: boolean, lowConfidence: boolean, status: string }}
 */
function getStatus(score) {
    if (score >= THRESHOLDS.verified) {
        return { verified: true, flagged: false, lowConfidence: false, status: 'verified' };
    }
    if (score >= THRESHOLDS.lowConfidence) {
        return { verified: false, flagged: false, lowConfidence: true, status: 'low_confidence' };
    }
    return { verified: false, flagged: true, lowConfidence: false, status: 'flagged' };
}

/**
 * Run text-only verification (Layer 1 + Layer 3).
 * Called when no image is available yet.
 *
 * @param {Object} params
 * @param {string} params.topicName - Ground truth topic name
 * @param {string} params.description - "What was covered" text
 * @param {string} params.teachingAids - Comma-separated aids
 * @param {string} params.teachingMethods - Comma-separated methods
 * @returns {{ score: number, verified: boolean, flagged: boolean, lowConfidence: boolean, status: string, reason: string, layerScores: Object }}
 */
export function verifyTextOnly({ topicName, description, teachingAids, teachingMethods }) {
    const layerResults = {};

    // Layer 1: Text match
    try {
        const textResult = verifyTextMatch(topicName, description);
        layerResults.textMatch = textResult;
    } catch (err) {
        console.error('Layer 1 error:', err);
        layerResults.textMatch = null;
    }

    // Layer 3: Aids/methods consistency
    try {
        const aidsResult = verifyAidsMethodsConsistency(topicName, teachingAids, teachingMethods);
        layerResults.aidsMatch = aidsResult;
    } catch (err) {
        console.error('Layer 3 error:', err);
        layerResults.aidsMatch = null;
    }

    // Image layers not available
    layerResults.ocrMatch = null;
    layerResults.sceneMatch = null;

    // Calculate weighted score with only available layers
    const adjustedWeights = reweightLayers(layerResults);
    let totalScore = 0;
    const reasons = [];

    if (layerResults.textMatch && adjustedWeights.textMatch) {
        totalScore += layerResults.textMatch.score * adjustedWeights.textMatch;
        reasons.push(layerResults.textMatch.reason);
    }

    if (layerResults.aidsMatch && adjustedWeights.aidsMatch) {
        totalScore += layerResults.aidsMatch.score * adjustedWeights.aidsMatch;
        reasons.push(layerResults.aidsMatch.reason);
    }

    const finalScore = Math.round(totalScore);
    const statusInfo = getStatus(finalScore);

    return {
        score: finalScore,
        ...statusInfo,
        reason: reasons.join(' '),
        layerScores: {
            textMatch: layerResults.textMatch ? {
                score: layerResults.textMatch.score,
                weight: Math.round((adjustedWeights.textMatch || 0) * 100),
                tfidfScore: layerResults.textMatch.tfidfScore,
                keywordScore: layerResults.textMatch.keywordScore,
                reason: layerResults.textMatch.reason,
            } : null,
            ocrMatch: null,
            sceneMatch: null,
            aidsMatch: layerResults.aidsMatch ? {
                score: layerResults.aidsMatch.score,
                weight: Math.round((adjustedWeights.aidsMatch || 0) * 100),
                topicType: layerResults.aidsMatch.topicType,
                mismatches: layerResults.aidsMatch.mismatches,
                reason: layerResults.aidsMatch.reason,
            } : null,
        },
    };
}

/**
 * Run full verification including image analysis (all 4 layers).
 *
 * @param {Object} params
 * @param {string} params.topicName - Ground truth topic name
 * @param {string} params.description - "What was covered" text
 * @param {string} params.teachingAids - Comma-separated aids (e.g. "PPT, Whiteboard")
 * @param {string} params.teachingMethods - Comma-separated methods (e.g. "Lecture, Discussion")
 * @param {File} params.imageFile - Proof image File object
 * @param {function} params.onOCRProgress - Optional OCR progress callback (0-100)
 * @returns {Promise<{ score: number, verified: boolean, flagged: boolean, lowConfidence: boolean, status: string, reason: string, layerScores: Object }>}
 */
export async function verifyHourReport({ topicName, description, teachingAids, teachingMethods, imageFile, onOCRProgress }) {
    const layerResults = {};

    // Layer 1: Text match (synchronous, fast)
    try {
        layerResults.textMatch = verifyTextMatch(topicName, description);
    } catch (err) {
        console.error('Layer 1 (text match) failed:', err);
        layerResults.textMatch = null;
    }

    // Layer 3: Aids/methods consistency (synchronous, fast)
    try {
        layerResults.aidsMatch = verifyAidsMethodsConsistency(topicName, teachingAids, teachingMethods);
    } catch (err) {
        console.error('Layer 3 (aids consistency) failed:', err);
        layerResults.aidsMatch = null;
    }

    // Layer 2A + 2B: Image verification (async, slow)
    if (imageFile) {
        try {
            const imageResults = await verifyImage(imageFile, topicName, description, teachingAids, onOCRProgress);
            layerResults.ocrMatch = imageResults.ocr;
            layerResults.sceneMatch = imageResults.scene;
        } catch (err) {
            console.error('Layer 2 (image verification) failed:', err);
            layerResults.ocrMatch = null;
            layerResults.sceneMatch = null;
        }
    } else {
        layerResults.ocrMatch = null;
        layerResults.sceneMatch = null;
    }

    // Calculate weighted score
    const adjustedWeights = reweightLayers(layerResults);
    let totalScore = 0;
    const reasons = [];

    if (layerResults.textMatch && adjustedWeights.textMatch) {
        totalScore += layerResults.textMatch.score * adjustedWeights.textMatch;
        reasons.push(layerResults.textMatch.reason);
    }

    if (layerResults.ocrMatch && adjustedWeights.ocrMatch) {
        totalScore += layerResults.ocrMatch.score * adjustedWeights.ocrMatch;
        reasons.push(layerResults.ocrMatch.reason);
    }

    if (layerResults.sceneMatch && adjustedWeights.sceneMatch) {
        totalScore += layerResults.sceneMatch.score * adjustedWeights.sceneMatch;
        reasons.push(layerResults.sceneMatch.reason);
    }

    if (layerResults.aidsMatch && adjustedWeights.aidsMatch) {
        totalScore += layerResults.aidsMatch.score * adjustedWeights.aidsMatch;
        reasons.push(layerResults.aidsMatch.reason);
    }

    const finalScore = Math.round(totalScore);
    const statusInfo = getStatus(finalScore);

    return {
        score: finalScore,
        ...statusInfo,
        reason: reasons.join(' '),
        layerScores: {
            textMatch: layerResults.textMatch ? {
                score: layerResults.textMatch.score,
                weight: Math.round((adjustedWeights.textMatch || 0) * 100),
                tfidfScore: layerResults.textMatch.tfidfScore,
                keywordScore: layerResults.textMatch.keywordScore,
                reason: layerResults.textMatch.reason,
            } : null,
            ocrMatch: layerResults.ocrMatch ? {
                score: layerResults.ocrMatch.score,
                weight: Math.round((adjustedWeights.ocrMatch || 0) * 100),
                extractedText: layerResults.ocrMatch.extractedText,
                matchedWords: layerResults.ocrMatch.matchedWords,
                reason: layerResults.ocrMatch.reason,
            } : null,
            sceneMatch: layerResults.sceneMatch ? {
                score: layerResults.sceneMatch.score,
                weight: Math.round((adjustedWeights.sceneMatch || 0) * 100),
                detectedContext: layerResults.sceneMatch.detectedContext,
                predictions: layerResults.sceneMatch.predictions,
                aidsMismatch: layerResults.sceneMatch.aidsMismatch,
                reason: layerResults.sceneMatch.reason,
            } : null,
            aidsMatch: layerResults.aidsMatch ? {
                score: layerResults.aidsMatch.score,
                weight: Math.round((adjustedWeights.aidsMatch || 0) * 100),
                topicType: layerResults.aidsMatch.topicType,
                mismatches: layerResults.aidsMatch.mismatches,
                reason: layerResults.aidsMatch.reason,
            } : null,
        },
    };
}

// Re-export cleanup for use by consuming components
export { cleanupImageVerification };

export default verifyHourReport;

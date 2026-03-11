/**
 * imageVerification.js
 *
 * Browser-based image verification for hour report validation.
 * Uses Tesseract.js for OCR and TensorFlow.js + MobileNet for scene classification.
 * Both libraries are lazy-loaded only when needed.
 *
 * NO external API keys required — everything runs locally in the browser.
 *
 * @module imageVerification
 */

import { verifyOCRTextAgainstTopic } from './textVerification';

// ═══════════════════════════════════════════════════════════════
// MODULE STATE — lazy-loaded library references
// ═══════════════════════════════════════════════════════════════
let tesseractWorker = null;
let mobilenetModel = null;
let tf = null;

// ═══════════════════════════════════════════════════════════════
// IMAGE PREPROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Resize an image file if it exceeds the max size using Canvas API.
 * Returns a Blob suitable for further processing.
 *
 * @param {File} imageFile - The original image file
 * @param {number} maxWidth - Maximum width in pixels (default: 1600)
 * @param {number} maxHeight - Maximum height in pixels (default: 1200)
 * @returns {Promise<{ blob: Blob, url: string, width: number, height: number }>}
 */
async function preprocessImage(imageFile, maxWidth = 1600, maxHeight = 1200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(imageFile);

        img.onload = () => {
            let { width, height } = img;

            // Only resize if necessary
            if (width <= maxWidth && height <= maxHeight && imageFile.size <= 2 * 1024 * 1024) {
                resolve({ blob: imageFile, url, width, height });
                return;
            }

            // Calculate new dimensions maintaining aspect ratio
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            const newWidth = Math.round(width * ratio);
            const newHeight = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to preprocess image'));
                        return;
                    }
                    const processedUrl = URL.createObjectURL(blob);
                    resolve({ blob, url: processedUrl, width: newWidth, height: newHeight });
                },
                'image/jpeg',
                0.85
            );
        };

        img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
        img.src = url;
    });
}

/**
 * Convert an image file to an HTMLImageElement for TensorFlow.
 * @param {File|Blob} imageFile
 * @returns {Promise<HTMLImageElement>}
 */
function fileToImage(imageFile) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const url = URL.createObjectURL(imageFile);
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
}

// ═══════════════════════════════════════════════════════════════
// TESSERACT.JS OCR — Layer 2A
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize Tesseract.js worker (lazy-loaded on first call).
 * @param {function} onProgress - Progress callback (0-1)
 * @returns {Promise<object>} Tesseract worker
 */
async function initTesseract(onProgress) {
    if (tesseractWorker) return tesseractWorker;

    try {
        const Tesseract = await import('tesseract.js');
        const worker = await Tesseract.createWorker('eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(m.progress || 0);
                }
            },
        });
        tesseractWorker = worker;
        return worker;
    } catch (err) {
        console.error('Tesseract initialization failed:', err);
        throw new Error('Could not initialize text recognition engine.');
    }
}

/**
 * Extract text from an image using Tesseract.js OCR.
 *
 * @param {File} imageFile - The proof image file
 * @param {string} topicName - Topic name for keyword matching
 * @param {string} description - "What was covered" text
 * @param {function} onProgress - Progress callback (receives 0-100)
 * @returns {Promise<{ score: number, extractedText: string, matchedWords: string[], reason: string }>}
 */
export async function performOCR(imageFile, topicName, description, onProgress) {
    try {
        const progressCb = onProgress ? (p) => onProgress(Math.round(p * 100)) : null;

        const worker = await initTesseract(progressCb);
        const { blob } = await preprocessImage(imageFile);
        const { data } = await worker.recognize(blob);

        const extractedText = data.text || '';
        const words = extractedText
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);

        // Use textVerification utility to match OCR words against topic
        const result = verifyOCRTextAgainstTopic(words, topicName, description);

        return {
            score: result.score,
            extractedText: extractedText.slice(0, 500),
            matchedWords: result.matchedWords,
            reason: result.reason,
        };
    } catch (err) {
        console.error('OCR error:', err);
        return {
            score: 30,
            extractedText: '',
            matchedWords: [],
            reason: 'Text recognition could not be completed. This does not necessarily indicate a problem with your image.',
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// TENSORFLOW.JS + MOBILENET — Layer 2B
// ═══════════════════════════════════════════════════════════════

/**
 * Teaching context label mapping.
 * Maps MobileNet classification labels to teaching-related contexts.
 */
const TEACHING_CONTEXT_MAP = {
    // Classroom / teaching environments
    classroom: { context: 'classroom', score: 90, aids: ['whiteboard', 'blackboard', 'ppt', 'projector', 'chalk', 'marker'] },
    'school bus': { context: 'school', score: 60, aids: [] },
    desk: { context: 'classroom', score: 75, aids: ['whiteboard', 'blackboard', 'ppt'] },
    'library': { context: 'study', score: 70, aids: ['textbook', 'notes', 'reference'] },

    // Board-related
    whiteboard: { context: 'board', score: 90, aids: ['whiteboard', 'marker'] },
    blackboard: { context: 'board', score: 90, aids: ['blackboard', 'chalk'] },
    'chalkboard': { context: 'board', score: 90, aids: ['blackboard', 'chalk'] },
    'scoreboard': { context: 'board', score: 50, aids: ['whiteboard'] },
    'menu': { context: 'board', score: 40, aids: ['whiteboard'] },

    // Digital / slides context
    laptop: { context: 'digital', score: 80, aids: ['ppt', 'slides', 'video', 'software'] },
    'notebook computer': { context: 'digital', score: 80, aids: ['ppt', 'slides', 'video', 'software'] },
    screen: { context: 'digital', score: 80, aids: ['ppt', 'slides', 'projector', 'video'] },
    monitor: { context: 'digital', score: 80, aids: ['ppt', 'slides', 'video'] },
    'desktop computer': { context: 'digital', score: 80, aids: ['ppt', 'software', 'video'] },
    television: { context: 'digital', score: 70, aids: ['video', 'ppt', 'slides'] },
    projector: { context: 'digital', score: 90, aids: ['ppt', 'projector', 'slides'] },
    'digital clock': { context: 'digital', score: 30, aids: [] },

    // Lab context
    laboratory: { context: 'lab', score: 95, aids: ['lab equipment', 'experiment', 'hardware'] },
    microscope: { context: 'lab', score: 90, aids: ['lab equipment', 'experiment'] },
    oscilloscope: { context: 'lab', score: 90, aids: ['lab equipment', 'hardware'] },
    'test tube': { context: 'lab', score: 85, aids: ['lab equipment', 'experiment'] },
    beaker: { context: 'lab', score: 85, aids: ['lab equipment'] },
    stethoscope: { context: 'lab', score: 70, aids: ['lab equipment'] },

    // Study context
    book: { context: 'study', score: 75, aids: ['textbook', 'notes', 'reference'] },
    notebook: { context: 'study', score: 75, aids: ['notes', 'worksheet'] },
    'comic book': { context: 'study', score: 40, aids: [] },
    binder: { context: 'study', score: 70, aids: ['notes', 'textbook'] },
    envelope: { context: 'study', score: 40, aids: [] },
    pen: { context: 'study', score: 60, aids: ['notes', 'whiteboard'] },
    pencil: { context: 'study', score: 60, aids: ['notes'] },
    ruler: { context: 'study', score: 60, aids: [] },

    // Electronics / hardware
    'printed circuit board': { context: 'lab', score: 85, aids: ['lab equipment', 'hardware'] },
    keyboard: { context: 'digital', score: 65, aids: ['computer', 'software'] },
    mouse: { context: 'digital', score: 55, aids: ['computer'] },
    calculator: { context: 'study', score: 65, aids: [] },
    printer: { context: 'digital', score: 55, aids: ['computer'] },
    speaker: { context: 'digital', score: 50, aids: ['video', 'audio'] },
    microphone: { context: 'classroom', score: 60, aids: ['presentation'] },

    // People / groups
    'academic gown': { context: 'classroom', score: 70, aids: [] },
    suit: { context: 'presentation', score: 50, aids: ['ppt'] },

    // Unrelated / red flags
    'restaurant': { context: 'unrelated', score: 0, aids: [] },
    'pizza': { context: 'unrelated', score: 0, aids: [] },
    'hamburger': { context: 'unrelated', score: 0, aids: [] },
    'ice cream': { context: 'unrelated', score: 0, aids: [] },
    'swimming pool': { context: 'unrelated', score: 0, aids: [] },
    'beach': { context: 'unrelated', score: 0, aids: [] },
    'mountain': { context: 'unrelated', score: 0, aids: [] },
    'traffic light': { context: 'unrelated', score: 0, aids: [] },
    'park bench': { context: 'unrelated', score: 0, aids: [] },
    'shopping cart': { context: 'unrelated', score: 0, aids: [] },
    'prison': { context: 'unrelated', score: 0, aids: [] },
    'sports car': { context: 'unrelated', score: 0, aids: [] },
    'soccer ball': { context: 'unrelated', score: 0, aids: [] },
};

/**
 * Initialize TensorFlow.js and load MobileNet model (lazy-loaded).
 * @returns {Promise<object>} MobileNet model
 */
async function initMobileNet() {
    if (mobilenetModel) return mobilenetModel;

    try {
        tf = await import('@tensorflow/tfjs');
        const mobilenet = await import('@tensorflow-models/mobilenet');
        mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        return mobilenetModel;
    } catch (err) {
        console.error('MobileNet initialization failed:', err);
        throw new Error('Could not initialize image classification engine.');
    }
}

/**
 * Classify an image using MobileNet and map results to teaching contexts.
 *
 * @param {File} imageFile - The proof image file
 * @param {string} teachingAids - Declared teaching aids (comma-separated)
 * @returns {Promise<{ score: number, predictions: Array, detectedContext: string, aidsMismatch: string[], reason: string }>}
 */
export async function classifyImage(imageFile, teachingAids) {
    try {
        const model = await initMobileNet();
        const { blob } = await preprocessImage(imageFile, 224, 224);
        const img = await fileToImage(blob);

        const predictions = await model.classify(img, 10);

        // Map predictions to teaching contexts
        let bestContext = { context: 'unknown', score: 40, aids: [] };
        let matchedLabels = [];
        let unrelatedLabels = [];

        for (const pred of predictions) {
            const label = pred.className.toLowerCase();
            const confidence = pred.probability;

            // Check each key in our context map
            for (const [mapKey, mapVal] of Object.entries(TEACHING_CONTEXT_MAP)) {
                if (label.includes(mapKey) || mapKey.includes(label.split(',')[0].trim())) {
                    if (mapVal.context === 'unrelated') {
                        unrelatedLabels.push({ label: pred.className, confidence });
                    } else if (mapVal.score > bestContext.score) {
                        bestContext = { ...mapVal };
                        matchedLabels.push({ label: pred.className, confidence, context: mapVal.context });
                    }
                }
            }
        }

        // Calculate base scene score
        let sceneScore = bestContext.score;

        // If we detected unrelated content with high confidence, reduce score
        if (unrelatedLabels.length > 0 && unrelatedLabels[0].confidence > 0.3) {
            sceneScore = Math.max(10, sceneScore - 30);
        }

        // Cross-check detected context against declared teaching aids
        const declaredAids = (teachingAids || '').toLowerCase().split(/[,;]/).map(a => a.trim()).filter(Boolean);
        const aidsMismatch = [];

        if (declaredAids.length > 0 && bestContext.aids.length > 0) {
            // Check if any declared aid matches the detected context aids
            const hasMatch = declaredAids.some(aid =>
                bestContext.aids.some(contextAid => aid.includes(contextAid) || contextAid.includes(aid))
            );

            if (!hasMatch && bestContext.context !== 'unknown') {
                // Context and declared aids don't match
                for (const aid of declaredAids) {
                    const contextMatches = bestContext.aids.some(ca => aid.includes(ca) || ca.includes(aid));
                    if (!contextMatches) {
                        aidsMismatch.push(`You declared "${aid}" but image suggests ${bestContext.context} context`);
                    }
                }
                sceneScore = Math.max(20, sceneScore - 15);
            }
        }

        // Ensure score is in range
        sceneScore = Math.min(100, Math.max(0, sceneScore));

        // Build reason
        let reason = '';
        if (sceneScore >= 70) {
            reason = `✅ Image appears to show a ${bestContext.context} setting (${sceneScore}%)${matchedLabels.length > 0 ? ` — detected: ${matchedLabels.slice(0, 3).map(l => l.label).join(', ')}` : ''}.`;
        } else if (sceneScore >= 40) {
            reason = `⚠️ Image context is partially recognized as ${bestContext.context} (${sceneScore}%).`;
            if (aidsMismatch.length > 0) {
                reason += ` ${aidsMismatch[0]}.`;
            }
        } else {
            reason = `⚠️ Could not confidently identify a teaching context in the image (${sceneScore}%).`;
            if (unrelatedLabels.length > 0) {
                reason += ` Image may show non-teaching content.`;
            }
        }

        return {
            score: sceneScore,
            predictions: predictions.slice(0, 5).map(p => ({
                label: p.className,
                confidence: Math.round(p.probability * 100),
            })),
            detectedContext: bestContext.context,
            aidsMismatch,
            reason,
        };
    } catch (err) {
        console.error('Image classification error:', err);
        return {
            score: 40,
            predictions: [],
            detectedContext: 'unknown',
            aidsMismatch: [],
            reason: 'Image analysis could not be completed. The classification engine may still be loading.',
        };
    }
}

/**
 * Run full image verification (OCR + MobileNet) on the proof image.
 * Both analyses run in parallel for speed.
 *
 * @param {File} imageFile - The proof image file
 * @param {string} topicName - Ground truth topic name
 * @param {string} description - "What was covered" text
 * @param {string} teachingAids - Declared teaching aids
 * @param {function} onOCRProgress - OCR progress callback (0-100)
 * @returns {Promise<{ ocr: object, scene: object }>}
 */
export async function verifyImage(imageFile, topicName, description, teachingAids, onOCRProgress) {
    // Run both verifications in parallel
    const [ocrResult, sceneResult] = await Promise.allSettled([
        performOCR(imageFile, topicName, description, onOCRProgress),
        classifyImage(imageFile, teachingAids),
    ]);

    return {
        ocr: ocrResult.status === 'fulfilled' ? ocrResult.value : {
            score: 30,
            extractedText: '',
            matchedWords: [],
            reason: 'Text recognition encountered an error.',
        },
        scene: sceneResult.status === 'fulfilled' ? sceneResult.value : {
            score: 40,
            predictions: [],
            detectedContext: 'unknown',
            aidsMismatch: [],
            reason: 'Image classification encountered an error.',
        },
    };
}

/**
 * Cleanup Tesseract worker to free memory.
 */
export async function cleanupImageVerification() {
    if (tesseractWorker) {
        try {
            await tesseractWorker.terminate();
        } catch (e) {
            // Ignore cleanup errors
        }
        tesseractWorker = null;
    }
}

export default {
    verifyImage,
    performOCR,
    classifyImage,
    cleanupImageVerification,
};

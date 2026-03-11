/**
 * textVerification.js
 * 
 * Pure-JS text verification engine for hour report validation.
 * Implements TF-IDF cosine similarity, keyword overlap with synonym maps,
 * and teaching aids/methods consistency checking.
 * 
 * NO external libraries required.
 * 
 * @module textVerification
 */

// ═══════════════════════════════════════════════════════════════
// STOP WORDS — common English words to ignore during analysis
// ═══════════════════════════════════════════════════════════════
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their',
    'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'what',
    'where', 'when', 'how', 'why', 'not', 'no', 'nor', 'so', 'if', 'then',
    'than', 'too', 'very', 'just', 'about', 'above', 'after', 'again',
    'all', 'also', 'am', 'any', 'because', 'before', 'between', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
    'own', 'same', 'into', 'over', 'under', 'until', 'while', 'during',
    'through', 'up', 'down', 'out', 'off', 'once', 'here', 'there',
    'further', 'being', 'having', 'doing', 'using', 'used', 'etc',
    'like', 'also', 'well', 'back', 'even', 'still', 'way', 'take',
    'come', 'go', 'make', 'know', 'get', 'give', 'say', 'tell',
    'called', 'based', 'include', 'includes', 'including', 'included',
    'related', 'various', 'different', 'given', 'following', 'topic',
    'topics', 'covered', 'cover', 'covering', 'discussed', 'discuss',
    'taught', 'teach', 'teaching', 'learned', 'learn', 'learning',
    'explained', 'explain', 'explaining', 'session', 'class', 'today',
    'students', 'student', 'concept', 'concepts', 'introduction',
    'basic', 'basics', 'overview', 'detail', 'details', 'detailed',
]);

// ═══════════════════════════════════════════════════════════════
// SYNONYM MAP — 25+ CS/Engineering topic keyword groups
// ═══════════════════════════════════════════════════════════════
const SYNONYM_MAP = {
    // Computer Science topics
    'photosynthesis': ['chlorophyll', 'sunlight', 'glucose', 'plants', 'leaves', 'carbon dioxide', 'oxygen', 'light reaction', 'dark reaction', 'calvin cycle'],
    'networking': ['tcp', 'ip', 'router', 'protocol', 'osi', 'packets', 'ethernet', 'subnet', 'dns', 'dhcp', 'http', 'https', 'firewall', 'lan', 'wan', 'mac address', 'gateway', 'switch', 'hub', 'bandwidth'],
    'data structures': ['array', 'stack', 'queue', 'tree', 'linked list', 'graph', 'hash table', 'heap', 'binary tree', 'bst', 'avl', 'red black', 'trie', 'deque', 'priority queue'],
    'oop': ['class', 'object', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'constructor', 'destructor', 'method', 'interface', 'abstract class', 'overloading', 'overriding', 'virtual function'],
    'object oriented programming': ['class', 'object', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'constructor', 'destructor', 'method', 'interface'],
    'database': ['sql', 'query', 'table', 'schema', 'normalization', 'index', 'primary key', 'foreign key', 'join', 'aggregate', 'transaction', 'acid', 'er diagram', 'relational', 'nosql', 'mongodb', 'mysql', 'postgresql'],
    'dbms': ['sql', 'query', 'table', 'schema', 'normalization', 'index', 'primary key', 'foreign key', 'join', 'aggregate', 'transaction', 'acid', 'er diagram', 'relational'],
    'sorting': ['bubble', 'merge', 'quick', 'heap', 'insertion', 'selection', 'radix', 'counting', 'algorithm', 'time complexity', 'space complexity', 'comparison', 'stable', 'unstable', 'partition'],
    'operating system': ['process', 'thread', 'scheduling', 'deadlock', 'memory management', 'paging', 'segmentation', 'virtual memory', 'file system', 'semaphore', 'mutex', 'kernel', 'cpu scheduling', 'round robin', 'fifo', 'sjf', 'context switch'],
    'os': ['process', 'thread', 'scheduling', 'deadlock', 'memory management', 'paging', 'segmentation', 'virtual memory', 'file system', 'semaphore', 'mutex', 'kernel'],
    'compiler design': ['lexical analysis', 'syntax analysis', 'parsing', 'grammar', 'token', 'lexer', 'parser', 'ast', 'semantic analysis', 'code generation', 'optimization', 'symbol table', 'bnf', 'cfg', 'lr', 'll', 'lalr'],
    'machine learning': ['regression', 'classification', 'clustering', 'neural network', 'decision tree', 'random forest', 'svm', 'knn', 'naive bayes', 'gradient descent', 'overfitting', 'underfitting', 'training', 'testing', 'validation', 'feature', 'model', 'supervised', 'unsupervised'],
    'artificial intelligence': ['search', 'heuristic', 'agent', 'knowledge', 'reasoning', 'planning', 'expert system', 'fuzzy logic', 'genetic algorithm', 'neural network', 'nlp', 'machine learning', 'deep learning', 'reinforcement'],
    'web development': ['html', 'css', 'javascript', 'react', 'angular', 'vue', 'node', 'express', 'dom', 'api', 'rest', 'http', 'responsive', 'bootstrap', 'webpack', 'frontend', 'backend', 'fullstack'],
    'computer networks': ['tcp', 'ip', 'udp', 'osi model', 'protocol', 'routing', 'switching', 'ethernet', 'wireless', 'socket', 'dns', 'dhcp', 'http', 'ftp', 'smtp', 'pop3', 'imap'],
    'algorithms': ['complexity', 'big o', 'divide and conquer', 'dynamic programming', 'greedy', 'backtracking', 'recursion', 'iteration', 'graph algorithm', 'shortest path', 'spanning tree', 'search', 'sort'],
    'graph': ['vertex', 'edge', 'adjacency', 'bfs', 'dfs', 'shortest path', 'dijkstra', 'bellman ford', 'kruskal', 'prim', 'topological sort', 'cycle', 'connected', 'directed', 'undirected', 'weighted'],
    'graph traversal': ['bfs', 'dfs', 'breadth first', 'depth first', 'vertex', 'edge', 'visited', 'queue', 'stack', 'adjacency list', 'adjacency matrix', 'connected component'],
    'software engineering': ['sdlc', 'agile', 'waterfall', 'scrum', 'requirement', 'design', 'testing', 'maintenance', 'uml', 'use case', 'class diagram', 'sequence diagram', 'sprint', 'kanban'],
    'cryptography': ['encryption', 'decryption', 'cipher', 'rsa', 'aes', 'des', 'hash', 'sha', 'md5', 'digital signature', 'public key', 'private key', 'symmetric', 'asymmetric', 'ssl', 'tls'],
    'cloud computing': ['iaas', 'paas', 'saas', 'aws', 'azure', 'gcp', 'virtualization', 'container', 'docker', 'kubernetes', 'scalability', 'load balancing', 'serverless', 'microservices'],
    'digital electronics': ['logic gate', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'flip flop', 'counter', 'register', 'multiplexer', 'decoder', 'encoder', 'adder', 'boolean algebra', 'karnaugh map', 'combinational', 'sequential'],
    'microprocessor': ['8085', '8086', 'register', 'alu', 'instruction set', 'addressing mode', 'interrupt', 'bus', 'memory', 'assembly', 'opcode', 'accumulator', 'flag', 'stack pointer'],
    'java': ['jvm', 'jdk', 'jre', 'class', 'object', 'inheritance', 'interface', 'package', 'exception', 'thread', 'collection', 'stream', 'lambda', 'generics', 'annotation', 'servlet', 'spring'],
    'python': ['list', 'tuple', 'dictionary', 'set', 'comprehension', 'generator', 'decorator', 'lambda', 'class', 'module', 'package', 'pip', 'numpy', 'pandas', 'flask', 'django', 'iterator'],
    'c programming': ['pointer', 'array', 'structure', 'union', 'function', 'macro', 'header', 'malloc', 'calloc', 'free', 'file handling', 'string', 'recursion', 'preprocessor', 'typedef'],
    'data mining': ['association rule', 'apriori', 'clustering', 'classification', 'decision tree', 'naive bayes', 'knn', 'pattern', 'frequent itemset', 'support', 'confidence', 'lift', 'data warehouse', 'etl', 'olap'],
    'computer architecture': ['cpu', 'alu', 'register', 'cache', 'pipeline', 'instruction', 'risc', 'cisc', 'memory hierarchy', 'bus', 'io', 'interrupt', 'addressing mode', 'hazard', 'forwarding'],
    'mathematics': ['calculus', 'algebra', 'matrix', 'vector', 'differential', 'integral', 'limit', 'derivative', 'equation', 'theorem', 'proof', 'function', 'set theory', 'probability', 'statistics'],
    'physics': ['force', 'energy', 'momentum', 'wave', 'optics', 'thermodynamics', 'electricity', 'magnetism', 'quantum', 'mechanics', 'relativity', 'newton', 'circuit', 'resistance', 'capacitance'],
    'chemistry': ['atom', 'molecule', 'bond', 'reaction', 'acid', 'base', 'oxidation', 'reduction', 'organic', 'inorganic', 'periodic table', 'element', 'compound', 'solution', 'equilibrium'],
};

// ═══════════════════════════════════════════════════════════════
// TOPIC TYPE CLASSIFICATION — maps topic keywords to expected aids/methods
// ═══════════════════════════════════════════════════════════════
const TOPIC_TYPE_PATTERNS = {
    lab: {
        keywords: ['lab', 'laboratory', 'experiment', 'practical', 'hands-on', 'workshop', 'implementation', 'coding', 'programming lab', 'hardware'],
        expectedAids: ['lab equipment', 'computer', 'software', 'demonstration', 'hardware', 'simulator', 'ide', 'compiler'],
        expectedMethods: ['demonstration', 'hands-on', 'experiment', 'practice', 'lab exercise', 'implementation', 'coding'],
        incompatibleMethods: [],
    },
    theory: {
        keywords: ['theory', 'concept', 'introduction', 'overview', 'fundamentals', 'principles', 'definition', 'theorem', 'proof', 'analysis', 'architecture', 'model', 'design'],
        expectedAids: ['ppt', 'whiteboard', 'blackboard', 'slides', 'projector', 'textbook', 'notes', 'chalk', 'marker'],
        expectedMethods: ['lecture', 'discussion', 'explanation', 'presentation', 'chalk and talk', 'interactive'],
        incompatibleMethods: [],
    },
    tutorial: {
        keywords: ['tutorial', 'problem solving', 'exercise', 'worksheet', 'practice', 'assignment', 'numerical', 'example', 'solve'],
        expectedAids: ['whiteboard', 'worksheet', 'blackboard', 'chalk', 'marker', 'handout'],
        expectedMethods: ['discussion', 'problem solving', 'group work', 'interactive', 'tutorial', 'exercise'],
        incompatibleMethods: [],
    },
    seminar: {
        keywords: ['seminar', 'presentation', 'paper', 'research', 'case study', 'project', 'review'],
        expectedAids: ['ppt', 'projector', 'slides', 'video', 'reference paper'],
        expectedMethods: ['presentation', 'discussion', 'seminar', 'peer review', 'case study'],
        incompatibleMethods: [],
    },
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Tokenize text into lowercase words, removing punctuation and stop words.
 * @param {string} text - Input text
 * @returns {string[]} Array of cleaned tokens
 */
function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s+#]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Extract meaningful keywords from text (preserves multi-word terms).
 * @param {string} text - Input text
 * @returns {string[]} Array of keywords
 */
function extractKeywords(text) {
    if (!text) return [];
    const lower = text.toLowerCase().replace(/[^a-z0-9\s+#]/g, ' ');
    const tokens = lower.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
    return [...new Set(tokens)];
}

// ═══════════════════════════════════════════════════════════════
// TF-IDF COSINE SIMILARITY (Pure JS)
// ═══════════════════════════════════════════════════════════════

/**
 * Build a TF (term frequency) vector from tokens.
 * @param {string[]} tokens
 * @returns {Map<string, number>} Term frequency map
 */
function buildTF(tokens) {
    const tf = new Map();
    for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
    }
    const total = tokens.length || 1;
    for (const [key, val] of tf) {
        tf.set(key, val / total);
    }
    return tf;
}

/**
 * Build IDF values from two documents.
 * @param {Map<string, number>} tf1
 * @param {Map<string, number>} tf2
 * @returns {Map<string, number>} IDF values
 */
function buildIDF(tf1, tf2) {
    const idf = new Map();
    const totalDocs = 2;
    const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);
    for (const term of allTerms) {
        let docCount = 0;
        if (tf1.has(term)) docCount++;
        if (tf2.has(term)) docCount++;
        idf.set(term, Math.log((totalDocs + 1) / (docCount + 1)) + 1);
    }
    return idf;
}

/**
 * Build TF-IDF vector.
 * @param {Map<string, number>} tf
 * @param {Map<string, number>} idf
 * @returns {Map<string, number>}
 */
function buildTFIDF(tf, idf) {
    const tfidf = new Map();
    for (const [term, tfVal] of tf) {
        const idfVal = idf.get(term) || 1;
        tfidf.set(term, tfVal * idfVal);
    }
    return tfidf;
}

/**
 * Calculate cosine similarity between two TF-IDF vectors.
 * @param {Map<string, number>} vec1
 * @param {Map<string, number>} vec2
 * @returns {number} Similarity score 0-1
 */
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const term of allTerms) {
        const v1 = vec1.get(term) || 0;
        const v2 = vec2.get(term) || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
}

/**
 * Calculate TF-IDF cosine similarity between two texts.
 * @param {string} text1 - First text (topic name)
 * @param {string} text2 - Second text (description)
 * @returns {number} Similarity score 0-100
 */
function calculateTFIDFSimilarity(text1, text2) {
    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const tf1 = buildTF(tokens1);
    const tf2 = buildTF(tokens2);
    const idf = buildIDF(tf1, tf2);
    const tfidf1 = buildTFIDF(tf1, idf);
    const tfidf2 = buildTFIDF(tf2, idf);

    return Math.round(cosineSimilarity(tfidf1, tfidf2) * 100);
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD OVERLAP SCORE
// ═══════════════════════════════════════════════════════════════

/**
 * Find synonyms/related terms for a given topic.
 * @param {string} topicName - The topic name to find synonyms for
 * @returns {string[]} Array of related terms
 */
function findSynonyms(topicName) {
    const lower = topicName.toLowerCase();
    const relatedTerms = [];

    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
        // Check if the topic name contains the synonym map key
        if (lower.includes(key)) {
            relatedTerms.push(...synonyms);
        }
        // Also check if any synonym appears in the topic name
        for (const syn of synonyms) {
            if (lower.includes(syn.toLowerCase()) && !relatedTerms.includes(key)) {
                relatedTerms.push(key);
                relatedTerms.push(...synonyms);
                break;
            }
        }
    }

    return [...new Set(relatedTerms.map(t => t.toLowerCase()))];
}

/**
 * Calculate keyword overlap score between topic name and description.
 * Checks direct keyword matches and synonym/related term matches.
 * @param {string} topicName - The ground truth topic name
 * @param {string} description - The "what was covered" text
 * @returns {{ score: number, matchedKeywords: string[], totalKeywords: number, details: string }}
 */
function calculateKeywordOverlap(topicName, description) {
    const topicKeywords = extractKeywords(topicName);
    const descKeywords = extractKeywords(description);
    const descLower = description.toLowerCase();
    const synonyms = findSynonyms(topicName);

    if (topicKeywords.length === 0) {
        return { score: 0, matchedKeywords: [], totalKeywords: 0, details: 'No keywords found in topic name.' };
    }

    let matchedDirect = [];
    let matchedSynonym = [];

    // Check direct keyword matches
    for (const keyword of topicKeywords) {
        if (descLower.includes(keyword)) {
            matchedDirect.push(keyword);
        }
    }

    // Check synonym matches
    for (const syn of synonyms) {
        if (descLower.includes(syn)) {
            matchedSynonym.push(syn);
        }
    }

    const totalCheckable = topicKeywords.length + Math.min(synonyms.length, 5);
    const totalMatched = matchedDirect.length + Math.min(matchedSynonym.length, 5);
    const score = Math.min(100, Math.round((totalMatched / Math.max(totalCheckable, 1)) * 100));

    const allMatched = [...matchedDirect, ...matchedSynonym];

    let details = '';
    if (matchedDirect.length > 0) {
        details += `Direct keyword matches: ${matchedDirect.join(', ')}. `;
    }
    if (matchedSynonym.length > 0) {
        details += `Related term matches: ${matchedSynonym.slice(0, 5).join(', ')}. `;
    }
    if (allMatched.length === 0) {
        details = `No keyword or related term matches found between topic "${topicName}" and the description.`;
    }

    return {
        score,
        matchedKeywords: allMatched,
        totalKeywords: totalCheckable,
        details,
    };
}

// ═══════════════════════════════════════════════════════════════
// COMBINED TEXT SCORE — Layer 1
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate the combined text verification score (Layer 1).
 * Combines TF-IDF similarity (50%) and keyword overlap (50%).
 * 
 * @param {string} topicName - The ground truth topic name
 * @param {string} description - The "what was covered" text
 * @returns {{ score: number, tfidfScore: number, keywordScore: number, reason: string }}
 */
export function verifyTextMatch(topicName, description) {
    if (!topicName || !description || description.trim().length < 10) {
        return {
            score: 0,
            tfidfScore: 0,
            keywordScore: 0,
            reason: 'Description is too short to verify against the topic.',
        };
    }

    const tfidfScore = calculateTFIDFSimilarity(topicName, description);
    const keywordResult = calculateKeywordOverlap(topicName, description);
    const keywordScore = keywordResult.score;

    const combinedScore = Math.round(tfidfScore * 0.5 + keywordScore * 0.5);

    let reason = '';
    if (combinedScore >= 70) {
        reason = `✅ Strong text match (${combinedScore}%) — description aligns well with topic "${topicName}". ${keywordResult.details}`;
    } else if (combinedScore >= 40) {
        reason = `⚠️ Moderate text match (${combinedScore}%) — some relevance to topic "${topicName}" but could be more specific. ${keywordResult.details}`;
    } else {
        reason = `⚠️ Low text match (${combinedScore}%) — description may not match topic "${topicName}". ${keywordResult.details}`;
    }

    return {
        score: combinedScore,
        tfidfScore,
        keywordScore,
        reason,
    };
}

// ═══════════════════════════════════════════════════════════════
// TEACHING AIDS/METHODS CONSISTENCY — Layer 3
// ═══════════════════════════════════════════════════════════════

/**
 * Classify a topic into a type based on its name.
 * @param {string} topicName - The topic name
 * @returns {{ type: string, confidence: number }}
 */
function classifyTopicType(topicName) {
    const lower = topicName.toLowerCase();
    let bestMatch = { type: 'theory', confidence: 0.3 }; // default to theory

    for (const [type, patterns] of Object.entries(TOPIC_TYPE_PATTERNS)) {
        let matchCount = 0;
        for (const keyword of patterns.keywords) {
            if (lower.includes(keyword)) matchCount++;
        }
        const confidence = matchCount / patterns.keywords.length;
        if (confidence > bestMatch.confidence) {
            bestMatch = { type, confidence };
        }
    }

    return bestMatch;
}

/**
 * Verify teaching aids and methods are consistent with the topic type.
 * 
 * @param {string} topicName - The ground truth topic name
 * @param {string} teachingAids - Comma-separated teaching aids (e.g. "PPT, Whiteboard")
 * @param {string} teachingMethods - Comma-separated methods (e.g. "Lecture, Discussion")
 * @returns {{ score: number, reason: string, topicType: string, mismatches: string[] }}
 */
export function verifyAidsMethodsConsistency(topicName, teachingAids, teachingMethods) {
    if (!topicName) {
        return { score: 50, reason: 'No topic name to verify against.', topicType: 'unknown', mismatches: [] };
    }

    const { type: topicType } = classifyTopicType(topicName);
    const patterns = TOPIC_TYPE_PATTERNS[topicType];

    const aidsList = (teachingAids || '').toLowerCase().split(/[,;]/).map(a => a.trim()).filter(Boolean);
    const methodsList = (teachingMethods || '').toLowerCase().split(/[,;]/).map(m => m.trim()).filter(Boolean);

    if (aidsList.length === 0 && methodsList.length === 0) {
        return {
            score: 50,
            reason: 'No teaching aids or methods specified — cannot verify consistency.',
            topicType,
            mismatches: [],
        };
    }

    let totalChecks = 0;
    let passedChecks = 0;
    const mismatches = [];
    const matches = [];

    // Check aids against expected
    for (const aid of aidsList) {
        totalChecks++;
        const isExpected = patterns.expectedAids.some(expected => aid.includes(expected) || expected.includes(aid));
        if (isExpected) {
            passedChecks++;
            matches.push(`"${aid}" is appropriate for ${topicType} topics`);
        } else {
            // Not a hard mismatch, just less expected
            passedChecks += 0.5;
            mismatches.push(`"${aid}" is less common for ${topicType} topics`);
        }
    }

    // Check methods against expected
    for (const method of methodsList) {
        totalChecks++;
        const isExpected = patterns.expectedMethods.some(expected => method.includes(expected) || expected.includes(method));
        if (isExpected) {
            passedChecks++;
            matches.push(`"${method}" method is suitable for ${topicType} topics`);
        } else {
            passedChecks += 0.5;
            mismatches.push(`"${method}" method is less typical for ${topicType} topics`);
        }
    }

    // Cross-check: topic says lab but only lecture methods listed
    if (topicType === 'lab' && !methodsList.some(m =>
        m.includes('demo') || m.includes('hands') || m.includes('experiment') || m.includes('practice') || m.includes('lab') || m.includes('implementation')
    ) && methodsList.length > 0) {
        mismatches.push(`Topic appears to be a lab/practical but no hands-on methods were declared`);
        passedChecks -= 0.5;
    }

    const score = totalChecks > 0 ? Math.min(100, Math.max(0, Math.round((passedChecks / totalChecks) * 100))) : 50;

    let reason = '';
    if (score >= 70) {
        reason = `✅ Teaching aids/methods are consistent with the ${topicType} topic type (${score}%). ${matches.slice(0, 2).join('; ')}.`;
    } else if (score >= 40) {
        reason = `⚠️ Some inconsistency in aids/methods for this ${topicType} topic (${score}%). ${mismatches.slice(0, 2).join('; ')}.`;
    } else {
        reason = `⚠️ Teaching aids/methods may not match this ${topicType} topic (${score}%). ${mismatches.slice(0, 3).join('; ')}.`;
    }

    return { score, reason, topicType, mismatches };
}

/**
 * Verify OCR-extracted text keywords against topic keywords.
 * Called by imageVerification.js to score OCR text.
 * 
 * @param {string[]} ocrWords - Words extracted from image via OCR
 * @param {string} topicName - The ground truth topic name
 * @param {string} description - The "what was covered" text (optional, for broader matching)
 * @returns {{ score: number, matchedWords: string[], reason: string }}
 */
export function verifyOCRTextAgainstTopic(ocrWords, topicName, description) {
    if (!ocrWords || ocrWords.length === 0) {
        return {
            score: 30,
            matchedWords: [],
            reason: 'No readable text detected in the image. This may be normal for certain types of proof images.',
        };
    }

    const topicKeywords = extractKeywords(topicName);
    const descKeywords = description ? extractKeywords(description) : [];
    const synonyms = findSynonyms(topicName);
    const allTargetWords = [...new Set([...topicKeywords, ...descKeywords.slice(0, 20), ...synonyms.slice(0, 15)])];

    const ocrLower = ocrWords.map(w => w.toLowerCase());
    const ocrJoined = ocrLower.join(' ');

    const matchedWords = [];
    for (const target of allTargetWords) {
        if (ocrJoined.includes(target.toLowerCase())) {
            matchedWords.push(target);
        }
    }

    const matchRatio = allTargetWords.length > 0
        ? matchedWords.length / Math.min(allTargetWords.length, 10)
        : 0;

    const score = Math.min(100, Math.max(0, Math.round(matchRatio * 100)));

    let reason = '';
    if (matchedWords.length > 0) {
        reason = `✅ OCR detected "${matchedWords.slice(0, 5).join(', ')}" in the image — ${score >= 70 ? 'strong' : 'partial'} match with topic keywords.`;
    } else {
        reason = `⚠️ No topic-related text detected in the image via OCR. The image may not contain visible text related to "${topicName}".`;
    }

    return { score, matchedWords, reason };
}

// Default export for convenience
export default {
    verifyTextMatch,
    verifyAidsMethodsConsistency,
    verifyOCRTextAgainstTopic,
};

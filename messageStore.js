const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'lib', 'messages.json');

// Function to clear messages
function clearMessages() {
    saveDB({});
}

// Set up hourly cleanup
setInterval(clearMessages, 60 * 60 * 1000); // Run every hour

function loadDB() {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Normalize the key to only relevant fields
function normalizeKey(key) {
    if (!key) return {};
    return {
        remoteJid: key.remoteJid,
        id: key.id,
        fromMe: !!key.fromMe,
        participant: key.participant || undefined
    };
}

function saveMessage(key, message) {
    const db = loadDB();
    const normKey = normalizeKey(key);

    // Prevent saving if remoteJid or id is missing
    if (!normKey.remoteJid || !normKey.id) {
        // console.warn('Not saving message with invalid key:', normKey, 'type:', message && message.message ? Object.keys(message.message)[0] : 'unknown');
        return;
    }

    db[JSON.stringify(normKey)] = message;
    saveDB(db);
    // console.log('Saved message with normalized key:', normKey, 'type:', message && message.message ? Object.keys(message.message)[0] : 'unknown');
}

function getMessage(key) {
    const db = loadDB();
    const normKey = normalizeKey(key);
    const stringKey = JSON.stringify(normKey);
    let result = db[stringKey];

    if (!result) {
        // Fuzzy search: ignore participant if not found
        const allKeys = Object.keys(db);
        const fallbackKey = allKeys.find(k => {
            try {
                const parsed = JSON.parse(k);
                return parsed.remoteJid === normKey.remoteJid &&
                       parsed.id === normKey.id &&
                       parsed.fromMe === normKey.fromMe;
            } catch {
                return false;
            }
        });
        if (fallbackKey) {
            result = db[fallbackKey];
            // console.log('Fuzzy match found for key:', normKey, 'using stored key:', fallbackKey);
        } else {
            // Compare all keys for debugging
            const allParsedKeys = allKeys.map(k => JSON.parse(k));
            // console.log('Message not found for normalized key:', normKey);
            // console.log('Available keys:', allParsedKeys);
        }
    }
    return result;
}

module.exports = { saveMessage, getMessage };

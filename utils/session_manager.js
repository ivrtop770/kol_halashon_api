
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SessionManager {
    constructor(sessionFile = 'session.json') {
        this.sessionFile = sessionFile;
        this.session = axios.create();
        this.authToken = null;
        this.siteKey = null;
        this.headers = this._setupDefaultHeaders();
        this.BASE_URL = 'https://www2.kolhalashon.com:444/api';
    }

    _setupDefaultHeaders() {
        return {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'origin': 'https://www2.kolhalashon.com',
            'referer': 'https://www2.kolhalashon.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
        };
    }

    loadSession() {
        if (fs.existsSync(this.sessionFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.sessionFile));
                this.session.defaults.headers = { ...this.session.defaults.headers, ...data.headers };
                this.authToken = data.authToken;
                this.siteKey = data.siteKey;
                this._updateAuthHeaders();
                console.log('Session loaded from file');
            } catch (err) {
                console.warn(`Failed to load session file: ${err}`);
                this._initializeEmptySession();
            }
        } else {
            console.log('No session file found, initializing empty session');
            this._initializeEmptySession();
        }
    }

    _initializeEmptySession() {
        this.session.defaults.headers = this._setupDefaultHeaders();
        console.log('Empty session initialized');
    }

    saveSession() {
        const sessionData = {
            authToken: this.authToken,
            siteKey: this.siteKey,
            headers: this.session.defaults.headers
        };
        fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
        console.log('Session saved successfully');
    }

    _updateAuthHeaders() {
        if (this.authToken) {
            this.session.defaults.headers['authorization'] = `Bearer ${this.authToken}`;
        }
        if (this.siteKey) {
            this.session.defaults.headers['authorization-site-key'] = `Bearer ${this.siteKey}`;
        }
    }

    async getDownloadKey(fileId) {
        const url = `${this.BASE_URL}/files/checkAutorizationDownload/${fileId}/false`;
        const response = await this._sendRequest('get', url);
        const data = response.data;
        const key = data.key;
        if (!key) {
            throw new Error(`DownloadKeyNotFoundException: Key not found for file ID ${fileId}`);
        }
        return { key, cookie: response.headers['set-cookie'][0] };
    }

    async _sendRequest(method, url, options = {}) {
        options.headers = this.session.defaults.headers;
        const response = await this.session.request({ method, url, ...options });
        this.saveSession();
        return response;
    }

    isTokenValid() {
        return this.getDownloadKey(30413171).then(() => true).catch(() => false); // Test file ID
    }

    setTokens(authToken, siteKey) {
        this.authToken = authToken;
        this.siteKey = siteKey;
        this._updateAuthHeaders();
        this.saveSession();
    }
}

module.exports = { SessionManager };

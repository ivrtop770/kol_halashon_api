const fs = require('fs');
const dotenv = require('dotenv');
const { SessionManager } = require('./utils/session_manager');
const { Shiur, ShiurDetails, QualityLevel } = require('./models/shiur');
const { AuthenticationError, SessionNotLoadedException, SearchFailedException, DownloadFailedException, SessionDisabledException, ShiurDetailsNotFoundException } = require('./models/exceptions');

dotenv.config();

class KolHalashonAPI {
    constructor(username = process.env.KOL_HALASHON_USERNAME || '', password = process.env.KOL_HALASHON_PASSWORD || '', useSession = false, sessionFile = 'session.json') {
        this.username = username;
        this.password = password;
        this.token = "";
        this._baseUrl = "https://www2.kolhalashon.com:444/api/";
        this._headers = {
            'origin': 'https://www2.kolhalashon.com',
            'referer': 'https://www2.kolhalashon.com/',
        };

        this.useSession = useSession;
        this.sessionManager = new SessionManager(sessionFile);

        if (this.useSession) {
            this._initSession();
        }
    }

    async _initSession() {
        try {
            this.sessionManager.loadSession();
            const isValid = await this.sessionManager.isTokenValid();
            if (!isValid) {
                throw new SessionNotLoadedException();
            }
        } catch (error) {
            if (error.name === 'SessionNotLoadedException') {
                console.log("Session not found or invalid, attempting to login.");
                await this._login(this.username, this.password);
            } else {
                throw error;
            }
        }
    }

    async _login(username, password) {
        if (!username || !password) {
            throw new AuthenticationError("Username and password are required");
        }

        const loginUrl = `${this._baseUrl}Accounts/UserLogin/`;
        const payload = { Username: username, Password: password };
        const response = await this.sessionManager.session.post(loginUrl, payload, { headers: this._headers });

        if (response.status === 200) {
            const data = response.data;
            const token = data.Token;
            if (token) {
                this.sessionManager.setTokens(token, data.SiteKey || '');
                this._headers['authorization'] = `Bearer ${token}`;
                this.token = token;
                return true;
            }
            throw new AuthenticationError("Login successful but no token found");
        }
        throw new AuthenticationError(`Login failed with status code ${response.status}`);
    }

    async searchItems(keyword, userId = -1) {
        const url = `${this._baseUrl}Search/WebSite_GetSearchItems/${keyword}/${userId}/1/4`;
        const response = await this.sessionManager.session.get(url, { headers: this._headers });
        if (response.status === 200) {
            return response.data;  // Return the items directly
        } else {
            console.error(`Request failed with status code ${response.status} and response: ${response.data}`);
            throw new SearchFailedException(`Error fetching data for keyword: ${keyword}`, response.status);
        }
    }

    async searchRavShiurim(ravId) {
        const url = `${this._baseUrl}Search/WebSite_GetRavShiurim/`;
        const data = {
            "QueryType": -1,
            "LangID": -1,
            "MasechetID": -1,
            "DafNo": -1,
            "MasechetIDY": -1,
            "DafNoY": -1,
            "MoedID": -1,
            "ParashaID": -1,
            "EnglishDisplay": false,
            "MasechetIDYOz": -1,
            "DafNoYOz": -1,
            "FromRow": 0,
            "NumOfRows": 24,
            "PrefferedLanguage": -1,
            "SearchOrder": 7,
            "FiltersArray": [],
            "GeneralID": ravId,
            FilterSwitch: "1".repeat(90)
        };
        const response = await this.sessionManager.session.post(url, data, { headers: this._headers });
        if (response.status === 200) {
            return this.formatShiurim(response.data);
        } else {
            throw new SearchFailedException(`Error fetching Rav Shiurim for Rav ID: ${ravId}`, response.status);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async downloadFile(fileId, qualityLevel) {
        if (!this.useSession) {
            throw new SessionDisabledException();
        }

        const downloadKey = await this.sessionManager.getDownloadKey(fileId);
        const url = `${this._baseUrl}files/GetFileDownload/${fileId}/${qualityLevel}/${downloadKey.key}/null/false/false`;
        const fileExtension = qualityLevel === QualityLevel.AUDIO ? 'mp3' : 'mp4';
        const qualityName = qualityLevel === QualityLevel.AUDIO ? 'audio' : (qualityLevel === QualityLevel.VIDEO ? 'video' : 'hd');
        const fileName = `shiur_${fileId}_${qualityName}.${fileExtension}`;

        try {
            const response = await this.sessionManager.session.get(url, { headers: { 'cookie': downloadKey.cookie }, responseType: 'stream' });
            if (response.status === 200) {
                const writer = fs.createWriteStream(fileName);
                response.data.pipe(writer);
                return new Promise((resolve, reject) => {
                    writer.on('finish', () => resolve(fileName));
                    writer.on('error', reject);
                });
            } else {
                throw new DownloadFailedException("Download failed", response.status, fileId, qualityLevel);
            }
        } catch (error) {
            throw new DownloadFailedException("Download failed", error.response ? error.response.status : null, fileId, qualityLevel);
        }
    }


    async getShiurDetails(fileId) {
        const url = `${this._baseUrl}TblShiurimLists/WebSite_GetShiurDetails/${fileId}`;
        const response = await this.sessionManager.session.get(url, { headers: this._headers });

        if (response.status === 200) {
            return this._parseShiurDetails(response.data);
        }
        throw new ShiurDetailsNotFoundException(fileId);
    }

    // Adding the formatShiurim function
    formatShiurim(shiurim) {
        return shiurim.map(shiur => new Shiur(
            shiur.FileId,
            shiur.TitleHebrew || "",
            shiur.UserNameHebrew || "",
            shiur.ShiurDuration || "Unavailable",
            shiur.RecordDate || "",
            shiur.MainTopicHebrew || "",
            shiur.CatDesc1 || "",
            shiur.CatDesc2 || "",
            shiur.HasAudio || false,
            shiur.HasVideo || false,
            shiur.HasHdVideo || false,
            shiur.DownloadCount || 0,
            shiur.IsWomenOnly || false,
            shiur.ShiurType || "Unavailable",
            shiur.ViewdByUser || false
        ));
    }

    static _parseShiurDetails(data) {
        return new ShiurDetails(
            data.FileId || 0,
            data.TitleHebrew || "",
            data.UserNameHebrew || "",
            data.ShiurDuration || "Unavailable",
            data.RecordDate || "",
            data.MainTopicHebrew || "",
            data.HasAudio || false,
            data.HasVideo || false,
            data.HasHdVideo || false,
            [data.CatDesc1 || "", data.CatDesc2 || ""]
        );
    }
    _parseShiurDetails(data) {
        return new ShiurDetails(
            data.FileId || 0,
            data.TitleHebrew || "",
            data.UserNameHebrew || "",
            data.ShiurDuration || "Unavailable",
            data.RecordDate || "",
            data.MainTopicHebrew || "",
            data.HasAudio || false,
            data.HasVideo || false,
            data.HasHdVideo || false,
            [data.CatDesc1 || "", data.CatDesc2 || ""]
        );
    }

}

module.exports = { KolHalashonAPI, QualityLevel };

class SessionDisabledException extends Error {
    constructor(message = "Session is disabled. Please enable session by setting `useSession=true` to download the file.") {
        super(message);
        this.name = "SessionDisabledException";
    }
}

class AuthenticationError extends Error {
    constructor(message = "Authentication failed. Please check your credentials.") {
        super(message);
        this.name = "AuthenticationError";
    }
}

class TokenExpiredException extends Error {
    constructor(message = "Token expired. Please login again.") {
        super(message);
        this.name = "TokenExpiredException";
    }
}

class DownloadKeyNotFoundException extends Error {
    constructor(fileId) {
        const message = `Download key for file ID ${fileId} was not found.`;
        super(message);
        this.name = "DownloadKeyNotFoundException";
    }
}

class ShiurDetailsNotFoundException extends Error {
    constructor(fileId) {
        const message = `Details for Shiur with file ID ${fileId} were not found.`;
        super(message);
        this.name = "ShiurDetailsNotFoundException";
    }
}

class SessionNotLoadedException extends Error {
    constructor(message = "Session file not found or failed to load.") {
        super(message);
        this.name = "SessionNotLoadedException";
    }
}

class SearchFailedException extends Error {
    constructor(message, statusCode) {
        const formattedMessage = `Search failed with status code ${statusCode}: ${message}`;
        super(formattedMessage);
        this.name = "SearchFailedException";
    }
}

class DownloadFailedException extends Error {
    constructor(message, statusCode, fileId, qualityLevel) {
        super(message);
        this.name = "DownloadFailedException";
        this.statusCode = statusCode;
        this.fileId = fileId;
        this.qualityLevel = qualityLevel;
    }
}

module.exports = {
    SessionDisabledException,
    AuthenticationError,
    TokenExpiredException,
    DownloadKeyNotFoundException,
    ShiurDetailsNotFoundException,
    SessionNotLoadedException,
    SearchFailedException,
    DownloadFailedException
};

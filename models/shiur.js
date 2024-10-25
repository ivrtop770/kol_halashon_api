class QualityLevel {
    static AUDIO = 1;
    static VIDEO = 2;
    static HD_VIDEO = 3;
}

class Shiur {
    constructor(FileId, title, rav, duration, recordDate, mainTopic, category1, category2, audioAvailable, videoAvailable, hdVideoAvailable, downloadCount, womenOnly, shiurType, viewedByUser) {
        this.FileId = FileId;
        this.title = title;
        this.rav = rav;
        this.duration = duration;
        this.recordDate = recordDate;
        this.mainTopic = mainTopic;
        this.category1 = category1;
        this.category2 = category2;
        this.audioAvailable = audioAvailable;
        this.videoAvailable = videoAvailable;
        this.hdVideoAvailable = hdVideoAvailable;
        this.downloadCount = downloadCount;
        this.womenOnly = womenOnly;
        this.shiurType = shiurType;
        this.viewedByUser = viewedByUser;
    }
}

class ShiurDetails {
    constructor(fileId, title, rav, duration, recordDate, mainTopic, audioAvailable, videoAvailable, hdVideoAvailable, categories) {
        this.fileId = fileId;
        this.title = title;
        this.rav = rav;
        this.duration = duration;
        this.recordDate = recordDate;
        this.mainTopic = mainTopic;
        this.audioAvailable = audioAvailable;
        this.videoAvailable = videoAvailable;
        this.hdVideoAvailable = hdVideoAvailable;
        this.categories = categories;
    }
}

module.exports = { QualityLevel, Shiur, ShiurDetails };

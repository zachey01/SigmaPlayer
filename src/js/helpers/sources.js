SigmaPlayer.prototype.loadVideoSources = function (sources) {
    if (typeof sources === 'string') {
        this.autoQuality = true;
        this.videoSources = { default: { auto: sources } };
    } else if (typeof sources === 'object') {
        // Если передан объект сезонов/серий
        if (sources.seasons) {
            this.isSeries = true;
            // Сохраняем полную структуру источников в options – dropdown сам установит videoSources
            this.options.sources = sources;
            return;
        }
        let isQualityMapping = false;
        for (let key in sources) {
            if (typeof sources[key] === 'string') {
                isQualityMapping = true;
                break;
            }
        }
        if (isQualityMapping) {
            this.autoQuality = false;
            this.videoSources = { default: sources };
        } else {
            this.autoQuality = false;
            this.videoSources = sources;
        }
    } else {
        console.error('Неверный формат источников видео.');
        return;
    }
    this.populateTranslationOptions();
};

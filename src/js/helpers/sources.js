SigmaPlayer.prototype.loadVideoSources = function (sources) {
    if (typeof sources === 'string') {
        this.autoQuality = true;
        this.videoSources = { default: { auto: sources } };
    } else if (typeof sources === 'object') {
        // Если передан объект сезонов/серий
        if (sources.seasons) {
            this.isSeries = true;
            this.options.sources = sources;
            // Автоматически выбираем первый сезон и первую серию
            const defaultSeason = Object.keys(sources.seasons)[0];
            const defaultEpisode = Object.keys(
                sources.seasons[defaultSeason].episodes,
            )[0];
            this.selectSeasonEpisode(defaultSeason, defaultEpisode);
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
        // Если в объекте переданы субтитры, сохраняем их
        this.subtitleData = sources.subtitle ? sources.subtitle : [];
    } else {
        console.error('Неверный формат источников видео.');
        return;
    }
    this.populateTranslationOptions();
};

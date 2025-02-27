SigmaPlayer.prototype.selectQuality = function (quality, store = true) {
    const currentTime = this.video.currentTime;
    this.showSpinner();

    if (this.autoQuality) {
        const sources = this.videoSources[this.selectedTranslation];
        const autoUrl = sources['auto'];

        if (!autoUrl) {
            console.warn('Sources are not available');
            this.hideSpinner();
            return;
        }

        const cleanUrl = autoUrl.split('?')[0];

        if (!this.videoType) {
            if (cleanUrl.endsWith('.m3u8')) {
                this.videoType = 'hls';
            } else if (cleanUrl.endsWith('.mpd')) {
                this.videoType = 'dash';
            } else {
                this.videoType = 'mp4';
            }
        }

        if (this.videoType === 'hls') {
            if (typeof Hls === 'undefined') {
                console.warn('hls.js не доступен');
                this.hideSpinner();
                return;
            }
            if (cleanUrl.endsWith('.m3u8')) {
                if (this.hls) {
                    this.hls.destroy();
                    this.hls = null;
                }
                this.hls = new Hls({
                    maxMaxBufferLength: 30,
                    maxBufferSize: 5 * 1024 * 1024,
                    maxBufferLength: 30,
                });
                this.hls.attachMedia(this.video);
                this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                    this.hls.loadSource(autoUrl);
                });
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.video.currentTime = currentTime;
                    this.video.play().catch((err) => {
                        console.error('Error playing video:', err);
                        this.hideSpinner();
                    });
                });
            } else {
                this.video.src = autoUrl;
                this.video.currentTime = currentTime;
                this.video.play().catch((err) => {
                    console.error('Error playing video:', err);
                    this.hideSpinner();
                });
                this.hideSpinner();
            }
        } else if (this.videoType === 'dash') {
            if (typeof dashjs === 'undefined') {
                console.warn('dash.js не доступен');
                this.hideSpinner();
                return;
            }
            if (cleanUrl.endsWith('.mpd')) {
                if (this.dashPlayer) {
                    this.dashPlayer.reset();
                    this.dashPlayer = null;
                }
                this.dashPlayer = dashjs.MediaPlayer().create();
                this.dashPlayer.initialize(this.video, autoUrl, false);
                this.dashPlayer.on(
                    dashjs.MediaPlayer.events['MANIFEST_LOADED'],
                    () => {
                        this.video.currentTime = currentTime;
                        this.video.play().catch((err) => {
                            console.error('Error playing video:', err);
                            this.hideSpinner();
                        });
                    },
                );
            } else {
                this.video.src = autoUrl;
                this.video.currentTime = currentTime;
                this.video.play().catch((err) => {
                    console.error('Error playing video:', err);
                    this.hideSpinner();
                });
                this.hideSpinner();
            }
        } else {
            this.video.src = autoUrl;
            this.video.currentTime = currentTime;
            this.video.play().catch((err) => {
                console.error('Error playing video:', err);
                this.hideSpinner();
            });
            this.hideSpinner();
        }
    } else {
        if (!this.selectedTranslation) {
            console.warn(
                'Пожалуйста, выберите озвучку перед выбором качества.',
            );
            this.hideSpinner();
            return;
        }
        if (!this.videoSources[this.selectedTranslation][quality]) {
            console.warn('Выбранное качество недоступно.');
            this.hideSpinner();
            return;
        }

        if (store) {
            this.selectedQuality = quality;
            this.storeQuality(quality);
        } else {
            this.selectedQuality = quality;
        }

        const urls =
            this.videoSources[this.selectedTranslation][this.selectedQuality];
        if (urls && urls.length > 0) {
            const selectedUrl = urls[0];
            const cleanSelectedUrl = selectedUrl.split('?')[0];

            if (!this.videoType) {
                if (cleanSelectedUrl.endsWith('.m3u8')) {
                    this.videoType = 'hls';
                } else if (cleanSelectedUrl.endsWith('.mpd')) {
                    this.videoType = 'dash';
                } else {
                    this.videoType = 'mp4';
                }
            }

            if (this.videoType === 'hls') {
                if (typeof Hls === 'undefined') {
                    console.warn('hls.js не найден');
                    this.hideSpinner();
                    return;
                }
                if (cleanSelectedUrl.endsWith('.m3u8')) {
                    if (this.hls) {
                        this.hls.destroy();
                        this.hls = null;
                    }
                    this.hls = new Hls({
                        maxMaxBufferLength: 30,
                        maxBufferSize: 5 * 1024 * 1024,
                        maxBufferLength: 30,
                    });
                    this.hls.attachMedia(this.video);
                    this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                        this.hls.loadSource(selectedUrl);
                    });
                    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        this.video.currentTime = currentTime;
                        this.video.play().catch((err) => {
                            console.error('Error playing video:', err);
                            this.hideSpinner();
                        });
                    });
                } else {
                    this.video.src = selectedUrl;
                    this.video.currentTime = currentTime;
                    this.video.play().catch((err) => {
                        console.error('Error playing video:', err);
                        this.hideSpinner();
                    });
                    this.hideSpinner();
                }
            } else if (this.videoType === 'dash') {
                if (typeof dashjs === 'undefined') {
                    console.warn('dash.js не найден');
                    this.hideSpinner();
                    return;
                }
                if (cleanSelectedUrl.endsWith('.mpd')) {
                    if (this.dashPlayer) {
                        this.dashPlayer.reset();
                        this.dashPlayer = null;
                    }
                    this.dashPlayer = dashjs.MediaPlayer().create();
                    this.dashPlayer.initialize(this.video, selectedUrl, false);
                    this.dashPlayer.setAutoSwitchQuality(false);
                    this.dashPlayer.on(
                        dashjs.MediaPlayer.events['MANIFEST_LOADED'],
                        () => {
                            this.video.currentTime = currentTime;
                            this.video.play().catch((err) => {
                                console.error('Error playing video:', err);
                                this.hideSpinner();
                            });
                        },
                    );
                } else {
                    this.video.src = selectedUrl;
                    this.video.currentTime = currentTime;
                    this.video.play().catch((err) => {
                        console.error('Error playing video:', err);
                        this.hideSpinner();
                    });
                    this.hideSpinner();
                }
            } else {
                this.video.src = selectedUrl;
                this.video.currentTime = currentTime;
                this.video.play().catch((err) => {
                    console.error('Error playing video:', err);
                    this.hideSpinner();
                });
                this.hideSpinner();
            }
        } else {
            console.warn('Не удалось установить источник видео.');
            this.hideSpinner();
        }
    }
};

SigmaPlayer.prototype.selectQualityAuto = function (levelIndex) {
    if (this.videoType === 'hls') {
        if (this.hls) {
            this.hls.currentLevel = levelIndex;
            this.updateAutoQualityUI();
            this.storeQuality(levelIndex);
            if (this.hls.levels && this.hls.levels[levelIndex]) {
                console.log(
                    'Выбрано качество: ' +
                        this.hls.levels[levelIndex].height +
                        'p',
                );
            } else {
                console.log('Выбрано качество: уровень ' + levelIndex);
            }
        }
    } else if (this.videoType === 'dash') {
        if (this.dashPlayer) {
            if (levelIndex === -1) {
                this.dashPlayer.updateSettings({
                    streaming: {
                        abr: {
                            autoSwitchBitrate: {
                                video: true,
                            },
                        },
                    },
                });
                console.log('Автоматический выбор качества включен');
            } else {
                this.dashPlayer.updateSettings({
                    streaming: {
                        abr: {
                            autoSwitchBitrate: {
                                video: false,
                            },
                        },
                    },
                });
                this.dashPlayer.setQualityFor('video', levelIndex);
                var qualityList =
                    this.dashPlayer.getBitrateInfoListFor('video');
                var qualityInfo = qualityList.find(function (item) {
                    return item.qualityIndex === levelIndex;
                });
                if (qualityInfo) {
                    console.log(
                        'Выбрано качество: ' +
                            (qualityInfo.height
                                ? qualityInfo.height + 'p'
                                : qualityInfo.bitrate + 'bps'),
                    );
                } else {
                    console.log('Выбрано качество: уровень ' + levelIndex);
                }
            }
            this.storeQuality(levelIndex);
        }
    }
};

SigmaPlayer.prototype.updateAutoQualityUI = function () {
    if (this.videoType === 'hls' && this.hls) {
        const items = this.settingsSubmenu.querySelectorAll('[data-level]');
        items.forEach((item) => {
            if (parseInt(item.dataset.level) === this.hls.currentLevel) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};

SigmaPlayer.prototype.populateQualityOptionsAuto = function () {
    // todo: implement
};

SigmaPlayer.prototype.populateTranslationOptions = function () {
    if (this.videoType === 'dash') {
        const translationDropdown = this.settingsMenu.querySelector(
            ".sigma__settings-main [data-menu='translation']",
        );
        if (translationDropdown) {
            translationDropdown.style.display = 'block';
        }
        return;
    }
    const translations = Object.keys(this.videoSources);
    if (translations.length <= 1) {
        if (translations.length === 1) {
            this.selectedTranslation = translations[0];
            if (this.autoQuality) {
                this.populateQualityOptionsAuto();
                this.selectQuality('auto', false);
            } else {
                let preferredQuality = this.getStoredQuality();
                if (
                    !preferredQuality ||
                    !this.videoSources[this.selectedTranslation][
                        preferredQuality
                    ]
                ) {
                    preferredQuality = this.chooseQualityBasedOnSpeed();
                }
                if (
                    this.videoSources[this.selectedTranslation][
                        preferredQuality
                    ]
                ) {
                    this.selectQuality(preferredQuality, false);
                } else {
                    const qualities = Object.keys(
                        this.videoSources[this.selectedTranslation],
                    ).sort((a, b) => parseInt(b) - parseInt(a));
                    preferredQuality =
                        qualities.find(
                            (q) => parseInt(q) <= parseInt(preferredQuality),
                        ) || qualities[0];
                    this.selectQuality(preferredQuality, false);
                }
            }
            this.playEnabled = true;
            this.enablePlayButton();
        }
        return;
    }
    this.selectTranslation(translations[0]);
};

SigmaPlayer.prototype.selectTranslation = function (translation) {
    this.selectedTranslation = translation;
    this.playEnabled = true;
    this.enablePlayButton();
};

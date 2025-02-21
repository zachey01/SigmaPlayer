SigmaPlayer.prototype.hideSubmenu = function () {
    this.settingsSubmenu.style.display = 'none';
    this.settingsSubmenu.innerHTML = '';
    this.settingsMain.style.display = 'block';
};

SigmaPlayer.prototype.showSubmenu = function (menuType) {
    this.settingsMain.style.display = 'none';
    this.settingsSubmenu.style.display = 'block';
    this.settingsSubmenu.innerHTML = '';
    const backButton = document.createElement('div');
    backButton.className = 'sigma__dropdown-item sigma__back-button';
    const backIcon = getIcon('sigma-chevron-left');
    backIcon.classList.add('sigma__backIcon');
    backButton.appendChild(backIcon);
    backButton.appendChild(
        document.createTextNode(
            ` ${
                menuType === 'speed'
                    ? 'Скорость'
                    : menuType === 'translation'
                    ? 'Озвучка'
                    : 'Качество'
            }`,
        ),
    );
    backButton.setAttribute('tabindex', '0');
    backButton.addEventListener('click', () => {
        this.hideSubmenu();
    });
    backButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            backButton.click();
        }
    });
    this.settingsSubmenu.appendChild(backButton);
    if (menuType === 'speed') {
        this.populateSpeedSubmenu();
    } else if (menuType === 'translation') {
        this.populateTranslationSubmenu();
    } else if (menuType === 'quality') {
        this.populateQualitySubmenu();
    }
};

SigmaPlayer.prototype.populateSpeedSubmenu = function () {
    const speeds = [
        { speed: 0.5, label: '0.5x' },
        { speed: 1.0, label: '1.0x' },
        { speed: 2.0, label: '2.0x' },
    ];
    speeds.forEach((item) => {
        const speedOption = document.createElement('div');
        speedOption.className = 'sigma__dropdown-item sigma__speed-option';
        speedOption.dataset.speed = item.speed;
        speedOption.textContent = item.label;
        speedOption.setAttribute('tabindex', '0');
        speedOption.addEventListener('click', () => {
            this.setPlaybackSpeed(item.speed);
            this.hideSubmenu();
        });
        speedOption.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                speedOption.click();
            }
        });
        this.settingsSubmenu.appendChild(speedOption);
    });
};

SigmaPlayer.prototype.populateTranslationSubmenu = function () {
    const translations = Object.keys(this.videoSources);
    translations.forEach((translation) => {
        const transOption = document.createElement('div');
        transOption.className = 'sigma__dropdown-item';
        transOption.dataset.translation = translation;
        transOption.textContent = translation;
        transOption.setAttribute('tabindex', '0');
        transOption.addEventListener('click', () => {
            this.selectTranslation(translation);
            this.hideSubmenu();
        });
        transOption.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                transOption.click();
            }
        });
        this.settingsSubmenu.appendChild(transOption);
    });
};

SigmaPlayer.prototype.populateQualitySubmenu = function () {
    if (this.autoQuality) {
        // Для dash
        if (this.videoType === 'dash') {
            if (typeof dashjs === 'undefined') {
                const msg = document.createElement('div');
                msg.className = 'sigma__dropdown-item';
                msg.textContent = 'dash.js не найден';
                this.settingsSubmenu.appendChild(msg);
                return;
            }
            if (!this.dashPlayer) {
                const msg = document.createElement('div');
                msg.className = 'sigma__dropdown-item';
                msg.textContent = 'Нет доступных качеств';
                this.settingsSubmenu.appendChild(msg);
                return;
            }
            const autoOption = document.createElement('div');
            autoOption.className = 'sigma__dropdown-item';
            autoOption.textContent = 'Авто';
            autoOption.dataset.level = -1;
            autoOption.setAttribute('tabindex', '0');
            autoOption.addEventListener('click', () => {
                this.selectQualityAuto(-1);
                this.hideSubmenu();
            });
            autoOption.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    autoOption.click();
                }
            });
            this.settingsSubmenu.appendChild(autoOption);
            const qualityList = this.dashPlayer.getBitrateInfoListFor('video');
            const qualitySet = new Map();
            qualityList.forEach((q) => {
                let qualityLabel = q.height ? q.height + 'p' : `${q.bitrate}`;
                if (!qualitySet.has(qualityLabel)) {
                    qualitySet.set(qualityLabel, q.qualityIndex);
                }
            });
            qualitySet.forEach((levelIndex, qualityLabel) => {
                const qualityOption = document.createElement('div');
                qualityOption.className = 'sigma__dropdown-item';
                qualityOption.textContent = qualityLabel;
                qualityOption.dataset.level = levelIndex;
                qualityOption.setAttribute('tabindex', '0');
                qualityOption.addEventListener('click', () => {
                    this.selectQualityAuto(
                        parseInt(qualityOption.dataset.level),
                    );
                    this.hideSubmenu();
                });
                qualityOption.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        qualityOption.click();
                    }
                });
                this.settingsSubmenu.appendChild(qualityOption);
            });
        }
        // Для hls
        else if (this.videoType === 'hls') {
            if (typeof Hls === 'undefined') {
                const msg = document.createElement('div');
                msg.className = 'sigma__dropdown-item';
                msg.textContent = 'hls.js не найден';
                this.settingsSubmenu.appendChild(msg);
                return;
            }
            if (!this.hls || !this.hls.levels || this.hls.levels.length === 0) {
                const msg = document.createElement('div');
                msg.className = 'sigma__dropdown-item';
                msg.textContent = 'Нет доступных качеств';
                this.settingsSubmenu.appendChild(msg);
                return;
            }
            const autoOption = document.createElement('div');
            autoOption.className = 'sigma__dropdown-item';
            autoOption.textContent = 'Авто';
            autoOption.dataset.level = -1;
            autoOption.setAttribute('tabindex', '0');
            autoOption.addEventListener('click', () => {
                this.selectQualityAuto(-1);
                this.hideSubmenu();
            });
            autoOption.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    autoOption.click();
                }
            });
            this.settingsSubmenu.appendChild(autoOption);
            const levels = this.hls.levels;
            const qualitySet = new Map();
            levels.forEach((level, index) => {
                let qualityLabel = level.height
                    ? level.height + 'p'
                    : `${level.bitrate}`;
                if (!qualitySet.has(qualityLabel)) {
                    qualitySet.set(qualityLabel, index);
                }
            });
            qualitySet.forEach((levelIndex, qualityLabel) => {
                const qualityOption = document.createElement('div');
                qualityOption.className = 'sigma__dropdown-item';
                qualityOption.textContent = qualityLabel;
                qualityOption.dataset.level = levelIndex;
                qualityOption.setAttribute('tabindex', '0');
                qualityOption.addEventListener('click', () => {
                    this.selectQualityAuto(
                        parseInt(qualityOption.dataset.level),
                    );
                    this.hideSubmenu();
                });
                qualityOption.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        qualityOption.click();
                    }
                });
                this.settingsSubmenu.appendChild(qualityOption);
            });
        }
    }
    // Ручной режим (выбор качества для озвучки)
    else {
        if (!this.selectedTranslation) {
            const msg = document.createElement('div');
            msg.className = 'sigma__dropdown-item';
            msg.textContent = 'Нет озвучки';
            this.settingsSubmenu.appendChild(msg);
            return;
        }
        const qualities = Object.keys(
            this.videoSources[this.selectedTranslation],
        ).sort((a, b) => parseInt(b) - parseInt(a));
        qualities.forEach((quality) => {
            const qualityOption = document.createElement('div');
            qualityOption.className = 'sigma__dropdown-item';
            qualityOption.textContent = quality;
            qualityOption.dataset.quality = quality;
            qualityOption.setAttribute('tabindex', '0');
            qualityOption.addEventListener('click', () => {
                this.selectQuality(quality);
                this.hideSubmenu();
            });
            qualityOption.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    qualityOption.click();
                }
            });
            this.settingsSubmenu.appendChild(qualityOption);
        });
    }
};

// Метод скрытия подменю
SigmaPlayer.prototype.hideSubmenu = function () {
    this.settingsSubmenu.style.display = 'none';
    this.settingsSubmenu.innerHTML = '';
    this.settingsMain.style.display = 'block';
    this._submenuItemsContainer = null;
};

// Метод показа подменю для выбранного типа настроек
SigmaPlayer.prototype.showSubmenu = function (menuType) {
    this.settingsMain.style.display = 'none';
    this.settingsSubmenu.style.display = 'block';
    this.settingsSubmenu.innerHTML = '';
    // Создаём фиксированную back-кнопку (не скроллируется)
    const backButton = document.createElement('div');
    backButton.className = 'sigma__sub-back-item';
    backButton.setAttribute('tabindex', '0');
    const backIcon = getIcon('sigma-chevron-left');
    backIcon.classList.add('sigma__backIcon');
    backButton.appendChild(backIcon);
    const titleText =
        menuType === 'speed'
            ? 'Скорость'
            : menuType === 'translation'
            ? 'Озвучка'
            : 'Качество';
    backButton.appendChild(document.createTextNode(' ' + titleText));
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
    // Создаём скроллируемый контейнер для остальных элементов подменю
    this._submenuItemsContainer = document.createElement('div');
    this._submenuItemsContainer.className = 'sigma__submenu-items';
    this.settingsSubmenu.appendChild(this._submenuItemsContainer);

    if (menuType === 'speed') {
        this.populateSpeedSubmenu();
    } else if (menuType === 'translation') {
        // Озвучка доступна только для DASH
        if (
            this.videoType === 'dash' &&
            this.dashPlayer &&
            typeof this.dashPlayer.getTracksFor === 'function'
        ) {
            this.populateTranslationSubmenu();
        } else {
            const msg = document.createElement('div');
            msg.className = 'sigma__dropdown-item';
            msg.textContent = 'Озвучка недоступна';
            this._submenuItemsContainer.appendChild(msg);
        }
    } else if (menuType === 'quality') {
        this.populateQualitySubmenu();
    }
};

// Подменю для выбора скорости воспроизведения
SigmaPlayer.prototype.populateSpeedSubmenu = function () {
    const speeds = [
        { speed: 0.5, label: '0.5x' },
        { speed: 1.0, label: '1.0x' },
        { speed: 2.0, label: '2.0x' },
    ];
    speeds.forEach((item) => {
        const speedOption = document.createElement('div');
        speedOption.className = 'sigma__submenu-item';
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
        this._submenuItemsContainer.appendChild(speedOption);
    });
};

// Подменю для выбора озвучки (только для DASH)
SigmaPlayer.prototype.populateTranslationSubmenu = function () {
    var audioTracks = this.dashPlayer.getTracksFor('audio');
    if (audioTracks.length === 0) {
        var msg = document.createElement('div');
        msg.className = 'sigma__submenu-item';
        msg.textContent = 'Нет аудио-дорожек';
        this._submenuItemsContainer.appendChild(msg);
        return;
    }
    audioTracks.forEach((track, index) => {
        let displayName;
        if (
            this.options.audioNames &&
            Array.isArray(this.options.audioNames.names) &&
            Array.isArray(this.options.audioNames.order)
        ) {
            const extracted = track.lang ? track.lang.replace(/\D/g, '') : '';
            const num = extracted ? parseInt(extracted) : index;
            const orderArr = this.options.audioNames.order;
            let mappedIndex = num;
            if (num < orderArr.length) {
                mappedIndex = orderArr[num];
            }
            const namesArr = this.options.audioNames.names;
            if (mappedIndex < namesArr.length) {
                displayName = namesArr[mappedIndex];
                if (displayName === 'delete') {
                    return;
                }
            } else {
                displayName = track.lang || 'Дорожка ' + (index + 1);
            }
        } else {
            displayName = track.lang || 'Дорожка ' + (index + 1);
        }
        var trackOption = document.createElement('div');
        trackOption.className = 'sigma__submenu-item';
        trackOption.dataset.trackIndex = index;
        trackOption.textContent = displayName;
        trackOption.setAttribute('tabindex', '0');
        trackOption.addEventListener('click', () => {
            this.setAudioTrack(index);
            this.hideSubmenu();
        });
        trackOption.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trackOption.click();
            }
        });
        this._submenuItemsContainer.appendChild(trackOption);
    });
};

// Подменю для выбора качества видео
SigmaPlayer.prototype.populateQualitySubmenu = function () {
    if (this.autoQuality) {
        if (this.videoType === 'dash') {
            if (typeof dashjs === 'undefined') {
                const msg = document.createElement('div');
                msg.className = 'sigma__submenu-item';
                msg.textContent = 'dash.js не найден';
                this._submenuItemsContainer.appendChild(msg);
                return;
            }
            if (!this.dashPlayer) {
                const msg = document.createElement('div');
                msg.className = 'sigma__submenu-item';
                msg.textContent = 'Нет доступных качеств';
                this._submenuItemsContainer.appendChild(msg);
                return;
            }
            const autoOption = document.createElement('div');
            autoOption.className = 'sigma__submenu-item';
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
            this._submenuItemsContainer.appendChild(autoOption);
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
                qualityOption.className = 'sigma__submenu-item';
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
                this._submenuItemsContainer.appendChild(qualityOption);
            });
        } else if (this.videoType === 'hls') {
            const msg = document.createElement('div');
            msg.className = 'sigma__submenu-item';
            msg.textContent = 'Выбор качества недоступен';
            this._submenuItemsContainer.appendChild(msg);
        }
    } else {
        if (!this.selectedTranslation) {
            const msg = document.createElement('div');
            msg.className = 'sigma__submenu-item';
            msg.textContent = 'Нет озвучки';
            this._submenuItemsContainer.appendChild(msg);
            return;
        }
        const qualities = Object.keys(
            this.videoSources[this.selectedTranslation],
        ).sort((a, b) => parseInt(b) - parseInt(a));
        qualities.forEach((quality) => {
            const qualityOption = document.createElement('div');
            qualityOption.className = 'sigma__submenu-item';
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
            this._submenuItemsContainer.appendChild(qualityOption);
        });
    }
};

// Новый метод для переключения аудио-дорожки
SigmaPlayer.prototype.setAudioTrack = function (index) {
    if (
        this.videoType === 'dash' &&
        this.dashPlayer &&
        typeof this.dashPlayer.getTracksFor === 'function'
    ) {
        var audioTracks = this.dashPlayer.getTracksFor('audio');
        if (audioTracks && audioTracks[index]) {
            this.dashPlayer.setCurrentTrack(audioTracks[index]);
            console.log(
                'Выбрана аудио-дорожка:',
                audioTracks[index].lang || 'Дорожка ' + (index + 1),
            );
        }
    } else if (this.videoType === 'hls' && this.hls && this.hls.audioTracks) {
        if (this.hls.audioTracks[index]) {
            this.hls.audioTrack = index;
            console.log(
                'Выбрана аудио-дорожка:',
                this.hls.audioTracks[index].name ||
                    this.hls.audioTracks[index].lang ||
                    'Дорожка ' + (index + 1),
            );
        }
    }
};

SigmaPlayer.prototype.setCurrentTrack = function (track) {
    if (
        this.videoType === 'dash' &&
        this.dashPlayer &&
        typeof this.dashPlayer.getTracksFor === 'function'
    ) {
        var audioTracks = this.dashPlayer.getTracksFor('audio');
        var index = audioTracks.indexOf(track);
        if (index !== -1) {
            this.setAudioTrack(index);
        } else {
            console.warn('Аудиодорожка не найдена');
        }
    } else {
        console.warn('setCurrentTrack доступен только для DASH');
    }
};

class SigmaPlayer {
    constructor(videoElementOrSelector, options = {}) {
        if (typeof videoElementOrSelector === 'string') {
            this.video = document.querySelector(videoElementOrSelector);
        } else {
            this.video = videoElementOrSelector;
        }

        if (!this.video) {
            throw new Error('Video element not found');
        }

        if (!this.video.closest('#sigma__video-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.id = 'sigma__video-wrapper';
            this.video.parentNode.insertBefore(wrapper, this.video);
            wrapper.appendChild(this.video);
        }

        const wrapper = this.video.closest('#sigma__video-wrapper');
        createControlsUI(wrapper, this);

        // Если передан thumbnail – создаём оверлей
        if (options.thumbnail) {
            const thumbnailOverlay = document.createElement('div');
            thumbnailOverlay.id = 'sigma__thumbnail-overlay';
            thumbnailOverlay.style.position = 'absolute';
            thumbnailOverlay.style.top = '0';
            thumbnailOverlay.style.left = '0';
            thumbnailOverlay.style.width = '100%';
            thumbnailOverlay.style.height = '100%';
            thumbnailOverlay.style.backgroundImage = `url(${options.thumbnail})`;
            thumbnailOverlay.style.backgroundSize = 'cover';
            thumbnailOverlay.style.backgroundPosition = 'center';
            thumbnailOverlay.style.zIndex = '1';
            wrapper.appendChild(thumbnailOverlay);
            this.thumbnailOverlay = thumbnailOverlay;
        }

        this.videoWrapper = wrapper;
        this.options = options;
        this.videoType = options.videoType || null;
        this.videoSources = {};
        this.selectedTranslation = null;
        this.selectedQuality = null;
        this.autoQuality = false;
        // Для субтитров
        this.subtitlesEnabled = false;
        this.captionTrack = null;
        this.captionTrackElement = null;

        this.hls = null;
        this.dashPlayer = null;

        this.isDragging = false;
        this.playEnabled = false;

        this.HIDE_CONTROLS_CLASS = 'sigma__hide-controls';
        this.IS_PLAYING_CLASS = 'sigma__isPlaying';
        this.IS_MUTED_CLASS = 'sigma__isMute';
        this.IS_FULLSCREEN_CLASS = 'sigma__isFullscreen';
        this.SHOW_CLASS = 'sigma__show';

        this.longPressTimeout = null;
        this.longPressActivated = false;

        // Если переданы источники в формате сезонов/серий – отметить режим сериалов
        if (this.options.sources && this.options.sources.seasons) {
            this.isSeries = true;
            // Создаём сразу dropdown для выбора сезона/серии (без ожидания загрузки видео)
            createSeasonEpisodeDropdown(wrapper, this);
        }

        this.initialize();

        if (this.options.sources) {
            this.loadVideoSources(this.options.sources);
        } else {
            console.error('Нет источников видео');
        }
    }

    // --- Helper methods for UI ---
    showSpinner = () => {
        this.loadingSpinner.style.display = 'block';
    };

    hideSpinner = () => {
        this.loadingSpinner.style.display = 'none';
    };

    showCentralPlay = () => {
        this.centralPlayBtn.style.display = 'flex';
    };

    hideCentralPlay = () => {
        this.centralPlayBtn.style.display = 'none';
    };

    formatTime = (timeInSeconds) => {
        return formatTime(timeInSeconds);
    };

    getNetworkSpeed = () => {
        return getNetworkSpeed();
    };

    chooseQualityBasedOnSpeed = () => {
        return chooseQualityBasedOnSpeed();
    };

    getStoredQuality = () => {
        return getStoredQuality();
    };

    storeQuality = (quality) => {
        storeQuality(quality);
    };

    getStoredSpeed = () => {
        return getStoredSpeed();
    };

    storeSpeed = (speed) => {
        storeSpeed(speed);
    };

    updateTabIndices = () => {
        const menuOpen = this.settingsMenu.parentElement.classList.contains(
            this.SHOW_CLASS,
        );
        const settingsItems = this.settingsMenu.querySelectorAll(
            '.sigma__dropdown-item, .sigma__menu-item',
        );
        settingsItems.forEach((item) => {
            item.setAttribute('tabindex', menuOpen ? '0' : '-1');
        });
        const volumeOpen = this.volumeContainer.classList.contains('active');
        if (this.volumeSlider) {
            this.volumeSlider.setAttribute('tabindex', volumeOpen ? '0' : '-1');
        }
    };

    isMenuOpen = () => {
        return (
            (this.settingsMenu &&
                this.settingsMenu.parentElement &&
                this.settingsMenu.parentElement.classList.contains(
                    this.SHOW_CLASS,
                )) ||
            (this.volumeContainer &&
                this.volumeContainer.classList.contains('active'))
        );
    };

    // --- Loading video sources ---
    enablePlayButton = () => {
        this.playBtn.disabled = false;
        this.playBtn.style.opacity = 1;
    };

    disablePlayButton = () => {
        this.playBtn.disabled = true;
        this.playBtn.style.opacity = 0.5;
    };

    togglePlayState = () => {
        if (this.video.paused || this.video.ended) {
            this.video
                .play()
                .then(() => {
                    this.playBtn.classList.add(this.IS_PLAYING_CLASS);
                })
                .catch((err) => {
                    console.error('Error playing video:', err);
                    this.hideSpinner();
                });
        } else {
            this.video.pause();
            this.playBtn.classList.remove(this.IS_PLAYING_CLASS);
        }
    };

    toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            this.openFullscreen();
        } else {
            this.closeFullscreen();
        }
    };

    openFullscreen = () => {
        if (this.videoWrapper.requestFullscreen) {
            this.videoWrapper.requestFullscreen();
        } else if (this.videoWrapper.webkitRequestFullscreen) {
            this.videoWrapper.webkitRequestFullscreen();
        } else if (this.videoWrapper.msRequestFullscreen) {
            this.videoWrapper.msRequestFullscreen();
        }
        this.fullScreenBtn.classList.add(this.IS_FULLSCREEN_CLASS);
        this.video.style.position = 'absolute';
        this.video.style.top = '50%';
        this.video.style.left = '50%';
        this.video.style.transform = 'translate(-50%, -50%)';
        this.video.style.maxWidth = '100%';
        this.video.style.maxHeight = '100%';
    };

    closeFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
                console.error('Error exiting fullscreen:', err);
            });
        }
        this.fullScreenBtn.classList.remove(this.IS_FULLSCREEN_CLASS);
        this.video.style.position = '';
        this.video.style.top = '';
        this.video.style.left = '';
        this.video.style.transform = '';
        this.video.style.maxWidth = '';
        this.video.style.maxHeight = '';
    };

    updateProgress = () => {
        if (!this.isDragging && this.video.duration) {
            const percentage =
                (this.video.currentTime / this.video.duration) * 100;
            this.progress.style.width = percentage + '%';
            this.updateTimeDisplay();
        }
    };

    updateTimeDisplay = (newTime) => {
        const current =
            newTime !== undefined ? newTime : this.video.currentTime;
        const duration = this.video.duration || 0;
        this.currentTimeElem.textContent = this.formatTime(current);
        this.durationElem.textContent = this.formatTime(duration);
        this.currentTimeElem.classList.add('countdown');
        setTimeout(
            () => this.currentTimeElem.classList.remove('countdown'),
            500,
        );
    };

    updateBuffered = () => {
        if (this.video.buffered.length > 0) {
            const bufferedEnd = this.video.buffered.end(
                this.video.buffered.length - 1,
            );
            const duration = this.video.duration;
            if (duration > 0) {
                const bufferedWidth = (bufferedEnd / duration) * 100;
                this.progress.parentElement.querySelector(
                    '.sigma__buffered',
                ).style.width = `${bufferedWidth}%`;
            }
        }
    };

    handleTimelineClick = (event) => {
        if (!this.video.duration) return;
        const timelineWidth = this.timeline.offsetWidth;
        const clickX = event.offsetX;
        const newTime = (clickX / timelineWidth) * this.video.duration;
        this.video.currentTime = newTime;
    };

    startDrag = (event) => {
        this.isDragging = true;
        const clientX = event.touches
            ? event.touches[0].clientX
            : event.clientX;
        this.updateTimeline(clientX);
        this.showSeekTooltip(clientX);
    };

    dragTimeline = (event) => {
        if (this.isDragging && this.video.duration) {
            const clientX = event.touches
                ? event.touches[0].clientX
                : event.clientX;
            this.updateTimeline(clientX);
            this.showSeekTooltip(clientX);
        }
    };

    stopDrag = (event) => {
        if (this.isDragging && this.video.duration) {
            this.isDragging = false;
            const clientX = event.changedTouches
                ? event.changedTouches[0].clientX
                : event.clientX;
            this.hideSeekTooltip();
            this.updateTimeline(clientX);
            const rect = this.timeline.getBoundingClientRect();
            const newTime =
                ((clientX - rect.left) / this.timeline.offsetWidth) *
                this.video.duration;
            this.video.currentTime = newTime;
        }
    };

    updateTimeline = (clientX) => {
        const rect = this.timeline.getBoundingClientRect();
        let offsetX = clientX - rect.left;
        if (offsetX < 0) offsetX = 0;
        if (offsetX > rect.width) offsetX = rect.width;
        const percentage = (offsetX / rect.width) * 100;
        this.progress.style.width = percentage + '%';
        const newTime = (offsetX / rect.width) * this.video.duration;
        this.updateTimeDisplay(newTime);
    };

    showSeekTooltip = (clientX) => {
        const rect = this.timeline.getBoundingClientRect();
        let offsetX = clientX - rect.left;
        if (offsetX < 0) offsetX = 0;
        if (offsetX > rect.width) offsetX = rect.width;
        const percentage = offsetX / rect.width;
        const newTime = percentage * this.video.duration;
        const time = this.formatTime(newTime);
        this.seekTooltip.textContent = time;
        this.seekTooltip.style.left = `${offsetX}px`;
        this.seekTooltip.style.display = 'block';
    };

    hideSeekTooltip = () => {
        this.seekTooltip.style.display = 'none';
    };

    toggleVolume = () => {
        this.volumeContainer.classList.toggle('active');
        this.closeOtherMenus('volume');
        this.updateTabIndices();
    };

    toggleSettingsMenuFunc = (event) => {
        event.stopPropagation();
        this.settingsMenu.parentElement.classList.toggle(this.SHOW_CLASS);
        this.closeOtherMenus('settings');
        this.updateTabIndices();
    };

    setPlaybackSpeed = (speed) => {
        this.video.playbackRate = speed;
        this.storeSpeed(speed);
    };

    checkPlayButton = () => {
        this.enablePlayButton();
    };

    closeOtherMenus = (currentMenu) => {
        if (currentMenu === 'settings') {
            if (this.volumeContainer.classList.contains('active')) {
                this.volumeContainer.classList.remove('active');
            }
        } else if (currentMenu === 'volume') {
            if (
                this.settingsMenu.parentElement.classList.contains(
                    this.SHOW_CLASS,
                )
            ) {
                this.settingsMenu.parentElement.classList.remove(
                    this.SHOW_CLASS,
                );
            }
        }
        this.updateTabIndices();
    };
}

// Инициализация плеера и привязка событий
// main.js (фрагмент метода initialize)

// main.js (фрагмент метода selectSeasonEpisode)
SigmaPlayer.prototype.selectSeasonEpisode = function (season, episode) {
    this.currentSeason = season;
    this.currentEpisode = episode;
    const episodeData = this.options.sources.seasons[season].episodes[episode];
    if (!episodeData || !episodeData.sources) {
        console.error('Данные для выбранной серии отсутствуют');
        return;
    }

    // Сбрасываем уже инициализированные плееры для hls/dash (если были)
    if (this.hls) {
        this.hls.destroy();
        this.hls = null;
    }
    if (this.dashPlayer) {
        this.dashPlayer.reset();
        this.dashPlayer = null;
    }
    // Сбрасываем videoType, чтобы при загрузке новой серии определился формат исходного файла
    this.videoType = null;

    // Если источник передаётся как строка, оборачиваем в объект auto
    if (typeof episodeData.sources.default === 'string') {
        this.autoQuality = true;
        this.videoSources = {
            default: { auto: episodeData.sources.default },
        };
    } else {
        this.videoSources = episodeData.sources;
        this.autoQuality = false;
    }
    this.options.audioNames = episodeData.audioNames || null;
    // Добавляем данные субтитров (если есть)
    this.subtitleData = episodeData.subtitle || [];
    // Сброс выбранной озвучки
    this.selectedTranslation = null;
    // Перезапускаем логику выбора озвучки/качества
    this.populateTranslationOptions();
    // Обновляем источник у видео и перезагружаем метаданные
    this.video.load();
};

SigmaPlayer.prototype.initialize = function () {
    this.video.addEventListener('play', () => {
        this.playBtn.classList.add(this.IS_PLAYING_CLASS);
        this.hideSpinner();
        // Скрываем thumbnail-оверлей при старте воспроизведения
        if (this.thumbnailOverlay) {
            this.thumbnailOverlay.style.display = 'none';
        }
    });

    this.video.addEventListener('pause', () => {
        this.playBtn.classList.remove(this.IS_PLAYING_CLASS);
        this.hideSpinner();
        this.showCentralPlay();
    });

    this.video.addEventListener('ended', () => {
        this.playBtn.classList.remove(this.IS_PLAYING_CLASS);
        this.showControls();
        this.hideSpinner();
        this.showCentralPlay();
    });

    this.video.addEventListener('waiting', this.showSpinner);
    this.video.addEventListener('playing', this.hideSpinner);
    this.video.addEventListener('pause', this.showCentralPlay);
    this.video.addEventListener('play', this.hideCentralPlay);
    this.video.addEventListener('ended', this.showCentralPlay);

    // Убираем вызов disablePlayButton(), чтобы кнопка воспроизведения была всегда доступна
    // this.disablePlayButton();

    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        const vol = parseFloat(savedVolume);
        this.video.volume = vol;
        this.volumeSlider.value = vol;
        if (vol === 0) {
            this.video.muted = true;
            this.volumeBtn.classList.add(this.IS_MUTED_CLASS);
        } else {
            this.video.muted = false;
            this.volumeBtn.classList.remove(this.IS_MUTED_CLASS);
        }
    } else {
        this.video.volume = 1;
        this.volumeSlider.value = 1;
    }

    const savedSpeed = this.getStoredSpeed();
    this.video.playbackRate = savedSpeed;

    // Изменён обработчик: воспроизведение всегда доступно
    this.playBtn.addEventListener('click', () => {
        this.togglePlayState();
    });

    // Изменён обработчик центральной кнопки воспроизведения
    this.centralPlayBtn.addEventListener('click', () => {
        this.togglePlayState();
    });

    this.fullScreenBtn.addEventListener('click', this.toggleFullscreen);

    this.video.addEventListener('timeupdate', this.updateProgress);
    this.video.addEventListener('loadedmetadata', () => {
        this.updateTimeDisplay();
    });

    this.video.addEventListener('sigma__progress', this.updateBuffered);

    this.timeline.addEventListener('click', this.handleTimelineClick);
    this.timeline.addEventListener('mousedown', this.startDrag);
    document.addEventListener('mouseup', this.stopDrag);
    document.addEventListener('mousemove', this.dragTimeline);
    this.timeline.addEventListener('touchstart', this.startDrag);
    document.addEventListener('touchend', this.stopDrag);
    document.addEventListener('touchmove', this.dragTimeline);
    this.volumeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleVolume();
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.sigma__dropdown')) {
            let dropdown = this.settingsMenu.parentElement;
            if (dropdown.classList.contains(this.SHOW_CLASS)) {
                dropdown.classList.remove(this.SHOW_CLASS);
                this.updateTabIndices();
            }
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            this.fullScreenBtn.classList.remove(this.IS_FULLSCREEN_CLASS);
            this.video.style.position = '';
            this.video.style.top = '';
            this.video.style.left = '';
            this.video.style.transform = '';
            this.video.style.maxWidth = '';
            this.video.style.maxHeight = '';
        }
    });

    this.mouseActivityTimeout = null;
    this.showControls = this.showControls.bind(this);
    this.hideControls = this.hideControls.bind(this);
    this.resetMouseActivityTimeout = this.resetMouseActivityTimeout.bind(this);
    this.videoWrapper.addEventListener('mousemove', this.showControls);
    this.video.addEventListener('pause', this.showControls);
    this.video.addEventListener('play', this.resetMouseActivityTimeout);
    this.videoWrapper.addEventListener('mouseenter', this.showControls);
    this.videoWrapper.addEventListener('mouseleave', this.hideControls);
    this.controls.addEventListener('mousemove', this.showControls);
    this.controls.addEventListener('mouseenter', this.showControls);
    this.controls.addEventListener(
        'mouseleave',
        this.resetMouseActivityTimeout,
    );
    this.videoWrapper.addEventListener('touchstart', this.showControls);
    this.videoWrapper.addEventListener('touchend', () => {
        setTimeout(this.hideControls, 5000);
    });
    this.resetMouseActivityTimeout();

    this.settingsBtn.addEventListener('click', this.toggleSettingsMenuFunc);

    this.videoWrapper.addEventListener('dblclick', this.handleDoubleClick);
    this.videoWrapper.addEventListener('mousedown', this.handleMouseDown);
    this.videoWrapper.addEventListener('touchstart', this.handleMouseDown);
    this.videoWrapper.addEventListener('mouseup', this.handleMouseUp);
    this.videoWrapper.addEventListener('touchend', this.handleMouseUp);
    this.videoWrapper.addEventListener('mouseleave', this.handleMouseUp);

    this.settingsMenu.addEventListener('keydown', (e) => {
        const focusableItems = Array.from(
            this.settingsMenu.querySelectorAll(
                '.sigma__dropdown-item, .sigma__menu-item',
            ),
        ).filter((item) => item.getAttribute('tabindex') === '0');
        if (focusableItems.length === 0) return;
        const currentIndex = focusableItems.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % focusableItems.length;
            focusableItems[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const nextIndex =
                (currentIndex - 1 + focusableItems.length) %
                focusableItems.length;
            focusableItems[nextIndex].focus();
        } else if (e.key === 'Escape') {
            this.settingsMenu.parentElement.classList.remove(this.SHOW_CLASS);
            this.updateTabIndices();
            this.settingsBtn.focus();
        }
    });
};

// Остальные методы плеера остаются без изменений
// …

//////////////////////////////
// UI: Создание dropdown для выбора сезона/серии
//////////////////////////////
function createSeasonEpisodeDropdown(wrapper, playerInstance) {
    // Если уже создан, выходим
    if (wrapper.querySelector('.sigma__season-episode-dropdown')) return;
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'sigma__season-episode-dropdown';

    // Создаём select для выбора сезона
    const seasonSelect = document.createElement('select');
    seasonSelect.id = 'sigma__season-select';

    // Создаём select для выбора серии
    const episodeSelect = document.createElement('select');
    episodeSelect.id = 'sigma__episode-select';

    dropdownContainer.appendChild(seasonSelect);
    dropdownContainer.appendChild(episodeSelect);
    wrapper.appendChild(dropdownContainer);

    // Заполняем select сезонов из playerInstance.options.sources.seasons
    const seasons = playerInstance.options.sources.seasons;
    for (let season in seasons) {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = 'Сезон ' + season;
        seasonSelect.appendChild(option);
    }
    // Устанавливаем первый сезон по умолчанию
    seasonSelect.value = Object.keys(seasons)[0];

    // Функция для заполнения списка серий на основе выбранного сезона
    function populateEpisodes() {
        episodeSelect.innerHTML = '';
        const selectedSeason = seasonSelect.value;
        const episodes = seasons[selectedSeason].episodes;
        for (let episode in episodes) {
            const option = document.createElement('option');
            option.value = episode;
            option.textContent = 'Серия ' + episode;
            episodeSelect.appendChild(option);
        }
        // Выбираем первую серию по умолчанию
        episodeSelect.value = Object.keys(episodes)[0];
        // Устанавливаем источники для выбранной серии
        playerInstance.selectSeasonEpisode(
            seasonSelect.value,
            episodeSelect.value,
        );
    }
    seasonSelect.addEventListener('change', populateEpisodes);
    episodeSelect.addEventListener('change', () => {
        playerInstance.selectSeasonEpisode(
            seasonSelect.value,
            episodeSelect.value,
        );
    });
    // Первоначальное заполнение серий
    populateEpisodes();
}

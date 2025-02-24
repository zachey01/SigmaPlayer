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

        this.videoWrapper = wrapper;
        this.options = options;
        this.videoType = options.videoType || null;
        this.videoSources = {};
        this.selectedTranslation = null;
        this.selectedQuality = null;
        this.autoQuality = false;

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
        if (this.playEnabled) {
            this.enablePlayButton();
        } else {
            this.disablePlayButton();
        }
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

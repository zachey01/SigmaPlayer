SigmaPlayer.prototype.handleDoubleClick = function (event) {
    if (event.target.closest('#sigma__controls-wrapper')) return;
    const rect = this.videoWrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < rect.width / 2) {
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
    } else {
        this.video.currentTime = Math.min(
            this.video.duration,
            this.video.currentTime + 10,
        );
    }
};

SigmaPlayer.prototype.handleMouseDown = function (event) {
    if (event.target.closest('#sigma__controls-wrapper')) return;
    this.longPressTimeout = setTimeout(() => {
        this.video.playbackRate = 2;
        this.longPressActivated = true;
    }, 3000);
};

SigmaPlayer.prototype.handleMouseUp = function (event) {
    clearTimeout(this.longPressTimeout);
    if (this.longPressActivated) {
        this.video.playbackRate = 1;
        this.longPressActivated = false;
    }
};

SigmaPlayer.prototype.initialize = function () {
    this.video.addEventListener('play', () => {
        this.playBtn.classList.add(this.IS_PLAYING_CLASS);
        this.hideSpinner();
    });

    this.video.addEventListener('pause', () => {
        this.playBtn.classList.remove(this.IS_PLAYING_CLASS);
        this.hideSpinner();
    });

    this.video.addEventListener('ended', () => {
        this.playBtn.classList.remove(this.IS_PLAYING_CLASS);
        this.showControls();
        this.hideSpinner();
    });

    this.video.addEventListener('waiting', this.showSpinner);
    this.video.addEventListener('playing', this.hideSpinner);
    this.video.addEventListener('pause', this.showCentralPlay);
    this.video.addEventListener('play', this.hideCentralPlay);
    this.video.addEventListener('ended', this.showCentralPlay);

    this.disablePlayButton();

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

    this.playBtn.addEventListener('click', () => {
        if (this.playEnabled) {
            this.togglePlayState();
        } else {
            alert(
                'Пожалуйста, выберите озвучку и качество перед воспроизведением.',
            );
        }
    });

    this.centralPlayBtn.addEventListener('click', () => {
        if (this.playEnabled) {
            this.togglePlayState();
        }
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
            this.settingsMenu.querySelectorAll('.sigma__dropdown-item'),
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

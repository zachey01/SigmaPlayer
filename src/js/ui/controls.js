SigmaPlayer.prototype.showControls = function () {
    this.controls.classList.remove(this.HIDE_CONTROLS_CLASS);
    this.resetMouseActivityTimeout();
};

SigmaPlayer.prototype.hideControls = function () {
    if (this.isMenuOpen()) return;
    if (!this.video.paused && !this.video.ended) {
        this.controls.classList.add(this.HIDE_CONTROLS_CLASS);
    }
};

SigmaPlayer.prototype.resetMouseActivityTimeout = function () {
    clearTimeout(this.mouseActivityTimeout);
    if (!this.video.paused && !this.video.ended) {
        const timeoutDuration = 'ontouchstart' in window ? 5000 : 3000;
        this.mouseActivityTimeout = setTimeout(() => {
            this.hideControls();
        }, timeoutDuration);
    }
};

function createControlsUI(wrapper, playerInstance) {
    if (wrapper.querySelector('#sigma__controls')) return;

    // --- Создаём загрузчик (spinner) ---
    const spinner = document.createElement('div');
    spinner.id = 'sigma__loading-spinner';
    spinner.className = 'sigma__spinner';
    wrapper.appendChild(spinner);
    playerInstance.loadingSpinner = spinner;

    // --- Центральная кнопка воспроизведения ---
    const centralPlay = document.createElement('button');
    centralPlay.id = 'sigma__central-play';
    centralPlay.className = 'sigma__central-play-button';
    centralPlay.setAttribute('tabindex', '0');
    const centralPlayIcon = getIcon('sigma-play-btn');
    centralPlayIcon.classList.add('sigma__centralPlayIcon');
    centralPlay.appendChild(centralPlayIcon);
    wrapper.appendChild(centralPlay);

    // --- Контейнер управления ---
    const controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'sigma__controls-wrapper';
    controlsWrapper.className = 'sigma__control-wrapper';

    const controlsInner = document.createElement('div');
    controlsInner.className = 'sigma__controls sigma__controlsInner';

    // Кнопка Play/Pause
    const playPauseBtn = document.createElement('button');
    playPauseBtn.id = 'sigma__play-pause';
    playPauseBtn.setAttribute('tabindex', '0');
    const playIcon = getIcon('sigma-play');
    playIcon.classList.add('sigma__playIcon');
    const pauseIcon = getIcon('sigma-pause');
    pauseIcon.classList.add('sigma__pauseIcon');
    playPauseBtn.appendChild(playIcon);
    playPauseBtn.appendChild(pauseIcon);
    controlsInner.appendChild(playPauseBtn);

    // Таймлайн и отображение времени
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'sigma__timeline-container';
    timelineContainer.setAttribute('tabindex', '0');
    const timeline = document.createElement('div');
    timeline.id = 'sigma__timeline';
    timeline.className = 'sigma__timeline-spacer';
    const fullTimeline = document.createElement('div');
    fullTimeline.className = 'sigma__full-timeline';
    const bufferedDiv = document.createElement('div');
    bufferedDiv.className = 'sigma__buffered';
    const progressDiv = document.createElement('div');
    progressDiv.id = 'sigma__progress';
    fullTimeline.appendChild(bufferedDiv);
    fullTimeline.appendChild(progressDiv);
    timeline.appendChild(fullTimeline);
    const seekTooltip = document.createElement('div');
    seekTooltip.id = 'sigma__seek-tooltip';
    seekTooltip.className = 'sigma__seek-tooltip';
    seekTooltip.textContent = '0:00:00';
    timeline.appendChild(seekTooltip);
    timelineContainer.appendChild(timeline);
    const currentTimeSpan = document.createElement('span');
    currentTimeSpan.id = 'sigma__current-time';
    currentTimeSpan.textContent = '0:00:00';
    const durationSpan = document.createElement('span');
    durationSpan.id = 'sigma__duration';
    durationSpan.textContent = '0:00:00';
    timelineContainer.appendChild(currentTimeSpan);
    timelineContainer.appendChild(document.createTextNode(' / '));
    timelineContainer.appendChild(durationSpan);
    controlsInner.appendChild(timelineContainer);

    // --- Контейнер громкости ---
    const volumeContainer = document.createElement('div');
    volumeContainer.className = 'sigma__volume-container';
    const muteBtn = document.createElement('button');
    muteBtn.id = 'sigma__mute';
    muteBtn.className = 'sigma__isMute';
    muteBtn.setAttribute('tabindex', '0');
    const volumeIcon = getIcon('sigma-volume-2');
    volumeIcon.classList.add('sigma__volumeIcon');
    const muteIcon = getIcon('sigma-volume-0');
    muteIcon.classList.add('sigma__muteIcon');
    muteBtn.appendChild(volumeIcon);
    muteBtn.appendChild(muteIcon);
    volumeContainer.appendChild(muteBtn);
    const volumeMenu = document.createElement('div');
    volumeMenu.id = 'volume-menu';
    volumeMenu.className = 'sigma__volume-dropdown';
    const volumeSlider = document.createElement('input');
    volumeSlider.id = 'sigma__volume-slider';
    volumeSlider.type = 'range';
    volumeSlider.style.writingMode = 'vertical-lr';
    volumeSlider.style.direction = 'rtl';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.01';
    volumeSlider.value = '1';
    volumeSlider.setAttribute('tabindex', '-1');
    volumeMenu.appendChild(volumeSlider);
    volumeContainer.appendChild(volumeMenu);
    controlsInner.appendChild(volumeContainer);

    // --- Кнопка субтитров ---
    const subtitlesBtn = document.createElement('button');
    subtitlesBtn.id = 'sigma__subtitles';
    subtitlesBtn.setAttribute('tabindex', '0');
    const captionsOffIcon = getIcon('sigma-captions-off');
    captionsOffIcon.classList.add('sigma__captionsOffIcon');
    const captionsOnIcon = getIcon('sigma-captions');
    captionsOnIcon.classList.add('sigma__captionsOnIcon');
    // Изначально показываем значок отключённых субтитров
    captionsOffIcon.style.display = 'block';
    captionsOnIcon.style.display = 'none';
    subtitlesBtn.appendChild(captionsOffIcon);
    subtitlesBtn.appendChild(captionsOnIcon);
    controlsInner.appendChild(subtitlesBtn);

    // --- Настройки (dropdown) ---
    const dropdown = document.createElement('div');
    dropdown.className = 'sigma__dropdown';
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'sigma__settings-btn';
    settingsBtn.setAttribute('tabindex', '0');
    const settingsIcon = getIcon('sigma-settings');
    settingsIcon.classList.add('sigma__settingsIcon');
    settingsBtn.appendChild(settingsIcon);
    dropdown.appendChild(settingsBtn);

    const settingsMenu = document.createElement('div');
    settingsMenu.id = 'sigma__settings-menu';
    settingsMenu.className = 'sigma__dropdown-content';
    // Главный раздел меню с новыми классами для элементов
    const settingsMain = document.createElement('div');
    settingsMain.className = 'sigma__settings-main';

    // Создание пункта "Скорость" с иконкой справа
    const speedItem = document.createElement('div');
    speedItem.className = 'sigma__menu-item';
    speedItem.dataset.menu = 'speed';
    speedItem.textContent = 'Скорость';
    const arrow1 = getIcon('sigma-chevron-right');
    arrow1.classList.add('sigma__menu-arrow');
    speedItem.appendChild(arrow1);
    settingsMain.appendChild(speedItem);

    // Создание пункта "Озвучка" с иконкой справа
    const translationItem = document.createElement('div');
    translationItem.className = 'sigma__menu-item';
    translationItem.dataset.menu = 'translation';
    translationItem.textContent = 'Озвучка';
    const arrow2 = getIcon('sigma-chevron-right');
    arrow2.classList.add('sigma__menu-arrow');
    translationItem.appendChild(arrow2);
    settingsMain.appendChild(translationItem);

    // Создание пункта "Качество" с иконкой справа
    const qualityItem = document.createElement('div');
    qualityItem.className = 'sigma__menu-item';
    qualityItem.dataset.menu = 'quality';
    qualityItem.textContent = 'Качество';
    const arrow3 = getIcon('sigma-chevron-right');
    arrow3.classList.add('sigma__menu-arrow');
    qualityItem.appendChild(arrow3);
    settingsMain.appendChild(qualityItem);

    // Создание пункта "Субтитры" с иконкой справа
    const subtitlesItem = document.createElement('div');
    subtitlesItem.className = 'sigma__menu-item';
    subtitlesItem.dataset.menu = 'subtitles';
    subtitlesItem.textContent = 'Субтитры';
    const arrowSub = getIcon('sigma-chevron-right');
    arrowSub.classList.add('sigma__menu-arrow');
    subtitlesItem.appendChild(arrowSub);
    settingsMain.appendChild(subtitlesItem);

    // Подменю
    const settingsSubmenu = document.createElement('div');
    settingsSubmenu.className = 'sigma__settings-submenu';
    settingsSubmenu.style.display = 'none';
    settingsMenu.appendChild(settingsMain);
    settingsMenu.appendChild(settingsSubmenu);
    dropdown.appendChild(settingsMenu);
    controlsInner.appendChild(dropdown);

    // При клике – навигация в подменю
    speedItem.addEventListener('click', () => {
        playerInstance.showSubmenu('speed');
    });
    translationItem.addEventListener('click', () => {
        playerInstance.showSubmenu('translation');
    });
    qualityItem.addEventListener('click', () => {
        playerInstance.showSubmenu('quality');
    });
    subtitlesItem.addEventListener('click', () => {
        playerInstance.showSubmenu('subtitles');
    });

    // --- Полноэкранный режим ---
    const fullScreenBtn = document.createElement('button');
    fullScreenBtn.id = 'sigma__full-screen';
    fullScreenBtn.setAttribute('tabindex', '0');
    const fullscreenIcon = getIcon('sigma-maximize');
    fullscreenIcon.classList.add('sigma__fullscreenIcon');
    const minimiseIcon = getIcon('sigma-minimize');
    minimiseIcon.classList.add('sigma__minimiseIcon');
    fullScreenBtn.appendChild(fullscreenIcon);
    fullScreenBtn.appendChild(minimiseIcon);
    controlsInner.appendChild(fullScreenBtn);

    controlsWrapper.appendChild(controlsInner);
    wrapper.appendChild(controlsWrapper);

    // Сохраняем ссылки в объекте playerInstance
    playerInstance.centralPlayBtn = wrapper.querySelector(
        '#sigma__central-play',
    );
    playerInstance.seekTooltip = wrapper.querySelector('#sigma__seek-tooltip');
    playerInstance.videoWrapper = wrapper;
    playerInstance.controls = wrapper.querySelector('#sigma__controls-wrapper');
    playerInstance.playBtn = wrapper.querySelector('#sigma__play-pause');
    playerInstance.volumeBtn = wrapper.querySelector('#sigma__mute');
    playerInstance.fullScreenBtn = fullScreenBtn;
    playerInstance.timeline = wrapper.querySelector('#sigma__timeline');
    playerInstance.progress = wrapper.querySelector('#sigma__progress');
    playerInstance.currentTimeElem = wrapper.querySelector(
        '#sigma__current-time',
    );
    playerInstance.durationElem = wrapper.querySelector('#sigma__duration');
    playerInstance.volumeContainer = volumeContainer;
    playerInstance.volumeMenu = volumeMenu;
    playerInstance.volumeSlider = volumeSlider;
    playerInstance.settingsBtn = settingsBtn;
    playerInstance.settingsMenu = settingsMenu;
    playerInstance.settingsMain = settingsMain;
    playerInstance.settingsSubmenu = settingsSubmenu;
    playerInstance.subtitlesBtn = subtitlesBtn;
}

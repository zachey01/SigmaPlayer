SigmaPlayer.prototype.toggleSubtitles = function () {
    if (!this.captionTrack) {
        // Если субтитров ещё нет – пытаемся выбрать первый, если он есть
        if (
            this.options.captions &&
            Array.isArray(this.options.captions) &&
            this.options.captions.length > 0
        ) {
            this.selectSubtitle(0);
            this.subtitlesEnabled = true;
        } else {
            console.warn('Нет субтитров');
        }
    } else {
        if (this.subtitlesEnabled) {
            this.captionTrack.mode = 'disabled';
            this.subtitlesEnabled = false;
            if (this.subtitlesBtn) {
                const offIcon = this.subtitlesBtn.querySelector(
                    '.sigma__captionsOffIcon',
                );
                const onIcon = this.subtitlesBtn.querySelector(
                    '.sigma__captionsOnIcon',
                );
                offIcon.style.display = 'block';
                onIcon.style.display = 'none';
            }
        } else {
            this.captionTrack.mode = 'showing';
            this.subtitlesEnabled = true;
            if (this.subtitlesBtn) {
                const offIcon = this.subtitlesBtn.querySelector(
                    '.sigma__captionsOffIcon',
                );
                const onIcon = this.subtitlesBtn.querySelector(
                    '.sigma__captionsOnIcon',
                );
                offIcon.style.display = 'none';
                onIcon.style.display = 'block';
            }
        }
    }
};

SigmaPlayer.prototype.selectSubtitle = function (captionIndex) {
    if (this.captionTrackElement) {
        this.video.removeChild(this.captionTrackElement);
        this.captionTrackElement = null;
        this.captionTrack = null;
    }
    if (captionIndex === null) {
        this.subtitlesEnabled = false;
        if (this.subtitlesBtn) {
            const offIcon = this.subtitlesBtn.querySelector(
                '.sigma__captionsOffIcon',
            );
            const onIcon = this.subtitlesBtn.querySelector(
                '.sigma__captionsOnIcon',
            );
            offIcon.style.display = 'block';
            onIcon.style.display = 'none';
        }
        return;
    }
    const caption = this.options.captions[captionIndex];
    if (!caption || !caption.url) {
        console.warn('Неверные данные субтитров');
        return;
    }
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = caption.name;
    track.src = caption.url;
    track.default = true;
    track.mode = 'showing';
    this.video.appendChild(track);
    this.captionTrackElement = track;
    setTimeout(() => {
        for (let i = 0; i < this.video.textTracks.length; i++) {
            if (this.video.textTracks[i].label === caption.name) {
                this.captionTrack = this.video.textTracks[i];
                this.captionTrack.mode = 'showing';
                break;
            }
        }
    }, 500);
    this.subtitlesEnabled = true;
    if (this.subtitlesBtn) {
        const offIcon = this.subtitlesBtn.querySelector(
            '.sigma__captionsOffIcon',
        );
        const onIcon = this.subtitlesBtn.querySelector(
            '.sigma__captionsOnIcon',
        );
        offIcon.style.display = 'none';
        onIcon.style.display = 'block';
    }
};

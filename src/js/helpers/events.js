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

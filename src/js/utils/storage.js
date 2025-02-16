function getStoredQuality() {
    return localStorage.getItem('sigma-preferredQuality');
}

function storeQuality(quality) {
    localStorage.setItem('sigma-preferredQuality', quality);
}

function getStoredSpeed() {
    const speed = localStorage.getItem('sigma-playbackSpeed');
    return speed ? parseFloat(speed) : 1.0;
}

function storeSpeed(speed) {
    localStorage.setItem('sigma-playbackSpeed', speed);
}

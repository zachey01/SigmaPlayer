function getNetworkSpeed() {
    if (navigator.connection && navigator.connection.downlink) {
        return navigator.connection.downlink;
    }
    return 5;
}

function chooseQualityBasedOnSpeed() {
    const speed = getNetworkSpeed();
    if (speed >= 20) {
        return '8K';
    } else if (speed >= 10) {
        return '4K';
    } else if (speed >= 5) {
        return '1080';
    } else if (speed >= 2.5) {
        return '720';
    } else if (speed >= 1) {
        return '480';
    } else {
        return '360';
    }
}

function getqualityBadge(resolution) {
    const resValue = parseInt(resolution);

    if (resValue <= 480) {
        return 'SD';
    } else if (resValue <= 720) {
        return 'HD';
    } else if (resValue <= 1080) {
        return 'Full HD';
    } else if (resValue <= 1440) {
        return '2K';
    } else if (resValue <= 2160) {
        return '4K';
    } else {
        return '8K';
    }
}

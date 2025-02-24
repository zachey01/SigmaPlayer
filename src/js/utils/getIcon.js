async function loadIcons() {
    const url = 'https://www.unpkg.com/sigmaplayer/dist/sigma.svg';
    const cacheKey = 'sigma-icons-cache';

    const cachedSVG = localStorage.getItem(cacheKey);
    if (cachedSVG) {
        addSVGToHead(cachedSVG);
    } else {
        try {
            const response = await fetch(url);
            const svgContent = await response.text();
            localStorage.setItem(cacheKey, svgContent);
            addSVGToHead(svgContent);
        } catch (error) {
            console.error('Ошибка при загрузке SVG:', error);
        }
    }
}

function addSVGToHead(svgContent) {
    const svgContainer = document.createElement('div');
    svgContainer.innerHTML = svgContent;
    const svg = svgContainer.querySelector('svg');
    document.head.appendChild(svg);
}

function getIcon(iconId) {
    const svgElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
    );
    svgElement.setAttribute('class', 'sigma__icon');
    svgElement.setAttribute('width', '24');
    svgElement.setAttribute('height', '24');
    svgElement.setAttribute('viewBox', '0 0 24 24');

    const useElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'use',
    );
    useElement.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        `#${iconId}`,
    );

    svgElement.appendChild(useElement);

    return svgElement;
}

window.addEventListener('load', loadIcons);

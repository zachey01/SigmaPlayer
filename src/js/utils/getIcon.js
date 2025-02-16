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

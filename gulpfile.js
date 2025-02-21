import gulp from 'gulp';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import svgSprite from 'gulp-svg-sprite';
import babel from 'gulp-babel';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const paths = {
    js: 'src/js/**/*.js',
    css: 'src/css/**/*.css',
    icons: 'src/sprites/*.svg',
    build: 'build',
    dist: 'dist',
};

function buildJS(env) {
    const outputDir = env === 'dev' ? paths.build : paths.dist;

    return gulp
        .src(paths.js)
        .pipe(concat('sigma-player.min.js'))
        .pipe(
            babel({
                presets: ['@babel/env'],
            }),
        )
        .pipe(terser())
        .pipe(gulp.dest(outputDir));
}

function buildCSS(env) {
    const outputDir = env === 'dev' ? paths.build : paths.dist;

    return gulp
        .src(paths.css)
        .pipe(concat('sigma-player.min.css'))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(cleanCSS())
        .pipe(gulp.dest(outputDir));
}

function buildSVGSprite(env) {
    const outputDir = env === 'dev' ? paths.build : paths.dist;

    return gulp
        .src(paths.icons)
        .pipe(
            svgSprite({
                mode: {
                    symbol: {
                        sprite: 'sigma.svg',
                    },
                },
            }),
        )
        .pipe(gulp.dest(outputDir));
}

function watchFiles() {
    gulp.watch(paths.js, () => buildJS('dev'));
    gulp.watch(paths.css, () => buildCSS('dev'));
    gulp.watch(paths.icons, () => buildSVGSprite('dev'));
}

// Production tasks
const buildProd = gulp.series(
    () => buildJS('prod'),
    () => buildCSS('prod'),
    () => buildSVGSprite('prod'),
);

// Development tasks
const dev = gulp.series(
    () => buildJS('dev'),
    () => buildCSS('dev'),
    () => buildSVGSprite('dev'),
    watchFiles,
);

// Export the tasks
export default buildProd;
export { dev };

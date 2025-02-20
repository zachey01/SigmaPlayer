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
    dest: 'dist',
};

function buildJS() {
    return gulp
        .src(paths.js)
        .pipe(concat('sigma-player.min.js'))
        .pipe(
            babel({
                presets: ['@babel/env'],
            }),
        )
        .pipe(terser())
        .pipe(gulp.dest(paths.dest));
}

function buildCSS() {
    return gulp
        .src(paths.css)
        .pipe(concat('sigma-player.min.css'))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(cleanCSS())
        .pipe(gulp.dest(paths.dest));
}

function buildSVGSprite() {
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
        .pipe(gulp.dest(paths.dest));
}

function watchFiles() {
    gulp.watch(paths.js, buildJS);
    gulp.watch(paths.css, buildCSS);
    gulp.watch(paths.icons, buildSVGSprite);
}

export default gulp.series(buildJS, buildCSS, buildSVGSprite);

// Export the watch task to use in dev mode
export const dev = gulp.series(buildJS, buildCSS, buildSVGSprite, watchFiles);

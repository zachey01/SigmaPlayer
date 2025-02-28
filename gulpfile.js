import gulp from 'gulp';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import svgSprite from 'gulp-svg-sprite';
import babel from 'gulp-babel';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import sourcemaps from 'gulp-sourcemaps';
import { deleteAsync as del } from 'del';
import rename from 'gulp-rename';

const paths = {
    js: 'src/js/**/*.js',
    css: 'src/css/**/*.css',
    icons: 'src/sprites/*.svg',
    dest: 'dist',
};

function buildJS() {
    return gulp
        .src(paths.js)
        .pipe(sourcemaps.init())
        .pipe(concat('sigma-player.min.js'))
        .pipe(babel({ presets: ['@babel/env'] }))
        .pipe(terser())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dest));
}

// Задача для обычного (не сжатого) CSS
function buildCSS() {
    return gulp
        .src(paths.css)
        .pipe(sourcemaps.init())
        .pipe(postcss([autoprefixer()])) // только автопрефиксер, без сжатия
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dest));
}

// Задача для сжатого (min) CSS
function buildCSSMin() {
    return gulp
        .src(paths.css)
        .pipe(sourcemaps.init())
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('.'))
        .pipe(rename({ suffix: '.min' })) // Добавление .min в имя файла
        .pipe(gulp.dest(paths.dest));
}

// Асинхронная задача для сборки SVG-спрайта с копированием и удалением временной папки
async function buildSVGSprite() {
    // Создаем спрайт в папке dist/symbol
    await new Promise((resolve, reject) => {
        gulp.src(paths.icons)
            .pipe(
                svgSprite({
                    mode: {
                        symbol: {
                            sprite: 'sigma.svg',
                        },
                    },
                }),
            )
            .pipe(gulp.dest(paths.dest))
            .on('end', resolve)
            .on('error', reject);
    });

    // Копируем sigma.svg из папки symbol в корень dist
    await new Promise((resolve, reject) => {
        gulp.src('dist/symbol/sigma.svg', { allowEmpty: true })
            .pipe(gulp.dest(paths.dest))
            .on('end', resolve)
            .on('error', reject);
    });

    // Удаляем временную папку symbol
    await del('dist/symbol');
}

function watchFiles() {
    gulp.watch(paths.js, buildJS);
    gulp.watch(paths.css, gulp.series(buildCSS, buildCSSMin));
    gulp.watch(paths.icons, buildSVGSprite);
}

// Задача для разработки: сборка и наблюдение за изменениями
export const dev = gulp.series(
    gulp.parallel(buildJS, gulp.series(buildCSS, buildCSSMin), buildSVGSprite),
    watchFiles,
);

// Задача по умолчанию: сборка всех ресурсов
export default gulp.series(
    gulp.parallel(buildJS, gulp.series(buildCSS, buildCSSMin), buildSVGSprite),
);

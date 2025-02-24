import gulp from 'gulp';
import concat from 'gulp-concat';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import svgSprite from 'gulp-svg-sprite';
import babel from 'gulp-babel';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import sourcemaps from 'gulp-sourcemaps'; // Import gulp-sourcemaps
import del from 'del'; // Import del for deleting files and folders

const paths = {
    js: 'src/js/**/*.js',
    css: 'src/css/**/*.css',
    icons: 'src/sprites/*.svg',
    dest: 'dist',
};

function buildJS() {
    return gulp
        .src(paths.js)
        .pipe(sourcemaps.init()) // Initialize source maps for JS
        .pipe(concat('sigma-player.min.js'))
        .pipe(
            babel({
                presets: ['@babel/env'],
            }),
        )
        .pipe(terser())
        .pipe(sourcemaps.write('.')) // Write source maps to the current directory
        .pipe(gulp.dest(paths.dest));
}

function buildCSS() {
    return gulp
        .src(paths.css)
        .pipe(sourcemaps.init()) // Initialize source maps for CSS
        .pipe(concat('sigma-player.min.css'))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('.')) // Write source maps to the current directory
        .pipe(gulp.dest(paths.dest));
}

function buildSVGSprite() {
    return gulp
        .src(paths.icons)
        .pipe(
            svgSprite({
                mode: {
                    symbol: {
                        sprite: 'symbol/sigma.svg', // Ensure it's stored in the 'symbol' folder
                    },
                },
            }),
        )
        .pipe(gulp.dest(paths.dest)) // Output the sprite to 'dist/symbol/'
        .on('end', function () {
            // After the sprite task finishes, copy the sigma.svg to the root of 'dist/'
            gulp.src('dist/symbol/sigma.svg')
                .pipe(gulp.dest(paths.dest)) // Copy it to the 'dist/' folder
                .on('end', function () {
                    // Now delete the 'symbol' folder
                    del('dist/symbol'); // Delete the symbol folder
                });
        });
}

function watchFiles() {
    gulp.watch(paths.js, buildJS);
    gulp.watch(paths.css, buildCSS);
    gulp.watch(paths.icons, buildSVGSprite);
}

export default gulp.series(buildJS, buildCSS, buildSVGSprite);

// Export the watch task to use in dev mode
export const dev = gulp.series(buildJS, buildCSS, buildSVGSprite, watchFiles);

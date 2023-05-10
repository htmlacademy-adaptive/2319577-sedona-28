import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import del from 'del';
import gulp from 'gulp';
import htmlmin from 'gulp-htmlmin';
import less from 'gulp-less';
import squoosh from 'gulp-libsquoosh';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import svgo from 'gulp-svgmin';
import svgstoe from 'gulp-svgstore';
import terser from 'gulp-terser';
import csso from 'postcss-csso';

// Styles

export const styles = () => { //name
  return gulp.src('source/less/style.less', { sourcemaps: true }) //1 находит style.less
    .pipe(plumber()) //2 обработка ошибок
    .pipe(less()) //style.less -> style.css
    .pipe(postcss([ //style.css
      autoprefixer(), //префикс для кроссбраузерности style.css
      csso() //минифицируемый файл style.css
    ]))
    .pipe(rename('style.min.css')) //переименовывает style.css в style.min.css
    .pipe(gulp.dest('build/css', { sourcemaps: '.' })) //3 перекладывание файла в нужную папку
    .pipe(browser.stream());
}

// HTML

export const html = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true })) //запуск минификатора html
    .pipe(gulp.dest('build')); //переместить в папку source минифицированные файлы
}

// Scripts
// Images
// WebP
// SVG
// Copy
// Clean
// Build


// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Watcher

const watcher = () => {
  gulp.watch('source/less/**/*.less', gulp.series(styles));
  gulp.watch('source/*.html').on('change', browser.reload);
}

// Default

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svg,
    sprite,
    createWebp
  ),
  gulp.series(
    server,
    watcher
  )
);

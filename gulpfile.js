import gulp from 'gulp';
import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import htmlmin from 'gulp-htmlmin';
import less from 'gulp-less';
import squoosh from 'gulp-libsquoosh';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import svgo from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
import terser from 'gulp-terser';
import csso from 'postcss-csso';
import del from 'del';

// npm i -D НАЗВАНИЕ@ВЕРСИЯ   -установка
// npm uninstall -D НАЗВАНИЕ  -удаление

// 1. Clean (очистка папки build перед запуском сборки)

const clean = () => {
  return del('build'); //запуск утилиты del для очистки выбранной папки
};

// 2. Copy (копирование шрифтов, иконок и манифеста)

const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}', //копирование шрифтов
    'source/*.ico', //копирование иконок
    'source/manifest.webmanifest' //копирование манифеста
  ], {
    base: 'source' //базируется в папке source
  })
    .pipe(gulp.dest('build')) //переместить все в папку build
  done();
}

// 3. Оптимизация и копирование Images

const optimizeImages = () => { //оптимизация картинок
  return gulp.src('source/img/**/*.{jpg,png}') //выбирает нужные файлы
    .pipe(squoosh()) //запуск утилиты оптимизации картинок squoosh
    .pipe(gulp.dest('build/img')) //переместить в папку build/img оптимизированные картинки
}

const copyImages = () => { //копирование оптимизированных картинок
  return gulp.src('source/img/**/*.{jpg,png,svg}') //выбирает нужные файлы
    .pipe(gulp.dest('build/img')) //переместить в папку build/img оптимизированные картинки
}

// Оптимизация SVG

const svg = () =>
  gulp.src(['source/img/**/*.svg', '!source/img/icons/*.svg']) //в первой папке ищешь, а во второй нет
    .pipe(svgo()) //запуск оптимизатора svg
    .pipe(gulp.dest('build/img')); //переместить в папку build/img иконки

export const sprite = () => { //делаем спрайты из svg
  return gulp.src('source/img/icons/*.svg') //берем все иконки в папке source/img/icons
    .pipe(svgo()) //запуск оптимизатора svg
    .pipe(svgstore({
      inlineSvg: true //использование инлайново
    }))
    .pipe(rename('sprite.svg')) //переименовывает файлы в один файл sprite.svg
    .pipe(gulp.dest('build/img'));  //переместить в папку build/img спрайты
}

// Создание WebP

const createWebp = () => {
  return gulp.src('source/img/**/*.{jpg,png}') //выбирает нужные файлы
    .pipe(squoosh({
      webp: {} //конвертирование выбраных форматов в WebP
    }))
    .pipe(gulp.dest('build/img')) //переместить в папку build/img картинки формата WebP
}

// Минификация Styles

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

// Минификация HTML

const html = () => {
  return gulp.src('source/*.html') //выбирает нужные файлы
    .pipe(htmlmin({ collapseWhitespace: true })) //запуск минификатора html
    .pipe(gulp.dest('build')); //переместить в папку build минифицированные файлы
}

// Копирование Scripts

const scripts = () => {
  return gulp.src('source/js/*.js') //выбирает нужные файлы
    .pipe(terser()) //запуск утилиты terser
    .pipe(gulp.dest('build/js')); //переместить в папку build/js js-файлы
}

// Server (запуск сервера)

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build' //запуск сервера из папки build
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Watcher (следит за указанными файлами)

const watcher = () => {
  gulp.watch('source/less/**/*.less', gulp.series(styles)); //найди все файлы .less и запусти задачу styles
  gulp.watch('source/js/script.js', gulp.series(scripts)); //найди все файлы .js и запусти задачу scripts
  gulp.watch('source/*.html', gulp.series(html, reload)); //найди все файлы .html и перезапусти страницу
}

// Reload (перезагрузка сервера)

const reload = (done) => {
  browser.reload(); //перезагрузка страницы
  done();
}

// Build (сздание сборки)

export const build = gulp.series( //1. Запуск последовательных задач
  clean, //полная очистка папки build
  copy, //копирование файлов, которые не надо оптимизировать
  optimizeImages, //оптимизация картинок
  svg, //оптимизация и копирование svg
  gulp.parallel( //2. Запуск параллельных задач
    styles, //минификация и копирование стилей
    html, //минификация и копирование html
    scripts, //минификация и копирование js
    sprite, //оптимизация svg и создание спрайтов в папке build
    createWebp //преобразование картинок в webp
  ),
);

// Default (создание версии для разработки)

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    svg,
    createWebp
  ),
  gulp.series(
    sprite,
    server,
    watcher
  )
);

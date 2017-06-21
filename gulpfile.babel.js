'use strict';

import babelify from 'babelify';
import browserify from 'browserify';
import path from 'path';
import gulp from 'gulp';
import del from 'del';
import marked from 'marked';
import runSequence from 'run-sequence';
import browserSync from 'browser-sync';
import swPrecache from 'sw-precache';
import gulpLoadPlugins from 'gulp-load-plugins';
import {output as pagespeed} from 'psi';
import buffer from 'vinyl-buffer';
import sourcestream from 'vinyl-source-stream';
import pkg from './package.json';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const fs = require('fs');

marked.setOptions({
  pedantic: true,
  smartypants: true
});

// Directory variables
const dist = 'dist';
const src = 'app';

// Lint JavaScript
gulp.task('lint', () =>
  gulp.src([
    `${src}/scripts/**/*.js`,
    'gulpfile.babel.js',
    '!node_modules/**'
  ]).pipe($.eslint())
  .pipe($.eslint.format())
);

// Optimize images
gulp.task('images', () =>
  gulp.src([`${src}/images/**/*`, `!{src}/images/_*`])
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(`${dist}/images`))
    .pipe($.size({title: 'images'}))
);

// SVG Sprite
gulp.task('svg-sprites', () => {
  return gulp.src(`${src}/images/_svg-sprite/**/*.svg`)
  .pipe($.svgmin())
  .pipe($.svgstore({inlineSvg: true}))
  .pipe($.rename('svg-sprites.svg'))
  .pipe(gulp.dest(`${src}/_includes`));
});

// Sequentially generates sprites then reruns html task.
gulp.task('embed-sprites', cb =>
    runSequence('svg-sprites', ['html', 'markdown'], cb));

// Copy all files at the root level (app), except pug templates or any items
// prefixed with an underscore.
gulp.task('copy', () =>
  gulp.src([
    `${src}/**/*`,
    `!${src}/_*`,
    `!${src}/images`,
    `!${src}/scripts`,
    `!${src}/styles`,
    `!${src}/**/*.pug`,
    `!${src}/**/*.md`
    // Uncomment the next line if you need a basic htaccess file.
    // `node_modules/apache-server-configs/dist/.htaccess`
  ], {
    dot: true
  }).pipe(gulp.dest(dist))
    .pipe($.size({title: 'copy'}))
);

// Lint sass files.
// Styles
gulp.task('stylelint', function() {
  return gulp.src([
    `${src}/styles/**/*.s+(a|c)ss`,
    `${src}/styles/**/*.css`,
    `!${src}/styles/vendor/**`,
  ])
  .pipe($.stylelint({
    reporters: [
      {formatter: 'string', console: true},
    ],
  }));
});

// Compile and automatically prefix stylesheets
gulp.task('styles', ['stylelint'], () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    `${src}/styles/main.scss`
  ])
    .pipe($.newer('.tmp/styles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: ['node_modules']
        .concat(require('bourbon').includePaths)
        .concat(require('bourbon-neat').includePaths),
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(`${dist}/styles`))
    .pipe(gulp.dest('.tmp/styles'));
});

// This uses babelify to compile ES6 modules and transpile them to ES5.
gulp.task('scripts', () => {
  const b = browserify({
    entries: `${src}/scripts/main.js`,
    debug: true,
    paths: ['node_modules', `${src}/scripts`],
    transform: [babelify]
  });

  return b.bundle()
  .pipe(sourcestream('main.js'))
  .pipe(buffer())
  .pipe($.sourcemaps.init({loadMaps: true}))
  .pipe($.uglify())
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest(`${dist}/scripts`))
  .pipe(gulp.dest(`.tmp/scripts`))
  .pipe($.size({title: 'scripts'}));
});

// HTML Minification optionsThis is pretty aggressive, difficult to read,
// and can look wrong to some people (i.e. this won't close body and html
// tags as they are optional). If this isn't desired, consider commenting
// this out, for example if handing static assets off to another developer.
const minificationOptions = {
  removeComments: true,
  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeOptionalTags: true
};

// Processes pug templates into html.
gulp.task('html', () => {
  return gulp.src([
    `${src}/**/*.pug`,
    `!${src}/**/_*.pug`
  ]).pipe($.pug({
    basedir: 'app',
    pretty: true
  }))
  .pipe(gulp.dest('.tmp'))
  .pipe($.htmlmin(minificationOptions))
  .pipe(gulp.dest(dist));
});

gulp.task('markdown', () => {
  return gulp.src([
    `${src}/**/*.md`
  ]).pipe($.plumber())
  .pipe($.markdownToJson(marked))
  .pipe($.wrap(data =>
      fs.readFileSync(`${src}/${data.contents.template}`).toString(), {}, {
    basedir: 'app',
    engine: 'pug',
    pretty: true
  }))
  .pipe($.rename({extname: '.html'}))
  .pipe(gulp.dest('.tmp'))
  .pipe($.htmlmin(minificationOptions))
  .pipe(gulp.dest(dist));
});

// Clean output directory
gulp.task('clean', () => del(['.tmp', `${dist}/*`, `!${dist}/.git`],
    {dot: true}));

// Watch files for changes & reload
gulp.task('serve', ['default'], () => {
  browserSync({
    notify: false,
    // Customize the Browsersync console logging prefix
    logPrefix: 'WSK',
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ['main', '.mdl-layout'],
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['.tmp', src],
    port: 3000
  });

  gulp.watch([`${src}/**/*.pug`], ['html', reload]);
  gulp.watch([`${src}/**/*.md`], ['markdown', reload]);
  gulp.watch([`${src}/styles/**/*.{scss,css}`], ['styles', reload]);
  gulp.watch([`${src}/scripts/**/*.js`], ['lint', 'scripts', reload]);
  gulp.watch([`${src}/images/_svg-sprite/**/*.svg`],
      ['embed-sprites', reload]);
  gulp.watch([
    `${src}/images/**/*`,
    `!${src}/images/_svg-sprite/**/*`
  ], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], () =>
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ['main', '.mdl-layout'],
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: dist,
    port: 3001
  })
);

// Build production files, the default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    ['styles', 'svg-sprites'],
    ['lint', 'html', 'markdown', 'scripts', 'images', 'copy'],
    'generate-service-worker',
    cb
  )
);

// Run PageSpeed Insights
gulp.task('pagespeed', cb =>
  // Update the below URL to the public URL of your site
  pagespeed('example.com', {
    strategy: 'mobile'
    // By default we use the PageSpeed Insights free (no API key) tier.
    // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
    // key: 'YOUR_API_KEY'
  }, cb)
);

// Copy over the scripts that are used in importScripts as part of the
// generate-service-worker task.
gulp.task('copy-sw-scripts', () => {
  return gulp.src([
    'node_modules/sw-toolbox/sw-toolbox.js',
    `${src}/scripts/sw/runtime-caching.js`
  ]).pipe(gulp.dest(`${dist}/scripts/sw`));
});

// See http://www.html5rocks.com/en/tutorials/service-worker/introduction/ for
// an in-depth explanation of what service workers are and why you should care.
// Generate a service worker file that will provide offline functionality for
// local resources. This should only be done for the 'dist' directory, to allow
// live reload to work as expected when serving from the 'app' directory.
gulp.task('generate-service-worker', ['copy-sw-scripts'], () => {
  const rootDir = dist;
  const filepath = path.join(rootDir, 'service-worker.js');

  return swPrecache.write(filepath, {
    // Used to avoid cache conflicts when serving on localhost.
    cacheId: pkg.name || 'web-starter-kit',
    // sw-toolbox.js needs to be listed first. It sets up methods used in
    // runtime-caching.js.
    importScripts: [
      'scripts/sw/sw-toolbox.js',
      'scripts/sw/runtime-caching.js'
    ],
    staticFileGlobs: [
      // Add/remove glob patterns to match your directory setup.
      `${rootDir}/images/**/*`,
      `${rootDir}/scripts/**/*.js`,
      `${rootDir}/styles/**/*.css`,
      `${rootDir}/*.{html,json}`
    ],
    // Translates a static file path to the relative URL that it's served from.
    // This is '/' rather than path.sep because the paths returned from
    // glob always use '/'.
    stripPrefix: rootDir + '/'
  });
});

// Load custom tasks from the `tasks` directory
// Run: `npm install --save-dev require-dir` from the command-line
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }

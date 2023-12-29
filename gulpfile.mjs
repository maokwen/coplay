import gulp from 'gulp';
import replace from 'gulp-replace';
import svgo from 'gulp-svgo';
import zip from 'gulp-zip';
import fs from 'fs';
import pack from './package.json' with { type: "json" };
import log from 'fancy-log';
let version = pack.version;

gulp.task('icons', function() {
  return gulp
    .src('./assets/icons/*.svg')
    .pipe(svgo())
    .pipe(gulp.dest('./dist/icons'));
});

var svgPattern = /\.svg$/;
gulp.task(
  'res',
  gulp.series('icons', function() {
    var iconData = fs.readdirSync('./dist/icons').reduce(function(icons, file) {
      if (!file.match(svgPattern)) {
        return;
      }

      var name = file.replace(svgPattern, '');
      icons[name] = fs.readFileSync('./dist/icons/' + file, 'utf8');
      return icons;
    }, {});

    return gulp
      .src('./src/coplay.js')
      .pipe(replace("'__ICONS__'", JSON.stringify(iconData)))
      .pipe(gulp.dest('./extensions/chrome'))
      .pipe(gulp.dest('./extensions/firefox'));
  })
);

gulp.task(
  'cp',
  gulp.series('res', function() {
    return gulp
      .src(['./src/*', '!./src/coplay.js'])
      .pipe(gulp.dest('./extensions/chrome'))
      .pipe(gulp.dest('./extensions/firefox'));
  })
);

gulp.task(
  'pack-chrome-extension',
  gulp.series('cp', function() {
    var manifestPath = './extensions/chrome/manifest.json';
    var manifest = JSON.parse(
      fs.readFileSync(manifestPath, { encoding: 'utf8' })
    );
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '  '));
    return gulp.src('extensions/chrome/*')
      .pipe(zip('coplay.chrome.zip'))
      .pipe(gulp.dest('extensions/packed'));
  })
);

gulp.task(
  'pack-firefox-addon',
  gulp.series('cp', function() {
    var manifestPath = './extensions/firefox/manifest.json';
    var manifest = JSON.parse(
      fs.readFileSync(manifestPath, { encoding: 'utf8' })
    );
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '  '));
    return gulp.src('extensions/firefox/*')
      .pipe(zip('coplay.firefox.zip'))
      .pipe(gulp.dest('extensions/packed'));
  })
);

gulp.task(
  'extensions',
  gulp.series('pack-chrome-extension', 'pack-firefox-addon')
);

gulp.task('default', gulp.series('extensions'));

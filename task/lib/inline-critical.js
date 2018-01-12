/**
 * Module to inline styles while loading the existing stylesheets async
 *
 * @author Ben Zörb @bezoerb https://github.com/bezoerb
 * @copyright Copyright (c) 2014 Ben Zörb
 *
 * *** Modified by Victor Sandoval ***
 */

'use strict';
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const UglifyJS = require('uglify-js');
const cheerio = require('cheerio');
const render = require('dom-serializer');
const CleanCSS = require('clean-css');
const resolve = require('resolve');
const detectIndent = require('detect-indent');

/**
 * Get loadcss + cssrelpreload script
 *
 * @returns {string}
 */
function getScript() {
  const loadCssMain = resolve.sync('fg-loadcss');
  const loadCssBase = path.dirname(loadCssMain);
  const loadCSS = read(path.join(loadCssBase, 'cssrelpreload.js'));
  return UglifyJS.minify(loadCSS).code;
}


/**
 * Read file *
 * @param {string} file
 * @returns {string}
 */
function read(file) {
  return fs.readFileSync(file, 'utf8');
}

module.exports = function (html, styles, options) {
  if (!_.isString(html)) {
    html = String(html);
  }
  const $ = cheerio.load(html, {
    decodeEntities: false
  });

  const allLinks = $('link[rel="stylesheet"], link[rel="preload"][as="style"]').filter(function () {
    return !$(this).parents('noscript').length;
  });

  let links = allLinks.filter('[rel="stylesheet"]');

  const o = _.assign({
    minify: true
  }, options || {});

  const target = o.selector || allLinks.get(0) || $('script').get(0);
  const $target = $(target);
  let indent = detectIndent(html).indent;
  let newLine = "\n";

  if (_.isString(o.ignore)) {
    o.ignore = [o.ignore];
  }

  if (o.ignore) {
    links = _.filter(links, link => {
      const href = $(link).attr('href');
      return _.findIndex(options.ignore, arg => {
        return (_.isRegExp(arg) && arg.test(href)) || arg === href;
      }) === -1;
    });
  }
  // Minify if minify option is set
  if (o.minify) {
    styles = new CleanCSS().minify(styles).styles;
    newLine = "";
    indent = "";
  }

  // Insert inline styles right before first <link rel="stylesheet" />
  $target.before([
    '<style type="text/css">',
    styles.replace(/(\r\n|\r|\n)/g, '$1' + indent).replace(/^[\s\t]+$/g, ''),
    '</style>'
  ].join(newLine + indent) + newLine + indent);

  if (links.length > 0) {
    // Modify links and ad clones to noscript block
    $(links).each(function (idx, el) {
      if (o.extract && !o.basePath) {
        throw new Error('Option `basePath` is missing and required when using `extract`!');
      }
      const $el = $(el);

      // Add each fallback right behind the current style to keep source order when ignoring stylesheets
      $el.after(`${newLine + indent}<noscript>${render(this)}</noscript>`);

      // Add preload atttibutes to actual link element
      $el.attr('rel', 'preload');
      $el.attr('as', 'style');
      $el.attr('onload', 'this.onload=null;this.rel=\'stylesheet\'');
    });

    // Add loadcss + cssrelpreload polyfill
    const scriptAnchor = $('link[rel="stylesheet"], noscript').filter(function () {
      return !$(this).parents('noscript').length;
    }).last().get(0);

    $(scriptAnchor).after(`${newLine + indent}<script>${getScript()}</script>`);
  }

  const head = $("head").html();
  const markup = html.replace(/<head>(?:.|\n)*?<\/head>/g, `<head>${head}</head>`)

  return Buffer.from(markup);
};

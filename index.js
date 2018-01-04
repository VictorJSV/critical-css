const puppeteer = require("puppeteer");
const critical  = require("critical");
const fs        = require("fs");
const config    = require("./config");
const pathFiles = "./";
//const pathFiles = require("/usr/local/app/frontend/config/docker-path.js");

let initBrowser = function() {
   return puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
};

let getPage = async function (url, browser) {
  const page = await browser.newPage();
  await page.goto(`${url}`, { timeout: 120000 });
  return page.content();
};

let getCssCollection = function (browser, content) {
  if (!content) return;

  let cssUri = content.match(/https?:\/\/(cds|cdn)\.[a-z_\-0-9\.\/]+(?<!ie)\.css\?v=([a-z0-9]+)?/g);
  if (!cssUri) {
    console.error("cssUri is null");
    browser.close();
    return;
  }
  return cssUri;
};

let getContentCSS = async function (browser, cssUrls) {
  let cssContent = "";

  for (let url of cssUrls) {
    let contentCSS = await getPage(url, browser);
    const detectTags = /(<([^>]+)>)/ig;
    const justCss = contentCSS.replace(detectTags, "");
    cssContent = cssContent + justCss;
  }

  browser.close();
  return cssContent;
};

let generateTempFiles = function (url, fileName, cssContent) {
  if (cssContent === "") {
    console.info(`${url} doesn't have CSS :C`);
    return;
  }

  try {
    let content = cssContent.replace(/&gt;/g, ">");
    fs.writeFileSync(fileName, content);
  } catch (e) {
    console.error(`Cannot write the temporal file ${fileName} for ${url} - ${e.message}`);
  }
};

let generateCritical = function (url, fileTempName, contentBody) {
  console.info(`Generating critical for ${url} ... `);
  critical.generate({
    html      : contentBody,
    folder    : "dist/",
    dimensions: [
      { height: 736, width : 414  },
      { height: 678, width : 1200 }
    ],
    minify   : true,
    ignore   : ["@font-face", "background-image"],
    penthouse: {
      timeout: 120000,
      strict : true
    },
    css: [ fileTempName ]
  }).then(function (output) {
    // Delete temporal css file
    try {
      fs.unlinkSync(fileTempName);
    } catch (e) {
      console.error(`Cannot delete the temporal file ${fileTempName} for ${url} - ${e.message}`);
    }

    // Template css inline
    const dataWithCritical = `if locals.environment !== "local"\n  | <style>${output}</style>`;

    // Write .jade file with dataWithCritical
    try {
      fs.writeFileSync(`${pathFiles}/${fileTempName}.jade`, dataWithCritical);
      console.info(`Success! ${url}`);
    } catch (e) {
      console.error(`Cannot write file critical.jade: ${e.message}`);
    }
  }).error(function (e) {
    console.error(`Something wrong with critical :C ! ${e.message}`);
  });
};

function main (config) {
  config.pages.map(async (page) => {
    const url = `${config.host}/${page.uri}`;
    const fileTempName = `tmp${page.uri}${new Date().getTime()}.css`;

    console.info(`Initialize page ${url}`);
    let browser = await initBrowser();
    let contentBody = await getPage(url, browser)
      .catch((e) => console.error(e.message));
    let cssUrls = getCssCollection(browser, contentBody);
    let cssContent = await getContentCSS(browser, cssUrls)
      .catch((e) => console.error(e.message));

    generateTempFiles(url, fileTempName, cssContent);
    generateCritical(url, fileTempName, contentBody);
  });
}

main(config);
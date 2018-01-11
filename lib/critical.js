const fs             = require("fs");
const path           = require("path");
const puppeteer      = require("puppeteer");
const critical       = require("critical");
const inlineCritical = require("./inline-critical");
const PLUGIN_NAME    = "Critical CSS";
const PATH_BASE      = "/test"; // /usr/local/app

let getConfigEnv = function (config, environment, environments) {
  let host = environments[environment];

  if (!host) {
    if (!config.host) throw new TypeError(`[${PLUGIN_NAME}] Something wrong :C !, host is invalid`);

    if (typeof environment === "undefined") {
      console.info(`[${PLUGIN_NAME}] Using default host: ${config.host}`);
    } else {
      console.info(`[${PLUGIN_NAME}] Environment variable '${environment}' not found, using default host: ${config.host}`);
    }

    host = config.host;
  }

  return {
    host,
    pages: config.pages
  }
};

let getInstanceBrowser = function() {
  return puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
};

let getContentPage = async function (url, browser) {
  if (!browser) return;

  try {
    const page = await browser.newPage();
    await page.goto(`${url}`, { timeout: 120000 });
    return page.content();
  } catch (e) {
    console.error(`[${PLUGIN_NAME}] Something wrong :C !, ${e.message}`)
  }
};

let getCSSLinks = function (url, content) {
  if (!content) return;

  let cssLinks = content.match(/https?:\/\/[a-z_\-0-9\.\/]+(?<!ie)\.css(\?v=([a-z0-9]+)?)?/g);
  if (!cssLinks) {
    console.info(`[${PLUGIN_NAME}] ${url} doesn't have CSS :C`);
  }
  return cssLinks;
};

let getContentCSS = async function (browser, cssUrls) {
  let contentCSS = "";
  if (cssUrls) {
    for (let url of cssUrls) {
      const contentPage = await getContentPage(url, browser);
      const regexTags = /(<([^>]+)>)/ig;
      const justCss = contentPage.replace(regexTags, "");
      contentCSS = contentCSS + justCss;
    }
    contentCSS = contentCSS.replace(/&gt;/g, ">")
  }

  browser.close();
  return contentCSS;
};

let writeFile = function(nameFile, content) {
  try {
    fs.writeFileSync(nameFile, content);
  } catch (e) {
    console.error(`[${PLUGIN_NAME}] Something wrong :C !, ${e.message}`)
  }
};

let getPathParse = function(page) {
  return path.parse(PATH_BASE + page.fileRoute);
};

let getCSSFile = function(path) {
  return `${path.dir}/${path.name}.css`;
};

let generateCritical = async function (page, cssContent, htmlContent) {
  if (!htmlContent || !cssContent) return;
  console.info(`[${PLUGIN_NAME}] Generating critical for ${page.url} ... `);

  const pathParse = getPathParse(page);
  const pathCSS = getCSSFile(pathParse);

  // Make CSS File with all css
  writeFile(pathCSS, cssContent);

  // Set critical settings
  let criticalConfig = {
    folder    : "/",
    dimensions: config.dimensions,
    html      : htmlContent,
    css       : [ pathCSS ],
    minify    : true,
    ignore    : ["@font-face", "background-image"],
    penthouse : {
      timeout: 120000,
      strict : true
    }
  };
  const cssCritical = await critical.generate(criticalConfig, null);

  // Overwrite CSS File with critical css
  writeFile(pathCSS, cssCritical);
  makeCriticalHTMLFile(`${pathParse.dir}/${pathParse.base}`, cssCritical, true);
};

let makeCriticalHTMLFile = function (routeHTML, ourCSS, inline) {
  try {
    let contentCSS;

    if (inline) {
      contentCSS = ourCSS;
    } else {
      contentCSS = fs.readFileSync(ourCSS, 'utf8')
    }

    if (contentCSS === "") throw new Error(`CSS is empty for route '${routeHTML}'`);

    let html = inlineCritical(fs.readFileSync(routeHTML, 'utf8'), contentCSS);
    writeFile(routeHTML, html);
    console.info(`[${PLUGIN_NAME}] Successful generation for route '${routeHTML}'`);
  } catch (e) {
    console.error(`[${PLUGIN_NAME}] Something wrong :C !, ${e.message}`);
  }
};

exports.runCriticalFactory = function (config, environment, environments) {
  if (!config || !environments) {
    throw new TypeError(`[${PLUGIN_NAME}] Something wrong :C !, config is invalid`);
  }

  const configEnv = getConfigEnv(config, environment, environments);
  configEnv.pages.map(async (page) => {
    page.url = `${configEnv.host}/${page.uri}`;

    console.info(`[${PLUGIN_NAME}] Initializing page, ${page.url}`);
    const browser     = await getInstanceBrowser();
    const htmlContent = await getContentPage(page.url, browser);
    const cssUrls     = getCSSLinks(page.url, htmlContent);
    const cssContent  = await getContentCSS(browser, cssUrls);
    await generateCritical(page, cssContent, htmlContent);
  });
};

exports.runCriticalProdFactory = function (config) {
  config.pages.map((page) => {
    const pathParse = getPathParse(page);
    console.info(`[${PLUGIN_NAME}] Initializing page for route '${pathParse.dir}'`);
    makeCriticalHTMLFile(`${pathParse.dir}/${pathParse.base}`, `${pathParse.dir}/${pathParse.name}.css`, false)
  });
};


const puppeteer = require("puppeteer");
const critical  = require("critical");
const fs        = require("fs");
const config    = require("./config");

//const pathFiles = require("/usr/local/app/frontend/config/docker-path.js");

async function scrape (uri) {
  // Init browser
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();

  // Get body content
  console.info(`Plugin critical: Init! ${config.host}/${uri}`);
  await page.goto(`${config.host}/${uri}`, {timeout: 120000});
  const body = await page.content();

  // Get css content
  let cssUri = body.match(/https?:\/\/(cds|cdn)\.[a-z_\-0-9\.\/]+(?<!ie)\.css\?v=([a-z0-9]+)?/g);
  if (!cssUri) {
    console.error("Plugin critical: cssUri is null");
    browser.close();
    return;
  }
  console.log(cssUri)

  let cssContent = "";
  for (let url of cssUri) {
    await page.goto(url);
    const cssContentTmp = await page.content();
    const regToDeleteTags = /(<([^>]+)>)/ig;
    const justCss = cssContentTmp.replace(regToDeleteTags, "");
    cssContent = cssContent + justCss;
  }
  browser.close();
  return {
    body,
    cssContent
  }
}

function generateCritical(uri, file, scrapedData) {
  const fileTempName = `tmp${uri}${new Date().getTime()}.css`;

  if (scrapedData.cssContent === "") {
    console.info(`${config.host}/${uri} doesn't have CSS :C`);
    return;
  }

  // Generate temporal css file
  try {
    let content = scrapedData.cssContent.replace(/&gt;/g, ">");
    fs.writeFileSync(fileTempName, content);
  } catch (e) {
    console.error(`Plugin critical: Cannot write the temporal file ${fileTempName} for ${config.host}/${uri}: ${e.message}`);
  }

  critical.generate({
    html      : scrapedData.body,
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
      console.error(`Plugin critical: Cannot delete the temporal file ${fileTempName} for ${config.host}/${uri}: ${e.message}`);
    }

    // Template css inline
    const dataWithCritical = `if locals.environment !== "local"\n  | <style>${output}</style>`;

    // Write .jade file with dataWithCritical
    /*try {
      fs.writeFileSync(`${pathFiles.output.critical}${file}/critical.jade`, dataWithCritical);
      console.info(`Plugin critical: Success! ${config.host}/${uri}`);
    } catch (e) {
      console.error(`Plugin critical: Cannot write file ${pathFiles.output.critical}${file}/critical.jade: ${e.message}`);
    }*/
  }).error(function (e) {
    console.error(`Plugin critical: Something wrong with critical :C ! ${e.message}`);
  });
}

function main (config) {
  config.pages.map(async (page) => {
    scrape(page.uri)
      .then((scrapedData) => {
        // generateCritical(page.uri, page.fileRoute, scrapedData);
      }).catch((e) => {
          console.error(`Plugin critical: Error in loading ${config.host}/${page.uri}: ${e.message}`);
      })
  });
}

main(config);

# Critical CSS
If domains that are **externally restricted**, It is important to give **user privileges** to servers that going to makes scraping, otherwise the task won't can be done.

## Installation
In your project need two files, `environments.js` and `options.json`

File: `environments.js`, where you specify all your environments
```javascript
module.exports = {
  "dev" : "https://dev.domain.com",
  "pre" : "https://pre.domain.com",
  "prod": "https://domain.com"
};
```
File: `options.json`, where you specify
- `host` is default host variable 
- `pages` will be used for scrape
- `dimensions` will be used when generating critical css for this dimensions
```json
{
  "host": "https://default.domain.com",
  "pages": [
    {
      "uri"      : "empresa",
      "fileRoute": "/fixtures/home/index.html"
    }
  ],
  "dimensions": [
    { "height": 736, "width" : 414  },
    { "height": 678, "width" : 1200 }
  ]
}
```
Then run a docker container
```bash
docker run -it --rm -v [project]:/usr/local/app -e ENV=[environment] -e CONFIG=[config] micro-critical-css:1.0 node index
```
- [project] is project route, could be `$(pwd)/test`
- [environment] could be `dev`, `pre`, `prod`
- [config] is route file where are `environments.js` and `options.json`, could be `/config`. Is not absolute route, this starts from the base of your project

> If is `prod` scrape won't do, only will inject the css file into html. For this reason it's important that CSS file exist. This CSS file contents critical styles.

## How to build ?

```bash
docker build -t micro-critical-css:1.0 .
```
## How to run ?

```bash
docker run -it --rm -v $(pwd)/test:/usr/local/app -e ENV=[environment] -e CONFIG=/config micro-critical-css:1.0 node index
```
`environment` could be `dev`, `pre`, `prod`

## How to run test ?
```bash
yarn install
npm test
```
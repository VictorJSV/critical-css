# Critical CSS
If domains that are **externally restricted**, It is important to give **user privileges** to servers that going to makes scraping, otherwise the task won't can be done.

## How to build ?

```shell
docker build -t micro-critical-css:1.0 .
```
## How to run ?

```shell
docker run -it --rm -v $(pwd)/test:/usr/local/app -e ENV=[environment] -e CONFIG=/usr/local/app/config micro-critical-css:1.0 node index
```
> `environment` could be `dev`, `pre`, `prod`

## How to run test ?
```shell
yarn install
npm test
```
# Critical CSS
If domains that are **externally restricted**, It is important to give **user privileges** to servers that going to makes scraping, otherwise the task won't can be done.

## How to build ?

```shell
docker build -t micro-critical-css:2.2 .

```
## How to run ?

```shell
docker run -it --rm -v $(pwd)/:/usr/local/app -e ENV=[environment] -w /usr/local/app/lib micro-critical-css:2.2 node index

```
> `environment` could be `dev`, `pre`, `prod`

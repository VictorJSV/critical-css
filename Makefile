
# Global variables
ENV          = foo
CONFIG_FILE  = /usr/local/app/config
DOCKER_IMAGE = micro-critical-css:1.0
COMMAND      = node index

start:
	docker run -it --rm -v $(PWD)/test:/usr/local/app -e ENV=${ENV} -e CONFIG=${CONFIG_FILE} ${DOCKER_IMAGE} ${COMMAND}

build:
	docker build -t ${DOCKER_IMAGE} .

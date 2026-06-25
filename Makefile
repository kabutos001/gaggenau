format:
	$(MAKE) -C backend format
	cd frontend && npm run format

lint:
	$(MAKE) -C backend lint
	cd frontend && npm run lint

build:
	cd frontend && npm run build

check: lint
	$(MAKE) -C backend typecheck

all: format lint build check

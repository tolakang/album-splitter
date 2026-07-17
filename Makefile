.PHONY: up down build logs test migrate

up:
	docker compose -f dokploy/docker-compose.yml up -d

down:
	docker compose -f dokploy/docker-compose.yml down

build:
	docker compose -f dokploy/docker-compose.yml build

logs:
	docker compose -f dokploy/docker-compose.yml logs -f

test:
	docker compose -f dokploy/docker-compose.yml exec backend npm test

migrate:
	docker compose -f dokploy/docker-compose.yml run --rm migrate

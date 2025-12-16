## FundBridge Config Repo (Native, Flat Layout)

This folder is the Spring Cloud Config repository when the `config-server` runs with the `native` profile. It uses a single flat layout:

- `application.yml` — shared defaults (Eureka, management, etc.).
- `<service-name>.yml` — one file per service (api-gateway, auth-service, user-service, loan-management-service, wallet-service).

Secrets and environment-specific values use `${ENV_VAR[:default]}` placeholders. Provide real values via environment variables when running services.

To point the Config Server at a different location, set `CONFIG_REPO_LOCATIONS` before launching it. By default it tries `file:../config-repo`, `file:./config-repo`, and `file:./fundbridge-backend/config-repo`.

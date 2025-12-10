## FundBridge Config Repo (Native)

This folder acts as the Spring Cloud Config repository when the `config-server` module runs with the `native` profile. The server watches the `dev/` and `production/` subdirectories and serves property sources to the rest of the microservices.

- `dev/` mirrors the local developer setup (localhost Eureka, MySQL, permissive CORS, etc.).
- `production/` contains the same keys but expects secrets/URLs to be supplied via environment variables (see the `${...}` placeholders).
- Each subdirectory stores `application-<profile>.yml` for shared defaults and `<service-name>-<profile>.yml` for service overrides.

To point the Config Server at a different location (or custom folders), set `CONFIG_REPO_LOCATIONS` before launching it. The default resolves to `file:../config-repo/dev,file:../config-repo/production`.

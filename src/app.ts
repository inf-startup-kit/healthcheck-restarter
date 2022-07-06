import config from "./lib/init";
import chalk from "chalk";
import { LoggerEventEmitter } from "logger-event-emitter";
import { buildApiServer } from "./http/build_api_server";
import { DockerConnector } from "./lib/docker-connector";
import { Restarter } from "./lib/restarter";

const logger = new LoggerEventEmitter(config.logger);

logger.debug(`\nCONFIG:\n${JSON.stringify(config, null, 4)}`);

const docker_connector = new DockerConnector(config.docker, logger.child("docker-connector"));
const restarter = new Restarter(docker_connector, config.healthcheck, logger.child("healthcheck"));

const bootstrap = async () => {

    try {

        await restarter.run();

        const api_server_logger = logger.child("api-server");
        const api_server = buildApiServer(config.api, api_server_logger);

        if (config.api.enable === true) {

            api_server.listen({
                port: config.api.port,
                host: config.api.hostname,
                backlog: config.api.backlog
            }, (error: Error, address: string) => {
                if (error !== null) {
                    api_server_logger.fatal(`Error start server. Error: ${chalk.red(error)}`);
                    process.exit(1);
                }
                api_server_logger.info(`Server listening on ${chalk.cyan(address)}`);
            });
        }

        const stop_app = async () => {
            //await restarter.close();
            await api_server.close();
            process.exit();
        };

        process.on("SIGTERM", async () => {
            logger.info(`Signal ${chalk.cyan("SIGTERM")} received`);
            await stop_app();
        });

        process.on("SIGINT", async () => {
            logger.info(`Signal ${chalk.cyan("SIGINT")} received`);
            await stop_app();
        });

    } catch (error) {
        logger.fatal(`Error application start.\n${error.stack}`);
        process.exit(1);
    }

};

bootstrap();
import { ILoggerEventEmitter } from "logger-event-emitter";
import { DockerConnector } from "../docker-connector";
import { IRestarter, IRestarterConfig } from "./interfaces";
import chalk from "chalk";
import { convertTime } from "../tools/convert_time";

export class Restarter implements IRestarter {

    private _running_flag: boolean;
    private _healthcheck_interval: ReturnType<typeof setTimeout>;

    constructor (
        private readonly _docker_connector: DockerConnector,
        private readonly _config: IRestarterConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._running_flag = false;
    }

    private async _healthcheck (): Promise<void> {

        if (this._docker_connector.ready === true) {

            const containers_list = await this._docker_connector.list({
                label: [this._config.label]
            });

            for (const container of containers_list) {
                this._logger.debug(`Container ${chalk.cyan(container.name)} ID: ${chalk.cyan(container.id)} checking`);
                if (/\(unhealthy\)$/.test(container.status) === true) {
                    this._logger.warn(`Container ${chalk.yellow(container.name)} ID: ${chalk.yellow(container.id)} unhealthy. Restart container...`);
                    await this._docker_connector.restart(container.id);
                    this._logger.info(`Container ${chalk.yellow(container.name)} restarted`);
                }
            }
        }

        this._healthcheck_interval = setTimeout( () => {
            this._healthcheck();
        }, convertTime(this._config.check_interval)*1000);

    }

    async run (): Promise<void> {
        if (this._running_flag === true) {
            return;
        }
        this._running_flag = true;
        await this._docker_connector.run();
        this._healthcheck();
    }

    async close (): Promise<void> {
        if (this._running_flag === false) {
            return;
        }
        this._running_flag = false;
        clearTimeout(this._healthcheck_interval);
        await this._docker_connector.close();
    }

}
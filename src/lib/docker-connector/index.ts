import Docker from "dockerode";
import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import { IDockerConnector, IDockerConnectorConfig, IDockerConnectorContainerInfo, IDockerConnectorListFilter } from "./interfaces";
import { ILoggerEventEmitter } from "logger-event-emitter";
import { convertTime } from "../tools/convert_time";

export * from "./interfaces";

export class DockerConnector implements IDockerConnector {

    private readonly _docker: Docker;
    private _ready_flag: boolean;
    private _ping_interval: ReturnType<typeof setTimeout>;
    private _running_flag: boolean;

    constructor (
        private readonly _config: IDockerConnectorConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {

        const options: Docker.DockerOptions = {
            version: this._config.version
        };

        if (this._config.host === "") {
            options.socketPath = this._config.socket;
        } else {

            if (this._config.ca !== "") {
                const ca_full_path = path.resolve(process.cwd(), this._config.ca);
                if (!fs.existsSync(ca_full_path)) {
                    this._logger.fatal(`CA file ${chalk.red(ca_full_path)} not found`);
                    process.exit(1);
                }
                options.ca = fs.readFileSync(ca_full_path).toString();
            }
            
            if (this._config.cert !== "") {
                const cert_full_path = path.resolve(process.cwd(), this._config.cert);
                if (!fs.existsSync(cert_full_path)) {
                    this._logger.fatal(`CERT file ${chalk.red(cert_full_path)} not found`);
                    process.exit(1);
                }
                options.cert = fs.readFileSync(cert_full_path).toString();
            }
            
            if (this._config.key !== "") {
                const key_full_path = path.resolve(process.cwd(), this._config.key);
                if (!fs.existsSync(key_full_path)) {
                    this._logger.fatal(`KEY file ${chalk.red(key_full_path)} not found`);
                    process.exit(1);
                }
                options.key = fs.readFileSync(key_full_path).toString();
            }

            options.host = this._config.host;
            options.port = this._config.port;
            options.protocol = this._config.protocol;

        }

        this._ready_flag = false;
        this._running_flag = false;
        this._docker = new Docker(options);

    }

    get ready (): boolean {
        return this._ready_flag;
    }

    private async _ping (): Promise<void> {

        try {

            const ping_result = await this._docker.ping();

            if (ping_result.toString() !== "OK") {
                if (this._ready_flag === true) {
                    this._logger.debug("Docker socket not ready");
                }
                this._ready_flag = false;
            } else {
                if (this._ready_flag === false) {
                    this._logger.debug("Docker socket is ready");
                }
                this._ready_flag = true;
            }

        } catch (error) {
            this._logger.error(`Docker ping error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
        }

        this._ping_interval = setTimeout( async () => {
            this._ping();
        }, convertTime(this._config.ping_interval)*1000);

    }
    
    async run (): Promise<void> {

        if (this._running_flag === true) {
            return;
        }

        this._running_flag = true;

        this._ping();
    }

    async close (): Promise<void> {
        if (this._running_flag === false) {
            return;
        }
        this._running_flag = false;
        clearTimeout(this._ping_interval);
    }

    async restart (id: string): Promise<void> {

        if (this._ready_flag === false) {
            return;
        }

        try {

            const container = this._docker.getContainer(id);

            await container.restart();

        } catch (error) {
            this._logger.error(`Docker restart container error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
        }

    }

    async list (filter: IDockerConnectorListFilter = {}, all_flag: boolean = false): Promise<IDockerConnectorContainerInfo[]> {

        if (this._ready_flag === false) {
            return [];
        }

        const result: IDockerConnectorContainerInfo[] = [];

        try {

            const list_result = await this._docker.listContainers({
                all: all_flag,
                filters: {
                    ...filter
                }
            });
    
            for (const item of list_result) {
                result.push({
                    id: item.Id,
                    images: item.Image,
                    name: item.Names[0].replace(/^\//,""),
                    state: item.State,
                    status: item.Status
                });
            }

        } catch (error) {
            this._logger.error(`Docker list error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
        }

        return result;

    }
    
}
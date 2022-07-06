export interface IDockerConnector {
    readonly ready: boolean
    run: () => Promise<void>
    close: () => Promise<void>
    list: (filter?: IDockerConnectorListFilter, all_flag?: boolean) => Promise<IDockerConnectorContainerInfo[]>
    restart: (id: string) => Promise<void>
}

export interface IDockerConnectorContainerInfo {
    id: string
    images: string
    name: string
    state: string
    status: string
}

export interface IDockerConnectorListFilter {
    label?: string[]
}

export interface IDockerConnectorConfig {
    socket: string
    host: string
    port: number
    protocol: "http" | "https" | "ssh"
    ca: string
    cert: string
    key: string
    version: string
    ping_interval: string
}
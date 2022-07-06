export interface IRestarter {
    run: () => Promise<void>
    close: () => Promise<void>
}

export interface IRestarterConfig {
    enable: boolean
    label: string
    check_interval: string
}
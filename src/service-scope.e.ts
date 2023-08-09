export enum ServiceScope {
  /** Only one service instance is created. */
  Singleton = "SINGLETON",
  /** New service instance is created on each request. */
  Transient = "TRANSIENT",
  /** Same instance of a service is provided for the scope. */
  Scoped = "SCOPED",
}

import { ServiceCreateCallback } from "./service-create-callback.t";
import { ServiceScope } from "./service-scope.e";
import { ServiceType } from "./service-type.t";

export interface IServiceProvider {

  /**
   * Gets the number of services registered with the service provider.
   */
  get count(): number;

  /**
   * Retrieves a service.
   * @param serviceType Type of the service class.
   * @param scopeName Name of the scope.
   * @returns The requested service.
   */
  get<Type>(serviceType: ServiceType<Type>, scopeName?: string): Type;

  /**
   * Retrieves a service by name.
   * @param serviceName Name of the service class.
   * @param scopeName Name of the scope.
   * @returns The requested service.
   */
  getByName<Type>(serviceName: string, scopeName?: string): Type;

  /**
   * Registers a service.
   * @param serviceType Type of the service class.
   * @param scope Scope of the service.
   * @param createCallback If callback function is provided, service provider
   * shall use during new service object creation.
   * @returns The service provider instance.
   */
  register<Type>(serviceType: ServiceType<Type>, scope?: ServiceScope,
    createCallback?: ServiceCreateCallback<Type>): IServiceProvider;

  /**
   * Registers a singleton service instance.
   * @param serviceType Type of the service class.
   * @param instance The service instance to register.
   * @param scopeName Name of the scope.
   * @returns The service provider instance.
   */
  registerSingleton<Type>(serviceType: ServiceType<Type>, instance: Type): IServiceProvider;

  /**
   * Unregisters a service. If scope name is provided, this method
   * shall only unregister a scoped instance of the service.
   * @param serviceType Type of the service class.
   * @param scopeName Name of the scope.
   * @returns The service provider instance.
   */
  unregister<Type>(serviceType: ServiceType<Type>, scopeName?: string): IServiceProvider;

  /**
   * Unregisters all the services.
   * @returns The service provider instance.
   */
  unregisterAll(): IServiceProvider;
}

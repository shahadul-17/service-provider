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
   * @param scopeName Name of the scope.
   * @param createCallback If callback function is provided, service provider
   * shall use during new service object creation.
   * @returns The service provider instance.
   */
  register<Type>(serviceType: ServiceType<Type>, scope?: ServiceScope,
    scopeName?: string, createCallback?: ServiceCreateCallback<Type>): IServiceProvider;

  /**
   * Registers a service object.
   * @param serviceType Type of the service class.
   * @param object The service object to register.
   * @param scopeName Name of the scope.
   * @returns The service provider instance.
   */
  registerObject<Type>(serviceType: ServiceType<Type>, object: Type, scopeName?: string): IServiceProvider;

  /**
   * Unregisters a service.
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

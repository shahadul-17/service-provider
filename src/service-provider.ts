import { Map } from "@shahadul-17/collections";
import { StringUtilities, ObjectUtilities, } from "@shahadul-17/utilities";
import { ServiceData } from "./service-data.t";
import { IServiceProvider } from "./service-provider.i";
import { ServiceScope } from "./service-scope.e";
import { ServiceType } from "./service-type.t";
import { ServiceCreateCallback } from "./service-create-callback.t";

const SERVICE_KEY_PREFIX = "$_SVC_";

export class ServiceProvider implements IServiceProvider {

  private readonly serviceDataMap = new Map<string, ServiceData>();

  private constructor() { }

  get count(): number {
    return this.serviceDataMap.size;
  }

  public get<Type>(serviceType: ServiceType<Type>, scopeName?: string): Type {
    const serviceName = ServiceProvider.getServiceName(serviceType);

    if (StringUtilities.isEmpty(serviceName)) { throw new Error("An unexpected error occurred while reading service name."); }

    return this.getByName(serviceName, scopeName);
  }

  public getByName<Type>(serviceName: string, scopeName?: string): Type {
    serviceName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      serviceName, StringUtilities.getEmptyString(), true);

    if (StringUtilities.isEmpty(serviceName)) {
      throw new Error(`Invalid service name '${serviceName}' provided.`);
    }

    scopeName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      scopeName, StringUtilities.getEmptyString(), true);

    const serviceKey = ServiceProvider.populateServiceKey(serviceName, scopeName);
    const serviceData = this.serviceDataMap.get(serviceKey);

    if (typeof serviceData === "undefined") {
      throw new Error(`Requested service with name, '${serviceName}' and scope name, '${scopeName}' was not found.`);
    }

    switch (serviceData.scope) {
      case ServiceScope.Transient:
        let instance: any = undefined;

        // if callback is available...
        if (typeof serviceData.createCallback === "function") {
          // executes the callback to create new instance...
          instance = serviceData.createCallback(serviceData.serviceType);
        }

        // if callback function is not provided or it did not return an instance...
        if (!ObjectUtilities.isObject(instance)) {
          // executes the default constructor...
          instance = new serviceData.serviceType();
        }

        return instance;
      default:
        return serviceData.instance;
    }
  }

  public register<Type>(serviceType: ServiceType<Type>, scope?: ServiceScope,
    scopeName?: string, createCallback?: ServiceCreateCallback<Type>): IServiceProvider {
    const serviceName = ServiceProvider.getServiceName(serviceType);

    // if service name is empty, we shall throw error...
    if (StringUtilities.isEmpty(serviceName)) { throw new Error("An unexpected error occurred while reading service name."); }
    // if valid scope is not provided, we shall set Singleton as the default...
    if (StringUtilities.isUndefinedOrNull(scope) || [ServiceScope.Singleton, ServiceScope.Scoped, ServiceScope.Transient].indexOf(scope!) === -1) {
      scope = ServiceScope.Singleton;
    }

    // sanitizes the scope name...
    scopeName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      scopeName, StringUtilities.getEmptyString(), true);

    // if the provided service shall be registered as scoped
    // but scope name is empty, we shall throw error...
    if (scope === ServiceScope.Scoped && StringUtilities.isEmpty(scopeName)) {
      throw new Error("Scope name must be provided to register scoped services.");
    }
    // if scope name is provided but the provided scope is not 'Scoped'...
    if (!StringUtilities.isEmpty(scopeName) && scope !== ServiceScope.Scoped) {
      // we shall set the scope to 'Scoped'...
      scope = ServiceScope.Scoped;
    }

    const serviceKey = ServiceProvider.populateServiceKey(serviceName, scopeName);
    const existingServiceData = this.serviceDataMap.get(serviceKey);

    if (typeof existingServiceData !== "undefined") {
      throw new Error("Requested service is already registered.");
    }

    let instance: any = undefined;

    if (scope !== ServiceScope.Transient) {
      // if callback is provided...
      if (typeof createCallback === "function") {
        // executes the callback to create new instance...
        instance = createCallback(serviceType);
      }

      // if callback function is not provided or it did not return an instance...
      if (!ObjectUtilities.isObject(instance)) {
        // executes the default constructor...
        instance = new serviceType();
      }
    }

    const serviceData: ServiceData = Object.create(null);
    serviceData.key = serviceKey;
    serviceData.scopeName = scopeName!;
    serviceData.scope = scope!;
    serviceData.serviceType = serviceType;
    serviceData.instance = instance;
    serviceData.createCallback = createCallback;

    this.serviceDataMap.set(serviceKey, serviceData);

    return this;
  }

  public registerObject<Type>(serviceType: ServiceType<Type>, serviceObject: Type, scopeName?: string): IServiceProvider {
    const serviceName = ServiceProvider.getServiceName(serviceType);

    if (StringUtilities.isEmpty(serviceName)) { throw new Error("An unexpected error occurred while reading service name."); }
    if (!ObjectUtilities.isObject(serviceObject)) { throw new Error("Invalid service object provided."); }

    scopeName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      scopeName, StringUtilities.getEmptyString(), true);

    const serviceKey = ServiceProvider.populateServiceKey(serviceName, scopeName);
    const existingServiceData = this.serviceDataMap.get(serviceKey);

    if (typeof existingServiceData !== "undefined") {
      throw new Error("Requested service is already registered.");
    }

    const scope = StringUtilities.isEmpty(scopeName)
      ? ServiceScope.Singleton : ServiceScope.Scoped;
    const serviceData: ServiceData = Object.create(null);
    serviceData.key = serviceKey;
    serviceData.scopeName = scopeName!;
    serviceData.scope = scope;
    serviceData.serviceType = serviceType;
    serviceData.instance = serviceObject;
    serviceData.createCallback = undefined;

    this.serviceDataMap.set(serviceKey, serviceData);

    return this;
  }

  public unregister<Type>(serviceType: ServiceType<Type>, scopeName?: string): IServiceProvider {
    const serviceName = ServiceProvider.getServiceName(serviceType);

    if (StringUtilities.isEmpty(serviceName)) { return this; }

    const serviceKey = ServiceProvider.populateServiceKey(serviceName, scopeName);

    this.serviceDataMap.delete(serviceKey);

    return this;
  }

  public unregisterAll(): IServiceProvider {
    this.serviceDataMap.clear();

    return this;
  }

  private static readonly instance: IServiceProvider = new ServiceProvider();

  private static getServiceName<Type>(serviceType: ServiceType<Type>): string {
    if (typeof serviceType !== "function") { return StringUtilities.getEmptyString(); }

    let serviceName = (serviceType as any).name;
    serviceName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      serviceName, StringUtilities.getEmptyString(), true);

    return serviceName;
  }

  private static populateServiceKey(serviceName: string, scopeName?: string): string {
    scopeName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      scopeName, StringUtilities.getEmptyString(), true);

    return `${SERVICE_KEY_PREFIX}${scopeName}_${serviceName.toLowerCase()}`;
  }

  public static getInstance(): IServiceProvider {
    return this.instance;
  }
}

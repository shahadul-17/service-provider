import { IMap, Map, } from "@shahadul-17/collections";
import { StringUtilities, ObjectUtilities, } from "@shahadul-17/utilities";
import { ServiceData } from "./service-data.t";
import { IServiceProvider } from "./service-provider.i";
import { ServiceScope } from "./service-scope.e";
import { ServiceType } from "./service-type.t";
import { ServiceCreateCallback } from "./service-create-callback.t";

const VALID_SCOPES = [
  ServiceScope.Singleton,
  ServiceScope.Scoped,
  ServiceScope.Transient,
];

export class ServiceProvider implements IServiceProvider {

  private readonly serviceDataMap: IMap<string, ServiceData<any>> = new Map<string, ServiceData<any>>();

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

    const serviceData = this.serviceDataMap.get(serviceName);

    if (typeof serviceData === "undefined") {
      throw new Error(`Requested service with name, '${serviceName}' was not found.`);
    }

    switch (serviceData.scope) {
      // if the service scope is 'Transient'...
      case ServiceScope.Transient:
        // we shall create new instance for each request...
        return ServiceProvider.createServiceInstance(serviceData);
      // else if the service scope is 'Singleton'...
      case ServiceScope.Singleton:
        // and if the singleton instance is not an object...
        if (!ObjectUtilities.isObject(serviceData.singletonInstance)) {
          // we shall create new instance and assign that to service data...
          serviceData.singletonInstance = ServiceProvider.createServiceInstance(serviceData);
        }

        // finally, we shall return the singleton instance...
        return serviceData.singletonInstance;
      case ServiceScope.Scoped:
        // we'll first sanitize the scope name...
        scopeName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
          scopeName, StringUtilities.getEmptyString(), true);

        // if scope name is an empty string...
        if (StringUtilities.isEmpty(scopeName)) {
          throw new Error("Scope name not provided.");
        }

        // if the scoped instance map is not an object...
        if (!ObjectUtilities.isObject(serviceData.scopedInstanceMap)) {
          // we shall create a new one and assign it to service data...
          serviceData.scopedInstanceMap = new Map();
        }

        let instance = serviceData.scopedInstanceMap!.get(scopeName!);

        // if the instance is an object, we'll return that...
        if (ObjectUtilities.isObject(instance)) { return instance; }

        // or else, we'll create a new instance...
        instance = ServiceProvider.createServiceInstance(serviceData);

        // and set that to the scoped instance map...
        serviceData.scopedInstanceMap!.set(scopeName!, instance);

        // finally, we shall return the scoped instance...
        return instance;
      default:
        throw new Error(`Unidentified service scope, '${serviceData.scope}' detected.`);
    }
  }

  public register<Type>(serviceType: ServiceType<Type>, scope?: ServiceScope,
    createCallback?: ServiceCreateCallback<Type>): IServiceProvider {
    const serviceName = ServiceProvider.getServiceName(serviceType);

    // if service name is empty, we shall throw error...
    if (StringUtilities.isEmpty(serviceName)) {
      throw new Error("An unexpected error occurred while reading service name.");
    }
    // if valid scope is not provided, we shall set Singleton as the default...
    if (!ServiceProvider.isValidScope(scope)) {
      scope = ServiceScope.Singleton;
    }

    const existingServiceData = this.serviceDataMap.get(serviceName);

    // if the service is already registered, we won't re-register the service...
    if (typeof existingServiceData !== "undefined") {
      throw new Error("Requested service is already registered.");
    }

    const serviceData: ServiceData<Type> = ObjectUtilities.getEmptyObject(true);
    serviceData.name = serviceName;
    serviceData.scope = scope!;
    serviceData.serviceType = serviceType;
    serviceData.createCallback = createCallback;

    this.serviceDataMap.set(serviceName, serviceData);

    return this;
  }

  public registerSingleton<Type>(serviceType: ServiceType<Type>, instance: Type): IServiceProvider {
    // if the provided service object is not an object, we'll throw an error...
    if (!ObjectUtilities.isObject(instance)) {
      throw new Error("Invalid service instance provided.");
    }

    // now we shall register the service...
    this.register(serviceType, ServiceScope.Singleton);

    // we don't need to check if the service name is empty because
    // if it were empty, the register method would have thrown exception...
    const serviceName = ServiceProvider.getServiceName(serviceType);
    // we are also certain that service data is not undefined because
    // the register method executed successfully...
    const serviceData = this.serviceDataMap.get(serviceName) as ServiceData<Type>;
    // now we shall just assign the service object as the singleton instance...
    serviceData.singletonInstance = instance;

    return this;
  }

  public unregister<Type>(serviceType: ServiceType<Type>, scopeName?: string): IServiceProvider {
    const serviceName = ServiceProvider.getServiceName(serviceType);

    if (StringUtilities.isEmpty(serviceName)) { return this; }

    // we'll sanitize the scope name...
    scopeName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      scopeName, StringUtilities.getEmptyString(), true);

    // if the scope name is empty...
    if (StringUtilities.isEmpty(scopeName)) {
      // we shall unregister the entire service...
      this.serviceDataMap.delete(serviceName);

      return this;
    }

    // otherwise, we shall only unregister a scoped instance of the service...
    const serviceData = this.serviceDataMap.get(serviceName);

    // if no such service is registered, we'll not do anything...
    if (!ObjectUtilities.isObject(serviceData)
      || !ObjectUtilities.isObject(serviceData!.scopedInstanceMap)) { return this; }

    // or else, we shall unregister the scoped instance of the service...
    serviceData!.scopedInstanceMap!.delete(scopeName!);

    return this;
  }

  public unregisterAll(): IServiceProvider {
    this.serviceDataMap.clear();

    return this;
  }

  private static readonly instance: IServiceProvider = new ServiceProvider();

  private static isValidScope(scope: undefined | ServiceScope): boolean {
    return VALID_SCOPES.indexOf(scope!) !== -1;
  }

  private static getServiceName<Type>(serviceType: ServiceType<Type>): string {
    if (typeof serviceType !== "function") { return StringUtilities.getEmptyString(); }

    let serviceName = (serviceType as any).name;
    serviceName = StringUtilities.getDefaultIfUndefinedOrNullOrEmpty(
      serviceName, StringUtilities.getEmptyString(), true);

    return serviceName;
  }

  private static createServiceInstance<Type>(serviceData: ServiceData<Type>): Type {
    let instance: undefined | Type = undefined;

    // if callback is available...
    if (typeof serviceData.createCallback === "function") {
      // we shall execute the callback to create new instance...
      instance = serviceData.createCallback(serviceData.serviceType);
    }

    // if callback function is provided and it returned an object, we shall return that instance...
    if (ObjectUtilities.isObject(instance)) { return instance!; }

    try {
      // otherwise, we'll execute the default constructor...
      instance = new serviceData.serviceType();
    } catch {
      // we shall re-throw the exception...
      throw new Error(`An error occurred while instantiating the service named '${serviceData.name}'.`);
    }

    // if the instantiation is successful...
    if (ObjectUtilities.isObject(instance)) { return instance; }

    // we shall throw exception...
    throw new Error(`An error occurred while instantiating the service named '${serviceData.name}'.`);
  }

  public static getInstance(): IServiceProvider {
    return this.instance;
  }
}

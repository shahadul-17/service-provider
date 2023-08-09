import { ServiceType } from "./service-type.t";

export type ServiceCreateCallback<Type>
  = (serviceType: ServiceType<Type>) => Type;

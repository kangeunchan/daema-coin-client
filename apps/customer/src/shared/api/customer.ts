import { customerApiRequest } from "./client";

export type CustomerMeDto = {
  displayName?: string;
  github?: {
    login?: string;
  };
  id?: string;
};

export async function fetchCustomerMe() {
  return customerApiRequest<CustomerMeDto>("/customer/me");
}

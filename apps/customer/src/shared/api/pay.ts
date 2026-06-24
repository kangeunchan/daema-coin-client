import { customerApiRequest } from "./client";

export type CustomerPayBarcodeDto = Record<string, unknown> & {
  code?: string;
  expiresAt?: string;
  id?: string;
};

export async function createCustomerPayBarcode() {
  return customerApiRequest<CustomerPayBarcodeDto>("/customer/pay/barcodes", {
    method: "POST",
  });
}

import { CustomerApiError, customerApiBaseUrl, customerApiRequest, isCustomerApiEnabled } from "./client";

export type CustomerProfile = {
  name: string;
  studentId: string;
};

export type GithubAuthenticationResult =
  | {
      status: "authenticated";
    }
  | {
      status: "profile_required";
    };

export type CustomerSessionStatus =
  | GithubAuthenticationResult
  | {
      status: "unauthenticated";
    };

const customerAuthStorageKey = "daema-customer-auth";
const githubLoginSuccessParam = "login";

export function hasStoredCustomerSession() {
  if (isCustomerApiEnabled()) {
    return false;
  }

  return window.localStorage.getItem(customerAuthStorageKey) !== null;
}

export function getStoredCustomerProfile(): CustomerProfile | undefined {
  const rawProfile = window.localStorage.getItem(customerAuthStorageKey);

  if (!rawProfile) {
    return undefined;
  }

  try {
    return JSON.parse(rawProfile) as CustomerProfile;
  } catch {
    return undefined;
  }
}

export function isGithubLoginSuccessRedirect() {
  return new URLSearchParams(window.location.search).get(githubLoginSuccessParam) === "success";
}

export async function checkCustomerSession(): Promise<CustomerSessionStatus> {
  if (!isCustomerApiEnabled()) {
    return hasStoredCustomerSession() ? { status: "authenticated" } : { status: "unauthenticated" };
  }

  try {
    return await customerApiRequest<GithubAuthenticationResult>("/auth/github/session", {
      method: "POST",
    });
  } catch (error) {
    if (error instanceof CustomerApiError && error.status === 401) {
      return { status: "unauthenticated" };
    }

    throw error;
  }
}

export async function completeGithubAuthentication(): Promise<GithubAuthenticationResult> {
  if (!isCustomerApiEnabled()) {
    return { status: "profile_required" };
  }

  if (!isGithubLoginSuccessRedirect()) {
    const redirectAfter = `${window.location.origin}/login`;
    window.location.assign(
      `${customerApiBaseUrl}/auth/github/login?role=customer&redirectAfter=${encodeURIComponent(redirectAfter)}`,
    );
    return new Promise<GithubAuthenticationResult>(() => {});
  }

  window.history.replaceState(window.history.state, "", "/login");

  return customerApiRequest<GithubAuthenticationResult>("/auth/github/session", {
    method: "POST",
  });
}

export async function completeStudentProfile(profile: CustomerProfile) {
  if (isCustomerApiEnabled()) {
    await customerApiRequest<void>("/auth/me/student-profile", {
      body: profile,
      method: "PUT",
    });

    return;
  }

  window.localStorage.setItem(customerAuthStorageKey, JSON.stringify(profile));
}

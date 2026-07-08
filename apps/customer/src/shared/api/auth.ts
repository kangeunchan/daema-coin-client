import {
  CustomerApiError,
  customerApiBaseUrl,
  customerApiRequest,
  isCustomerApiEnabled,
  teacherAccessTokenStorageKey,
} from "./client";

export type CustomerProfile = {
  name: string;
  studentNo: string;
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

export type TeacherLoginSession = {
  accessToken?: string;
  expiresAt?: string;
  role?: string;
  tokenType?: string;
  user?: {
    id?: string;
    login?: string;
    name?: string;
    roles?: string[];
  };
};

const customerAuthStorageKey = "daema-customer-auth";
const githubLoginSuccessParam = "login";

export function hasStoredCustomerSession() {
  if (isCustomerApiEnabled()) {
    return false;
  }

  return window.localStorage.getItem(customerAuthStorageKey) !== null;
}

export function readTeacherAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(teacherAccessTokenStorageKey) ?? "";
}

function writeTeacherAccessToken(token: string | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(teacherAccessTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(teacherAccessTokenStorageKey);
}

export function clearTeacherAccessToken() {
  writeTeacherAccessToken(undefined);
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

export async function loginTeacher(loginId: string, password: string) {
  if (!isCustomerApiEnabled()) {
    window.localStorage.setItem(
      customerAuthStorageKey,
      JSON.stringify({ name: "Teacher", studentNo: "99990000" }),
    );
    return { role: "teacher" } satisfies TeacherLoginSession;
  }

  const session = await customerApiRequest<TeacherLoginSession>("/auth/teacher/login", {
    body: { loginId, password },
    method: "POST",
  });
  writeTeacherAccessToken(session.accessToken);
  return session;
}

export async function completeStudentProfile(profile: CustomerProfile) {
  if (isCustomerApiEnabled()) {
    await customerApiRequest<void>("/auth/me/student-profile", {
      body: { ...profile, studentId: profile.studentNo },
      method: "PUT",
    });

    return;
  }

  window.localStorage.setItem(customerAuthStorageKey, JSON.stringify(profile));
}

import { useEffect, useState } from "react";

import { getCurrentCustomerPathname } from "./customerNavigation";

export function useCustomerPathname() {
  const [pathname, setPathname] = useState(() => getCurrentCustomerPathname());

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getCurrentCustomerPathname());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return pathname;
}

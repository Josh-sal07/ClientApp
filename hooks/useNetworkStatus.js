import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(
        state.isConnected && state.isInternetReachable !== false
      );
      setChecked(true);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, checked };
}

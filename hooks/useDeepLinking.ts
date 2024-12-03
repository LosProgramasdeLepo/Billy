import { useEffect } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Profiles: { invitationId: string };
};

export const useDeepLinking = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      const route = url.replace(/.*?:\/\//g, "");
      const [path, queryString] = route.split("?");
      const params = new URLSearchParams(queryString);
      const invitationId = params.get("invitationId");

      if (path === "profile" && invitationId) {
        navigation.navigate("Profiles", { invitationId });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);
};

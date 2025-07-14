import { useUser } from "./UserContext";
import { useError } from "./ErrorContext";
import { useSuccess } from "./SuccessContext";

export default function useAppContext() {
  return {
    ...useUser(),
    ...useError(),
    ...useSuccess(),
  };
}

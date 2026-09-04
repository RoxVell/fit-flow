import { Redirect } from "expo-router";

// NativeTabs has no `index` child; `/` (fitflow://) would otherwise be unmatched.
export default function Index() {
  return <Redirect href="/dashboard" />;
}

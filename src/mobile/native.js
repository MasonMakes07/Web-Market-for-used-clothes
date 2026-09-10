import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export const isNative = Capacitor.isNativePlatform();
import { nativeCallback } from "./nativeCallback.js";
export const authReturnUrl = isNative ? nativeCallback : window.location.origin;
export const openAuthUrl = isNative
  ? async (url) => Browser.open({ url, presentationStyle: "popover" })
  : undefined;

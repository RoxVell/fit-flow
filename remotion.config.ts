import { Config } from "@remotion/cli/config";

Config.setPublicDir("./remotion/public");
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(20);
Config.setOverwriteOutput(true);

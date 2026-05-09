import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('freskoDesktop', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
  isDesktop: true,
});

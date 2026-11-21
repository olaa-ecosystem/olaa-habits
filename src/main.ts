/**
 * Entry point. The interface (frontend) has been removed and will be imported later; it
 * mounts into #root. Until then only the data services run: account sync and the events
 * received from Olaa Language.
 */
import { startCloudSync } from './services/cloudSync';
import { startLanguageEvents } from './services/languageEvents';

startCloudSync();
startLanguageEvents();

/**
 * Screens pushed over the food log (search, barcode, photo, confirm). A separate entry so
 * the router can lazy-load them: they are not needed for the first paint of the app.
 */
export { BarcodeScanPage } from './pages/BarcodeScanPage';
export { FoodConfirmPage } from './pages/FoodConfirmPage';
export { PhotoLogPage } from './pages/PhotoLogPage';
export { TextSearchPage } from './pages/TextSearchPage';

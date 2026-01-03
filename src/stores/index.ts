// Central export for all stores
export { useShopStore, useOwnedCharacters, useOwnedBackgrounds, useEquippedBackground } from './shopStore';
export type { ShopInventory } from './shopStore';

export { useThemeStore, useHomeBackground } from './themeStore';

export { useCollectionStore, useActiveHomePets, useFavorites } from './collectionStore';

export {
  useNavigationStore,
  useActiveTab,
  useActiveModal,
  useModalData,
  useCanGoBack,
  useNavigationActions,
  setupLegacyEventBridge,
  onTabChange,
  onModalChange,
} from './navigationStore';
export type { MainTab, ModalType } from './navigationStore';

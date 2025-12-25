// Notification hooks
export { useNotifications } from './useNotifications';

// Product hooks
export { useProducts, useProduct, useFeaturedProducts, usePrefetchProduct } from './useProducts';

// Order hooks
export { useOrders, useOrder, useCreateOrder, usePrefetchOrder } from './useOrders';

// Auth hooks
export { useProfile, useAuth } from './useAuth';

// Favorites hooks
export {
  useFavorites,
  useIsFavorite,
  useAddFavorite,
  useRemoveFavorite,
  useToggleFavorite,
} from './useFavorites';

// Notify-Me hooks
export {
  useNotifyMeSubscriptions,
  useCheckNotifyMe,
  useSubscribeNotifyMe,
  useUnsubscribeNotifyMe,
  useToggleNotifyMe,
} from './useNotifyMe';

// Cart & Promotions hooks
export {
  useValidateCheckout,
  useQuickStockCheck,
  useActivePromotions,
  usePromotion,
  usePreviewPromotions,
} from './useCart';

// Address hooks
export {
  useAddresses,
  useAddress,
  useDefaultAddress,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from './useAddresses';

// Category hooks
export {
  useCategories,
  useCategory,
  useActiveCategories,
} from './useCategories';

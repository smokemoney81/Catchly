import { useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

const PRODUCTS = {
  basic: {
    android: 'com.catchly.app.basic.monthly',
    ios: 'com.catchly.app.basic.monthly',
    web: 'catchly_basic_monthly',
    price: '9,00 €',
    name: 'Basic',
  },
  pro: {
    android: 'com.catchly.app.pro.monthly',
    ios: 'com.catchly.app.pro.monthly',
    web: 'catchly_pro_monthly',
    price: '19,00 €',
    name: 'Pro',
  },
  ultimate: {
    android: 'com.catchly.app.ultimate.monthly',
    ios: 'com.catchly.app.ultimate.monthly',
    web: 'catchly_ultimate_monthly',
    price: '30,00 €',
    name: 'Ultimate',
  },
};

function getPlatform() {
  if (window.Capacitor?.isNativePlatform?.()) {
    return window.Capacitor.getPlatform();
  }
  return 'web';
}

export function useInAppPurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const purchase = useCallback(async (planKey) => {
    setLoading(true);
    setError(null);

    try {
      const platform = getPlatform();
      const product = PRODUCTS[planKey];
      if (!product) throw new Error('Unknown plan: ' + planKey);

      const productId = product[platform] || product.web;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Nicht eingeloggt');

      let purchaseData = { platform, productId };

      if (platform === 'android' && window.CdvPurchase) {
        const store = window.CdvPurchase.store;
        store.register({ id: productId, type: 'paid subscription' });
        await store.update();
        const offer = store.get(productId)?.getOffer();
        if (!offer) throw new Error('Produkt nicht gefunden im Store');
        const order = await store.order(offer);
        purchaseData.purchaseToken = order?.purchaseToken;
        purchaseData.signedData = order?.receipt;
        purchaseData.signature = order?.signature;
        purchaseData.transactionId = order?.transactionId;
      } else if (platform === 'ios' && window.CdvPurchase) {
        const store = window.CdvPurchase.store;
        store.register({ id: productId, type: 'paid subscription' });
        await store.update();
        const offer = store.get(productId)?.getOffer();
        if (!offer) throw new Error('Produkt nicht gefunden im Store');
        const order = await store.order(offer);
        purchaseData.receiptData = order?.appStoreReceipt;
        purchaseData.transactionId = order?.transactionId;
      } else {
        purchaseData.platform = 'web';
      }

      const response = await fetch(
        'https://vecxtgwxqzrogthqqdys.supabase.co/functions/v1/process-purchase',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.access_token,
            'x-app-name': 'catchly',
          },
          body: JSON.stringify(purchaseData),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Kauf fehlgeschlagen');

      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { purchase, loading, error, PRODUCTS };
}
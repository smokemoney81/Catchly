import React from 'react';
import { Button } from '@/components/ui/button';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { toast } from 'sonner';
import { Crown, Loader2 } from 'lucide-react';

export default function PremiumPurchaseButton({ plan = 'pro', className = '' }) {
  const { purchase, loading, PRODUCTS } = useInAppPurchase();
  const product = PRODUCTS[plan];

  const handlePurchase = async () => {
    try {
      const result = await purchase(plan);
      toast.success(result.message || `${product.name} Plan aktiviert!`);
    } catch (err) {
      toast.error('Kauf fehlgeschlagen: ' + err.message);
    }
  };

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className={`bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Crown className="w-4 h-4 mr-2" />
      )}
      {product?.name} – {product?.price}/Monat
    </Button>
  );
}
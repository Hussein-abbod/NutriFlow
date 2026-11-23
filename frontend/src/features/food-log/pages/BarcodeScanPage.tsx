import { Navigate } from 'react-router';
import { SubpageLayout } from '../components/SubpageLayout';
import { BarcodeScannerPanel } from '../components/add-food/BarcodeScannerPanel';
import { useAddFoodTarget, useOpenConfirm } from '../hooks/useAddFoodFlow';
import { foodLogPaths } from '../paths';

/** add_food_sheet.dart `BarcodeScannerScreen` ("Scan Barcode"). */
export function BarcodeScanPage() {
  const target = useAddFoodTarget();
  const openConfirm = useOpenConfirm(target, 'barcode');
  if (!target) return <Navigate to={foodLogPaths.log} replace />;
  return (
    <SubpageLayout title="Scan Barcode" fallback={foodLogPaths.log} tone="camera">
      <BarcodeScannerPanel onConfirm={(item) => openConfirm([item])} />
    </SubpageLayout>
  );
}

import { Navigate } from 'react-router';
import { SubpageLayout } from '../components/SubpageLayout';
import { ImageCapturePanel } from '../components/add-food/ImageCapturePanel';
import { useAddFoodTarget, useOpenConfirm } from '../hooks/useAddFoodFlow';
import { foodLogPaths } from '../paths';

/** add_food_sheet.dart `CameraFoodScreen` ("Camera Food Scan"). */
export function PhotoLogPage() {
  const target = useAddFoodTarget();
  const openConfirm = useOpenConfirm(target, 'image');
  if (!target) return <Navigate to={foodLogPaths.log} replace />;
  return (
    <SubpageLayout title="Camera Food Scan" fallback={foodLogPaths.log}>
      <ImageCapturePanel meal={target.meal} onReview={openConfirm} />
    </SubpageLayout>
  );
}

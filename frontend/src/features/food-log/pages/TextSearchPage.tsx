import { Navigate } from 'react-router';
import { SubpageLayout } from '../components/SubpageLayout';
import { TextSearchPanel } from '../components/add-food/TextSearchPanel';
import { useAddFoodTarget, useOpenConfirm } from '../hooks/useAddFoodFlow';
import { foodLogPaths } from '../paths';

/** add_food_sheet.dart `TextFoodScreen` ("Search Food"). */
export function TextSearchPage() {
  const target = useAddFoodTarget();
  const openConfirm = useOpenConfirm(target, 'text');
  if (!target) return <Navigate to={foodLogPaths.log} replace />;
  return (
    <SubpageLayout title="Search Food" fallback={foodLogPaths.log}>
      <TextSearchPanel meal={target.meal} onReview={openConfirm} />
    </SubpageLayout>
  );
}

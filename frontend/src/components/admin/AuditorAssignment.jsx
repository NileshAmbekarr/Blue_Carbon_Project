// Example component for an admin to use
import { useIssueCredits } from '@/hooks/api/useCredits';
import { Button } from '@/components/ui/button';

export const CreditIssuance = ({ mrvId }) => {
  const { mutate: issue, isLoading } = useIssueCredits();

  const handleIssue = () => {
    const issuanceParams = { /* ... parameters from a form ... */ };
    issue({ mrvId, issuanceParams });
  };

  return (
    <Button onClick={handleIssue} disabled={isLoading}>
      {isLoading ? 'Initiating Issuance...' : 'Issue Credits'}
    </Button>
  );
};
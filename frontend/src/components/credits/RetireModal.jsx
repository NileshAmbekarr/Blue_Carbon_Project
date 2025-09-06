// components/credits/RetireModal.jsx
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { CreditTokenABI } from '@/services/blockchain/contracts'; // Your contract ABI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TransactionStatus } from '@/components/wallet/TransactionStatus';

const CREDIT_TOKEN_ADDRESS = '0x...'; // From your config

export const RetireModal = ({ batchId, onclose }) => {
  const [amount, setAmount] = useState('0');
  const [beneficiary, setBeneficiary] = useState('');

  // 1. Prepare the transaction to get config and check for errors
  const { config, error: prepareError } = usePrepareContractWrite({
    address: CREDIT_TOKEN_ADDRESS,
    abi: CreditTokenABI,
    functionName: 'retire',
    args: [batchId, parseEther(amount), beneficiary],
    enabled: parseFloat(amount) > 0 && !!beneficiary, // Only enable if form is valid
  });

  // 2. Get the write function and transaction data
  const { data, write, isLoading: isWriteLoading } = useContractWrite(config);

  // 3. Wait for the transaction to be mined
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const handleRetire = () => {
    if (write) {
      write(); // This will pop up MetaMask
    }
  };

  return (
    <div>
      {/* Inputs for amount and beneficiary */}
      <Button onClick={handleRetire} disabled={!write || isWriteLoading || isTxLoading}>
        {isWriteLoading ? 'Check Wallet...' : isTxLoading ? 'Retiring...' : 'Retire Credits'}
      </Button>

      <TransactionStatus
        hash={data?.hash}
        isSuccess={isSuccess}
        isLoading={isTxLoading}
        error={prepareError}
      />
    </div>
  );
};
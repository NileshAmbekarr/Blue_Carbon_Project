// components/web3/WalletButton.jsx
import React, { useState } from 'react';
import {
  WalletIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useWallet } from '../../hooks/web3/useWallet';
import WalletConnectModal from './WalletConnectModal';

const WalletButton = () => {
  const {
    address,
    isConnected,
    isConnecting,
    balance,
    chain,
    disconnectWallet,
    formatAddress,
    isWalletLinked,
    isWrongNetwork,
    openWalletModal,
    closeWalletModal,
    isWalletModalOpen
  } = useWallet();

  const [showLinkModal, setShowLinkModal] = useState(false);

  if (!isConnected) {
    return (
      <>
        <button
          onClick={openWalletModal}
          disabled={isConnecting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <WalletIcon className="h-4 w-4 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        <WalletConnectModal 
          isOpen={isWalletModalOpen} 
          onClose={closeWalletModal} 
        />
      </>
    );
  }

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <div className="flex items-center">
              {isWrongNetwork ? (
                <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-red-500" />
              ) : isWalletLinked ? (
                <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <WalletIcon className="h-4 w-4 mr-2 text-gray-400" />
              )}
              
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">
                  {formatAddress(address)}
                </div>
                {balance && (
                  <div className="text-xs text-gray-500">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </div>
                )}
              </div>
            </div>
            <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-400" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="p-4">
              {/* Wallet Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Connected Wallet</span>
                  {isWalletLinked && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Linked
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {address}
                </div>
                
                {balance && (
                  <div className="mt-2 text-sm text-gray-600">
                    Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </div>
                )}
                
                {chain && (
                  <div className="mt-1 text-sm text-gray-600">
                    Network: {chain.name}
                    {isWrongNetwork && (
                      <span className="ml-2 text-red-600 text-xs">(Wrong Network)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet Status */}
              {isWrongNetwork && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-800">
                      Please switch to Ethereum Mainnet
                    </span>
                  </div>
                </div>
              )}

              {!isWalletLinked && !isWrongNetwork && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Link wallet to account
                      </span>
                    </div>
                    <button
                      onClick={() => setShowLinkModal(true)}
                      className="text-xs text-yellow-700 hover:text-yellow-600 underline"
                    >
                      Link Now
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigator.clipboard.writeText(address)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700`}
                    >
                      Copy Address
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700`}
                    >
                      View on Etherscan
                    </a>
                  )}
                </Menu.Item>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={disconnectWallet}
                      className={`${
                        active ? 'bg-red-50 text-red-700' : 'text-red-600'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Disconnect
                    </button>
                  )}
                </Menu.Item>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Link Wallet Modal */}
      {showLinkModal && (
        <LinkWalletModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          walletAddress={address}
        />
      )}
    </>
  );
};

// Link Wallet Modal Component
const LinkWalletModal = ({ isOpen, onClose, walletAddress }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const handleLinkWallet = async () => {
    setIsLinking(true);
    setLinkError(null);
    
    try {
      // In a real app, this would call an API to link the wallet to the user's account
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user's wallet address in the auth store
      // This would typically be done via an API call
      console.log('Linking wallet:', walletAddress);
      
      onClose();
    } catch (error) {
      setLinkError(error.message || 'Failed to link wallet');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <LinkIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Link Wallet to Account
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Link your wallet to your Blue Carbon account to enable seamless blockchain interactions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Wallet Address:</p>
                    <p className="text-sm text-gray-600 font-mono break-all">{walletAddress}</p>
                  </div>
                </div>

                {linkError && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{linkError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleLinkWallet}
                    disabled={isLinking}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 sm:col-start-2"
                  >
                    {isLinking ? 'Linking...' : 'Link Wallet'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLinking}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default WalletButton;

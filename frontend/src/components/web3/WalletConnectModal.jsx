// components/web3/WalletConnectModal.jsx
import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  WalletIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useWallet } from '../../hooks/web3/useWallet';

const WalletConnectModal = ({ isOpen, onClose }) => {
  const {
    connectors,
    connectWallet,
    isConnecting,
    pendingConnector,
    connectionError,
    isWrongNetwork,
    switchToRequiredNetwork,
    isSwitchingNetwork
  } = useWallet();

  const getConnectorIcon = (connectorId) => {
    const icons = {
      metaMask: '/icons/metamask.svg',
      walletConnect: '/icons/walletconnect.svg',
      coinbaseWallet: '/icons/coinbase.svg',
      injected: '/icons/wallet.svg'
    };
    return icons[connectorId] || '/icons/wallet.svg';
  };

  const getConnectorName = (connector) => {
    const names = {
      metaMask: 'MetaMask',
      walletConnect: 'WalletConnect',
      coinbaseWallet: 'Coinbase Wallet',
      injected: 'Browser Wallet'
    };
    return names[connector.id] || connector.name;
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <WalletIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Connect Wallet
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Connect your wallet to interact with the blockchain and manage your carbon credits.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Network Warning */}
                {isWrongNetwork && (
                  <div className="mt-4 rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Wrong Network</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Please switch to Ethereum Mainnet to continue.</p>
                        </div>
                        <div className="mt-4">
                          <div className="-mx-2 -my-1.5 flex">
                            <button
                              type="button"
                              onClick={() => switchToRequiredNetwork(1)}
                              disabled={isSwitchingNetwork}
                              className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
                            >
                              {isSwitchingNetwork ? (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin inline" />
                                  Switching...
                                </>
                              ) : (
                                'Switch Network'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Error */}
                {connectionError && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{connectionError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Options */}
                <div className="mt-5 space-y-3">
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => connectWallet(connector)}
                      disabled={isConnecting || isWrongNetwork}
                      className="relative w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center">
                        <img
                          src={getConnectorIcon(connector.id)}
                          alt={connector.name}
                          className="h-6 w-6 mr-3"
                          onError={(e) => {
                            e.target.src = '/icons/wallet.svg';
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {getConnectorName(connector)}
                        </span>
                      </div>
                      
                      {isConnecting && pendingConnector?.id === connector.id && (
                        <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Help Text */}
                <div className="mt-5 text-center">
                  <p className="text-xs text-gray-500">
                    Don't have a wallet?{' '}
                    <a
                      href="https://metamask.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Get MetaMask
                    </a>
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default WalletConnectModal;

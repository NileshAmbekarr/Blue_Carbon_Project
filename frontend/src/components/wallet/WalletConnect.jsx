// components/wallet/WalletConnect.jsx
import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { WalletIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-x-2 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span>{formatAddress(address)}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </Menu.Button>
        
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <div className="px-4 py-2 text-sm text-gray-700">
                  <div className="font-medium">Connected</div>
                  <div className="text-xs text-gray-500">{formatAddress(address)}</div>
                </div>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => disconnect()}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                >
                  Disconnect
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
        <WalletIcon className="h-4 w-4" />
        <span>Connect Wallet</span>
        <ChevronDownIcon className="h-4 w-4" />
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {connectors.map((connector) => (
            <Menu.Item key={connector.id}>
              {({ active }) => (
                <button
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full px-4 py-2 text-left text-sm text-gray-700 disabled:opacity-50`}
                >
                  {connector.name}
                  {isPending && ' (connecting...)'}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
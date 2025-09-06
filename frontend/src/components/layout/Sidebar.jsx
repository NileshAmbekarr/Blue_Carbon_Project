// components/layout/Sidebar.jsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import { 
  XMarkIcon,
  HomeIcon,
  FolderIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CogIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/auth/useAuth';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['Admin', 'Auditor', 'Developer'] },
  { name: 'Projects', href: '/projects', icon: FolderIcon, roles: ['Admin', 'Auditor', 'Developer'] },
  { name: 'Audits', href: '/audits', icon: DocumentCheckIcon, roles: ['Admin', 'Auditor'] },
  { name: 'Credits', href: '/credits', icon: CurrencyDollarIcon, roles: ['Admin', 'Auditor', 'Developer'] },
  { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon, roles: ['Admin'] },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['Admin'] },
  { name: 'Admin Settings', href: '/admin', icon: CogIcon, roles: ['Admin'] },
  { name: 'Public Explorer', href: '/explorer', icon: GlobeAltIcon, roles: ['Admin', 'Auditor', 'Developer', 'Public'] },
];

export const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => user?.roles?.includes(role))
  );

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-x-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <GlobeAltIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-white text-lg font-semibold">Blue Carbon</span>
        </div>
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      location.pathname === item.href
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          
          {/* User Role Badge */}
          <li className="mt-auto">
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-400">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white">{user?.name || user?.email}</span>
                <span className="text-xs text-gray-400">
                  {user?.roles?.join(', ') || 'User'}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  );
};
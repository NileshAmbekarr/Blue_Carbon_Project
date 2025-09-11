// pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  GlobeAltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  MapIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BeakerIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      icon: MapIcon,
      title: 'Project Management',
      description: 'Create and manage blue carbon projects with interactive mapping and plot management.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: DocumentCheckIcon,
      title: 'MRV System',
      description: 'Comprehensive Monitoring, Reporting & Verification with evidence tracking.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Carbon Credits',
      description: 'Issue, transfer, and retire carbon credits with blockchain transparency.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Audit Management',
      description: 'Independent third-party auditing with comprehensive review workflows.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics Dashboard',
      description: 'Real-time insights and reporting for all stakeholders.',
      color: 'text-indigo-600 bg-indigo-100'
    },
    {
      icon: EyeIcon,
      title: 'Public Transparency',
      description: 'Open access to verified project data and carbon credit information.',
      color: 'text-teal-600 bg-teal-100'
    }
  ];

  const userRoles = [
    {
      role: 'Registry Admin',
      description: 'NCCR administrators managing the entire carbon registry system',
      icon: BuildingOfficeIcon,
      features: ['System Administration', 'User Management', 'Registry Oversight', 'Policy Configuration'],
      color: 'border-red-200 bg-red-50'
    },
    {
      role: 'Project Developer',
      description: 'NGOs, Panchayats, and organizations developing blue carbon projects',
      icon: UserGroupIcon,
      features: ['Project Creation', 'Plot Management', 'Evidence Upload', 'Progress Tracking'],
      color: 'border-blue-200 bg-blue-50'
    },
    {
      role: 'Auditor',
      description: 'Independent third-party organizations conducting project audits',
      icon: BeakerIcon,
      features: ['Audit Reviews', 'Evidence Verification', 'Compliance Checking', 'Report Generation'],
      color: 'border-green-200 bg-green-50'
    },
    {
      role: 'Public User',
      description: 'General public accessing transparent project information',
      icon: GlobeAltIcon,
      features: ['Project Explorer', 'Credit Tracking', 'Impact Visualization', 'Data Access'],
      color: 'border-gray-200 bg-gray-50'
    }
  ];

  const stats = [
    { label: 'Active Projects', value: '150+', icon: MapIcon },
    { label: 'Carbon Credits Issued', value: '2.5M+', icon: CurrencyDollarIcon },
    { label: 'Hectares Protected', value: '50K+', icon: GlobeAltIcon },
    { label: 'Verified Organizations', value: '75+', icon: ShieldCheckIcon }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Blue Carbon Registry
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              A comprehensive platform for managing blue carbon projects, ensuring transparency, 
              and facilitating the issuance of verified carbon credits from coastal ecosystems.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50 transition-colors"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/public/explorer"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-900 transition-colors"
              >
                Explore Projects
                <EyeIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-20 text-white" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Blue Carbon Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides end-to-end solutions for blue carbon project development, 
              verification, and carbon credit management with full transparency and traceability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-6`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Roles Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Stakeholder
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Role-based access ensures each user type gets the tools and information they need 
              while maintaining security and compliance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {userRoles.map((role, index) => (
              <div key={index} className={`rounded-xl border-2 ${role.color} p-8`}>
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-white rounded-lg shadow-sm mr-4">
                    <role.icon className="h-8 w-8 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{role.role}</h3>
                    <p className="text-gray-600">{role.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {role.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Blue Carbon Registry Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A streamlined process from project registration to carbon credit issuance
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Project Registration',
                description: 'Developers register blue carbon projects with detailed plot mapping and baseline data.',
                icon: MapIcon
              },
              {
                step: '02',
                title: 'Monitoring & Evidence',
                description: 'Continuous monitoring with photo evidence, measurements, and progress tracking.',
                icon: DocumentCheckIcon
              },
              {
                step: '03',
                title: 'Independent Audit',
                description: 'Third-party auditors verify project data and compliance with standards.',
                icon: ShieldCheckIcon
              },
              {
                step: '04',
                title: 'Credit Issuance',
                description: 'Verified carbon credits are issued and recorded on blockchain for transparency.',
                icon: CurrencyDollarIcon
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <process.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{process.step}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{process.title}</h3>
                <p className="text-gray-600">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Blue Carbon Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the growing community of organizations protecting coastal ecosystems 
            and generating verified carbon credits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Register Organization
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/public/explorer"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Explore Public Data
              <EyeIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">Blue Carbon Registry</h3>
              <p className="text-gray-300 mb-6">
                Empowering coastal ecosystem conservation through transparent, 
                verified carbon credit management and blockchain technology.
              </p>
              <div className="flex space-x-4">
                {/* Social links would go here */}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/public/explorer" className="hover:text-white">Project Explorer</Link></li>
                <li><Link to="/auth/login" className="hover:text-white">Login</Link></li>
                <li><Link to="/auth/register" className="hover:text-white">Register</Link></li>
                <li><Link to="/public/documentation" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/public/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/public/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/public/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/public/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Blue Carbon Registry. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

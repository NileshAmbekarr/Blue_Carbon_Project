import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '@store/authStore';
import { theme, roleColors } from '@utils/theme';

// Auth Screens
import LoginScreen from '@screens/auth/LoginScreen';

// Main App Screens
import DashboardScreen from '@screens/dashboard/DashboardScreen';
import ProjectsScreen from '@screens/projects/ProjectsScreen';
import ProjectDetailsScreen from '@screens/projects/ProjectDetailsScreen';
import CreateProjectScreen from '@screens/projects/CreateProjectScreen';
import CameraScreen from '@screens/camera/CameraScreen';
import PhotoDetailsScreen from '@screens/camera/PhotoDetailsScreen';
import SyncScreen from '@screens/sync/SyncScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Camera: undefined;
  Sync: undefined;
  Profile: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetails: { projectId: string };
  CreateProject: undefined;
};

export type CameraStackParamList = {
  CameraCapture: undefined;
  PhotoDetails: { photoId: string };
};

// Stack Navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ProjectsStack = createNativeStackNavigator<ProjectsStackParamList>();
const CameraStack = createNativeStackNavigator<CameraStackParamList>();

// Auth Navigator
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

// Projects Stack Navigator
const ProjectsNavigator: React.FC = () => {
  return (
    <ProjectsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProjectsStack.Screen
        name="ProjectsList"
        component={ProjectsScreen}
        options={{ title: 'Projects' }}
      />
      <ProjectsStack.Screen
        name="ProjectDetails"
        component={ProjectDetailsScreen}
        options={{ title: 'Project Details' }}
      />
      <ProjectsStack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ title: 'Create Project' }}
      />
    </ProjectsStack.Navigator>
  );
};

// Camera Stack Navigator
const CameraNavigator: React.FC = () => {
  return (
    <CameraStack.Navigator
      screenOptions={{
        headerShown: false, // Camera screens typically don't need headers
      }}
    >
      <CameraStack.Screen name="CameraCapture" component={CameraScreen} />
      <CameraStack.Screen name="PhotoDetails" component={PhotoDetailsScreen} />
    </CameraStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  const { user } = useAuthStore();
  
  // Get user role for UI customization
  const userRole = user?.role || 'developer';
  const primaryColor = roleColors[userRole] || theme.colors.primary;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Projects':
              iconName = focused ? 'folder-multiple' : 'folder-multiple-outline';
              break;
            case 'Camera':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Sync':
              iconName = focused ? 'sync' : 'sync-off';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: theme.custom.colors.gray500,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.custom.colors.gray200,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: primaryColor,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      
      <MainTab.Screen
        name="Projects"
        component={ProjectsNavigator}
        options={{ 
          title: 'Projects',
          headerShown: false, // Let the nested navigator handle the header
        }}
      />
      
      <MainTab.Screen
        name="Camera"
        component={CameraNavigator}
        options={{ 
          title: 'Capture',
          headerShown: false, // Camera screens handle their own UI
        }}
      />
      
      <MainTab.Screen
        name="Sync"
        component={SyncScreen}
        options={{ title: 'Sync' }}
      />
      
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </MainTab.Navigator>
  );
};

// Root App Navigator
export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

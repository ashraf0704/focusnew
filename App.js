import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './auth/AuthContext';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator();

function SplashScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#5A5A40" />
      <Text style={styles.text}>Loading Session...</Text>
    </View>
  );
}

function MainDashboardScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.center}>
      <Text style={styles.welcome}>Welcome, {user?.name || 'Student'}!</Text>
      <Text style={styles.email}>Email: {user?.email}</Text>
      <View style={styles.logoutBtn}>
        <Button title="Log Out" onPress={logout} color="#D11A2A" />
      </View>
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={MainDashboardScreen} 
        options={{ title: 'Focus Buddy Dashboard' }}
      />
    </Stack.Navigator>
  );
}

function NavigationWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationWrapper />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFAE0',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#5A5A40',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A5A40',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#777777',
    marginBottom: 24,
  },
  logoutBtn: {
    width: '100%',
    maxWidth: 200,
  }
});

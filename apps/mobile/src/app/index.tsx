/**
 * 🍎 BlackRent Mobile App - Index Route
 * Redirects to the main tabs layout
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}




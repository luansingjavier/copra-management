import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useAuthStore } from "../../store/authStore";
import LoginScreen from "../../components/LoginScreen";

export default function ExploreScreen() {
  const { isAuthenticated } = useAuthStore();

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // When authenticated, show the explore screen content
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Welcome to the Explore section</Text>
          <Text style={styles.description}>
            Here you can explore features of the Luansing Copra Management
            system.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 60,
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 90, // Make sure content doesn't get cut off by tab bar
  },
  content: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "#4a90e2",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
});

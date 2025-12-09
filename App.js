// App.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

const Stack = createNativeStackNavigator();

// ---------------- LOGIN SCREEN ----------------
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("Home");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.replace("Home");
    } catch (error) {
      alert("Registration failed: " + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.title}>FarmDo</Text>
      <Text style={styles.subtitle}>Record your farm activities</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={true}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry={true}
        editable={true}
      />

      <TouchableOpacity style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={register}
      >
        <Text style={[styles.buttonText, styles.registerText]}>Register</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ---------------- HOME SCREEN ----------------
function HomeScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activities, setActivities] = useState([]);
  const [editId, setEditId] = useState(null);
  const [aboutVisible, setAboutVisible] = useState(false); // Modal toggle

  const activitiesRef = collection(db, "activities");

  // Load current user's activities
  const loadActivities = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(activitiesRef, where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setActivities(data);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const addOrUpdateActivity = async () => {
    if (!title || !description) return alert("Fill in all fields");

    const user = auth.currentUser;
    if (!user) return alert("No user logged in");

    if (editId) {
      const activityDoc = doc(db, "activities", editId);
      await updateDoc(activityDoc, { title, description });
      setEditId(null);
    } else {
      await addDoc(activitiesRef, {
        title,
        description,
        date: new Date().toISOString(),
        uid: user.uid,
      });
    }

    setTitle("");
    setDescription("");
    loadActivities();
  };

  const deleteActivity = async (id) => {
    await deleteDoc(doc(db, "activities", id));
    loadActivities();
  };

  const editActivity = (activity) => {
    setTitle(activity.title);
    setDescription(activity.description);
    setEditId(activity.id);
  };

  const logout = async () => {
    await signOut(auth);
    setActivities([]);
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 24, marginBottom: 15, fontWeight: "bold" }}>
        Farm Activities
      </Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        editable={true}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        editable={true}
      />

      <TouchableOpacity style={styles.button} onPress={addOrUpdateActivity}>
        <Text style={styles.buttonText}>
          {editId ? "Update Activity" : "Add Activity"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={{ fontWeight: "bold" }}>
              {item.date.split("T")[0]} - {item.title}
            </Text>
            <Text>{item.description}</Text>
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: "#f9a825", flex: 1, marginRight: 5 },
                ]}
                onPress={() => editActivity(item)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#d32f2f", flex: 1 }]}
                onPress={() => deleteActivity(item.id)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#757575", marginTop: 20 }]}
        onPress={logout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* About Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#607d8b", marginTop: 10 }]}
        onPress={() => setAboutVisible(true)}
      >
        <Text style={styles.buttonText}>About</Text>
      </TouchableOpacity>

      {/* About Modal as Popup */}
      <Modal
        visible={aboutVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.popupBackground}>
          <View style={styles.popupContainer}>
            <ScrollView>
              <Text style={styles.popupTitle}>About FarmDo</Text>
              <Text style={styles.popupText}>
                FarmDo is an app to help you track your farm activities easily.
              </Text>
              <Text style={styles.popupText}>Features:</Text>
              <Text style={styles.popupTextIndented}>
                - Add, update, and delete your farm activities
              </Text>
              <Text style={styles.popupTextIndented}>
                - View your activities by date
              </Text>
              <Text style={styles.popupTextIndented}>
                - Data is stored securely per user
              </Text>
              <Text style={styles.popupText}>How to use:</Text>
              <Text style={styles.popupTextIndented}>1. Login or register</Text>
              <Text style={styles.popupTextIndented}>
                2. Add your farm activity with title and description
              </Text>
              <Text style={styles.popupTextIndented}>
                3. Edit or delete activities anytime
              </Text>
              <Text style={styles.popupTextIndented}>
                4. Logout when done
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#d32f2f", marginTop: 10 }]}
              onPress={() => setAboutVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// STYLES 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7fa",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00796b",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#004d40",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#00796b",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  registerButton: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#00796b" },
  registerText: { color: "#00796b" },
  item: {
    padding: 15,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "#b2dfdb",
    borderRadius: 10,
  },
  popupBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    width: "85%",
    maxHeight: "60%",
    backgroundColor: "#e0f7fa",
    borderRadius: 10,
    padding: 20,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  popupText: {
    fontSize: 16,
    marginBottom: 8,
  },
  popupTextIndented: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 5,
  },
});

// ---------------- APP NAVIGATION ----------------
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "FarmDo Home" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
